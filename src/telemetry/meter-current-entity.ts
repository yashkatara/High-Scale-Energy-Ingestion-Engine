import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('meter_current_status')
export class MeterCurrent {

  @PrimaryColumn({ name: 'meter_id' })
  meterId: string;

  @Column({ name: 'last_kwh_consumed_ac' })
  lastKwhConsumedAc: number;

  @Column({ name: 'last_voltage' })
  lastVoltage: number;

  @Column({ name: 'last_seen' })
  lastSeen: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
