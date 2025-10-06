import { OrderStatus } from '../types';

interface StatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'received':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'served':
        return 'bg-gray-100 text-gray-800';
      case 'canceled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'received':
        return 'Received';
      case 'in_progress':
        return 'In Progress';
      case 'ready':
        return 'Ready';
      case 'served':
        return 'Served';
      case 'canceled':
        return 'Canceled';
      default:
        return 'Unknown';
    }
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor()} ${className}`}>
      {getStatusText()}
    </span>
  );
};

export default StatusBadge;
