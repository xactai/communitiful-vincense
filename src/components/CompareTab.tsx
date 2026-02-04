import React, { useState } from 'react';
import type { DataDict } from '../types';
import { Chart } from './Chart';
import { getColor } from '../utils/colors';
import { getRangeTraces, IMA_RANGES, WMA_RANGES } from '../utils/referenceRanges';

interface CompareTabProps {
    data: DataDict;
    isDarkMode: boolean;
}



const LABELS: Record<string, string> = {
    'Pulse': 'Pulse Rate',
    'SpO2': 'SpO2',
    'Resp': 'Respiratory Rate',
    'Temp': 'Skin Temperature'
};

export const CompareTab: React.FC<CompareTabProps> = ({ data, isDarkMode }) => {
    const [activeTab, setActiveTab] = useState<string>('Pulse');
    const chartTemplate = isDarkMode ? 'plotly_dark' : 'plotly_white';
    const textColor = isDarkMode ? '#fafafa' : '#2c3e50';

    const df = data[activeTab];
    const title = LABELS[activeTab];

    if (!df || df.length === 0) {
        return <div className="text-gray-500">No data available for {title}</div>;
    }

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

    return (
        <div className="space-y-8">
            {/* Header with Tabs */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-card-bg-dark p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                <span className="text-xl font-bold text-gray-800 dark:text-gray-200">Device Trend Analysis</span>
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

            <div key={activeTab} className="bg-white dark:bg-card-bg-dark p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-6">
                    <h3 className="text-xl font-bold text-blue-900 dark:text-blue-400">{title}</h3>
                    {IMA_RANGES[activeTab] && (
                        <p className="text-sm text-gray-500 mt-1">Normal Range: {IMA_RANGES[activeTab].min} - {IMA_RANGES[activeTab].max}</p>
                    )}
                </div>

                <Chart
                    title={`Comparative Trend: ${title}`}
                    data={[
                        ...getRangeTraces(activeTab, timestamps, 'scatter'),
                        ...trendData
                    ]}
                    layout={{
                        xaxis: { title: 'Time' },
                        yaxis: { title: 'Value' },
                        template: chartTemplate,
                        font: { color: textColor },
                        legend: { orientation: 'h', y: 1.1 }
                    }}
                />


                {/* Chart Description */}
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-l-4 border-gray-400 mb-2">
                    <h4 className="font-bold text-sm text-gray-700 dark:text-gray-300 uppercase mb-1">Chart Description</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        This chart shows how VinCense readings move over time compared to other devices. It helps you see if VinCense follows the same pattern as the trusted devices.
                    </p>
                </div>
                {/* Insight */}
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500 mb-4">
                    <h4 className="font-bold text-sm text-blue-800 dark:text-blue-300 uppercase mb-1">Insight</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-200">
                        <strong>Insight:</strong> If the lines separate consistently, VinCense has a fixed error. Spikes mean it is struggling with sudden changes.
                    </p>
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

                    {/* Explicit Dr Trust vs Dr Odin Plot */}
                    {readingCols.includes('Dr Trust Readings') && readingCols.includes('Dr Odin Readings') && (() => {
                        const trustVals = sortedDf.map(r => Number(r['Dr Trust Readings']));
                        const odinVals = sortedDf.map(r => Number(r['Dr Odin Readings']));

                        const validTrust = trustVals.filter(v => !isNaN(v));
                        const validOdin = odinVals.filter(v => !isNaN(v));

                        if (validTrust.length === 0 || validOdin.length === 0) return null;

                        const minVal = Math.min(...validTrust, ...validOdin);
                        const maxVal = Math.max(...validTrust, ...validOdin);

                        return (
                            <div key="TrustVsOdin">
                                <Chart
                                    title="Identity Plot: Dr Trust vs Dr Odin"
                                    data={[
                                        {
                                            x: odinVals,
                                            y: trustVals,
                                            mode: 'markers',
                                            type: 'scatter',
                                            marker: { color: '#ec4899' }, // Different color (pink-500)
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
                                        xaxis: { title: 'Dr Odin' },
                                        yaxis: { title: 'Dr Trust' },
                                        template: chartTemplate,
                                        font: { color: textColor }
                                    }}
                                />
                            </div>
                        );
                    })()}
                </div>

                {/* Chart Description - Only show if we have identity plots */}
                {readingCols.some(c => !c.includes('VinCense')) && (
                    <>
                        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-l-4 border-gray-400 mb-2">
                            <h4 className="font-bold text-sm text-gray-700 dark:text-gray-300 uppercase mb-1">Chart Description</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                This plot compares individual VinCense readings with the reference. Points on the dashed line are perfect matches.
                            </p>
                        </div>
                        {/* Insight */}
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500 mb-4">
                            <h4 className="font-bold text-sm text-blue-800 dark:text-blue-300 uppercase mb-1">Insight</h4>
                            <p className="text-sm text-blue-700 dark:text-blue-200">
                                <strong>Insight:</strong> Points scattered far from the line show poor accuracy. If most points are on one side, there is a bias.
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
