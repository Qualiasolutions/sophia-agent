import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import HealthIndicator from '../HealthIndicator';

describe('HealthIndicator', () => {
  it('shows online status with green indicator', () => {
    render(
      <HealthIndicator
        service="Database"
        status="online"
        lastUpdate={new Date().toISOString()}
        message="Connected"
      />
    );

    expect(screen.getByText('Database')).toBeInTheDocument();
    expect(screen.getByText('Connected')).toBeInTheDocument();
  });

  it('shows warning status with yellow indicator', () => {
    render(
      <HealthIndicator
        service="WhatsApp"
        status="warning"
        lastUpdate={new Date(Date.now() - 10 * 60 * 1000).toISOString()}
        message="Slow response"
      />
    );

    expect(screen.getByText('WhatsApp')).toBeInTheDocument();
    expect(screen.getByText('Slow response')).toBeInTheDocument();
  });

  it('shows offline status with red indicator', () => {
    render(
      <HealthIndicator
        service="Telegram"
        status="offline"
        lastUpdate={null}
        message="No connection"
      />
    );

    expect(screen.getByText('Telegram')).toBeInTheDocument();
    expect(screen.getByText('No connection')).toBeInTheDocument();
    expect(screen.getByText('Never')).toBeInTheDocument();
  });

  it('formats relative time correctly', () => {
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();

    render(
      <HealthIndicator
        service="OpenAI"
        status="online"
        lastUpdate={twoMinutesAgo}
      />
    );

    expect(screen.getByText(/2m ago/)).toBeInTheDocument();
  });

  it('displays "Just now" for very recent updates', () => {
    const justNow = new Date(Date.now() - 30 * 1000).toISOString();

    render(
      <HealthIndicator
        service="API"
        status="online"
        lastUpdate={justNow}
      />
    );

    expect(screen.getByText('Just now')).toBeInTheDocument();
  });
});
