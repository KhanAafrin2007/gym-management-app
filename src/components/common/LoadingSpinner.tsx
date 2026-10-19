import React from 'react';

export const LoadingSpinner: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}> = ({ size = 'md', label = 'Loading data...', className = '' }) => {
  const sizeClass = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  }[size];

  return (
    <div className={`flex flex-col items-center justify-center py-12 gap-3 text-slate-400 ${className}`}>
      <div
        className={`${sizeClass} border-slate-700 border-t-emerald-400 rounded-full animate-spin`}
      />
      {label && <p className="text-sm font-medium text-slate-400">{label}</p>}
    </div>
  );
};
