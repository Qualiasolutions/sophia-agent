/**
 * Activity Feed Component
 * Epic 6, Story 6.6: System Overview & Monitoring
 *
 * Displays recent system activities with icons and timestamps
 */

import {
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  CalculatorIcon,
} from '@heroicons/react/24/outline';

interface Activity {
  id: string;
  type: 'message' | 'document' | 'calculator';
  agentName: string;
  description: string;
  timestamp: string;
}

interface ActivityFeedProps {
  activities: Activity[];
}

export default function ActivityFeed({ activities }: ActivityFeedProps) {
  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'message':
        return <ChatBubbleLeftRightIcon className="w-5 h-5 text-blue-600" />;
      case 'document':
        return <DocumentTextIcon className="w-5 h-5 text-green-600" />;
      case 'calculator':
        return <CalculatorIcon className="w-5 h-5 text-purple-600" />;
      default:
        return <ChatBubbleLeftRightIcon className="w-5 h-5 text-gray-600" />;
    }
  };

  const formatRelativeTime = (timestamp: string): string => {
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

  if (!activities || activities.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
        No recent activity
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start space-x-3 pb-4 border-b border-gray-100 last:border-0 last:pb-0"
          >
            <div className="flex-shrink-0 mt-1">
              {getActivityIcon(activity.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">
                {activity.agentName}
              </p>
              <p className="text-sm text-gray-600">{activity.description}</p>
            </div>
            <div className="flex-shrink-0 text-xs text-gray-500">
              {formatRelativeTime(activity.timestamp)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
