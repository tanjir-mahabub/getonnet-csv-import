import * as fs from 'fs';
import { parse } from 'csv-parse';

import { BadRequestException, ConflictException, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { normalizeCustomer } from '../common/utils/normalizeCustomer';
import { ImportStatus } from './import-status.enum';

const BATCH_SIZE = 1000;
const PROGRESS_INTERVAL = 1000;
const RECENT_BUFFER_SIZE = 20;

@Injectable()
export class ImportService implements OnModuleInit {
    private readonly logger = new Logger(ImportService.name);
    private readonly csvFilePath = process.env.CSV_FILE_PATH;

    constructor(private readonly prisma: PrismaService) { }

    async onModuleInit() {
        const result = await this.prisma.importState.updateMany({
            where: { status: ImportStatus.RUNNING },
            data: { status: ImportStatus.INTERRUPTED },
        });

        if (result.count > 0) {
            this.logger.warn(
                `Marked ${result.count} running import(s) as INTERRUPTED after restart`,
            );
        }
    }

    /**
     * Starts a CSV import if no other import is running.
     * Uses DB transaction to avoid race conditions.
     * Returns immediately after creating ImportState.
     */
    async startImport() {
        if (!this.csvFilePath) {
            this.logger.error('CSV_FILE_PATH is not configured');
            throw new Error('CSV_FILE_PATH environment variable is not set');
        }

        await fs.promises.access(this.csvFilePath).catch(() => {
            throw new BadRequestException(
                `CSV file not found at ${this.csvFilePath}`,
            );
        });

        const importState = await this.prisma.$transaction(async (prisma) => {
            const existing = await prisma.importState.findFirst({
                where: {
                    status: {
                        in: [
                            ImportStatus.RUNNING,
                            ImportStatus.INTERRUPTED
                        ],
                    },
                },
                orderBy: { startedAt: 'desc' },
            });

            if (existing?.status === ImportStatus.RUNNING) {
                throw new ConflictException('Import already running');
            }

            if (existing?.status === ImportStatus.INTERRUPTED) {
                this.logger.warn(`Resuming interrupted import ${existing.id}`);
                this.runCsvImport(existing.id);
                return existing;
            }

            return prisma.importState.create({
                data: {
                    status: ImportStatus.RUNNING,
                    processedRows: 0,
                    lastProcessedRow: 0,
                    totalRows: 2_000_000,
                    recentCustomerEmails: [],
                    startedAt: new Date(),
                },
            });
        });

        if (importState.status === ImportStatus.RUNNING) {
            this.logger.log(`Starting new import ${importState.id}`);
            this.runCsvImport(importState.id).catch((error) => {
                this.logger.error(
                    `Unhandled import failure for import ${importState.id}`,
                    error,
                );
            });
        }

        return importState;
    }

    /**
     * Returns latest import progress.
     */
    async getProgress() {
        return (
            (await this.prisma.importState.findFirst({
                orderBy: { startedAt: 'desc' },
            })) ?? {
                status: ImportStatus.IDLE,
                processedRows: 0,
                lastProcessedRow: 0,
                totalRows: 2_000_000,
                startedAt: null,
                updatedAt: null,
                errorMessage: null,
            }
        );
    }

    /**
     * Core CSV streaming logic.
     * Event-loop safe, progress persisted, failure-safe.
     */
    private async runCsvImport(importStateId: string) {
        const state = await this.prisma.importState.findUnique({
            where: { id: importStateId },
        });

        if (!state) return;

        const resumeForm = state.lastProcessedRow ?? 0;

        if (resumeForm > 0) {
            this.logger.log(`Resuming import ${importStateId} from row ${resumeForm}`);
        }

        const parser = fs
            .createReadStream(this.csvFilePath!)
            .pipe(
                parse({
                    columns: true,
                    skip_empty_lines: true,
                    relax_quotes: true,
                    relax_column_count: true,
                }),
            );

        let currentRow = 0;
        let processedRows = state.processedRows || 0;
        let lastPersisted = processedRows;

        let batch: any[] = [];
        let recentEmails: string[] = [];

        try {
            for await (const record of parser) {
                currentRow++;

                if (currentRow <= resumeForm) continue;

                const customer = normalizeCustomer(record);
                if (!customer) continue;

                batch.push(customer);
                processedRows++;

                if (batch.length >= BATCH_SIZE) {
                    await this.insertBatchSafely(batch);

                    recentEmails.push(...batch.map((c) => c.email));
                    batch = [];

                    if (processedRows - lastPersisted >= PROGRESS_INTERVAL) {
                        await this.prisma.importState.update({
                            where: { id: importStateId },
                            data: {
                                status: ImportStatus.RUNNING,
                                processedRows,
                                lastProcessedRow: currentRow,
                                recentCustomerEmails: recentEmails.slice(-RECENT_BUFFER_SIZE),
                            },
                        });

                        lastPersisted = processedRows;
                    }
                }
            }

            // flush remaining batch
            if (batch.length > 0) {
                await this.insertBatchSafely(batch);

                await this.prisma.importState.update({
                    where: { id: importStateId },
                    data: {
                        processedRows,
                        lastProcessedRow: currentRow,
                        recentCustomerEmails: recentEmails.slice(
                            -RECENT_BUFFER_SIZE,
                        ),
                    },
                });
            }

            await this.prisma.importState.update({
                where: { id: importStateId },
                data: {
                    status: ImportStatus.COMPLETED,
                    processedRows,
                    lastProcessedRow: currentRow,
                },
            });

            this.logger.log(`Import ${importStateId} completed`);

        } catch (error) {
            await this.safeFail(importStateId, error, processedRows);
        }
    }

    /**
     * MongoDB-safe batch insertion with duplicate handling.
     */
    private async insertBatchSafely(batch: any[]) {
        try {
            await this.prisma.customer.createMany({ data: batch });
        } catch (error: any) {
            if (error.code !== 'P2002') throw error;
            // Fallback path (only when duplicates exist)
            for (const customer of batch) {
                try {
                    await this.prisma.customer.create({ data: customer });
                } catch (err: any) {
                    if (err.code === 'P2002') {
                        await this.prisma.customer.updateMany({
                            where: {
                                email: customer.email,
                                updatedManuallyAt: null,
                            },
                            data: customer,
                        });
                    } else {
                        throw err;
                    }
                }
            }
        }
    }

    /**
     * Safely marks an import as failed.
     */
    private async safeFail(importStateId: string, error: unknown, processedRows: number = 0) {
        this.logger.error(`Import ${importStateId} failed`, error as any);

        try {
            await this.prisma.importState.update({
                where: { id: importStateId },
                data: {
                    status: ImportStatus.FAILED,
                    processedRows,
                    errorMessage: (error as Error).message || String(error),
                },
            });
        } catch (err) {
            this.logger.error(
                `Failed to mark import ${importStateId} as failed`,
                err,
            );
        }
    }
}