import React from 'react';
import type { DataDict } from '../types';
import { MetricCard } from './MetricCard';

interface HomeTabProps {
  data: DataDict;
}

export const HomeTab: React.FC<HomeTabProps> = ({ data }) => {
  const vitalKeys = ['Pulse', 'SpO2', 'Resp', 'Temp'];
  const labels: Record<string, string> = {
    'Pulse': 'Pulse (bpm)',
    'SpO2': 'SpO2 (%)',
    'Resp': 'Resp Rate (bpm)',
    'Temp': 'Skin Temp (°C)'
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4 text-blue-900 dark:text-blue-400">Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {vitalKeys.map(key => {
          const df = data[key];
          if (!df || df.length === 0) {
             return (
               <div key={key} className="bg-white dark:bg-card-bg-dark p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold mb-2">{labels[key]}</h3>
                  <div className="text-gray-500">No Data</div>
               </div>
             );
          }

          // Calculate metrics
          const vinReadings = df.map(r => Number(r['VinCense Readings'])).filter(n => !isNaN(n));
          const avgVin = vinReadings.length > 0 ? (vinReadings.reduce((a, b) => a + b, 0) / vinReadings.length).toFixed(1) : "N/A";

          // Find other readings columns
          const refCols = Object.keys(df[0]).filter(k => k.includes('Readings') && !k.includes('VinCense'));
          
          const subMetrics = refCols.map(col => {
             const vals = df.map(r => Number(r[col])).filter(n => !isNaN(n));
             const avg = vals.length > 0 ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : "N/A";
             return {
                 label: col.replace(' Readings', '') + ' Avg',
                 value: avg
             };
          });

          return (
            <div key={key}>
                <h3 className="text-lg font-semibold mb-2 text-text-light dark:text-text-dark">{labels[key]}</h3>
                <MetricCard 
                    label="VinCense Avg" 
                    value={avgVin}
                    subMetrics={subMetrics}
                />
            </div>
          );
        })}
      </div>
    </div>
  );
};
