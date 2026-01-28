import * as fs from 'fs';
import * as readline from 'readline';

import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
        this.runCsvImport(importState.id).catch(async (err) => {
            this.logger.error(
                `Unhandled import failure (id=${importState.id})`,
                err,
            );

            // Ensure state is not left as "running"
            await this.safeFail(importState.id, 0);
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

        if (!fs.existsSync(filePath)) {
            throw new Error(`CSV file not found at ${filePath}`);
        }

        let processedRows = 0;

        try {
            const stream = fs.createReadStream(filePath);

            const rl = readline.createInterface({
                input: stream,
                crlfDelay: Infinity,
            });

            for await (const _line of rl) {
                processedRows++;

                // Persist progress every 1000 rows
                if (processedRows % 1000 === 0) {
                    await this.prisma.importState.update({
                        where: { id: importStateId },
                        data: { processedRows },
                    });

                    if (processedRows % 100_000 === 0) {
                        this.logger.log(
                            `Import ${importStateId}: ${processedRows} rows processed`,
                        );
                    }
                }
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
    private async safeFail(importStateId: string, processedRows: number) {
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