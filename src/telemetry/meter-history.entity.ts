import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('meter_telemetry_history')
@Index(['meterId', 'timestamp'])
export class MeterHistory {

  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'meter_id' })
  meterId: string;

  @Column({ name: 'kwh_consumed_ac' })
  kwhConsumedAc: number;

  @Column()
  voltage: number;

  @Column({ type: 'timestamp' })
  timestamp: Date;
}
