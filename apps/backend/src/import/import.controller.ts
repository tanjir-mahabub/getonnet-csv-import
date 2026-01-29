import { Controller, Get, Post } from '@nestjs/common';
import { ImportService } from './import.service';

@Controller('import')
export class ImportController {
    constructor(private readonly importService: ImportService) { }

    @Post('sync')
    startSync() {
        return this.importService.startImport();
    }

    @Get('progress')
    getProgress() {
        return this.importService.getProgress();
    }
}
