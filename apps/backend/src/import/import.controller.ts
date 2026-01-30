import { Controller, Get, Post, Header } from '@nestjs/common';
import { ImportService } from './import.service';

@Controller('import')
export class ImportController {
    constructor(private readonly importService: ImportService) { }

    @Post('sync')
    startSync() {
        return this.importService.startImport();
    }

    @Get('progress')
    @Header('Cache-Control', 'no-store')
    getProgress() {
        return this.importService.getProgress();
    }
}