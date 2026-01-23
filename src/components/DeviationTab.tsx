import React, { useState } from 'react';
import type { DataDict } from '../types';
import { Chart } from './Chart';

interface DeviationTabProps {
  data: DataDict;
  isDarkMode: boolean;
}

const LABELS: Record<string, string> = {
    'Pulse': 'Pulse Rate',
    'SpO2': 'SpO2',
    'Resp': 'Respiratory Rate',
    'Temp': 'Skin Temperature'
};

const VALID_REFS: Record<string, string[]> = {
    'Pulse': ['Dr Trust Pulse Oximeter', 'Noise SmartWatch', 'IMA', 'WMA'],
    'SpO2': ['Dr Trust Pulse Oximeter', 'Noise SmartWatch', 'IMA', 'WMA'],
    'Resp': ['Dr Trust Pulse Oximeter', 'IMA', 'WMA'],
    'Temp': ['IMA', 'WMA']
};

export const DeviationTab: React.FC<DeviationTabProps> = ({ data, isDarkMode }) => {
  const [activeTab, setActiveTab] = useState<string>('Pulse');
  const chartTemplate = isDarkMode ? 'plotly_dark' : 'plotly_white';
  const textColor = isDarkMode ? '#fafafa' : '#2c3e50';

  const df = data[activeTab];
  const title = LABELS[activeTab];

  if (!df || df.length === 0) {
      return (
          <div>
               {/* Sub Tabs Navigation */}
              <div className="flex space-x-4 border-b border-gray-200 dark:border-gray-700 mb-6 overflow-x-auto">
                {Object.keys(LABELS).map(key => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`py-2 px-4 border-b-2 font-medium text-sm whitespace-nowrap ${
                      activeTab === key
                        ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    {LABELS[key]}
                  </button>
                ))}
              </div>
              <div className="text-gray-500">No Data for {title}</div>
          </div>
      );
  }

  // Identify deviation columns
  const devCols: string[] = [];
  const validRefs = VALID_REFS[activeTab] || [];
  
  // Find columns that contain 'v/s' and reference name
  if (df.length > 0) {
      Object.keys(df[0]).forEach(col => {
          if (col.includes('v/s')) {
              if (validRefs.some(ref => col.toLowerCase().includes(ref.toLowerCase()))) {
                  devCols.push(col);
              }
          }
      });
  }

  const sortedDf = [...df].sort((a, b) => {
     const ta = a['Timestamp'] ? new Date(a['Timestamp']).getTime() : 0;
     const tb = b['Timestamp'] ? new Date(b['Timestamp']).getTime() : 0;
     return ta - tb;
  });
  const timestamps = sortedDf.map(r => r['Timestamp']);

  return (
    <div>
      {/* Sub Tabs Navigation */}
      <div className="flex space-x-4 border-b border-gray-200 dark:border-gray-700 mb-6 overflow-x-auto">
        {Object.keys(LABELS).map(key => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`py-2 px-4 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === key
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            {LABELS[key]}
          </button>
        ))}
      </div>

      <h2 className="text-xl font-bold mb-4 text-blue-900 dark:text-blue-400">Error & Deviation Analytics: {title}</h2>
      
      {/* 1. Deviation Over Time */}
      <div className="mb-12">
          <h3 className="text-lg font-bold mb-4 text-text-light dark:text-text-dark">{activeTab === 'Pulse' ? 'Pulse' : title} Deviation Overtime</h3>
          {devCols.length > 0 ? (
              <Chart
                  title={`Temporal Deviation Trends: ${title}`}
                  data={devCols.map(col => ({
                      x: timestamps,
                      y: sortedDf.map(r => r[col]),
                      type: 'scatter',
                      mode: 'lines+markers',
                      name: col,
                      line: { shape: 'linear' } // colors auto assigned or we can map
                  }))}
                  layout={{
                      xaxis: { title: 'Time' },
                      yaxis: { title: 'Deviation' },
                      template: chartTemplate,
                      font: { color: textColor }
                  }}
              />
          ) : (
              <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded">No deviation data available for time series.</div>
          )}
           <div className="bg-blue-50 dark:bg-gray-800 p-4 rounded-md text-sm mt-4">
               <p className="mb-2"><strong>Chart Description (Line Chart):</strong> This graph tracks the exact error amount at every second. A flat line at zero would be perfect accuracy.</p>
               <p className="text-indigo-700 dark:text-indigo-300"><strong>Insight:</strong> Large spikes or waves in this line usually mean VinCense is reacting too slowly or picking up noise.</p>
           </div>
      </div>

      <hr className="border-gray-200 dark:border-gray-700 mb-12" />

      {/* 2. Bland-Altman */}
      <div className="mb-12">
          <h3 className="text-lg font-bold mb-4 text-text-light dark:text-text-dark">Error Bias Analytics</h3>
          {activeTab === 'Temp' ? (
               <div className="p-4 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded">Note: there is no reference device to compare the readings of skin temperature by vincense device hence there is no chart plotted</div>
          ) : devCols.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {devCols.map((dCol) => {
                      const refNameGuess = dCol.split('v/s').pop()?.trim() || '';
                      // Find reading col for this ref
                      const readColRef = Object.keys(df[0] || {}).find(c => c.includes('Readings') && c.toLowerCase().includes(refNameGuess.toLowerCase()));
                      
                      if (!readColRef) return null;

                      const meanVals = sortedDf.map(r => (Number(r['VinCense Readings']) + Number(r[readColRef])) / 2);
                      const diffVals = sortedDf.map(r => Number(r[dCol]));
                      
                      // Filter NaNs
                      const validData = meanVals.map((v, i) => ({ x: v, y: diffVals[i] })).filter(p => !isNaN(p.x) && !isNaN(p.y));
                      
                      const diffs = validData.map(d => d.y);
                      const meanDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;
                      const sdDiff = Math.sqrt(diffs.map(x => Math.pow(x - meanDiff, 2)).reduce((a, b) => a + b, 0) / diffs.length);

                      return (
                          <div key={dCol}>
                              <Chart
                                  title={`Bland-Altman: VinCense vs ${refNameGuess}`}
                                  data={[{
                                      x: validData.map(d => d.x),
                                      y: validData.map(d => d.y),
                                      mode: 'markers',
                                      type: 'scatter',
                                      name: 'Error'
                                  }]}
                                  layout={{
                                      xaxis: { title: 'Mean' },
                                      yaxis: { title: 'Difference' },
                                      shapes: [
                                          { type: 'line', x0: 0, x1: 1, xref: 'paper', y0: meanDiff, y1: meanDiff, line: { color: 'blue' } },
                                          { type: 'line', x0: 0, x1: 1, xref: 'paper', y0: meanDiff + 1.96*sdDiff, y1: meanDiff + 1.96*sdDiff, line: { color: 'red', dash: 'dash' } },
                                          { type: 'line', x0: 0, x1: 1, xref: 'paper', y0: meanDiff - 1.96*sdDiff, y1: meanDiff - 1.96*sdDiff, line: { color: 'red', dash: 'dash' } }
                                      ],
                                      template: chartTemplate,
                                      font: { color: textColor }
                                  }}
                              />
                          </div>
                      );
                  })}
              </div>
          ) : (
             <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded">Note: the data needed to plot the graph is not available</div>
          )}
           {activeTab !== 'Temp' && devCols.length > 0 && (
             <div className="bg-blue-50 dark:bg-gray-800 p-4 rounded-md text-sm mt-4">
                <p className="mb-2"><strong>Chart Description (Scatter Plot):</strong> This chart checks if errors happen more often at high or low reading values. It detects size-related bias.</p>
                <p className="text-indigo-700 dark:text-indigo-300"><strong>Insight:</strong> If points spread out more on the right side, VinCense becomes less accurate at higher reading values.</p>
             </div>
           )}
      </div>

       <hr className="border-gray-200 dark:border-gray-700 mb-12" />

       {/* 3. Error Spread (Box Plot) */}
       <div className="mb-12">
           <h3 className="text-lg font-bold mb-4 text-text-light dark:text-text-dark">Error Spread Across Devices</h3>
           {devCols.length > 0 ? (
               <Chart
                   title={`Deviation Distribution: ${title}`}
                   data={devCols.map(col => ({
                       y: sortedDf.map(r => r[col]),
                       type: 'box',
                       name: col,
                       boxpoints: 'all',
                       jitter: 0.3,
                       pointpos: -1.8
                   }))}
                   layout={{
                       yaxis: { title: 'Deviation' },
                       template: chartTemplate,
                       font: { color: textColor }
                   }}
               />
           ) : (
                activeTab === 'Temp' ? (
                    <div className="p-4 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded">Note: there is no reference device to compare the readings of skin temperature by vincense device hence there is no chart plotted</div>
                ) : (
                    <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded">Note: the data needed to plot the graph is not available</div>
                )
           )}
           {devCols.length > 0 && (
                <div className="bg-blue-50 dark:bg-gray-800 p-4 rounded-md text-sm mt-4">
                    <p className="mb-2"><strong>Chart Description (Box Plot):</strong> This box shows the spread of errors. The box holds the middle 50% of errors, showing consistency.</p>
                    <p className="text-indigo-700 dark:text-indigo-300"><strong>Insight:</strong> A tall box suggests VinCense is inconsistent. If the box is far from zero, it needs calibration.</p>
                </div>
           )}
       </div>

       <hr className="border-gray-200 dark:border-gray-700 mb-12" />

       {/* 4. Aggregate Performance (Bar Chart) */}
       <div className="mb-12">
            <h3 className="text-lg font-bold mb-4 text-text-light dark:text-text-dark">Aggregate Performance Metrics</h3>
            {devCols.length > 0 ? (
                <Chart
                    title={`Summary Statistics: ${title}`}
                    data={[
                        {
                            x: devCols,
                            y: devCols.map(col => {
                                const vals = sortedDf.map(r => Number(r[col])).filter(n => !isNaN(n));
                                return vals.reduce((a, b) => a + b, 0) / vals.length;
                            }),
                            type: 'bar',
                            name: 'Average Dev'
                        },
                        {
                            x: devCols,
                            y: devCols.map(col => {
                                const vals = sortedDf.map(r => Math.abs(Number(r[col]))).filter(n => !isNaN(n));
                                return Math.max(...vals);
                            }),
                            type: 'bar',
                            name: 'Max Dev'
                        }
                    ]}
                    layout={{
                        barmode: 'group',
                        yaxis: { title: 'Value' },
                        template: chartTemplate,
                        font: { color: textColor }
                    }}
                />
            ) : (
                 activeTab === 'Temp' ? (
                    <div className="p-4 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded">Note: there is no reference device to compare the readings of skin temperature by vincense device hence there is no chart plotted</div>
                ) : (
                    <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded">Note: the data needed to plot the graph is not available</div>
                )
            )}
             {devCols.length > 0 && (
                <div className="bg-blue-50 dark:bg-gray-800 p-4 rounded-md text-sm mt-4">
                    <p className="mb-2"><strong>Chart Description (Bar Chart):</strong> This bar chart compares average and maximum errors. It summarizes overall performance against each device.</p>
                    <p className="text-indigo-700 dark:text-indigo-300"><strong>Insight:</strong> High 'Max Deviation' bars warn of occasional large failures that could be dangerous.</p>
                </div>
           )}
       </div>

    </div>
  );
};
