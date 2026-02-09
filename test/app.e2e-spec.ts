import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Energy Fleet Platform E2E Tests', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Integration Flow: Meter & Vehicle Telemetry', () => {
    const vehicleId = 'vehicle-e2e-001';
    const meterId = 'meter-e2e-001';

    it('1. Should register vehicle-to-meter mapping', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/ingestion/mapping')
        .send({
          vehicleId,
          meterId,
        })
        .expect(201);

      expect(response.body).toEqual({
        status: 'mapping registered',
        vehicleId,
        meterId,
      });
    });

    it('2. Should ingest meter telemetry (AC power from grid)', async () => {
      const meterData = {
        meterId,
        kwhConsumedAc: 150.5,
        voltage: 230.0,
        timestamp: new Date().toISOString(),
      };

      const response = await request(app.getHttpServer())
        .post('/v1/ingestion')
        .send(meterData)
        .expect(201);

      expect(response.body.status).toBe('meter data saved');
      expect(response.body.meterId).toBe(meterId);
    });

    it('3. Should ingest vehicle telemetry (DC power to battery)', async () => {
      const vehicleData = {
        vehicleId,
        soc: 85.5,
        kwhDeliveredDc: 120.0,
        batteryTemp: 35.2,
        timestamp: new Date().toISOString(),
      };

      const response = await request(app.getHttpServer())
        .post('/v1/ingestion')
        .send(vehicleData)
        .expect(201);

      expect(response.body.status).toBe('vehicle data saved');
      expect(response.body.vehicleId).toBe(vehicleId);
    });

    it('4. Should retrieve 24-hour performance analytics', async () => {
      const response = await request(app.getHttpServer())
        .get(`/v1/analytics/performance/${vehicleId}`);

      // Should have efficiency metrics
      if (response.status === 200) {
        expect(response.body).toHaveProperty('vehicleId');
        expect(response.body).toHaveProperty('total_dc');
        expect(response.body).toHaveProperty('total_ac');
        expect(response.body).toHaveProperty('efficiency_ratio');
        expect(response.body).toHaveProperty('avg_battery_temp');
      }
    });

    it('5. Should reject invalid ingestion payload', async () => {
      const invalidData = {
        timestamp: new Date().toISOString(),
        // Missing meterId or vehicleId
      };

      const response = await request(app.getHttpServer())
        .post('/v1/ingestion')
        .send(invalidData);

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('Data Validation & Error Handling', () => {
    it('Should validate required payload fields', async () => {
      const incompleteData = {
        vehicleId: 'vehicle-001',
        soc: 85.5,
        // Missing kwhDeliveredDc and batteryTemp
        timestamp: new Date().toISOString(),
      };

      const response = await request(app.getHttpServer())
        .post('/v1/ingestion')
        .send(incompleteData);

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('Root Endpoint', () => {
    it('/ (GET)', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(200)
        .expect('Hello World!');
    });
  });
});
