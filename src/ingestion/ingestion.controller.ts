import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { IngestionService } from './ingestion.service';

@Controller('v1/ingestion')
export class IngestionController {

  constructor(private ingestionService: IngestionService) {}

  
  @Post()
  @HttpCode(201)
  async ingest(@Body() body: any) {
    return this.ingestionService.ingestPolymorphic(body);
  }


  @Post('mapping')
  @HttpCode(201)
  async registerMapping(@Body() body: { vehicleId: string; meterId: string }) {
    return this.ingestionService.registerVehicleMeterMapping(body.vehicleId, body.meterId);
  }
}
