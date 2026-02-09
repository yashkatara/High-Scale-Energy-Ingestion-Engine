import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity('vehicle_meter_map')
@Unique(['vehicleId', 'meterId'])
export class VehicleMeterMap {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'vehicle_id' })
  vehicleId: string;

  @Column({ name: 'meter_id' })
  meterId: string;

  @Column({ name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
