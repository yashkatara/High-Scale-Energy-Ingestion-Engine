import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MeterCurrent } from 'src/telemetry/meter-current-entity';
import { MeterHistory } from 'src/telemetry/meter-history.entity';
import { VehicleCurrent } from 'src/telemetry/vehicle-current-entity';
import { VehicleHistory } from 'src/telemetry/vehicle-history.entity';
import { VehicleMeterMap } from 'src/telemetry/vehicle-meter-map.entity';
import { Repository } from 'typeorm';
import { MeterIngestionDto } from './dtos/meter-ingestion.dto';
import { VehicleIngestionDto } from './dtos/vehicle-ingestion.dto';

@Injectable()
export class IngestionService {

  constructor(
    @InjectRepository(MeterHistory)
    private meterHistoryRepo: Repository<MeterHistory>,
    @InjectRepository(MeterCurrent)
    private meterCurrentRepo: Repository<MeterCurrent>,
    @InjectRepository(VehicleHistory)
    private vehicleHistoryRepo: Repository<VehicleHistory>,
    @InjectRepository(VehicleCurrent)
    private vehicleCurrentRepo: Repository<VehicleCurrent>,
    @InjectRepository(VehicleMeterMap)
    private vehicleMeterMapRepo: Repository<VehicleMeterMap>,
  ) {}

  async ingestMeter(data: MeterIngestionDto) {
    const timestamp = new Date(data.timestamp);

    // Cold Path: Append to history for audit trail
    await this.meterHistoryRepo.insert({
      meterId: data.meterId,
      kwhConsumedAc: data.kwhConsumedAc,
      voltage: data.voltage,
      timestamp,
    });

    // Hot Path: Upsert to current status (atomic update)
    await this.meterCurrentRepo.upsert(
      {
        meterId: data.meterId,
        lastKwhConsumedAc: data.kwhConsumedAc,
        lastVoltage: data.voltage,
        lastSeen: timestamp,
      },
      ['meterId'],
    );

    return { 
      status: 'meter data saved',
      meterId: data.meterId,
      timestamp,
    };
  }

 
  async ingestVehicle(data: VehicleIngestionDto) {
    const timestamp = new Date(data.timestamp);

    // Cold Path: Append to history for audit trail
    await this.vehicleHistoryRepo.insert({
      vehicleId: data.vehicleId,
      soc: data.soc,
      kwhDeliveredDc: data.kwhDeliveredDc,
      batteryTemp: data.batteryTemp,
      timestamp,
    });

    // Hot Path: Upsert to current status (atomic update)
    await this.vehicleCurrentRepo.upsert(
      {
        vehicleId: data.vehicleId,
        soc: data.soc,
        batteryTemp: data.batteryTemp,
        lastKwhDeliveredDc: data.kwhDeliveredDc,
        lastSeen: timestamp,
      },
      ['vehicleId'],
    );

    return { 
      status: 'vehicle data saved',
      vehicleId: data.vehicleId,
      timestamp,
    };
  }

  /**
   * Polymorphic ingestion endpoint that accepts either meter or vehicle data
   * Discriminates by presence of meterId vs vehicleId
   */
  async ingestPolymorphic(data: any) {
    if (data.meterId && data.kwhConsumedAc !== undefined) {
      const meterDto = new MeterIngestionDto();
      meterDto.meterId = data.meterId;
      meterDto.kwhConsumedAc = data.kwhConsumedAc;
      meterDto.voltage = data.voltage;
      meterDto.timestamp = data.timestamp;
      return this.ingestMeter(meterDto);
    }

    if (data.vehicleId && data.kwhDeliveredDc !== undefined) {
      const vehicleDto = new VehicleIngestionDto();
      vehicleDto.vehicleId = data.vehicleId;
      vehicleDto.soc = data.soc;
      vehicleDto.kwhDeliveredDc = data.kwhDeliveredDc;
      vehicleDto.batteryTemp = data.batteryTemp;
      vehicleDto.timestamp = data.timestamp;
      return this.ingestVehicle(vehicleDto);
    }

    throw new BadRequestException('Invalid payload: Must contain either meterId (meter) or vehicleId (vehicle) with corresponding fields');
  }

  async registerVehicleMeterMapping(vehicleId: string, meterId: string) {
    await this.vehicleMeterMapRepo.upsert(
      {
        vehicleId,
        meterId,
      },
      ['vehicleId', 'meterId'],
    );

    return { 
      status: 'mapping registered',
      vehicleId,
      meterId,
    };
  }
}
