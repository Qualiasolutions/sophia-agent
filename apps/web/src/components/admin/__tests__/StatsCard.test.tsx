import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatsCard from '../StatsCard';

describe('StatsCard', () => {
  it('renders title and value', () => {
    render(<StatsCard title="Total Agents" value={42} />);

    expect(screen.getByText('Total Agents')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renders with string value', () => {
    render(<StatsCard title="Status" value="Online" />);

    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Online')).toBeInTheDocument();
  });

  it('displays trend indicator when provided', () => {
    render(<StatsCard title="Messages" value={100} trend="up" />);

    expect(screen.getByText('↑')).toBeInTheDocument();
    expect(screen.getByText('Increasing')).toBeInTheDocument();
  });

  it('displays down trend correctly', () => {
    render(<StatsCard title="Errors" value={5} trend="down" />);

    expect(screen.getByText('↓')).toBeInTheDocument();
    expect(screen.getByText('Decreasing')).toBeInTheDocument();
  });

  it('displays neutral trend correctly', () => {
    render(<StatsCard title="Active" value={10} trend="neutral" />);

    expect(screen.getByText('→')).toBeInTheDocument();
    expect(screen.getByText('Stable')).toBeInTheDocument();
  });

  it('renders without icon', () => {
    const { container } = render(<StatsCard title="Test" value={123} />);

    expect(screen.getByText('Test')).toBeInTheDocument();
    expect(screen.getByText('123')).toBeInTheDocument();
    // Icon container shouldn't exist when no icon provided
    expect(container.querySelector('.bg-blue-50')).not.toBeInTheDocument();
  });
});
