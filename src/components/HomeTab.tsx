import React from 'react';
import type { DataDict } from '../types';
import { MetricCard } from './MetricCard';
import { IMA_RANGES } from '../utils/referenceRanges';

interface HomeTabProps {
  data: DataDict;
  isDarkMode: boolean;
}

export const HomeTab: React.FC<HomeTabProps> = ({ data }) => {
  const vitalKeys = ['Pulse', 'SpO2', 'Resp', 'Temp'];
  const labels: Record<string, string> = {
    'Pulse': 'Pulse (bpm)',
    'SpO2': 'SpO2 (%)',
    'Resp': 'Resp Rate (bpm)',
    'Temp': 'Skin Temp (°C)'
  };

  // ... (rest of logic) ...

  // Define known devices to track
  const devices = ['VinCense', 'Dr Trust', 'Dr Odin'];

  // Pre-calculate all metrics
  // Structure: {[DeviceName]: {[VitalKey]: AverageValue } }
  const metrics: Record<string, Record<string, string>> = {};

  // 1. Identify First Sheet
  // Similar logic to SourceTab: get keys, filter 'Consolidated', take first.
  const allKeys = Object.keys(data);
  const sheetKeys = allKeys.filter(k => k !== 'Consolidated');
  if (allKeys.includes('Consolidated')) sheetKeys.unshift('Consolidated'); // Actually user asked for specific "data from the First sheet of the dataset", usually implying the raw data sheet, not consolidated.
  // Let's stick to the FIRST non-consolidated sheet as per standard "First Sheet" interpretation if Consolidated is a summary.
  // Wait, user said "data only from the First sheet of the dataset".
  // Let's try to grab the very first key from data that isn't empty.

  const firstSheetKey = sheetKeys.length > 0 ? sheetKeys[0] : '';
  const firstSheetData = firstSheetKey ? data[firstSheetKey] : [];

  // DEBUG: Unconditional Log
  console.log('--- HomeTab Debug ---');
  console.log('Available Sheets:', Object.keys(data));
  console.log('Selected Sheet:', firstSheetKey);
  if (firstSheetData.length > 0) {
    console.log('Sheet Headers:', Object.keys(firstSheetData[0]));
    console.log('First Row Sample:', firstSheetData[0]);
  } else {
    console.log('Selected Sheet is Empty');
  }

  // 2. Define Column Mappings (User provided underscores, possibly mapping to spaces in Excel)
  const columnMap: Record<string, Record<string, string>> = {
    'Pulse': {
      'VinCense': 'Pulse Rate VinCense',
      'Dr Trust': 'Pulse Rate DrTrust',
      'Dr Odin': 'Pulse Rate DrOdin'
    },
    'SpO2': {
      'VinCense': 'SpO2 VinCense',
      'Dr Trust': 'SpO2 DrTrust',
      'Dr Odin': 'SpO2 DrOdin'
    },
    'Resp': {
      'VinCense': 'Respiratory Rate VinCense',
      'Dr Trust': 'Respiratory Rate DrTrust',
      'Dr Odin': 'Respiratory Rate DrOdin'
    },
    'Temp': {
      'VinCense': 'Skin Temperature VinCense',
      'Dr Trust': '',
      'Dr Odin': ''
    }
  };

  // Helper to find key
  const findKey = (row: any, key: string): string | undefined => {
    if (!key) return undefined;
    if (row[key] !== undefined) return key;
    // Try with underscores
    const keyUnder = key.replace(/ /g, '_');
    if (row[keyUnder] !== undefined) return keyUnder;
    // Try with spaces if input had underscores
    const keySpace = key.replace(/_/g, ' ');
    if (row[keySpace] !== undefined) return keySpace;
    return undefined;
  };

  // 3. Calculate Averages
  devices.forEach(device => {
    metrics[device] = {};
    vitalKeys.forEach(vital => {
      let targetCol = columnMap[vital]?.[device];

      // Determine actual column name from first row
      if (targetCol && firstSheetData.length > 0) {
        const actualKey = findKey(firstSheetData[0], targetCol);
        if (actualKey) targetCol = actualKey;
        // Fallback: If not found, keep original targetCol to allow logging failure
      }

      if (!targetCol) {
        metrics[device][vital] = "N/A";
        return;
      }

      // DEBUG: Check keys if finding nothing
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sampleRow = firstSheetData[0] || {};
      if (sampleRow[targetCol] === undefined && firstSheetData.length > 0) {
        console.log(`Debug ${device}-${vital}: Column '${targetCol}' NOT FOUND. Available:`, Object.keys(sampleRow));
      }

      // Extract valid numbers
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const vals = firstSheetData.map((r: any) => {
        const v = r[targetCol];
        if (v === null || v === undefined || v === '') return NaN;
        return Number(v);
      }).filter(n => !isNaN(n)); // Allow 0 if it's a real reading, but filter invalid types. 
      // User saw 0.0 because of empty strings. !isNaN check handles " "->0 if parsed by Number?
      // Number(" ") is 0. So strict check above (v === '') handles it. 

      const avg = vals.length > 0 ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : "N/A";
      metrics[device][vital] = avg;
    });
  });

  return (
    <div>
      <div className="flex flex-col mb-6">
        <h2 className="text-xl font-bold text-blue-900 dark:text-blue-400">Overview</h2>


      </div>

      <div className="overflow-x-auto pb-4">
        {/* Grid Container */}
        <div className="min-w-[800px] grid grid-cols-4 gap-4">

          {/* Header Row */}
          {vitalKeys.map(key => {
            const range = IMA_RANGES[key];
            return (
              <div key={key} className="flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 p-2 rounded-lg">
                <span className="text-center font-bold text-gray-700 dark:text-indigo-400 uppercase tracking-wider text-sm">
                  {labels[key]}
                </span>
                {range && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
                    Normal: {range.min}-{range.max}
                  </span>
                )}
              </div>
            );
          })}

          {/* Device Rows */}
          {devices.map((device) => (
            <React.Fragment key={device}>
              {/* Vital Cards */}
              {vitalKeys.map(vital => (
                <div key={`${device}-${vital}`} className="h-full">
                  <MetricCard
                    label={device.toUpperCase()}
                    value={metrics[device][vital]}
                  />
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>

      <p className="text-gray-600 dark:text-gray-400 mt-6 max-w-4xl">
        This dashboard provides a comprehensive view of vital sign readings collected from VinCense and reference devices (Dr. Trust, Dr. Odin). The metrics below display the <strong>average values</strong> for Pulse Rate, SpO2, Respiratory Rate, and Skin Temperature based on the first dataset, allowing for a quick performance comparison between devices.
      </p>
    </div>
  );
};
