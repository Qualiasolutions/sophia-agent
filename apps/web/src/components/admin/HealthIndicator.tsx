/**
 * Health Indicator Component
 * Epic 6, Story 6.6: System Overview & Monitoring
 *
 * Displays service health status with color indicators
 */

interface HealthIndicatorProps {
  service: string;
  status: 'online' | 'warning' | 'offline';
  lastUpdate: string | null;
  message?: string;
}

export default function HealthIndicator({
  service,
  status,
  lastUpdate,
  message,
}: HealthIndicatorProps) {
  const statusConfig = {
    online: {
      color: 'bg-green-500',
      textColor: 'text-green-700',
      bgColor: 'bg-green-50',
      label: 'Online',
    },
    warning: {
      color: 'bg-yellow-500',
      textColor: 'text-yellow-700',
      bgColor: 'bg-yellow-50',
      label: 'Warning',
    },
    offline: {
      color: 'bg-red-500',
      textColor: 'text-red-700',
      bgColor: 'bg-red-50',
      label: 'Offline',
    },
  };

  const config = statusConfig[status];

  const formatRelativeTime = (timestamp: string | null): string => {
    if (!timestamp) return 'Never';

    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className={`rounded-lg p-4 ${config.bgColor}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${config.color}`} />
          <div>
            <p className="font-medium text-gray-900">{service}</p>
            <p className={`text-sm ${config.textColor}`}>
              {message || config.label}
            </p>
          </div>
        </div>
        <div className="text-sm text-gray-500">
          {formatRelativeTime(lastUpdate)}
        </div>
      </div>
    </div>
  );
}
