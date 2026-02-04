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
    'Pulse': ['Dr Trust Pulse Oximeter', 'Dr Odin', 'IMA', 'WMA'],
    'SpO2': ['Dr Trust Pulse Oximeter', 'Dr Odin', 'IMA', 'WMA'],
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
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-card-bg-dark p-4 rounded-xl border border-gray-200 dark:border-gray-700 mb-6">
                    <span className="text-xl font-bold text-gray-800 dark:text-gray-200">Error & Deviation Analytics: {title}</span>
                    <div className="flex space-x-2 overflow-x-auto pb-1 md:pb-0 overflow-y-hidden scrollbar-hide">
                        {Object.keys(LABELS).map(key => (
                            <button
                                key={key}
                                onClick={() => setActiveTab(key)}
                                className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors flex-shrink-0 ${activeTab === key
                                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                                    : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                                    }`}
                            >
                                {LABELS[key]}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="text-gray-500">No Data for {title}</div>
            </div>
        );
    }

    // Identify deviation columns (Pre-calculated in Excel OR Computed on the fly)
    const computedDf = df.map(row => ({ ...row })); // Clone
    const devCols: string[] = [];
    const validRefs = VALID_REFS[activeTab] || [];

    // 1. Check for existing 'v/s' columns
    if (df.length > 0) {
        Object.keys(df[0]).forEach(col => {
            if (col.includes('v/s')) {
                if (validRefs.some(ref => col.toLowerCase().includes(ref.toLowerCase()))) {
                    devCols.push(col);
                }
            }
        });
    }



    // Better approach: Define desired pairs and compute if missing
    const pairs = [
        { name: 'VinCense v/s Dr Trust', c1: 'VinCense Readings', c2: 'Dr Trust Readings' },
        { name: 'VinCense v/s Dr Odin', c1: 'VinCense Readings', c2: 'Dr Odin Readings' },
        { name: 'Dr Trust v/s Dr Odin', c1: 'Dr Trust Readings', c2: 'Dr Odin Readings' }
    ];

    pairs.forEach(pair => {
        // Check if both source columns exist in at least one row? 
        // Actually we should check if they exist in the first row usually, but robust check is better.
        if (df.length > 0) {
            const hasC1 = Object.prototype.hasOwnProperty.call(df[0], pair.c1);
            const hasC2 = Object.prototype.hasOwnProperty.call(df[0], pair.c2);

            if (hasC1 && hasC2) {
                if (!devCols.includes(pair.name)) {
                    devCols.push(pair.name);
                    computedDf.forEach((row: any) => {
                        const v1 = Number(row[pair.c1]);
                        const v2 = Number(row[pair.c2]);
                        if (!isNaN(v1) && !isNaN(v2)) {
                            row[pair.name] = (v1 - v2); // Calculate Deviation
                        } else {
                            row[pair.name] = null;
                        }
                    });
                }
            }
        }
    });

    const sortedDf = [...computedDf].sort((a, b) => {
        const ta = a['Timestamp'] ? new Date(a['Timestamp']).getTime() : 0;
        const tb = b['Timestamp'] ? new Date(b['Timestamp']).getTime() : 0;
        return ta - tb;
    });
    const timestamps = sortedDf.map(r => r['Timestamp']);

    return (
        <div>
            {/* Sub Tabs Navigation */}
            {/* Sub Tabs Navigation */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-card-bg-dark p-4 rounded-xl border border-gray-200 dark:border-gray-700 mb-6">
                <span className="text-xl font-bold text-gray-800 dark:text-gray-200">Error & Deviation Analytics</span>
                <div className="flex space-x-2 overflow-x-auto pb-1 md:pb-0 overflow-y-hidden scrollbar-hide">
                    {Object.keys(LABELS).map(key => (
                        <button
                            key={key}
                            onClick={() => setActiveTab(key)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors flex-shrink-0 ${activeTab === key
                                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                                : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                                }`}
                        >
                            {LABELS[key]}
                        </button>
                    ))}
                </div>
            </div>

            <h2 className="text-xl font-bold mb-4 text-blue-900 dark:text-blue-400">{title}</h2>

            {/* 1. Deviation Over Time */}
            <div className="mb-12">
                <h3 className="text-lg font-bold mb-4 text-text-light dark:text-text-dark">{activeTab === 'Pulse' ? 'Pulse' : title} Deviation Overtime</h3>
                {devCols.length > 0 ? (
                    <Chart
                        title={`Temporal Deviation Trends: ${title}`}
                        data={devCols.map((col, i) => ({
                            x: timestamps,
                            y: sortedDf.map(r => r[col]),
                            type: 'scatter',
                            mode: 'lines+markers',
                            name: col,
                            visible: i < 2 ? true : 'legendonly',
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
                {/* Chart Description */}
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-l-4 border-gray-400 mb-2">
                    <h4 className="font-bold text-sm text-gray-700 dark:text-gray-300 uppercase mb-1">Chart Description</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        This graph tracks the exact error amount at every second. A flat line at zero would be perfect accuracy.
                    </p>
                </div>
                {/* Insight */}
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500 mb-4">
                    <h4 className="font-bold text-sm text-blue-800 dark:text-blue-300 uppercase mb-1">Insight</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-200">
                        <strong>Insight:</strong> Large spikes or waves in this line usually mean VinCense is reacting too slowly or picking up noise.
                    </p>
                </div>
            </div>

            <hr className="border-gray-200 dark:border-gray-700 mb-12" />

            {/* 2. Bland-Altman */}
            <div className="mb-12">
                <h3 className="text-lg font-bold mb-4 text-text-light dark:text-text-dark">Error Bias Analytics</h3>
                {activeTab === 'Temp' ? (
                    <div className="p-4 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded">Note: there is no reference device to compare the readings of skin temperature by vincense device hence there is no chart plotted</div>
                ) : devCols.length > 0 ? (
                    <div className="space-y-6">
                        {devCols.map((dCol) => {
                            // Identify Source Columns for this Deviation
                            let col1 = 'VinCense Readings';
                            let col2 = '';
                            let title = `Bland-Altman: ${dCol}`;

                            // Check against known pairs first
                            const knownPair = pairs.find(p => p.name === dCol);
                            if (knownPair) {
                                col1 = knownPair.c1;
                                col2 = knownPair.c2;
                            } else {
                                // Fallback: Assume VinCense v/s [Reference]
                                const refName = dCol.split('v/s').pop()?.trim() || '';
                                col2 = Object.keys(df[0] || {}).find(c => c.includes('Readings') && c.toLowerCase().includes(refName.toLowerCase())) || '';
                            }

                            if (!col1 || !col2) return null;

                            const meanVals = sortedDf.map((r: any) => (Number(r[col1]) + Number(r[col2])) / 2);
                            const diffVals = sortedDf.map((r: any) => Number(r[dCol]));

                            // Filter NaNs
                            const validData = meanVals.map((v, i) => ({ x: v, y: diffVals[i] })).filter(p => !isNaN(p.x) && !isNaN(p.y));

                            if (validData.length === 0) return null;

                            const diffs = validData.map(d => d.y);
                            const meanDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;
                            const sdDiff = Math.sqrt(diffs.map(x => Math.pow(x - meanDiff, 2)).reduce((a, b) => a + b, 0) / diffs.length);

                            return (
                                <div key={dCol}>
                                    <Chart
                                        title={title}
                                        data={[{
                                            x: validData.map(d => d.x),
                                            y: validData.map(d => d.y),
                                            mode: 'markers',
                                            type: 'scatter',
                                            name: 'Error'
                                        }]}
                                        layout={{
                                            xaxis: { title: 'Mean Value' },
                                            yaxis: { title: 'Difference' },
                                            shapes: [
                                                { type: 'line', x0: 0, x1: 1, xref: 'paper', y0: meanDiff, y1: meanDiff, line: { color: 'blue' } },
                                                { type: 'line', x0: 0, x1: 1, xref: 'paper', y0: meanDiff + 1.96 * sdDiff, y1: meanDiff + 1.96 * sdDiff, line: { color: 'red', dash: 'dash' } },
                                                { type: 'line', x0: 0, x1: 1, xref: 'paper', y0: meanDiff - 1.96 * sdDiff, y1: meanDiff - 1.96 * sdDiff, line: { color: 'red', dash: 'dash' } }
                                            ],
                                            template: chartTemplate,
                                            font: { color: textColor },
                                            showlegend: true,
                                            legend: { orientation: 'v', x: 1.02, y: 1, xanchor: 'left', yanchor: 'top' },
                                            margin: { r: 150 }
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
                    <>
                        {/* Chart Description */}
                        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-l-4 border-gray-400 mb-2">
                            <h4 className="font-bold text-sm text-gray-700 dark:text-gray-300 uppercase mb-1">Chart Description</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                This chart checks if errors happen more often at high or low reading values. It detects size-related bias.
                            </p>
                        </div>
                        {/* Insight */}
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500 mb-4">
                            <h4 className="font-bold text-sm text-blue-800 dark:text-blue-300 uppercase mb-1">Insight</h4>
                            <p className="text-sm text-blue-700 dark:text-blue-200">
                                <strong>Insight:</strong> If points spread out more on the right side, VinCense becomes less accurate at higher reading values.
                            </p>
                        </div>
                    </>
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
                    <>
                        {/* Chart Description */}
                        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-l-4 border-gray-400 mb-2">
                            <h4 className="font-bold text-sm text-gray-700 dark:text-gray-300 uppercase mb-1">Chart Description</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                This box shows the spread of errors. The box holds the middle 50% of errors, showing consistency.
                            </p>
                        </div>
                        {/* Insight */}
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500 mb-4">
                            <h4 className="font-bold text-sm text-blue-800 dark:text-blue-300 uppercase mb-1">Insight</h4>
                            <p className="text-sm text-blue-700 dark:text-blue-200">
                                <strong>Insight:</strong> A tall box suggests VinCense is inconsistent. If the box is far from zero, it needs calibration.
                            </p>
                        </div>
                    </>
                )}
            </div >

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
                    <>
                        {/* Chart Description */}
                        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-l-4 border-gray-400 mb-2">
                            <h4 className="font-bold text-sm text-gray-700 dark:text-gray-300 uppercase mb-1">Chart Description</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                This bar chart compares average and maximum errors. It summarizes overall performance against each device.
                            </p>
                        </div>
                        {/* Insight */}
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500 mb-4">
                            <h4 className="font-bold text-sm text-blue-800 dark:text-blue-300 uppercase mb-1">Insight</h4>
                            <p className="text-sm text-blue-700 dark:text-blue-200">
                                <strong>Insight:</strong> High 'Max Deviation' bars warn of occasional large failures that could be dangerous.
                            </p>
                        </div>
                    </>
                )}
            </div >

        </div >
    );
};
