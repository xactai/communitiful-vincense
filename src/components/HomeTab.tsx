import React from 'react';
import type { DataDict } from '../types';
import { MetricCard } from './MetricCard';

interface HomeTabProps {
  data: DataDict;
  isDarkMode: boolean;
}

export const HomeTab: React.FC<HomeTabProps> = ({ data, isDarkMode }) => {
  const vitalKeys = ['Pulse', 'SpO2', 'Resp', 'Temp'];
  const labels: Record<string, string> = {
    'Pulse': 'Pulse (bpm)',
    'SpO2': 'SpO2 (%)',
    'Resp': 'Resp Rate (bpm)',
    'Temp': 'Skin Temp (°C)'
  };

  // Define known devices to track
  const devices = ['VinCense', 'Dr Trust', 'Dr Odin'];

  // Pre-calculate all metrics
  // Structure: { [DeviceName]: { [VitalKey]: AverageValue } }
  const metrics: Record<string, Record<string, string>> = {};

  devices.forEach(device => {
    metrics[device] = {};
    vitalKeys.forEach(vital => {
      const df = data[vital];
      if (!df) {
        metrics[device][vital] = "N/A";
        return;
      }

      let vals: number[] = [];

      if (device === 'VinCense') {
        vals = df.map(r => Number(r['VinCense Readings'])).filter(n => !isNaN(n));
      } else {
        // Try to find a column that matches the device name
        // Logic: Look for columns containing device name
        const colName = Object.keys(df[0] || {}).find(k => k.includes(device) && k.includes('Readings'));
        if (colName) {
          vals = df.map(r => Number(r[colName])).filter(n => !isNaN(n));
        }
      }

      const avg = vals.length > 0 ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : "N/A";
      metrics[device][vital] = avg;
    });
  });

  return (
    <div>
      <h2 className="text-xl font-bold mb-6 text-blue-900 dark:text-blue-400">Overview</h2>

      <div className="overflow-x-auto pb-4">
        {/* Grid Container */}
        {/* 4 Columns for Vitals - Row headers removed */}
        <div className="min-w-[800px] grid grid-cols-4 gap-4">

          {/* Header Row */}
          {vitalKeys.map(key => (
            <div key={key} className="text-center font-bold text-gray-700 dark:text-indigo-400 uppercase tracking-wider text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded-lg">
              {labels[key]}
            </div>
          ))}

          {/* Device Rows */}
          {devices.map((device) => (
            <React.Fragment key={device}>
              {/* Vital Cards */}
              {vitalKeys.map(vital => (
                <div key={`${device}-${vital}`} className="h-full">
                  <MetricCard
                    label={`${device} ${vital}`}
                    value={metrics[device][vital]}
                  />
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};
