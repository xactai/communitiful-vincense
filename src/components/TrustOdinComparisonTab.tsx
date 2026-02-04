import React, { useMemo, useState } from 'react';
import type { DataDict } from '../types';
import Plot from 'react-plotly.js';
import { ExpandableChart } from './ExpandableChart';


interface Props {
    data: DataDict;
    isDarkMode: boolean;
}

export const TrustOdinComparisonTab: React.FC<Props> = ({ data, isDarkMode }) => {
    // 1. Data Alignment & Processing
    const analytics = useMemo(() => {
        const vitals = ['Pulse', 'SpO2', 'Resp'];
        const results: Record<string, any> = {};

        vitals.forEach(vital => {
            const sheet = data[vital] || [];
            const alignedData: any[] = [];
            const diffs: number[] = [];
            const absDiffs: number[] = [];

            // For Heatmap
            const byCircumstance: Record<string, number[]> = {};

            sheet.forEach(row => {
                const t = Number(row['Dr Trust Readings']);
                const o = Number(row['Dr Odin Readings']);

                // Filter valid simultaneous readings
                if (!isNaN(t) && !isNaN(o)) {
                    const diff = t - o;
                    const avg = (t + o) / 2;

                    alignedData.push({
                        trust: t,
                        odin: o,
                        diff,
                        avg,
                        circumstance: row['Circumstance'] || 'Unknown'
                    });

                    diffs.push(diff);
                    absDiffs.push(Math.abs(diff));

                    // Circumstance aggregation
                    let c = (row['Circumstance'] || 'Unknown').trim().replace(/\s+/g, ' ');
                    c = c.replace(/\w\S*/g, (txt: string) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());

                    if (!byCircumstance[c]) byCircumstance[c] = [];
                    byCircumstance[c].push(Math.abs(diff));
                }
            });

            if (alignedData.length === 0) return;

            // Stats
            const mae = absDiffs.reduce((a, b) => a + b, 0) / absDiffs.length;
            const diffDistribution = {
                '0-2': absDiffs.filter(d => d <= 2).length,
                '2-5': absDiffs.filter(d => d > 2 && d <= 5).length,
                '5+': absDiffs.filter(d => d > 5).length
            };
            const within2Percent = alignedData.filter(d => {
                const margin = d.avg * 0.02;
                return Math.abs(d.diff) <= margin;
            }).length;

            results[vital] = {
                data: alignedData,
                mae,
                diffDistribution,
                within2Percent,
                total: alignedData.length,
                meanDiff: diffs.reduce((a, b) => a + b, 0) / diffs.length,
                sdDiff: Math.sqrt(diffs.map(d => Math.pow(d - (diffs.reduce((a, b) => a + b, 0) / diffs.length), 2)).reduce((a, b) => a + b, 0) / diffs.length),
                byCircumstance
            };
        });

        return results;
    }, [data]);

    const textColor = isDarkMode ? '#e5e7eb' : '#374151';
    const gridColor = isDarkMode ? '#374151' : '#e5e7eb';


    const [activeTab, setActiveTab] = useState<string>('Pulse');
    const vitalsList = ['Pulse', 'SpO2', 'Resp'];

    if (Object.keys(analytics).length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-gray-500">
                <h3 className="text-lg font-semibold mb-2">No Simultaneous Data Found</h3>
                <p>Ensure data exists for both Dr Trust and Dr Odin in Pulse/SpO2 sheets.</p>
            </div>
        );
    }

    const stats = analytics[activeTab];
    if (!stats) return <div className="p-4 text-gray-500">No data for {activeTab}</div>;

    const { data: pts, mae, diffDistribution, within2Percent, total, meanDiff, sdDiff, byCircumstance } = stats;
    const unit = activeTab === 'Pulse' ? 'bpm' : activeTab === 'SpO2' ? '%' : 'rpm';

    return (
        <div className="space-y-12 p-4">
            {/* Header with Tabs */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-card-bg-dark p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                <span className="text-xl font-bold text-gray-800 dark:text-gray-200">Dr Trust vs Dr Odin Analysis</span>
                <div className="flex space-x-2 overflow-x-auto pb-1 md:pb-0 overflow-y-hidden scrollbar-hide">
                    {vitalsList.map(v => (
                        <button
                            key={v}
                            onClick={() => setActiveTab(v)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors flex-shrink-0 ${activeTab === v
                                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                                : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                                }`}
                        >
                            {v === 'Resp' ? 'Respiratory Rate' : v}
                        </button>
                    ))}
                </div>
            </div>

            <div key={activeTab} className="space-y-8 border-b border-gray-200 dark:border-gray-700 pb-12 last:border-0">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-indigo-800 dark:text-indigo-300">{activeTab === 'Resp' ? 'Respiratory Rate' : activeTab} Analysis</h3>
                    {/* KPI Card */}
                    <div className="bg-indigo-50 dark:bg-indigo-900/30 px-6 py-3 rounded-xl border border-indigo-200 dark:border-indigo-800 shadow-sm">
                        <div className="text-xs font-bold text-indigo-500 uppercase tracking-wider">Mean Absolute Error (MAE)</div>
                        <div className="text-2xl font-bold text-indigo-900 dark:text-white">{mae.toFixed(2)} <span className="text-sm font-normal text-gray-500">{unit}</span></div>
                    </div>
                </div>

                {/* Top Row: Scatter & Bland-Altman */}
                <div className="space-y-8">
                    {/* Scatter Plot */}
                    <div className="bg-white dark:bg-card-bg-dark p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                        <h4 className="text-sm font-bold text-gray-500 mb-4 uppercase text-center">Brand Correlation</h4>
                        <ExpandableChart title="Brand Correlation" className="h-[350px]">
                            <Plot
                                data={[
                                    {
                                        x: pts.map((d: any) => d.trust),
                                        y: pts.map((d: any) => d.odin),
                                        mode: 'markers',
                                        type: 'scatter',
                                        marker: { color: '#6366f1', opacity: 0.6 },
                                        name: 'Readings'
                                    },
                                    {
                                        x: [Math.min(...pts.map((d: any) => d.trust)), Math.max(...pts.map((d: any) => d.trust))],
                                        y: [Math.min(...pts.map((d: any) => d.trust)), Math.max(...pts.map((d: any) => d.trust))],
                                        mode: 'lines',
                                        type: 'scatter',
                                        line: { color: 'gray', dash: 'dash' },
                                        name: 'Perfect Agreement'
                                    }
                                ]}
                                layout={{
                                    autosize: true,
                                    paper_bgcolor: 'transparent',
                                    plot_bgcolor: 'transparent',
                                    font: { color: textColor },
                                    xaxis: { title: `Dr Trust (${unit})`, gridcolor: gridColor },
                                    yaxis: { title: `Dr Odin (${unit})`, gridcolor: gridColor },
                                    showlegend: true,
                                    legend: { orientation: 'v', x: 1.02, y: 1, xanchor: 'left', yanchor: 'top' },
                                    margin: { r: 150 }
                                } as any}
                                useResizeHandler={true}
                                className="w-full h-full"
                            />
                        </ExpandableChart>
                        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-l-4 border-gray-400">
                            <h4 className="font-bold text-sm text-gray-700 dark:text-gray-300 uppercase mb-1">Chart Description</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Scatter plot showing the relationship between Dr Trust and Dr Odin readings. The dashed line represents perfect agreement.</p>
                        </div>
                        <div className="mt-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                            <h4 className="font-bold text-sm text-blue-800 dark:text-blue-300 uppercase mb-1">Insight</h4>
                            <p className="text-sm text-blue-700 dark:text-blue-200"><strong>Insight:</strong> Deviations from the diagonal line indicate systematic bias between the two devices.</p>
                        </div>
                    </div>

                    {/* Bland-Altman Plot */}
                    <div className="bg-white dark:bg-card-bg-dark p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                        <h4 className="text-sm font-bold text-gray-500 mb-4 uppercase text-center">Bland-Altman Analysis</h4>
                        <ExpandableChart title="Bland-Altman Analysis" className="h-[350px]">
                            <Plot
                                data={[
                                    {
                                        x: pts.map((d: any) => d.avg),
                                        y: pts.map((d: any) => d.diff),
                                        mode: 'markers',
                                        type: 'scatter',
                                        marker: { color: '#ec4899', opacity: 0.6 },
                                        name: 'Difference'
                                    }
                                ]}
                                layout={{
                                    autosize: true,
                                    paper_bgcolor: 'transparent',
                                    plot_bgcolor: 'transparent',
                                    font: { color: textColor },
                                    xaxis: { title: `Average Value (${unit})`, gridcolor: gridColor },
                                    yaxis: { title: `Difference (Trust - Odin) (${unit})`, gridcolor: gridColor },
                                    shapes: [
                                        { type: 'line', x0: 0, x1: 1, xref: 'paper', y0: meanDiff, y1: meanDiff, line: { color: 'blue', width: 2 } },
                                        { type: 'line', x0: 0, x1: 1, xref: 'paper', y0: meanDiff + 1.96 * sdDiff, y1: meanDiff + 1.96 * sdDiff, line: { color: 'red', dash: 'dot' } },
                                        { type: 'line', x0: 0, x1: 1, xref: 'paper', y0: meanDiff - 1.96 * sdDiff, y1: meanDiff - 1.96 * sdDiff, line: { color: 'red', dash: 'dot' } }
                                    ],
                                    showlegend: true,
                                    legend: { orientation: 'v', x: 1.02, y: 1, xanchor: 'left', yanchor: 'top' },
                                    margin: { r: 150 }
                                } as any}
                                useResizeHandler={true}
                                className="w-full h-full"
                            />
                        </ExpandableChart>
                        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-l-4 border-gray-400">
                            <h4 className="font-bold text-sm text-gray-700 dark:text-gray-300 uppercase mb-1">Chart Description</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Plots the difference between devices against their average. Blue line is the mean bias, red dotted lines are 95% limits of agreement.</p>
                        </div>
                        <div className="mt-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                            <h4 className="font-bold text-sm text-blue-800 dark:text-blue-300 uppercase mb-1">Insight</h4>
                            <p className="text-sm text-blue-700 dark:text-blue-200"><strong>Insight:</strong> A consistent non-zero mean difference suggests calibration bias. Widening scatter at higher values indicates proportional error.</p>
                        </div>
                    </div>
                </div>

                {/* Middle Row: Histogram & Donut */}
                <div className="space-y-8">
                    {/* Histogram */}
                    <div className="bg-white dark:bg-card-bg-dark p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                        <h4 className="text-sm font-bold text-gray-500 mb-4 uppercase text-center">Discrepancy Distribution</h4>
                        <ExpandableChart title="Discrepancy Distribution" className="h-[300px]">
                            <Plot
                                data={[{
                                    x: ['0-2 Units', '2-5 Units', '5+ Units'],
                                    y: [diffDistribution['0-2'], diffDistribution['2-5'], diffDistribution['5+']],
                                    type: 'bar',
                                    marker: { color: ['#10b981', '#f59e0b', '#ef4444'] }
                                }]}
                                layout={{
                                    autosize: true,
                                    paper_bgcolor: 'transparent',
                                    plot_bgcolor: 'transparent',
                                    font: { color: textColor },
                                    yaxis: { title: 'Count', gridcolor: gridColor },
                                    xaxis: { title: 'Absolute Difference Range' },
                                    showlegend: true,
                                    legend: { orientation: 'v', x: 1.02, y: 1, xanchor: 'left', yanchor: 'top' },
                                    margin: { r: 150 }
                                } as any}
                                useResizeHandler={true}
                                className="w-full h-full"
                            />
                        </ExpandableChart>
                        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-l-4 border-gray-400">
                            <h4 className="font-bold text-sm text-gray-700 dark:text-gray-300 uppercase mb-1">Chart Description</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Frequency of absolute differences grouped by magnitude severity.</p>
                        </div>
                        <div className="mt-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                            <h4 className="font-bold text-sm text-blue-800 dark:text-blue-300 uppercase mb-1">Insight</h4>
                            <p className="text-sm text-blue-700 dark:text-blue-200"><strong>Insight:</strong> A skewed left distribution (high green bar) indicates high reliability.</p>
                        </div>
                    </div>

                    {/* Donut Chart */}
                    <div className="bg-white dark:bg-card-bg-dark p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                        <h4 className="text-sm font-bold text-gray-500 mb-4 uppercase text-center">Reliability (±2% Agreement)</h4>
                        <ExpandableChart title="Reliability (±2% Agreement)" className="h-[300px]">
                            <Plot
                                data={[{
                                    labels: ['Good Agreement (<2%)', 'Discrepancy (>2%)'],
                                    values: [within2Percent, total - within2Percent],
                                    type: 'pie',
                                    hole: 0.6,
                                    marker: { colors: ['#10b981', '#ef4444'] },
                                    textinfo: 'label+percent',
                                    textposition: 'outside'
                                }]}
                                layout={{
                                    autosize: true,
                                    paper_bgcolor: 'transparent',
                                    plot_bgcolor: 'transparent',
                                    font: { color: textColor },
                                    showlegend: true,
                                    legend: { orientation: 'v', x: 1.02, y: 1, xanchor: 'left', yanchor: 'top' },
                                    margin: { r: 150 }
                                } as any}
                                useResizeHandler={true}
                                className="w-full h-full"
                            />
                        </ExpandableChart>
                        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-l-4 border-gray-400">
                            <h4 className="font-bold text-sm text-gray-700 dark:text-gray-300 uppercase mb-1">Chart Description</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Percentage of readings where Dr Trust and Dr Odin differ by less than ±2%.</p>
                        </div>
                        <div className="mt-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                            <h4 className="font-bold text-sm text-blue-800 dark:text-blue-300 uppercase mb-1">Insight</h4>
                            <p className="text-sm text-blue-700 dark:text-blue-200"><strong>Insight:</strong> High agreement ({'>'}90%) suggests the devices are interchangeable for clinical use.</p>
                        </div>
                    </div>
                </div>

                {/* Bottom: Circumstance Heatmap */}
                <div className="bg-white dark:bg-card-bg-dark p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mt-8">
                    <h4 className="text-sm font-bold text-gray-500 mb-4 uppercase text-center">Average Absolute Deviation by Circumstance</h4>
                    <ExpandableChart title="Average Absolute Deviation by Circumstance" className="h-[300px]">
                        <Plot
                            data={[{
                                x: Object.keys(byCircumstance),
                                y: [activeTab],
                                z: [Object.values(byCircumstance).map((divs: any) => divs.reduce((a: number, b: number) => a + b, 0) / divs.length)],
                                type: 'heatmap',
                                colorscale: 'RdBu',
                                reversescale: true,
                                showscale: true
                            }]}
                            layout={{
                                autosize: true,
                                paper_bgcolor: 'transparent',
                                plot_bgcolor: 'transparent',
                                font: { color: textColor },
                                xaxis: {
                                    tickangle: 45, // Positive 45 to rotate label down-right
                                    automargin: true
                                },
                                margin: { b: 100 }
                            } as any}
                            useResizeHandler={true}
                            className="w-full h-full"
                        />
                    </ExpandableChart>
                    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-l-4 border-gray-400">
                        <h4 className="font-bold text-sm text-gray-700 dark:text-gray-300 uppercase mb-1">Chart Description</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Heatmap visualization of the average absolute error across different user activities.</p>
                    </div>
                    <div className="mt-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                        <h4 className="font-bold text-sm text-blue-800 dark:text-blue-300 uppercase mb-1">Insight</h4>
                        <p className="text-sm text-blue-700 dark:text-blue-200"><strong>Insight:</strong> Darker red areas highlight activities that cause the most significant disagreement between the devices, indicating potential motion artifacts or sensor limitations.</p>
                    </div>
                </div>

            </div>
        </div>
    );
};
