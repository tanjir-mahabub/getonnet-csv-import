import * as fs from 'fs';
import { parse } from 'csv-parse';

import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const BATCH_SIZE = 1000;
const PROGRESS_INTERVAL = 1000;
const RECENT_BUFFER_SIZE = 20;

@Injectable()
export class ImportService {
    private readonly logger = new Logger(ImportService.name);
    private readonly csvFilePath = process.env.CSV_FILE_PATH;

    constructor(private prisma: PrismaService) { }

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
                recentCustomerIds: [],
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

        return progress ?? { status: 'idle' };
    }

    /**
     * Core CSV streaming logic.
     * Event-loop safe, progress persisted, failure-safe.
     */
    private async runCsvImport(importStateId: string) {
        const filePath = this.csvFilePath!;

        this.logger.log(`Reading CSV from ${filePath}`);

        try {
            // async-friendly existence check
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

        let processedRows = 0;
        let batch: any[] = [];
        let recentIds: string[] = [];

        try {

            for await (const _record of parser) {
                batch.push({
                    email: _record.email,
                    firstName: _record.firstName,
                    lastName: _record.lastName,
                });

                if (batch.length >= BATCH_SIZE) {
                    const createdCustomers = await this.prisma.customer.createMany({
                        data: batch,
                    });

                    processedRows += createdCustomers.count;

                    batch = [];

                    // Persist progress every 1000 rows
                    if (processedRows % PROGRESS_INTERVAL === 0) {
                        await this.prisma.importState.update({
                            where: { id: importStateId },
                            data: {
                                processedRows,
                                recentCustomerIds: recentIds.slice(-RECENT_BUFFER_SIZE),
                            },
                        });

                        this.logger.log(
                            `Import ${importStateId}: ${processedRows} rows processed`,
                        );
                    }
                }
            }

            // flush remaining batch
            if (batch.length > 0) {
                const createdCustomers = await this.prisma.customer.createMany({
                    data: batch,
                });

                processedRows += createdCustomers.count;
            }

            await this.prisma.importState.update({
                where: { id: importStateId },
                data: {
                    status: 'completed',
                    processedRows,
                },
            });

            this.logger.log(`Import ${importStateId} completed successfully`);
        } catch (error) {
            this.logger.error(
                `Import ${importStateId} failed after ${processedRows} rows`,
                error,
            );

            await this.safeFail(importStateId, processedRows);
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