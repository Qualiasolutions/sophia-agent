/**
 * Health Check & Metrics Endpoint
 * Provides system health status and operational metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMetricsService } from '@sophiaai/services';

const metrics = getMetricsService();

/**
 * GET /api/health
 * Returns basic health status
 */
export async function GET(request: NextRequest) {
  try {
    // Check if detailed metrics are requested
    const { searchParams } = new URL(request.url);
    const detailed = searchParams.get('detailed') === 'true';

    if (detailed) {
      const snapshot = metrics.getMetricsSnapshot();

      return NextResponse.json({
        status: 'healthy',
        ...snapshot,
        uptime: formatUptime(snapshot.uptime),
        environment: process.env.VERCEL_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0',
      });
    }

    const snapshot = metrics.getMetricsSnapshot();

    return NextResponse.json({
      status: 'healthy',
      timestamp: snapshot.timestamp,
      uptime: formatUptime(snapshot.uptime),
      uptimeMs: snapshot.uptime,
      environment: process.env.VERCEL_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * Format uptime in human-readable format
 */
function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h ${minutes % 60}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}
