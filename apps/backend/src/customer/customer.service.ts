import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Customer } from '@prisma/client';
import { isValidObjectId } from '../common/utils/objectid.util';

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

    async findManyCursor(cursor?: string, limit = 20) {
        if (cursor && !isValidObjectId(cursor)) {
            throw new BadRequestException('Invalid cursor');
        }

        const items = await this.prisma.customer.findMany({
            take: limit,
            ...(cursor && {
                cursor: { id: cursor },
                skip: 1,
            }),
            orderBy: { id: 'desc' },
        })

        return {
            items,
            nextCursor: items.length ? items[items.length - 1].id : null,
            hasMore: items.length === limit,
        }
    }
}
