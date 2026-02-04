import React, { useState } from 'react';
import type { DataDict } from '../types';
import { Chart } from './Chart';

interface DeepDiveTabProps {
    data: DataDict;
    isDarkMode: boolean;
}

const LABELS: Record<string, string> = {
    'Pulse': 'Pulse Rate',
    'SpO2': 'SpO2',
    'Resp': 'Respiratory Rate',
    'Temp': 'Skin Temperature'
};

export const DeepDiveTab: React.FC<DeepDiveTabProps> = ({ data, isDarkMode }) => {
    const [activeTab, setActiveTab] = useState<string>('Pulse');
    const chartTemplate = isDarkMode ? 'plotly_dark' : 'plotly_white';
    const textColor = isDarkMode ? '#fafafa' : '#2c3e50';

    const df = data[activeTab];
    const title = LABELS[activeTab];

    if (!df || df.length === 0) {
        return <div className="text-gray-500">No data available for {title}</div>;
    }

    // Prep data
    const vinReadings = df.map(r => Number(r['VinCense Readings'])).filter(n => !isNaN(n));
    const refCols = Object.keys(df[0] || {}).filter(k => k.includes('Readings') && !k.includes('VinCense'));

    // Sort
    const sortedDf = [...df].sort((a, b) => {
        const ta = a['Timestamp'] ? new Date(a['Timestamp']).getTime() : 0;
        const tb = b['Timestamp'] ? new Date(b['Timestamp']).getTime() : 0;
        return ta - tb;
    });
    const timestamps = sortedDf.map(r => r['Timestamp']);

    // Calculate Metrics
    let kpi1 = { label: '', value: '', sub: '' };
    let kpi2 = { label: '', value: '', sub: '' };
    let kpi3 = { label: '', value: '', sub: '' };

    if (activeTab === 'Temp') {
        const low = 33.0, high = 35.0;
        const total = vinReadings.length;
        const over = vinReadings.filter(v => v > high).length;
        const under = vinReadings.filter(v => v < low).length;
        const inTol = vinReadings.filter(v => v >= low && v <= high).length;

        kpi1 = { label: 'Above Normal (>35)', value: `${over}`, sub: total ? `(${(over / total * 100).toFixed(1)}%)` : '' };
        kpi2 = { label: 'In Normal Range (33-35)', value: `${inTol}`, sub: total ? `(${(inTol / total * 100).toFixed(1)}%)` : '' };
        kpi3 = { label: 'Below Normal (<33)', value: `${under}`, sub: total ? `(${(under / total * 100).toFixed(1)}%)` : '' };
    } else if (refCols.length > 0) {
        const priRef = refCols[0];
        const diffs = sortedDf.map(r => Number(r['VinCense Readings']) - Number(r[priRef])).filter(n => !isNaN(n));
        const tol = 2.0;
        const total = diffs.length;

        const over = diffs.filter(d => d > tol).length;
        const under = diffs.filter(d => d < -tol).length;
        const inTol = diffs.filter(d => d >= -tol && d <= tol).length;

        kpi1 = { label: 'Overestimation (> +2)', value: `${over}`, sub: total ? `(${(over / total * 100).toFixed(1)}%)` : '' };
        kpi2 = { label: 'In Tolerance (+/- 2)', value: `${inTol}`, sub: total ? `(${(inTol / total * 100).toFixed(1)}%)` : '' };
        kpi3 = { label: 'Underestimation (< -2)', value: `${under}`, sub: total ? `(${(under / total * 100).toFixed(1)}%)` : '' };
    }

    return (
        <div>
            {/* Header with Tabs */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-card-bg-dark p-4 rounded-xl border border-gray-200 dark:border-gray-700 mb-6">
                <span className="text-xl font-bold text-gray-800 dark:text-gray-200">VinCense Accuracy Overview</span>
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

            {/* 1. Accuracy Stats */}
            <div className="mb-8">
                <h3 className="text-lg font-bold mb-4 text-text-light dark:text-text-dark">Statistical Accuracy Evaluation</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[kpi1, kpi2, kpi3].map((kpi, i) => (
                        <div key={i} className="bg-white dark:bg-card-bg-dark p-4 rounded-lg shadow-sm border-l-4 border-indigo-400">
                            <div className="text-gray-500 dark:text-gray-400 text-sm mb-1">{kpi.label}</div>
                            <div className="text-2xl font-bold text-text-light dark:text-text-dark">{kpi.value} <span className="text-sm font-normal text-gray-500">{kpi.sub}</span></div>
                        </div>
                    ))}
                </div>
            </div>

            <hr className="border-gray-200 dark:border-gray-700 mb-8" />

            {/* 2. Bias Magnitude */}
            <div className="mb-8">
                <h3 className="text-lg font-bold mb-4 text-text-light dark:text-text-dark">Bias Magnitude Analysis</h3>
                {(() => {
                    let metrics: { label: string, value: string }[] = [];
                    if (activeTab === 'Temp') {
                        const vals = vinReadings;
                        const overDiffs = vals.map(v => v - 35.0).filter(d => d > 0);
                        const underDiffs = vals.map(v => 33.0 - v).filter(d => d > 0);

                        const avgOver = overDiffs.length ? overDiffs.reduce((a, b) => a + b, 0) / overDiffs.length : 0;
                        const maxOver = overDiffs.length ? Math.max(...overDiffs) : 0;
                        const avgUnder = underDiffs.length ? underDiffs.reduce((a, b) => a + b, 0) / underDiffs.length : 0;
                        const maxUnder = underDiffs.length ? Math.max(...underDiffs) : 0;

                        metrics = [
                            { label: 'Avg Above Range', value: avgOver.toFixed(2) },
                            { label: 'Max Above Range', value: maxOver.toFixed(2) },
                            { label: 'Avg Below Range', value: avgUnder.toFixed(2) },
                            { label: 'Max Below Range', value: maxUnder.toFixed(2) }
                        ];
                    } else if (refCols.length > 0) {
                        const priRef = refCols[0];
                        const diffs = sortedDf.map(r => Number(r['VinCense Readings']) - Number(r[priRef])).filter(n => !isNaN(n));
                        const overDiffs = diffs.filter(d => d > 0);
                        const underDiffs = diffs.filter(d => d < 0);

                        const avgOver = overDiffs.length ? overDiffs.reduce((a, b) => a + b, 0) / overDiffs.length : 0;
                        const maxOver = overDiffs.length ? Math.max(...overDiffs) : 0;
                        const avgUnder = underDiffs.length ? underDiffs.reduce((a, b) => a + b, 0) / underDiffs.length : 0;
                        const maxUnder = underDiffs.length ? Math.min(...underDiffs) : 0; // min of negatives is max magnitude underestimation

                        metrics = [
                            { label: 'Avg Overestimation', value: avgOver.toFixed(2) },
                            { label: 'Max Overestimation', value: maxOver.toFixed(2) },
                            { label: 'Avg Underestimation', value: avgUnder.toFixed(2) },
                            { label: 'Max Underestimation', value: maxUnder.toFixed(2) }
                        ];
                    }

                    return (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {metrics.map((m, i) => (
                                <div key={i} className="bg-white dark:bg-card-bg-dark p-4 rounded-lg shadow-sm border-l-4 border-orange-400">
                                    <div className="text-gray-500 dark:text-gray-400 text-sm mb-1">{m.label}</div>
                                    <div className="text-2xl font-bold text-text-light dark:text-text-dark">{m.value}</div>
                                </div>
                            ))}
                            {metrics.length === 0 && <div className="col-span-4 text-gray-500">No data available</div>}
                        </div>
                    );
                })()}
            </div>

            {/* 3. Deviation Multi-line */}
            <div className="mb-8">
                <h3 className="text-lg font-bold mb-4 text-text-light dark:text-text-dark">Deviation Comparison Across Reference Devices</h3>
                {refCols.length > 0 ? (
                    <Chart
                        title="Deviation Profile vs Reference Devices"
                        data={refCols.map(ref => ({
                            x: timestamps,
                            y: sortedDf.map(r => Number(r['VinCense Readings']) - Number(r[ref])),
                            type: 'scatter',
                            mode: 'lines+markers',
                            name: `Dev vs ${ref.replace(' Readings', '')}`
                        }))}
                        layout={{
                            xaxis: { title: 'Time' },
                            yaxis: { title: 'Deviation' },
                            template: chartTemplate,
                            font: { color: textColor }
                        }}
                    />
                ) : (
                    <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded">Note: No reference data available</div>
                )}
            </div>
            {refCols.length > 0 && (
                <>
                    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-l-4 border-gray-400 mb-2">
                        <h4 className="font-bold text-sm text-gray-700 dark:text-gray-300 uppercase mb-1">Chart Description</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            This line chart compares how much VinCense deviates from each reference device over the entire session.
                        </p>
                    </div>
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500 mb-4">
                        <h4 className="font-bold text-sm text-blue-800 dark:text-blue-300 uppercase mb-1">Insight</h4>
                        <p className="text-sm text-blue-700 dark:text-blue-200">
                            <strong>Insight:</strong> Consistent "parallel" deviation lines suggest a systematic offset (calibration issue). Crossing lines suggest random noise or device disagreement.
                        </p>
                    </div>
                </>
            )}

            {/* 4. Short Term Stability */}
            <div className="mb-8">
                <h3 className="text-lg font-bold mb-4 text-text-light dark:text-text-dark">Device Stability Overtime</h3>
                {/* Rolling Std calculation */}
                {(() => {
                    const vals = sortedDf.map(r => Number(r['VinCense Readings']));
                    const rollingStd = vals.map((_, i, arr) => {
                        if (i < 2) return null;
                        const window = arr.slice(i - 2, i + 1);
                        const mean = window.reduce((a, b) => a + b, 0) / 3;
                        const variance = window.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / 3;
                        return Math.sqrt(variance);
                    });

                    return (
                        <Chart
                            title="Short-Term Stability (Rolling Std Dev, Window=3)"
                            data={[{
                                x: timestamps,
                                y: rollingStd,
                                type: 'scatter',
                                mode: 'lines+markers',
                                name: 'Rolling Std'
                            }]}
                            layout={{
                                xaxis: { title: 'Time' },
                                yaxis: { title: 'Std Dev' },
                                template: chartTemplate,
                                font: { color: textColor },
                                showlegend: true,
                                legend: { orientation: 'v', x: 1.02, y: 1, xanchor: 'left', yanchor: 'top' },
                                margin: { r: 150 }
                            }}
                        />
                    );
                })()}
            </div>
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-l-4 border-gray-400 mb-2">
                <h4 className="font-bold text-sm text-gray-700 dark:text-gray-300 uppercase mb-1">Chart Description</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    This chart plots the Rolling Standard Deviation (window of 3 readings). It measures short-term volatility.
                </p>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500 mb-4">
                <h4 className="font-bold text-sm text-blue-800 dark:text-blue-300 uppercase mb-1">Insight</h4>
                <p className="text-sm text-blue-700 dark:text-blue-200">
                    <strong>Insight:</strong> High spikes indicate sudden instability or noise artifacts. A consistently low line indicates stable tracking.
                </p>
            </div>

            <hr className="border-gray-200 dark:border-gray-700 mb-8" />

            {/* 5. Long Term Drift Analysis */}
            <div className="mb-8">
                <h3 className="text-lg font-bold mb-4 text-text-light dark:text-text-dark">Accuracy Drift Overtime</h3>
                {refCols.length > 0 ? (() => {
                    const priRef = refCols[0];
                    const driftDev = sortedDf.map(r => Number(r['VinCense Readings']) - Number(r[priRef]));
                    // Simple Linear Regression for Trendline
                    // x = index (0, 1, 2...), y = driftDev
                    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
                    let validPoints = 0;

                    const points = driftDev.map((y, x) => {
                        if (isNaN(y)) return null;
                        sumX += x;
                        sumY += y;
                        sumXY += x * y;
                        sumXX += x * x;
                        validPoints++;
                        return { x: timestamps[x], y };
                    }).filter(p => p !== null);

                    // Check unused warning - we used sumX etc in slope calc
                    if (points.length === 0) { } // Dummy use if needed, but we use validPoints which is inc inside map

                    let slope = 0, intercept = 0;
                    if (validPoints > 1) {
                        slope = (validPoints * sumXY - sumX * sumY) / (validPoints * sumXX - sumX * sumX);
                        intercept = (sumY - slope * sumX) / validPoints;
                    }

                    // Trendline points
                    const trendY = driftDev.map((_, x) => slope * x + intercept);

                    return (
                        <Chart
                            title={`Drift Analysis Regression (vs ${priRef.replace(' Readings', '')})`}
                            data={[
                                {
                                    x: timestamps,
                                    y: driftDev,
                                    type: 'scatter',
                                    mode: 'markers',
                                    name: 'Deviation'
                                },
                                {
                                    x: timestamps,
                                    y: trendY,
                                    type: 'scatter',
                                    mode: 'lines',
                                    name: 'Trend (OLS)',
                                    line: { dash: 'dash', color: 'red' }
                                }
                            ]}
                            layout={{
                                xaxis: { title: 'Time' },
                                yaxis: { title: 'Deviation' },
                                template: chartTemplate,
                                font: { color: textColor }
                            }}
                        />
                    );
                })() : (
                    <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded">Note: No reference data available</div>
                )}
            </div>
            {refCols.length > 0 && (
                <>
                    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-l-4 border-gray-400 mb-2">
                        <h4 className="font-bold text-sm text-gray-700 dark:text-gray-300 uppercase mb-1">Chart Description</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            This scatter plot fits a linear trend line (red dash) to the error over time.
                        </p>
                    </div>
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500 mb-4">
                        <h4 className="font-bold text-sm text-blue-800 dark:text-blue-300 uppercase mb-1">Insight</h4>
                        <p className="text-sm text-blue-700 dark:text-blue-200">
                            <strong>Insight:</strong> A sloping trend line warns of "Sensor Drift"—the device losing accuracy as the session continues (e.g., due to warming up or battery drain).
                        </p>
                    </div>
                </>
            )}

            {/* 6. Consistency & Anomaly Detection */}
            <div className="mb-8">
                <h3 className="text-lg font-bold mb-4 text-text-light dark:text-text-dark">Consistency & Anomaly Detection</h3>
                {(() => {
                    const vals = sortedDf.map(r => Number(r['VinCense Readings']));
                    const jumps = vals.map((v, i) => i === 0 ? 0 : Math.abs(v - vals[i - 1]));
                    const jumpThreshold = activeTab === 'Pulse' ? 10 : 5;

                    const numJumps = jumps.filter(j => j > jumpThreshold).length;
                    const maxJump = Math.max(...jumps.filter(j => !isNaN(j)), 0);

                    return (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white dark:bg-card-bg-dark p-4 rounded-lg shadow-sm border-l-4 border-red-400">
                                <div className="text-gray-500 dark:text-gray-400 text-sm mb-1">Anomalous Jumps ({`> ${jumpThreshold}`})</div>
                                <div className="text-2xl font-bold text-text-light dark:text-text-dark">{numJumps}</div>
                            </div>
                            <div className="bg-white dark:bg-card-bg-dark p-4 rounded-lg shadow-sm border-l-4 border-red-400">
                                <div className="text-gray-500 dark:text-gray-400 text-sm mb-1">Max Jump Magnitude</div>
                                <div className="text-2xl font-bold text-text-light dark:text-text-dark">{maxJump.toFixed(2)}</div>
                            </div>
                        </div>
                    );
                })()}
            </div>

            {/* 7. Circumstance Analysis */}
            <div className="mb-8">
                <h3 className="text-lg font-bold mb-4 text-text-light dark:text-text-dark">Device Performance by Activity</h3>
                {refCols.length > 0 && sortedDf.some(r => r['Circumstance']) ? (() => {
                    const priRef = refCols[0];
                    // Group by Circumstance
                    const groups: Record<string, number[]> = {};
                    sortedDf.forEach(r => {
                        const c = String(r['Circumstance'] || 'Unknown');
                        const val = Math.abs(Number(r['VinCense Readings']) - Number(r[priRef]));
                        if (!isNaN(val)) {
                            if (!groups[c]) groups[c] = [];
                            groups[c].push(val);
                        }
                    });

                    const categories = Object.keys(groups);
                    const means = categories.map(c => groups[c].reduce((a, b) => a + b, 0) / groups[c].length);

                    return (
                        <Chart
                            title={`Mean Error by Observational Context (vs ${priRef.replace(' Readings', '')})`}
                            data={[{
                                x: categories,
                                y: means,
                                type: 'bar',
                                marker: { color: means, colorscale: 'Reds' }
                            }]}
                            layout={{
                                xaxis: { title: 'Circumstance' },
                                yaxis: { title: 'Mean Abs Deviation' },
                                template: chartTemplate,
                                font: { color: textColor },
                                showlegend: true,
                                legend: { orientation: 'v', x: 1.02, y: 1, xanchor: 'left', yanchor: 'top' },
                                margin: { r: 150 }
                            }}
                        />
                    );
                })() : (
                    <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded">Note: Circumstance data not available</div>
                )}
            </div>
            {refCols.length > 0 && sortedDf.some(r => r['Circumstance']) && (
                <>
                    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-l-4 border-gray-400 mb-2">
                        <h4 className="font-bold text-sm text-gray-700 dark:text-gray-300 uppercase mb-1">Chart Description</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            This heatmap-style bar chart groups errors by user activity (e.g., Resting, Walking).
                        </p>
                    </div>
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500 mb-4">
                        <h4 className="font-bold text-sm text-blue-800 dark:text-blue-300 uppercase mb-1">Insight</h4>
                        <p className="text-sm text-blue-700 dark:text-blue-200">
                            <strong>Insight:</strong> Darker red bars indicate activities where VinCense struggles (high error). Use this to identify if motion artifacts (e.g., Walking/Running) degrade accuracy.
                        </p>
                    </div>
                </>
            )}

        </div>
    );
};
