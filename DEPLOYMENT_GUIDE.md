# Deployment & Setup Guide

## Prerequisites
- Node.js 18+
- PostgreSQL 12+
- npm or yarn

## Installation

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory:
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=energy_ingestion

# Server
PORT=3000
NODE_ENV=production
```

### 3. Database Setup

#### Create database:
```bash
psql -U postgres -c "CREATE DATABASE energy_ingestion;"
```

#### Run migrations:
```bash
psql -U postgres -d energy_ingestion -f migrations/001_initial_schema.sql
```

#### Verify tables:
```bash
psql -U postgres -d energy_ingestion -c "\dt"
```

Expected tables:
- `meter_telemetry_history`
- `meter_current_status`
- `vehicle_telemetry_history`
- `vehicle_current_status`
- `vehicle_meter_map`

### 4. Build the Application
```bash
npm run build
```

### 5. Run the Application

#### Development Mode (with hot-reload):
```bash
npm run start:dev
```

#### Production Mode:
```bash
npm run start:prod
```

The API will be available at `http://localhost:3000`

---

## Database Indexing Strategy

The schema includes strategic indexes for performance:

### **Meter History Queries**
```sql
-- Supports: SELECT * FROM meter_telemetry_history WHERE meter_id = ? AND timestamp >= ?
CREATE INDEX idx_meter_telemetry_history_meter_id_timestamp 
    ON meter_telemetry_history(meter_id, timestamp DESC);
```

### **Vehicle History Queries**
```sql
-- Supports: SELECT * FROM vehicle_telemetry_history WHERE vehicle_id = ? AND timestamp >= ?
CREATE INDEX idx_vehicle_telemetry_history_vehicle_id_timestamp 
    ON vehicle_telemetry_history(vehicle_id, timestamp DESC);
```

### **Vehicle-Meter Mapping Lookups**
```sql
CREATE INDEX idx_vehicle_meter_map_vehicle_id ON vehicle_meter_map(vehicle_id);
CREATE INDEX idx_vehicle_meter_map_meter_id ON vehicle_meter_map(meter_id);
```

### **Current Status Lookups**
- Primary keys (`meter_id`, `vehicle_id`) are automatically indexed

---

## Performance Tuning

### 1. Connection Pooling
Update `app.module.ts` for production:
```typescript
TypeOrmModule.forRoot({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  synchronize: false,
  pool: {
    max: 20,
    min: 5,
  },
})
```

### 2. Batch Ingestion
For high-throughput scenarios (>1000 writes/sec), consider:
```typescript
// Example: Batch insert into history
await this.meterHistoryRepo.insert([
  { meterId: 'm1', kwhConsumedAc: 100, voltage: 230, timestamp: new Date() },
  { meterId: 'm2', kwhConsumedAc: 110, voltage: 230, timestamp: new Date() },
  // ...more records
]);
```

### 3. Query Optimization
Analytics query uses time-windowed aggregation:
```sql
-- Efficient: Scans only last 24 hours of data
WHERE v.timestamp >= NOW() - INTERVAL '24 HOURS'
```

### 4. Table Partitioning (Future)
For billions of historical records:
```sql
CREATE TABLE meter_telemetry_history_2026_02 PARTITION OF meter_telemetry_history
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
```

---

## Monitoring & Troubleshooting

### 1. Check Service Health
```bash
curl http://localhost:3000/health
```

### 2. Verify Database Connection
```bash
psql -U postgres -d energy_ingestion -c "SELECT COUNT(*) FROM meter_telemetry_history;"
```

### 3. Monitor Disk Usage
```bash
# Check table sizes
psql -U postgres -d energy_ingestion -c "
  SELECT schemaname, tablename, 
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) 
  FROM pg_tables 
  WHERE schemaname = 'public' 
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"
```

### 4. View Slow Queries
Enable PostgreSQL logging:
```sql
ALTER SYSTEM SET log_min_duration_statement = 100; -- Log queries >100ms
SELECT pg_reload_conf();
```

### 5. Test Ingestion Performance
```bash
# Send 100 test records
for i in {1..100}; do
  curl -X POST http://localhost:3000/v1/ingestion \
    -H "Content-Type: application/json" \
    -d "{\"vehicleId\": \"vehicle-$(printf '%03d' $i)\", \"soc\": 85.5, \"kwhDeliveredDc\": 120.0, \"batteryTemp\": 35.2, \"timestamp\": \"$(date -Iseconds)\"}"
done
```

---

## Running Tests

### Unit Tests
```bash
npm run test
```

### Test Coverage
```bash
npm run test:cov
```

### E2E Tests
```bash
npm run test:e2e
```

---

## Docker Deployment (Optional)

### 1. Create Dockerfile
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start:prod"]
```

### 2. Create docker-compose.yml
```yaml
version: '3.8'
services:
  db:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: energy_ingestion
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./migrations:/docker-entrypoint-initdb.d

  api:
    build: .
    ports:
      - "3000:3000"
    depends_on:
      - db
    environment:
      DB_HOST: db
      DB_PORT: 5432
      DB_USERNAME: postgres
      DB_PASSWORD: postgres
      DB_NAME: energy_ingestion

volumes:
  pgdata:
```

### 3. Deploy
```bash
docker-compose up -d
```

---

## Security Considerations

1. **Input Validation:** All DTOs use `class-validator`
2. **SQL Injection:** Using parameterized queries with TypeORM
3. **Rate Limiting:** Implement in production:
   ```typescript
   import { ThrottlerModule } from '@nestjs/throttler';
   
   ThrottlerModule.forRoot([{
     ttl: 60000,
     limit: 1000, // 1000 requests per minute
   }])
   ```

4. **HTTPS:** Use reverse proxy (Nginx, HAProxy) in production
5. **Authentication:** Add JWT/OAuth2 for API access control

---

## Scaling Considerations

### Vertical Scaling
- Increase CPU/RAM for compute-intensive analytics
- Database connection pool tuning
- Node.js worker threads for parallel processing

### Horizontal Scaling
- Deploy multiple API instances behind load balancer
- PostgreSQL read replicas for analytics queries
- Redis caching layer for frequent queries

### Data Archival
- Move data older than 1 year to cold storage (S3, GCS)
- Keep recent 24 months in hot database
- Implement time-series database (InfluxDB) for metrics

---

## Maintenance

### Weekly Tasks
- Monitor disk usage
- Review slow query logs
- Check error rates in application logs

### Monthly Tasks
- Update dependencies: `npm audit fix`
- Review and optimize slow queries
- Backup database: `pg_dump`

### Quarterly Tasks
- Review and update retention policies
- Archive old telemetry data
- Capacity planning based on growth

---

## Support

For issues or questions:
1. Check logs: `docker-compose logs api`
2. Review API_DOCUMENTATION.md
3. Run test suite: `npm run test`
