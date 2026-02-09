-- Cold Store: Meter Telemetry History (Append-only)
CREATE TABLE IF NOT EXISTS meter_telemetry_history (
    id SERIAL PRIMARY KEY,
    meter_id VARCHAR(255) NOT NULL,
    kwh_consumed_ac DECIMAL(10, 2) NOT NULL,
    voltage DECIMAL(8, 2) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_meter_telemetry_history_meter_id_timestamp 
    ON meter_telemetry_history(meter_id, timestamp DESC);

-- Hot Store: Meter Current Status (UPSERT)
CREATE TABLE IF NOT EXISTS meter_current_status (
    meter_id VARCHAR(255) PRIMARY KEY,
    last_kwh_consumed_ac DECIMAL(10, 2) NOT NULL,
    last_voltage DECIMAL(8, 2) NOT NULL,
    last_seen TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cold Store: Vehicle Telemetry History (Append-only)
CREATE TABLE IF NOT EXISTS vehicle_telemetry_history (
    id SERIAL PRIMARY KEY,
    vehicle_id VARCHAR(255) NOT NULL,
    soc DECIMAL(5, 2) NOT NULL,
    kwh_delivered_dc DECIMAL(10, 2) NOT NULL,
    battery_temp DECIMAL(6, 2) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vehicle_telemetry_history_vehicle_id_timestamp 
    ON vehicle_telemetry_history(vehicle_id, timestamp DESC);

-- Hot Store: Vehicle Current Status (UPSERT)
CREATE TABLE IF NOT EXISTS vehicle_current_status (
    vehicle_id VARCHAR(255) PRIMARY KEY,
    soc DECIMAL(5, 2) NOT NULL,
    battery_temp DECIMAL(6, 2) NOT NULL,
    last_kwh_delivered_dc DECIMAL(10, 2) NOT NULL,
    last_seen TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Mapping Table: Links vehicles to their meters
CREATE TABLE IF NOT EXISTS vehicle_meter_map (
    id SERIAL PRIMARY KEY,
    vehicle_id VARCHAR(255) NOT NULL,
    meter_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(vehicle_id, meter_id)
);

CREATE INDEX idx_vehicle_meter_map_vehicle_id 
    ON vehicle_meter_map(vehicle_id);

CREATE INDEX idx_vehicle_meter_map_meter_id 
    ON vehicle_meter_map(meter_id);
