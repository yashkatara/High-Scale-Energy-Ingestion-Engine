import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class AnalyticsService {
  constructor(private dataSource: DataSource) {}

  /**
   * Get 24-hour performance summary for a vehicle
   * 
   * Returns:
   * - total_dc: Total kWh delivered to battery (DC) in 24h
   * - total_ac: Total kWh consumed from grid (AC) in 24h
   * - efficiency_ratio: DC / AC (should be >= 0.85 for healthy system)
   * - avg_battery_temp: Average battery temperature
   * - record_count: Number of telemetry records analyzed
   * - alert: Warning if efficiency below 85% (power loss indicates fault)
   */
  async getPerformance(vehicleId: string) {
    const result = await this.dataSource.query(
      `
      SELECT
        v.vehicle_id AS vehicleId,
        COALESCE(SUM(v.kwh_delivered_dc), 0) AS total_dc,
        COALESCE(SUM(m.kwh_consumed_ac), 0) AS total_ac,
        CASE 
          WHEN SUM(m.kwh_consumed_ac) > 0 
          THEN ROUND(
            (SUM(v.kwh_delivered_dc) / SUM(m.kwh_consumed_ac))::numeric, 4
          )
          ELSE 0
        END AS efficiency_ratio,
        COALESCE(ROUND(AVG(v.battery_temp)::numeric, 2), 0) AS avg_battery_temp,
        COUNT(v.id) AS record_count,
        CASE 
          WHEN SUM(m.kwh_consumed_ac) > 0 
          AND (SUM(v.kwh_delivered_dc) / SUM(m.kwh_consumed_ac)) < 0.85
          THEN 'WARNING: Efficiency below 85% - possible hardware fault or energy leakage detected'
          ELSE NULL
        END AS alert
      FROM vehicle_telemetry_history v
      JOIN vehicle_meter_map vmm ON vmm.vehicle_id = v.vehicle_id
      LEFT JOIN meter_telemetry_history m 
        ON m.meter_id = vmm.meter_id
        AND m.timestamp >= v.timestamp - INTERVAL '5 minutes'
        AND m.timestamp <= v.timestamp + INTERVAL '5 minutes'
      WHERE v.vehicle_id = $1
        AND v.timestamp >= NOW() - INTERVAL '24 HOURS'
      GROUP BY v.vehicle_id
      `,
      [vehicleId],
    );

    if (!result || result.length === 0) {
      throw new NotFoundException(`No telemetry data found for vehicle: ${vehicleId}`);
    }

    return result[0];
  }

  /**
   * Get current live status of a vehicle (from hot store)
   * Used for real-time dashboard display
   */
  async getCurrentStatus(vehicleId: string) {
    const result = await this.dataSource.query(
      `
      SELECT 
        vehicle_id AS vehicleId,
        soc,
        battery_temp AS batteryTemp,
        last_kwh_delivered_dc AS lastKwhDeliveredDc,
        last_seen AS lastSeen,
        updated_at AS updatedAt
      FROM vehicle_current_status
      WHERE vehicle_id = $1
      `,
      [vehicleId],
    );

    if (!result || result.length === 0) {
      throw new NotFoundException(`No current status found for vehicle: ${vehicleId}`);
    }

    return result[0];
  }

  /**
   * Get current live status of a meter (from hot store)
   * Used for real-time dashboard display
   */
  async getMeterCurrentStatus(meterId: string) {
    const result = await this.dataSource.query(
      `
      SELECT 
        meter_id AS meterId,
        last_kwh_consumed_ac AS lastKwhConsumedAc,
        last_voltage AS lastVoltage,
        last_seen AS lastSeen,
        updated_at AS updatedAt
      FROM meter_current_status
      WHERE meter_id = $1
      `,
      [meterId],
    );

    if (!result || result.length === 0) {
      throw new NotFoundException(`No current status found for meter: ${meterId}`);
    }

    return result[0];
  }
}
