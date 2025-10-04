import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ActivityFeed from '../ActivityFeed';

describe('ActivityFeed', () => {
  const mockActivities = [
    {
      id: '1',
      type: 'message' as const,
      agentName: 'John Doe',
      description: 'Sent WhatsApp message',
      timestamp: new Date().toISOString(),
    },
    {
      id: '2',
      type: 'document' as const,
      agentName: 'Jane Smith',
      description: 'Generated Reg_Banks document',
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    },
    {
      id: '3',
      type: 'calculator' as const,
      agentName: 'Mike Johnson',
      description: 'Used transfer fees calculator',
      timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    },
  ];

  it('renders activity list', () => {
    render(<ActivityFeed activities={mockActivities} />);

    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Mike Johnson')).toBeInTheDocument();
  });

  it('displays activity descriptions', () => {
    render(<ActivityFeed activities={mockActivities} />);

    expect(screen.getByText('Sent WhatsApp message')).toBeInTheDocument();
    expect(screen.getByText('Generated Reg_Banks document')).toBeInTheDocument();
    expect(screen.getByText('Used transfer fees calculator')).toBeInTheDocument();
  });

  it('shows empty state when no activities', () => {
    render(<ActivityFeed activities={[]} />);

    expect(screen.getByText('No recent activity')).toBeInTheDocument();
  });

  it('formats relative timestamps', () => {
    render(<ActivityFeed activities={mockActivities} />);

    // Just now for recent activity
    expect(screen.getByText('Just now')).toBeInTheDocument();

    // 5 minutes ago
    expect(screen.getByText(/5m ago/)).toBeInTheDocument();

    // 10 minutes ago
    expect(screen.getByText(/10m ago/)).toBeInTheDocument();
  });

  it('renders different icons for different activity types', () => {
    const { container } = render(<ActivityFeed activities={mockActivities} />);

    // Check that SVG icons are rendered
    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThanOrEqual(3);
  });
});
