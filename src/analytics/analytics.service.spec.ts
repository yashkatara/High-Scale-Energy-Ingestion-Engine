import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let mockDataSource: any;

  beforeEach(async () => {
    mockDataSource = {
      query: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: 'DataSource',
          useValue: mockDataSource,
        },
      ],
    })
      .overrideProvider('DataSource')
      .useValue(mockDataSource)
      .compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    service['dataSource'] = mockDataSource;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPerformance', () => {
    it('should calculate 24-hour efficiency correctly', async () => {
      const mockResult = [
        {
          vehicleId: 'vehicle-001',
          total_dc: 120.0,
          total_ac: 150.0,
          efficiency_ratio: 0.8,
          avg_battery_temp: 35.5,
          record_count: 24,
          alert: null,
        },
      ];

      mockDataSource.query.mockResolvedValue(mockResult);

      const result = await service.getPerformance('vehicle-001');

      expect(result.total_dc).toBe(120.0);
      expect(result.total_ac).toBe(150.0);
      expect(result.efficiency_ratio).toBe(0.8);
      expect(mockDataSource.query).toHaveBeenCalled();
    });

    it('should trigger alert when efficiency below 85%', async () => {
      const mockResult = [
        {
          vehicleId: 'vehicle-001',
          total_dc: 120.0,
          total_ac: 150.0,
          efficiency_ratio: 0.8,
          avg_battery_temp: 35.5,
          record_count: 24,
          alert:
            'WARNING: Efficiency below 85% - possible hardware fault or energy leakage detected',
        },
      ];

      mockDataSource.query.mockResolvedValue(mockResult);

      const result = await service.getPerformance('vehicle-001');

      expect(result.alert).toContain('WARNING');
    });

    it('should throw NotFoundException when no data found', async () => {
      mockDataSource.query.mockResolvedValue([]);

      await expect(service.getPerformance('vehicle-999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getCurrentStatus', () => {
    it('should return current vehicle status from hot store', async () => {
      const mockResult = [
        {
          vehicleId: 'vehicle-001',
          soc: 85.5,
          batteryTemp: 35.5,
          lastKwhDeliveredDc: 120.0,
          lastSeen: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockDataSource.query.mockResolvedValue(mockResult);

      const result = await service.getCurrentStatus('vehicle-001');

      expect(result.soc).toBe(85.5);
      expect(result.batteryTemp).toBe(35.5);
    });
  });

  describe('getMeterCurrentStatus', () => {
    it('should return current meter status from hot store', async () => {
      const mockResult = [
        {
          meterId: 'meter-001',
          lastKwhConsumedAc: 150.0,
          lastVoltage: 230.0,
          lastSeen: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockDataSource.query.mockResolvedValue(mockResult);

      const result = await service.getMeterCurrentStatus('meter-001');

      expect(result.lastKwhConsumedAc).toBe(150.0);
      expect(result.lastVoltage).toBe(230.0);
    });
  });
});
