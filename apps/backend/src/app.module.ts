import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CustomerModule } from './customer/customer.module';
import { PrismaService } from './prisma/prisma.service';
import { PrismaModule } from './prisma/prisma.module';
import { ImportModule } from './import/import.module';

@Module({
  imports: [CustomerModule, PrismaModule, ImportModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
