import { BadRequestException, Body, Controller, Get, NotFoundException, Param, Patch, Post, Query } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { isValidObjectId } from '../common/utils/objectid.util';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Controller('customers')
export class CustomerController {
    constructor(private readonly service: CustomerService) { }

    @Post()
    createCustomer(@Body() createCustomerDto: CreateCustomerDto) {
        return this.service.create(createCustomerDto);
    }

    @Get()
    getAllCustomers(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.service.findMany(
            page ? Number(page) : 1,
            limit ? Number(limit) : 20,
        );
    }

    @Get(':id')
    async getCustomerById(@Param('id') id: string) {
        if (!isValidObjectId(id)) {
            throw new BadRequestException('Invalid customer id');
        }

        const customer = await this.service.findOne(id);

        if (!customer) {
            throw new NotFoundException('Customer not found');
        }

        return customer;
    }

    @Patch(':id')
    async updateCustomer(
        @Param('id') id: string,
        @Body() updateCustomerDto: UpdateCustomerDto,
    ) {
        if (!isValidObjectId(id)) {
            throw new BadRequestException('Invalid customer id');
        }

        return this.service.update(id, updateCustomerDto);
    }
}
