import React from 'react';

interface MetricCardProps {
  label: string;
  value: string;
  subMetrics?: { label: string; value: string }[];
}

export const MetricCard: React.FC<MetricCardProps> = ({ label, value, subMetrics }) => {
  return (
    <div className="bg-white dark:bg-card-bg-dark p-4 rounded-lg shadow-sm border-l-4 border-sky-300">
      <div className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">{label}</div>
      <div className="text-2xl font-bold text-text-light dark:text-text-dark mb-2">{value}</div>
      
      {subMetrics && subMetrics.length > 0 && (
        <div className="mt-2 space-y-1">
          {subMetrics.map((metric, idx) => (
            <div key={idx} className="flex justify-between text-xs">
              <span className="text-gray-500 dark:text-gray-400">{metric.label}:</span>
              <span className="font-semibold text-text-light dark:text-text-dark">{metric.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
