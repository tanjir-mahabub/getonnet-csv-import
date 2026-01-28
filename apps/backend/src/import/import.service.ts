import * as fs from 'fs';
import { parse } from 'csv-parse';

import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { normalizeCustomer } from '../common/utils/normalizeCustomer';

const BATCH_SIZE = 1000;
const PROGRESS_INTERVAL = 1000;
const RECENT_BUFFER_SIZE = 20;

@Injectable()
export class ImportService {
    private readonly logger = new Logger(ImportService.name);
    private readonly csvFilePath = process.env.CSV_FILE_PATH;

    constructor(private readonly prisma: PrismaService) { }

    /**
     * Starts a CSV import if no other import is running.
     * Returns immediately after creating ImportState.
     */
    async startImport() {
        if (!this.csvFilePath) {
            this.logger.error('CSV_FILE_PATH is not configured');
            throw new Error('CSV_FILE_PATH environment variable is not set');
        }

        const running = await this.prisma.importState.findFirst({
            where: { status: 'running' },
            select: { id: true },
        });

        if (running) {
            this.logger.warn(
                `Import start rejected: already running (id=${running.id})`,
            );
            throw new ConflictException('Import is already running');
        }

        const importState = await this.prisma.importState.create({
            data: {
                status: 'running',
                processedRows: 0,
                totalRows: 2_000_000,
                recentCustomerEmails: [],
                startedAt: new Date(),
            },
        });

        this.logger.log(`Import started (id=${importState.id})`);

        // Fire-and-forget background execution
        this.runCsvImport(importState.id).catch((err) => {
            this.logger.error(
                `Unhandled import failure (id=${importState.id})`,
                err,
            );
        });

        return importState;
    }

    /**
     * Returns latest import progress.
     */
    async getProgress() {
        const progress = await this.prisma.importState.findFirst({
            orderBy: { startedAt: 'desc' },
        });

        return progress ?? {
            "status": "idle",
            "processedRows": 0,
            "totalRows": 2_000_000,
            "recentCustomerEmails": [],
            "startedAt": null,
            "updatedAt": null
        };
    }

    /**
     * Core CSV streaming logic.
     * Event-loop safe, progress persisted, failure-safe.
     */
    private async runCsvImport(importStateId: string) {
        const filePath = this.csvFilePath!;

        this.logger.log(`Reading CSV from ${filePath}`);

        try {
            await fs.promises.access(filePath);
        } catch {
            throw new Error(`CSV file not found at ${filePath}`);
        }

        const parser = fs
            .createReadStream(filePath)
            .pipe(
                parse({
                    columns: true,
                    skip_empty_lines: true,
                    relax_quotes: true,
                    relax_column_count: true,
                }),
            );

        let readRows = 0;
        let insertedRows = 0;
        let lastPersisted = 0;

        let batch: any[] = [];
        let recentEmails: string[] = [];
        const seenEmails = new Set<string>();

        try {
            for await (const record of parser) {
                readRows++;

                const customer = normalizeCustomer(record);
                if (!customer) continue;

                if (seenEmails.has(customer.email)) continue;
                seenEmails.add(customer.email);

                batch.push(customer);

                if (batch.length >= BATCH_SIZE) {
                    const inserted = await this.insertBatchSafely(batch);
                    insertedRows += inserted;

                    if (inserted === 0) {
                        this.logger.warn(
                            `Batch processed but 0 rows inserted. Possible CSV mapping or duplicate issue.`,
                        );
                    }

                    recentEmails.push(...batch.map((c) => c.email));
                    batch = [];

                    // Persist progress every 1000 rows
                    if (readRows - lastPersisted >= PROGRESS_INTERVAL) {
                        await this.prisma.importState.update({
                            where: { id: importStateId },
                            data: {
                                processedRows: readRows,
                                recentCustomerEmails: recentEmails.slice(-RECENT_BUFFER_SIZE),
                            },
                        });

                        lastPersisted = readRows;

                        this.logger.log(
                            `Import ${importStateId}: read=${readRows}, inserted=${insertedRows}`,
                        );
                    }
                }
            }

            // flush remaining batch
            if (batch.length > 0) {
                insertedRows += await this.insertBatchSafely(batch);
            }

            await this.prisma.importState.update({
                where: { id: importStateId },
                data: {
                    status: 'completed',
                    processedRows: readRows,
                },
            });

            this.logger.log(`Import ${importStateId} completed | read=${readRows}, inserted=${insertedRows}`);
        } catch (error) {
            this.logger.error(
                `Import ${importStateId} failed after ${readRows} rows`,
                error,
            );

            await this.safeFail(importStateId, error, readRows);
        }
    }

    /**
     * MongoDB-safe batch insertion with duplicate handling.
     */
    private async insertBatchSafely(batch: any[]): Promise<number> {
        try {
            const result = await this.prisma.customer.createMany({
                data: batch,
            });
            return result.count;
        } catch (error: any) {
            if (error.code !== 'P2002') {
                throw error;
            }

            // Fallback path (only when duplicates exist)
            let inserted = 0;
            for (const customer of batch) {
                try {
                    await this.prisma.customer.create({ data: customer });
                    inserted++;
                } catch (err: any) {
                    if (err.code === 'P2002') {
                        this.logger.warn(
                            `Duplicate skipped: ${customer.email}`,
                        );
                    } else {
                        throw err;
                    }
                }
            }

            return inserted;
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
                    status: 'failed',
                    processedRows,
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