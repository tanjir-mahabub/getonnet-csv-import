import * as fs from 'fs';
import { parse } from 'csv-parse';
import {
    BadRequestException,
    Injectable,
    Logger,
    OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ImportStatus } from './import-status.enum';
import {
    BATCH_SIZE,
    PROGRESS_INTERVAL,
    RECENT_BUFFER_SIZE,
    TOTAL_ROWS,
} from '../common/utils/constants';
import { normalizeCustomer } from '../common/utils/normalizeCustomer';

@Injectable()
export class ImportService implements OnModuleInit {
    private readonly logger = new Logger(ImportService.name);
    private readonly csvFilePath = process.env.CSV_FILE_PATH!;

    constructor(private readonly prisma: PrismaService) { }

    /* ================= INIT ================= */
    async onModuleInit() {
        const running = await this.prisma.importState.findFirst({
            where: { status: ImportStatus.RUNNING },
        });

        if (running) {
            await this.prisma.importState.update({
                where: { id: running.id },
                data: { status: ImportStatus.INTERRUPTED },
            });
        }
    }

    /* ================= START ================= */
    async startImport() {
        await this.ensureCsvExists();

        const importState = await this.prisma.$transaction(async (tx) => {
            const latest = await tx.importState.findFirst({
                orderBy: { startedAt: 'desc' },
            });

            if (latest?.status === ImportStatus.RUNNING) {
                return latest;
            }

            if (latest?.status === ImportStatus.INTERRUPTED) {
                await tx.importState.update({
                    where: { id: latest.id },
                    data: { status: ImportStatus.RUNNING, errorMessage: null },
                });

                setImmediate(() => this.runCsvImport(latest.id));
                return { ...latest, status: ImportStatus.RUNNING };
            }

            return tx.importState.create({
                data: {
                    status: ImportStatus.RUNNING,
                    processedRows: 0,
                    skippedRows: 0,
                    lastProcessedRow: 0,
                    totalRows: TOTAL_ROWS,
                    recentCustomerEmails: [],
                    startedAt: new Date(),
                },
            });
        });

        setImmediate(() => this.runCsvImport(importState.id));
        return importState;
    }

    async getProgress() {
        return this.prisma.importState.findFirst({
            orderBy: { startedAt: 'desc' },
        });
    }

    /* ================= CORE ================= */
    private async runCsvImport(importStateId: string) {
        const state = await this.prisma.importState.findUnique({
            where: { id: importStateId },
        });
        if (!state) return;

        let currentRow = 0;
        let processedRows = state.processedRows;
        let skippedRows = state.skippedRows;
        let lastPersisted = processedRows;

        let batch: any[] = [];
        let recentEmails: string[] = [];

        const parser = fs
            .createReadStream(this.csvFilePath)
            .pipe(
                parse({
                    columns: true,
                    skip_empty_lines: true,
                    relax_column_count: true,
                    relax_quotes: true,
                    trim: true,
                }),
            );

        try {
            for await (const record of parser) {
                currentRow++;

                if (currentRow <= state.lastProcessedRow) continue;

                const customer = normalizeCustomer(record);
                if (!customer) {
                    skippedRows++;
                    continue;
                }

                batch.push(customer);

                if (batch.length >= BATCH_SIZE) {
                    const inserted = await this.insertBatch(batch);
                    processedRows += inserted;

                    recentEmails.push(...batch.map((c) => c.email));
                    batch = [];

                    if (processedRows - lastPersisted >= PROGRESS_INTERVAL) {
                        await this.persistProgress(
                            importStateId,
                            processedRows,
                            skippedRows,
                            currentRow,
                            recentEmails,
                        );
                        lastPersisted = processedRows;
                    }
                }
            }

            if (batch.length) {
                const inserted = await this.insertBatch(batch);
                processedRows += inserted;

                await this.persistProgress(
                    importStateId,
                    processedRows,
                    skippedRows,
                    currentRow,
                    recentEmails,
                );
            }

            await this.prisma.importState.update({
                where: { id: importStateId },
                data: {
                    status: ImportStatus.COMPLETED,
                    processedRows,
                    skippedRows,
                    lastProcessedRow: currentRow,
                    completedAt: new Date(),
                },
            });
        } catch (e) {
            await this.fail(importStateId, e, processedRows, skippedRows);
        }
    }

    /* ================= FAST INSERT ================= */
    private async insertBatch(batch: any[]): Promise<number> {
        try {
            const result = await this.prisma.customer.createMany({
                data: batch,
            });

            return result.count;
        } catch {
            let inserted = 0;

            for (const c of batch) {
                try {
                    await this.prisma.customer.create({ data: c });
                    inserted++;
                } catch (err: any) {
                    if (err.code === 'P2002') {
                        await this.prisma.customer.updateMany({
                            where: {
                                email: c.email,
                                updatedManuallyAt: null,
                            },
                            data: c,
                        });
                    } else {
                        throw err;
                    }
                }
            }

            return inserted;
        }
    }
    /* ================= PROGRESS ================= */
    private async persistProgress(
        id: string,
        processedRows: number,
        skippedRows: number,
        row: number,
        emails: string[],
    ) {
        await this.prisma.importState.update({
            where: { id },
            data: {
                processedRows,
                skippedRows,
                lastProcessedRow: row,
                recentCustomerEmails: emails.slice(-RECENT_BUFFER_SIZE),
            },
        });
    }

    private async fail(
        id: string,
        error: unknown,
        processedRows: number,
        skippedRows: number,
    ) {
        await this.prisma.importState.update({
            where: { id },
            data: {
                status: ImportStatus.FAILED,
                processedRows,
                skippedRows,
                errorMessage: String(error),
            },
        });
    }

    private async ensureCsvExists() {
        await fs.promises.access(this.csvFilePath).catch(() => {
            throw new BadRequestException('CSV file not found');
        });
    }
}