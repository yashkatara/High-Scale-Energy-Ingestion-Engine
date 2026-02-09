import { IsISO8601, IsNumber, IsString } from 'class-validator';

export class MeterIngestionDto {
  @IsString()
  meterId: string;

  @IsNumber()
  kwhConsumedAc: number;

  @IsNumber()
  voltage: number;

  @IsISO8601()
  timestamp: string;
}
