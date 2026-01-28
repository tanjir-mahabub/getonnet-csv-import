import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomerService {
    constructor(private primsa: PrismaService) { }

    async create(createCustomerDto: CreateCustomerDto) {
        return this.primsa.customer.create({
            data: createCustomerDto,
        });
    }

    async update(id: string, updateCustomerDto: UpdateCustomerDto) {
        return this.primsa.customer.update({
            where: { id },
            data: {
                ...updateCustomerDto,
                updatedManuallyAt: new Date(),
            },
        });
    }

    async findOne(id: string) {
        return this.primsa.customer.findUnique({
            where: { id },
        });
    }

    async findMany(page = 1, limit = 20) {
        const skip = (page - 1) * limit;

        const [items, total] = await Promise.all([
            this.primsa.customer.findMany({
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.primsa.customer.count(),
        ]);

        return { items, page, limit, total };
    }
}
