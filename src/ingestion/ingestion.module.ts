import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MeterCurrent } from 'src/telemetry/meter-current-entity';
import { MeterHistory } from 'src/telemetry/meter-history.entity';
import { VehicleCurrent } from 'src/telemetry/vehicle-current-entity';
import { VehicleHistory } from 'src/telemetry/vehicle-history.entity';
import { VehicleMeterMap } from 'src/telemetry/vehicle-meter-map.entity';
import { IngestionController } from './ingestion.controller';
import { IngestionService } from './ingestion.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MeterHistory,
      VehicleHistory,
      MeterCurrent,
      VehicleCurrent,
      VehicleMeterMap,
    ]),
  ],
  controllers: [IngestionController],
  providers: [IngestionService]
})
export class IngestionModule {}
