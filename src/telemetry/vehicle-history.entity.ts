import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('vehicle_telemetry_history')
@Index(['vehicleId', 'timestamp'])
export class VehicleHistory {

  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'vehicle_id' })
  vehicleId: string;

  @Column({ name: 'soc' })
  soc: number;

  @Column({ name: 'kwh_delivered_dc' })
  kwhDeliveredDc: number;

  @Column({ name: 'battery_temp' })
  batteryTemp: number;

  @Column({ type: 'timestamp' })
  timestamp: Date;
}
