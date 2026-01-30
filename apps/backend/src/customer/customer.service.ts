import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Customer } from '@prisma/client';

@Injectable()
export class CustomerService {
    private readonly logger = new Logger(CustomerService.name);

    constructor(private prisma: PrismaService) { }

    async create(createCustomerDto: CreateCustomerDto) {
        this.logger.log(`Creating customer ${createCustomerDto.email}`);
        return this.prisma.customer.create({
            data: {
                ...createCustomerDto,
                updatedManuallyAt: new Date(),
            },
        });
    }

    async update(id: string, updateCustomerDto: UpdateCustomerDto) {
        this.logger.log(`Manually updating customer ${id}`);

        return this.prisma.customer.update({
            where: { id },
            data: {
                ...updateCustomerDto,
                updatedManuallyAt: new Date(),
            },
        });
    }

    async findOne(id: string): Promise<Customer | null> {
        return this.prisma.customer.findUnique({
            where: { id },
        });
    }

    async findMany(page = 1, limit = 20): Promise<{
        items: Customer[];
        page: number;
        limit: number;
        total: number;
    }> {
        const skip = (page - 1) * limit;

        const [items, total] = await Promise.all([
            this.prisma.customer.findMany({
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.customer.count(),
        ]);

        return { items, page, limit, total };
    }
}
