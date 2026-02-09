import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('vehicle_current_status')
export class VehicleCurrent {

  @PrimaryColumn({ name: 'vehicle_id' })
  vehicleId: string;

  @Column({ name: 'soc' })
  soc: number;

  @Column({ name: 'battery_temp' })
  batteryTemp: number;

  @Column({ name: 'last_kwh_delivered_dc' })
  lastKwhDeliveredDc: number;

  @Column({ name: 'last_seen' })
  lastSeen: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
