import { Controller, Get, Param } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('v1/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * Get 24-hour performance summary for a vehicle
   * Returns: Total AC consumed, DC delivered, efficiency ratio, avg battery temp
   * GET /v1/analytics/performance/:vehicleId
   */
  @Get('performance/:vehicleId')
  async getPerformance(@Param('vehicleId') vehicleId: string) {
    return this.analyticsService.getPerformance(vehicleId);
  }
}
