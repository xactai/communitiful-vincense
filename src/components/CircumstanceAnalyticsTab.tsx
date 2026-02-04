import React, { useMemo, useState } from 'react';
import type { DataDict } from '../types';
import Plot from 'react-plotly.js';
import { getRangeTraces } from '../utils/referenceRanges';
import { ExpandableChart } from './ExpandableChart';

interface Props {
    data: DataDict;
    isDarkMode: boolean;
}

export const CircumstanceAnalyticsTab: React.FC<Props> = ({ data, isDarkMode }) => {
    // 1. Helpers
    const calculateStats = (values: number[]) => {
        if (values.length === 0) return { mean: 0, median: 0, count: 0 };
        const sum = values.reduce((a, b) => a + b, 0);
        const mean = sum / values.length;
        const sorted = [...values].sort((a, b) => a - b);
        const median = sorted[Math.floor(sorted.length / 2)];
        return { mean, median, count: values.length };
    };

    const vitals = [
        { key: 'Pulse', label: 'Pulse Rate', unit: 'bpm' },
        { key: 'SpO2', label: 'SpO2', unit: '%' },
        { key: 'Resp', label: 'Respiratory Rate', unit: 'bpm' },
        { key: 'Temp', label: 'Skin Temperature', unit: '°C' }
    ];

    // 2. Process Data by Circumstance
    const analyticsData = useMemo(() => {
        const processed: Record<string, Record<string, Record<string, number[]>>> = {};
        // Structure: { [Vital]: { [Circumstance]: { [Device]: Values[] } } }

        const allCircumstances = new Set<string>();

        vitals.forEach(v => {
            processed[v.key] = {};
            const sheet = data[v.key];
            if (!sheet) return;

            sheet.forEach(row => {
                let circumstance = row['Circumstance'] || 'Unknown';

                // Normalize variations: collapse spaces, trim, and Title Case to merge "Post Breakfast" and "post breakfast"
                circumstance = circumstance.trim().replace(/\s+/g, ' ');
                // Optional: Capitalize first letter of each word to standardise
                circumstance = circumstance.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
                if (!circumstance || circumstance === 'Unknown') return;

                allCircumstances.add(circumstance);

                if (!processed[v.key][circumstance]) processed[v.key][circumstance] = {};

                // VinCense
                const valV = Number(row['VinCense Readings']);
                if (!isNaN(valV)) {
                    if (!processed[v.key][circumstance]['VinCense']) processed[v.key][circumstance]['VinCense'] = [];
                    processed[v.key][circumstance]['VinCense'].push(valV);
                }

                // Dr Trust / Odin
                Object.keys(row).forEach(k => {
                    if (k.includes('Readings') && !k.includes('VinCense')) {
                        const devName = k.replace(' Readings', '').trim();
                        const val = Number(row[k]);
                        if (!isNaN(val)) {
                            if (!processed[v.key][circumstance][devName]) processed[v.key][circumstance][devName] = [];
                            processed[v.key][circumstance][devName].push(val);
                        }
                    }
                });
            });
        });

        // Sort by Count Descending
        const sortedCircumstances = Array.from(allCircumstances).sort((a, b) => {
            const getCount = (circumstance: string) => {
                return vitals.reduce((max, v) => {
                    const len = processed[v.key]?.[circumstance]?.['VinCense']?.length || 0;
                    return Math.max(max, len);
                }, 0);
            };
            return getCount(b) - getCount(a);
        });

        return { processed, sortedCircumstances };
    }, [data]);

    const { processed, sortedCircumstances } = analyticsData;
    const textColor = isDarkMode ? '#e5e7eb' : '#374151';
    const gridColor = isDarkMode ? '#374151' : '#e5e7eb';

    if (sortedCircumstances.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-gray-500">
                <h3 className="text-lg font-semibold mb-2">No Circumstance Data Available</h3>
                <p>Ensure the data contains 'Circumstance' information for the selected filters.</p>
            </div>
        );
    }

    const [activeVital, setActiveVital] = useState<string>('Pulse');

    const currentVital = vitals.find(v => v.key === activeVital) || vitals[0];

    return (
        <div className="space-y-8 p-4">
            {/* Header with Tabs */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-card-bg-dark p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                <span className="text-xl font-bold text-gray-800 dark:text-gray-200">Circumstance Analytics</span>
                <div className="flex space-x-2 overflow-x-auto pb-1 md:pb-0 overflow-y-hidden scrollbar-hide">
                    {vitals.map(v => (
                        <button
                            key={v.key}
                            onClick={() => setActiveVital(v.key)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors flex-shrink-0 ${activeVital === v.key
                                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                                : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                                }`}
                        >
                            {v.label}
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex flex-wrap gap-3">
                {sortedCircumstances.map(c => {
                    // Logic to find max count across vitals if Pulse is missing logic
                    const count = vitals.reduce((max, v) => {
                        const len = processed[v.key]?.[c]?.['VinCense']?.length || 0;
                        return Math.max(max, len);
                    }, 0);

                    return (
                        <div key={c} className="bg-white dark:bg-card-bg-dark p-3 rounded-xl shadow-sm border-b-2 border-indigo-500 flex-1 min-w-[130px] max-w-[220px] flex flex-col items-center justify-between hover:shadow-md transition-shadow">
                            <div className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase text-center whitespace-normal break-words leading-tight" title={c}>
                                {c}
                            </div>
                            <div className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                                {count}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div key={currentVital.key} className="bg-white dark:bg-card-bg-dark p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold mb-6 text-indigo-900 dark:text-indigo-400 flex items-center gap-2">
                    {currentVital.label} <span className="text-sm font-normal text-gray-500">({currentVital.unit})</span>
                </h3>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Chart 1: Mean Comparison by Circumstance */}
                    <ExpandableChart title="Mean Readings by Circumstance" className="h-[400px] border border-gray-100 dark:border-gray-800 rounded-lg bg-white dark:bg-card-bg-dark">
                        <h4 className="text-sm font-bold text-gray-500 mb-4 uppercase text-center pt-4">Mean Readings by Circumstance</h4>
                        <Plot
                            data={[
                                ...getRangeTraces(currentVital.key, sortedCircumstances),
                                ...['VinCense', 'Dr Trust', 'Dr Odin'].map(dev => {
                                    const x: string[] = [];
                                    const y: number[] = [];

                                    sortedCircumstances.forEach(c => {
                                        const vals = processed[currentVital.key]?.[c]?.[dev] || [];
                                        if (vals.length > 0) {
                                            const { mean } = calculateStats(vals);
                                            x.push(c);
                                            y.push(mean);
                                        } else {
                                            x.push(c);
                                            y.push(0);
                                        }
                                    });

                                    return {
                                        x,
                                        y,
                                        name: dev,
                                        type: 'bar',
                                        marker: { opacity: 0.8 },
                                        text: y.map(v => v ? v.toFixed(1) : ''),
                                        textposition: 'auto',
                                    };
                                })]}
                            layout={{
                                barmode: 'group',
                                autosize: true,
                                paper_bgcolor: 'transparent',
                                plot_bgcolor: 'transparent',
                                font: { color: textColor },
                                margin: { b: 150, l: 60, r: 20, t: 50 }, // Adjusted top margin
                                xaxis: {
                                    gridcolor: gridColor,
                                    title: 'Circumstance',
                                    tickangle: -45,
                                    automargin: true
                                },
                                yaxis: {
                                    gridcolor: gridColor,
                                    title: `Mean ${currentVital.unit}`,
                                    automargin: true
                                },
                                legend: { orientation: 'h', x: 0, y: 1.1 },
                            } as any}
                            useResizeHandler={true}
                            config={{ responsive: true }}
                            className="w-full h-full"
                        />
                    </ExpandableChart>
                    {/* Insight 1 */}
                    {/* Chart Description */}
                    <div className="col-span-1 lg:col-span-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-l-4 border-gray-400 mb-2">
                        <h4 className="font-bold text-sm text-gray-700 dark:text-gray-300 uppercase mb-1">Chart Description</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            This chart compares the average {currentVital.label} across different activities (Resting, Walking, etc.) and devices.
                        </p>
                    </div>
                    {/* Insight */}
                    <div className="col-span-1 lg:col-span-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500 mb-4">
                        <h4 className="font-bold text-sm text-blue-800 dark:text-blue-300 uppercase mb-1">Insight</h4>
                        <p className="text-sm text-blue-700 dark:text-blue-200">
                            <strong>Insight:</strong> Expected trends (e.g., higher Pulse during activity) validate the data accuracy and device sensitivity.
                        </p>
                    </div>

                    {/* Chart 2: Distribution (Box Plot) - VinCense */}
<<<<<<< HEAD
                    <div className="col-span-1 lg:col-span-2 h-[500px] overflow-x-auto w-full border border-gray-100 dark:border-gray-800 rounded-lg">
                        <h4 className="text-sm font-bold text-gray-500 mb-4 uppercase text-center sticky left-0 w-full pt-4">VinCense Distribution</h4>
                        <div style={{ width: '100%', height: '100%' }}>
                            <Plot
                                data={[
                                    // 1. Box Plots First
                                    ...sortedCircumstances.map(c => {
                                        const vals = processed[currentVital.key]?.[c]?.['VinCense'] || [];
                                        return {
                                            y: vals,
                                            name: c,
                                            type: 'box',
                                            boxpoints: 'all',
                                            jitter: 0.3,
                                            pointpos: -1.8,
                                            marker: { size: 2 },
                                        };
                                    }),
                                    // 2. Range Traces Last (for Bottom/End of Legend)
                                    ...getRangeTraces(currentVital.key, sortedCircumstances)
                                ]}
                                layout={{
                                    autosize: true, // Auto-size to container (1400px)
                                    paper_bgcolor: 'transparent',
                                    plot_bgcolor: 'transparent',
                                    font: { color: textColor },
                                    showlegend: true,
                                    legend: {
                                        orientation: 'v', // Vertical legend
                                        x: 1.02, // Right side
                                        y: 1, // Top alignment
                                        xanchor: 'left',
                                        yanchor: 'top',
                                        bgcolor: 'rgba(255, 255, 255, 0.5)' // semi-transparent background
                                    },
                                    margin: {
                                        b: 180, // Bottom margin for -45 labels
                                        l: 60,
                                        r: 250, // Right margin for vertical legend
                                        t: 80 // Reduced top margin for cleaner title
                                    },
                                    xaxis: {
                                        gridcolor: gridColor,
                                        title: 'Circumstance',
                                        tickangle: -45,
                                        automargin: false
                                    },
                                    yaxis: {
                                        gridcolor: gridColor,
                                        title: currentVital.unit,
                                        automargin: true,
                                    },
                                } as any}
                                useResizeHandler={true}
                                config={{ responsive: true }}
                                className="w-full h-full"
                                style={{ width: '100%', height: '100%' }}
                            />
                        </div>
=======
                    <div className="col-span-1 lg:col-span-2">
                        <ExpandableChart title="VinCense Distribution" className="h-[500px] border border-gray-100 dark:border-gray-800 rounded-lg bg-white dark:bg-card-bg-dark">
                            <h4 className="text-sm font-bold text-gray-500 mb-4 uppercase text-center sticky left-0 w-full pt-4">VinCense Distribution</h4>
                            <div style={{ width: '100%', height: 'calc(100% - 30px)' }}>
                                <Plot
                                    data={[
                                        // 1. Box Plots First
                                        ...sortedCircumstances.map(c => {
                                            const vals = processed[currentVital.key]?.[c]?.['VinCense'] || [];
                                            return {
                                                y: vals,
                                                name: c,
                                                type: 'box',
                                                boxpoints: 'all',
                                                jitter: 0.3,
                                                pointpos: -1.8,
                                                marker: { size: 2 },
                                            };
                                        }),
                                        // 2. Range Traces Last (for Bottom/End of Legend)
                                        ...getRangeTraces(currentVital.key, sortedCircumstances, 'category')
                                    ]}
                                    layout={{
                                        autosize: true, // Auto-size to container (1400px)
                                        paper_bgcolor: 'transparent',
                                        plot_bgcolor: 'transparent',
                                        font: { color: textColor },
                                        showlegend: true,
                                        legend: {
                                            orientation: 'v', // Vertical legend
                                            x: 1.02, // Right side
                                            y: 1, // Top alignment
                                            xanchor: 'left',
                                            yanchor: 'top',
                                            bgcolor: 'rgba(255, 255, 255, 0.5)' // semi-transparent background
                                        },
                                        margin: {
                                            b: 180, // Bottom margin for -45 labels
                                            l: 60,
                                            r: 250, // Right margin for vertical legend
                                            t: 80 // Reduced top margin for cleaner title
                                        },
                                        xaxis: {
                                            gridcolor: gridColor,
                                            title: 'Circumstance',
                                            tickangle: -45,
                                            automargin: false
                                        },
                                        yaxis: {
                                            gridcolor: gridColor,
                                            title: currentVital.unit,
                                            automargin: true,
                                        },
                                    } as any}
                                    useResizeHandler={true}
                                    config={{ responsive: true }}
                                    className="w-full h-full"
                                    style={{ width: '100%', height: '100%' }}
                                />
                            </div>
                        </ExpandableChart>
>>>>>>> a0d908f (local repo push changes)
                    </div>
                    {/* Insight 2 */}
                    {/* Chart Description */}
                    <div className="col-span-1 lg:col-span-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-l-4 border-gray-400 mb-2">
                        <h4 className="font-bold text-sm text-gray-700 dark:text-gray-300 uppercase mb-1">Chart Description</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            This chart shows the spread of VinCense readings for each activity.
                        </p>
                    </div>
                    {/* Insight */}
                    <div className="col-span-1 lg:col-span-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500 mb-4">
                        <h4 className="font-bold text-sm text-blue-800 dark:text-blue-300 uppercase mb-1">Insight</h4>
                        <p className="text-sm text-blue-700 dark:text-blue-200">
                            <strong>Insight:</strong> Tighter boxes indicate consistent measurements; tall boxes suggest high variability depending on intensity.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
