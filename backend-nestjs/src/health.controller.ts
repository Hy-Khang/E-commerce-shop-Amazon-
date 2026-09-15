import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from './common/decorators/public.decorator';

/**
 * Lightweight liveness probe — intentionally does NOT touch the database or any
 * downstream service, so it stays fast and cheap enough to serve:
 *   - Render's health check (Settings → Health Check Path = /api/v1/health)
 *   - An external keep-alive ping (UptimeRobot / cron-job.org) that stops the
 *     free-tier web service from spinning down (which would silence the cron
 *     jobs — order auto-complete, coin expiry, payment timeout, flash-sale
 *     status). See share-docs/DEPLOYMENT.md.
 *
 * @Public() bypasses the global JwtAuthGuard so the probe is reachable
 * unauthenticated. Sits under the global prefix → GET /api/v1/health.
 */
@ApiTags('health')
@Controller('health')
export class HealthController {
  @Public()
  @Get()
  @ApiOperation({ summary: 'Liveness probe (no DB) — for Render + keep-alive' })
  check() {
    return {
      status: 'ok',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }
}
