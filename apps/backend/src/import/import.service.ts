import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ImportService {
    private readonly logger = new Logger(ImportService.name);

    constructor(private prisma: PrismaService) { }

    async startImport() {
        const running = await this.prisma.importState.findFirst({
            where: { status: 'running' },
        });

        if (running) {
            this.logger.warn('Import is already running');
            throw new ConflictException('Import is already running');
        }

        this.logger.log('Starting import process');

        return this.prisma.importState.create({
            data: {
                status: 'running',
                processedRows: 0,
                totalRows: 2_000_000,
                recentCustomerIds: [],
                startedAt: new Date(),
            },
        });
    }

    async getProgress() {
        return this.prisma.importState.findFirst({
            orderBy: { startedAt: 'desc' },
        });
    }
}
