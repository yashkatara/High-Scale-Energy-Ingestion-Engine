import { IsISO8601, IsNumber, IsString } from 'class-validator';

export class VehicleIngestionDto {
  @IsString()
  vehicleId: string;

  @IsNumber()
  soc: number;

  @IsNumber()
  kwhDeliveredDc: number;

  @IsNumber()
  batteryTemp: number;

  @IsISO8601()
  timestamp: string;
}
