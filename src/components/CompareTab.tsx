import React from 'react';
import type { DataDict } from '../types';
import { Chart } from './Chart';
import { getColor } from '../utils/colors';

interface CompareTabProps {
  data: DataDict;
  isDarkMode: boolean;
}

const BASELINES: Record<string, [number, number]> = {
    'Pulse': [60, 100],
    'SpO2': [95, 100],
    'Resp': [12, 20],
    'Temp': [33, 35] 
};

const LABELS: Record<string, string> = {
    'Pulse': 'Pulse Rate',
    'SpO2': 'SpO2',
    'Resp': 'Respiratory Rate',
    'Temp': 'Skin Temperature'
};

export const CompareTab: React.FC<CompareTabProps> = ({ data, isDarkMode }) => {
  const chartTemplate = isDarkMode ? 'plotly_dark' : 'plotly_white';
  const textColor = isDarkMode ? '#fafafa' : '#2c3e50';

  return (
    <div className="space-y-12">
      <h2 className="text-xl font-bold mb-4 text-blue-900 dark:text-blue-400">Device Trend Analysis</h2>
      
      {Object.keys(LABELS).map(key => {
         const df = data[key];
         const title = LABELS[key];
         if (!df || df.length === 0) return null;
         
         // Sort by Timestamp
         const sortedDf = [...df].sort((a, b) => {
             const ta = a['Timestamp'] ? new Date(a['Timestamp']).getTime() : 0;
             const tb = b['Timestamp'] ? new Date(b['Timestamp']).getTime() : 0;
             return ta - tb;
         });

         const timestamps = sortedDf.map(r => r['Timestamp']);
         
         // 1. Trend Chart Data
         const readingCols = Object.keys(df[0] || {}).filter(k => k.includes('Readings'));
         const trendData = readingCols.map(col => {
             const deviceName = col.replace(' Readings', '');
             return {
                 x: timestamps,
                 y: sortedDf.map(r => r[col]),
                 type: 'scatter',
                 mode: 'lines+markers',
                 name: deviceName,
                 line: { color: getColor(deviceName) }
             };
         });
         
         // Baseline Shapes
         const shapes: any[] = [];
         if (BASELINES[key]) {
             const [low, high] = BASELINES[key];
             shapes.push({
                 type: 'rect',
                 xref: 'paper',
                 x0: 0,
                 x1: 1,
                 yref: 'y',
                 y0: low,
                 y1: high,
                 fillcolor: 'green',
                 opacity: 0.1,
                 line: { width: 0 }
             });
         }

         return (
             <div key={key} className="space-y-6">
                 <div className="border-b border-gray-200 dark:border-gray-700 pb-2">
                     <h3 className="text-lg font-bold text-text-light dark:text-text-dark">{title}</h3>
                     {BASELINES[key] && (
                         <p className="text-sm text-gray-500">Normal Range: {BASELINES[key][0]} - {BASELINES[key][1]}</p>
                     )}
                 </div>

                 <Chart
                    title={`Comparative Trend: ${title}`}
                    data={trendData}
                    layout={{
                        xaxis: { title: 'Time' },
                        yaxis: { title: 'Value' },
                        shapes: shapes,
                        template: chartTemplate,
                        font: { color: textColor },
                        legend: { orientation: 'h', y: 1.1 }
                    }}
                 />
                 
                 <div className="bg-blue-50 dark:bg-gray-800 p-4 rounded-md text-sm">
                    <p className="mb-2"><strong>Chart Description (Line Chart):</strong> This chart shows how VinCense readings move over time compared to other devices. It helps you see if VinCense follows the same pattern as the trusted devices.</p>
                    <p className="text-indigo-700 dark:text-indigo-300"><strong>Insight:</strong> If the lines separate consistently, VinCense has a fixed error. Spikes mean it is struggling with sudden changes.</p>
                 </div>

                 {/* Scatter Plots (Identity) */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     {readingCols.filter(c => !c.includes('VinCense')).map(refCol => {
                         const refName = refCol.replace(' Readings', '');
                         const vinVals = sortedDf.map(r => Number(r['VinCense Readings']));
                         const refVals = sortedDf.map(r => Number(r[refCol]));
                         
                         const minVal = Math.min(...vinVals.filter(v => !isNaN(v)), ...refVals.filter(v => !isNaN(v)));
                         const maxVal = Math.max(...vinVals.filter(v => !isNaN(v)), ...refVals.filter(v => !isNaN(v)));

                         return (
                             <div key={refCol}>
                                 <Chart 
                                     title={`Identity Plot: VinCense vs ${refName}`}
                                     data={[
                                         {
                                             x: refVals,
                                             y: vinVals,
                                             mode: 'markers',
                                             type: 'scatter',
                                             marker: { color: '#6366f1' },
                                             name: 'Readings'
                                         },
                                         {
                                             x: [minVal, maxVal],
                                             y: [minVal, maxVal],
                                             mode: 'lines',
                                             type: 'scatter',
                                             line: { dash: 'dash', color: 'gray' },
                                             name: 'Perfect Match'
                                         }
                                     ]}
                                     layout={{
                                         xaxis: { title: refName },
                                         yaxis: { title: 'VinCense' },
                                         template: chartTemplate,
                                         font: { color: textColor }
                                     }}
                                 />
                             </div>
                         );
                     })}
                 </div>
                 
                 <div className="bg-blue-50 dark:bg-gray-800 p-4 rounded-md text-sm">
                    <p className="mb-2"><strong>Chart Description (Scatter Plot):</strong> This plot compares individual VinCense readings with the reference. Points on the dashed line are perfect matches.</p>
                    <p className="text-indigo-700 dark:text-indigo-300"><strong>Insight:</strong> Points scattered far from the line show poor accuracy. If most points are on one side, there is a bias.</p>
                 </div>
             </div>
         );
      })}
    </div>
  );
};
