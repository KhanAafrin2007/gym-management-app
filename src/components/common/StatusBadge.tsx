import React from 'react';
import { getStatusBadgeClasses } from '../../lib/formatters';

interface StatusBadgeProps {
  status: string | null | undefined;
  className?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '', size = 'md' }) => {
  const classes = getStatusBadgeClasses(status);
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full capitalize font-semibold tracking-wide ${sizeClasses} ${classes} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {status || 'Unknown'}
    </span>
  );
};
