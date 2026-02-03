import React from 'react';
import { motion } from 'framer-motion';

interface MetricCardProps {
  label: string;
  value: string;
  subMetrics?: { label: string; value: string }[];
}

export const MetricCard: React.FC<MetricCardProps> = ({ label, value, subMetrics }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
      className="bg-white dark:bg-card-bg-dark p-5 rounded-xl shadow-lg border-l-4 border-sky-400 backdrop-blur-sm bg-opacity-80 dark:bg-opacity-80 transition-shadow hover:shadow-xl"
    >
      <div className="text-gray-500 dark:text-gray-400 text-sm font-semibold tracking-wide uppercase mb-2">{label}</div>
      <div className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 mb-4">
        {value}
      </div>

      {subMetrics && subMetrics.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 space-y-2">
          {subMetrics.map((metric, idx) => (
            <div key={idx} className="flex justify-between items-center text-xs group">
              <span className="text-gray-500 dark:text-gray-400 font-medium group-hover:text-indigo-500 transition-colors">{metric.label}:</span>
              <span className="font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">{metric.value}</span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};
