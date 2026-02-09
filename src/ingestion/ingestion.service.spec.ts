import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MeterCurrent } from 'src/telemetry/meter-current-entity';
import { MeterHistory } from 'src/telemetry/meter-history.entity';
import { VehicleCurrent } from 'src/telemetry/vehicle-current-entity';
import { VehicleHistory } from 'src/telemetry/vehicle-history.entity';
import { VehicleMeterMap } from 'src/telemetry/vehicle-meter-map.entity';
import { IngestionService } from './ingestion.service';

describe('IngestionService', () => {
  let service: IngestionService;
  let mockMeterHistoryRepo: any;
  let mockMeterCurrentRepo: any;
  let mockVehicleHistoryRepo: any;
  let mockVehicleCurrentRepo: any;
  let mockVehicleMeterMapRepo: any;

  beforeEach(async () => {
    mockMeterHistoryRepo = {
      insert: jest.fn().mockResolvedValue({}),
    };

    mockMeterCurrentRepo = {
      upsert: jest.fn().mockResolvedValue({}),
    };

    mockVehicleHistoryRepo = {
      insert: jest.fn().mockResolvedValue({}),
    };

    mockVehicleCurrentRepo = {
      upsert: jest.fn().mockResolvedValue({}),
    };

    mockVehicleMeterMapRepo = {
      upsert: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IngestionService,
        {
          provide: getRepositoryToken(MeterHistory),
          useValue: mockMeterHistoryRepo,
        },
        {
          provide: getRepositoryToken(MeterCurrent),
          useValue: mockMeterCurrentRepo,
        },
        {
          provide: getRepositoryToken(VehicleHistory),
          useValue: mockVehicleHistoryRepo,
        },
        {
          provide: getRepositoryToken(VehicleCurrent),
          useValue: mockVehicleCurrentRepo,
        },
        {
          provide: getRepositoryToken(VehicleMeterMap),
          useValue: mockVehicleMeterMapRepo,
        },
      ],
    }).compile();

    service = module.get<IngestionService>(IngestionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('ingestMeter', () => {
    it('should insert meter history and upsert current status', async () => {
      const meterData = {
        meterId: 'meter-001',
        kwhConsumedAc: 150.5,
        voltage: 230.0,
        timestamp: '2026-02-09T10:00:00Z',
      };

      const result = await service.ingestMeter(meterData);

      expect(mockMeterHistoryRepo.insert).toHaveBeenCalledWith({
        meterId: 'meter-001',
        kwhConsumedAc: 150.5,
        voltage: 230.0,
        timestamp: expect.any(Date),
      });

      expect(mockMeterCurrentRepo.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          meterId: 'meter-001',
          lastKwhConsumedAc: 150.5,
          lastVoltage: 230.0,
        }),
        ['meterId'],
      );

      expect(result.status).toBe('meter data saved');
      expect(result.meterId).toBe('meter-001');
    });
  });

  describe('ingestVehicle', () => {
    it('should insert vehicle history and upsert current status', async () => {
      const vehicleData = {
        vehicleId: 'vehicle-001',
        soc: 85.5,
        kwhDeliveredDc: 120.0,
        batteryTemp: 35.2,
        timestamp: '2026-02-09T10:00:00Z',
      };

      const result = await service.ingestVehicle(vehicleData);

      expect(mockVehicleHistoryRepo.insert).toHaveBeenCalledWith({
        vehicleId: 'vehicle-001',
        soc: 85.5,
        kwhDeliveredDc: 120.0,
        batteryTemp: 35.2,
        timestamp: expect.any(Date),
      });

      expect(mockVehicleCurrentRepo.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          vehicleId: 'vehicle-001',
          soc: 85.5,
          batteryTemp: 35.2,
          lastKwhDeliveredDc: 120.0,
        }),
        ['vehicleId'],
      );

      expect(result.status).toBe('vehicle data saved');
      expect(result.vehicleId).toBe('vehicle-001');
    });
  });

  describe('ingestPolymorphic', () => {
    it('should route meter data to ingestMeter', async () => {
      const meterData = {
        meterId: 'meter-001',
        kwhConsumedAc: 150.5,
        voltage: 230.0,
        timestamp: '2026-02-09T10:00:00Z',
      };

      jest.spyOn(service, 'ingestMeter').mockResolvedValue({
        status: 'meter data saved',
        meterId: 'meter-001',
        timestamp: new Date(),
      });

      const result = await service.ingestPolymorphic(meterData);
      expect(result.status).toBe('meter data saved');
    });

    it('should route vehicle data to ingestVehicle', async () => {
      const vehicleData = {
        vehicleId: 'vehicle-001',
        soc: 85.5,
        kwhDeliveredDc: 120.0,
        batteryTemp: 35.2,
        timestamp: '2026-02-09T10:00:00Z',
      };

      jest.spyOn(service, 'ingestVehicle').mockResolvedValue({
        status: 'vehicle data saved',
        vehicleId: 'vehicle-001',
        timestamp: new Date(),
      });

      const result = await service.ingestPolymorphic(vehicleData);
      expect(result.status).toBe('vehicle data saved');
    });

    it('should throw error on invalid payload', async () => {
      const invalidData = { timestamp: '2026-02-09T10:00:00Z' };

      await expect(service.ingestPolymorphic(invalidData)).rejects.toThrow(
        'Invalid payload',
      );
    });
  });

  describe('registerVehicleMeterMapping', () => {
    it('should upsert vehicle-meter mapping', async () => {
      await service.registerVehicleMeterMapping('vehicle-001', 'meter-001');

      expect(mockVehicleMeterMapRepo.upsert).toHaveBeenCalledWith(
        {
          vehicleId: 'vehicle-001',
          meterId: 'meter-001',
        },
        ['vehicleId', 'meterId'],
      );
    });
  });
});
