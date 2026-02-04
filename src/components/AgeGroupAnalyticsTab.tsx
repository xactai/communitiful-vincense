<<<<<<< HEAD
import React, { useMemo } from 'react';
=======
import React, { useMemo, useState } from 'react';
>>>>>>> 13725ae (Updated code commited)
import type { DataDict } from '../types';
import Plot from 'react-plotly.js';
import { format } from 'date-fns';
import { getRangeTraces, IMA_RANGES, WMA_RANGES } from '../utils/referenceRanges';

interface Props {
    data: DataDict;
    isDarkMode: boolean;
}

export const AgeGroupAnalyticsTab: React.FC<Props> = ({ data, isDarkMode }) => {
    // 1. Helpers
    const calculateStats = (values: number[]) => {
        if (values.length === 0) return { mean: 0, median: 0, count: 0, cv: 0, sd: 0 };
        const sum = values.reduce((a, b) => a + b, 0);
        const mean = sum / values.length;
        const sorted = [...values].sort((a, b) => a - b);
        const median = sorted[Math.floor(sorted.length / 2)];

        const sqDiffs = values.map(v => Math.pow(v - mean, 2));
        const avgSqDiff = sqDiffs.reduce((a, b) => a + b, 0) / values.length;
        const sd = Math.sqrt(avgSqDiff);
        const cv = mean === 0 ? 0 : (sd / mean);

        return { mean, median, count: values.length, cv, sd };
    };

    // 2. Vital Config
    const vitals = [
        { key: 'Pulse', label: 'Pulse Rate', unit: 'bpm', max: 150 },
        { key: 'SpO2', label: 'SpO2', unit: '%', max: 100 },
        { key: 'Resp', label: 'Respiratory Rate', unit: 'bpm', max: 40 },
        { key: 'Temp', label: 'Skin Temperature', unit: '°C', max: 40 }
    ];



    // 3. Process Data
    const analyticsData = useMemo(() => {
        // Data Structures
        // A. Per Age Group Means (for Radar)
        const ageGroupMeans: Record<string, Record<string, number>> = {}; // { [AgeGroup]: { [Vital]: Mean } }

        // B. Scatter Data: { [Vital]: [{ age: number, value: number, subject: string }] }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const scatterData: Record<string, any[]> = {};

        // C. Quadrant Data (Pulse vs RR): [{ pulse: number, rr: number, subject: string, label: string }]
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const quadrantData: any[] = [];

        // D. Polar Data (Circadian): { [Vital]: { [Hour/Segment]: number[] } }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const polarData: Record<string, Record<string, number[]>> = {};

        // E. Heatmap Data (Stability): { [Date]: { [Subject]: CV } }
        const stabilityData: Record<string, Record<string, number[]>> = {};

        // Init
        vitals.forEach(v => {
            scatterData[v.key] = [];
            polarData[v.key] = { AM: [], PM: [] };
        });

        // 1. Helper to estimate age from Age Group if numeric age missing? 
        // Or assume we have Age column? dataLoader doesn't explicitly parse "Age" numeric column unless present.
        // Let's check 'Age' field in row, or parse 'Age Group' center.

        // Refined Loop for all data points
        // Group Accumulators
        const ageGroupAcc: Record<string, Record<string, number[]>> = {}; // { [AgeGroup]: { [Vital]: vals[] } }

        vitals.forEach(v => {
            const sheet = data[v.key];
            if (!sheet) return;

            sheet.forEach(row => {
                const subj = row['Subject Name'] || 'Unknown';
                const ageGroup = row['Age Group'] || 'Unknown';
                // Try to find numeric Age
                let age = Number(row['Age']);
                if (isNaN(age)) {
                    // Fallback to age group midpoints
                    if (ageGroup === '18-25') age = 21.5;
                    else if (ageGroup === '26-50') age = 38;
                    else if (ageGroup === '51+') age = 60;
                    else age = 30; // default
                }

                const val = Number(row['VinCense Readings']);
                if (isNaN(val)) return;

                // A. Accumulate for Means
                if (!ageGroupAcc[ageGroup]) ageGroupAcc[ageGroup] = {};
                if (!ageGroupAcc[ageGroup][v.key]) ageGroupAcc[ageGroup][v.key] = [];
                ageGroupAcc[ageGroup][v.key].push(val);

                // B. Scatter Data
                scatterData[v.key].push({ age, value: val, subject: subj });

                // D. Polar (AM/PM)
                // Use 'Timestamp' or 'Time'
                let hour = -1;
                if (row['Timestamp']) hour = new Date(row['Timestamp']).getHours();
                else if (row['Time'] instanceof Date) hour = row['Time'].getHours();

                if (hour !== -1) {
                    const segment = hour < 12 ? 'AM' : 'PM';
                    if (!polarData[v.key][segment]) polarData[v.key][segment] = []; // initialize if needed
                    polarData[v.key][segment].push(val);
                }

                // E. Heatmap (Stability) - Aggregate by Date+Subject
                // We need to calc CV per day per subject. We'll store lists then reduce.
                let dateStr = 'Unknown';
                if (row['Date'] instanceof Date) {
                    dateStr = format(row['Date'], 'yyyy-MM-dd');
                }

                if (dateStr && dateStr !== 'Unknown') {
                    if (!stabilityData[dateStr]) stabilityData[dateStr] = {};
                    if (!stabilityData[dateStr][subj]) stabilityData[dateStr][subj] = []; // This stores *raw values* to calc CV later

                    // Actually, stability index is CV of stability? Or just CV.
                    // User said: "Stability Index (CV over time)". 
                    // To get ONE value per Subject per Day, we need multiple readings that day.
                    // Collecting *all* vitals? Usually Stability is calculated on a primary vital like Pulse or SpO2.
                    // Let's use Pulse for the Stability Heatmap as it varies most.
                    if (v.key === 'Pulse') {
                        stabilityData[dateStr][subj].push(val);
                    }
                }
            });
        });

        // C. Quadrant Data (Joined Pulse & Resp)
        // Need to join by Subject + Time approx? Or just avg per subject?
        // "Identify at-risk individuals immediately" -> Subject level average.
        // Let's aggregate Pulse and Resp by Subject.
        const subjectAvgs: Record<string, { pulse: number[], resp: number[] }> = {};

        // Pulse
        (data['Pulse'] || []).forEach(r => {
            const s = r['Subject Name'];
            const v = Number(r['VinCense Readings']);
            if (s && !isNaN(v)) {
                if (!subjectAvgs[s]) subjectAvgs[s] = { pulse: [], resp: [] };
                subjectAvgs[s].pulse.push(v);
            }
        });
        // Resp
        (data['Resp'] || []).forEach(r => {
            const s = r['Subject Name'];
            const v = Number(r['VinCense Readings']);
            if (s && !isNaN(v)) {
                if (!subjectAvgs[s]) subjectAvgs[s] = { pulse: [], resp: [] };
                subjectAvgs[s].resp.push(v);
            }
        });

        Object.keys(subjectAvgs).forEach(s => {
            const pMean = calculateStats(subjectAvgs[s].pulse).mean;
            const rMean = calculateStats(subjectAvgs[s].resp).mean;
            if (pMean && rMean) {
                quadrantData.push({ subject: s, pulse: pMean, rr: rMean });
            }
        });


        // Finalize Group Means
        Object.keys(ageGroupAcc).forEach(ag => {
            ageGroupMeans[ag] = {};
            Object.keys(ageGroupAcc[ag]).forEach(vk => {
                ageGroupMeans[ag][vk] = calculateStats(ageGroupAcc[ag][vk]).mean;
            });
        });

        return { ageGroupMeans, scatterData, quadrantData, polarData, stabilityData };

    }, [data]);

    const { ageGroupMeans, scatterData, quadrantData, polarData, stabilityData } = analyticsData;
    const textColor = isDarkMode ? '#e5e7eb' : '#374151';
    const gridColor = isDarkMode ? '#374151' : '#e5e7eb';
<<<<<<< HEAD
    const activeVital = 'Pulse';

=======
    const [activeVital, setActiveVital] = useState<string>('Pulse');
>>>>>>> 13725ae (Updated code commited)

    // Helper for Regression
    const calculateRegression = (x: number[], y: number[]) => {
        const n = x.length;
        if (n === 0) return { slope: 0, intercept: 0 };
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((a, b, i) => a + b * y[i], 0);
        const sumXX = x.reduce((a, b) => a + b * b, 0);
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        return { slope, intercept };
    };

    // Prepare Heatmap Data
    // X: Dates, Y: Subjects, Z: CV
    const heatmapX: string[] = Object.keys(stabilityData).sort();
    const heatmapY: string[] = Array.from(new Set(Object.values(stabilityData).flatMap(d => Object.keys(d)))).sort();
    const heatmapZ: (number | null)[][] = [];

    heatmapY.forEach(subj => {
        const row: (number | null)[] = [];
        heatmapX.forEach(date => {
            const vals = stabilityData[date]?.[subj];
            if (vals && vals.length > 1) {
                row.push(calculateStats(vals).cv);
            } else {
                row.push(null); // or 0? null for gap
            }
        });
        heatmapZ.push(row);
    });

    // Calculate Heatmap Height based on subjects
    const heatmapHeight = Math.max(500, heatmapY.length * 30);

    // Range Logic for Scatter
    const currentScatterData = scatterData[activeVital] || [];
    const ages = currentScatterData.map(d => d.age);
    const minAge = ages.length > 0 ? Math.min(...ages) : 0;
    const maxAge = ages.length > 0 ? Math.max(...ages) : 100;
    const ageRangeX = [Math.max(0, minAge - 5), maxAge + 5];

    return (
        <div className="space-y-12 p-4">
            {/* 1. Vital Age Radar Chart */}
            <div className="bg-white dark:bg-card-bg-dark p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold mb-2 text-amber-900 dark:text-amber-400">Vital Age Radar (Selection vs 30yo Benchmark)</h3>
                <div className="h-[500px]">
                    <Plot
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        data={[
                            {
                                type: 'scatterpolar',
                                r: vitals.map(v => {
                                    // Current Selection Mean
                                    // Use scatterData keys to get Mean of current selection
                                    const vals = scatterData[v.key]?.map(d => d.value) || [];
                                    return calculateStats(vals).mean;
                                }),
                                theta: vitals.map(v => v.label),
                                fill: 'toself',
                                name: 'Selected Data',
                                marker: { color: '#f59e0b' }
                            },
                            {
                                type: 'scatterpolar',
                                r: vitals.map(v => ageGroupMeans['26-50']?.[v.key] || 0), // Benchmark
                                theta: vitals.map(v => v.label),
                                fill: 'toself',
                                name: 'Age Group 26-50 (Benchmark)',
                                marker: { color: '#9ca3af', opacity: 0.5 }
                            }
                        ] as any}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        layout={{
                            polar: {
                                radialaxis: { visible: true, range: [0, 150] }, // Rough max
                                bgcolor: 'transparent',
                            },
                            paper_bgcolor: 'transparent',
                            plot_bgcolor: 'transparent',
                            font: { color: textColor },
                            showlegend: true
                        } as any}
                        useResizeHandler={true}
                        className="w-full h-full"
                    />
                </div>
                {/* Description & Insight */}
                {/* Chart Description */}
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-l-4 border-gray-400">
                    <h4 className="font-bold text-sm text-gray-700 dark:text-gray-300 uppercase mb-1">Chart Description</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        This <strong>Radar Chart</strong> compares the average vital signs of the current data selection (Orange) against a healthy "26-50" age group benchmark (Grey).
                    </p>
                </div>
                {/* Insight */}
                <div className="mt-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                    <h4 className="font-bold text-sm text-blue-800 dark:text-blue-300 uppercase mb-1">Insight</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-200">
                        <strong>Insight:</strong> Gaps between the orange and grey shapes highlight deviations. If the orange shape significantly exceeds the grey boundary, it indicates the subjects have higher-than-average vitals (potentially older "vital age").
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 2. Age vs. Vital Scatter Plot */}
                <div className="bg-white dark:bg-card-bg-dark p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <h3 className="text-xl font-bold mb-2 text-amber-900 dark:text-amber-400">Age vs Pulse Rate (Decay Trend)</h3>
                    <div className="h-[400px]">
                        {(() => {
                            const dataSet = scatterData['Pulse'] || [];
                            const x = dataSet.map(d => d.age);
                            const y = dataSet.map(d => d.value);
                            const { slope, intercept } = calculateRegression(x, y);
                            const lineX = [Math.min(...x), Math.max(...x)];
                            const lineY = lineX.map(v => slope * v + intercept);

                            return (
                                <Plot
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    data={[
<<<<<<< HEAD
                                        ...getRangeTraces(activeVital, ageRangeX),
=======
                                        ...getRangeTraces(activeVital, ageRangeX, 'scatter'),
>>>>>>> 13725ae (Updated code commited)
                                        {
                                            x: x,
                                            y: y,
                                            mode: 'markers',
                                            type: 'scatter',
                                            name: 'Subjects',
                                            marker: { color: '#f59e0b', size: 8, opacity: 0.6 }
                                        },
                                        {
                                            x: lineX,
                                            y: lineY,
                                            mode: 'lines',
                                            type: 'scatter',
                                            name: 'Trend Line',
                                            line: { color: '#ef4444', width: 2, dash: 'dash' }
                                        }
                                    ] as any}
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    layout={{
                                        autosize: true,
                                        paper_bgcolor: 'transparent',
                                        plot_bgcolor: 'transparent',
                                        font: { color: textColor },
                                        xaxis: { gridcolor: gridColor, title: 'Age' },
                                        yaxis: { gridcolor: gridColor, title: 'Pulse (bpm)' },
                                        showlegend: true,
                                        // shapes: getReferenceShapes('Pulse', showIMA, showWMA, isDarkMode) // Removed
                                    } as any}
                                    useResizeHandler={true}
                                    className="w-full h-full"
                                />
                            );
                        })()}
                    </div>
                    {/* Description & Insight */}
                    {/* Chart Description */}
                    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-l-4 border-gray-400">
                        <h4 className="font-bold text-sm text-gray-700 dark:text-gray-300 uppercase mb-1">Chart Description</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            <strong>Scatter Plot with Trend Line:</strong> Plots each subject's Pulse Rate against their Age. The red dashed line represents the linear regression (trend).
                        </p>
                    </div>
                    {/* Insight */}
                    <div className="mt-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                        <h4 className="font-bold text-sm text-blue-800 dark:text-blue-300 uppercase mb-1">Insight</h4>
                        <p className="text-sm text-blue-700 dark:text-blue-200">
                            <strong>Insight:</strong> A downward trend line suggests Pulse Rate decreases as age increases. Outliers far above the line indicate individuals with unusually high heart rates for their age.
                        </p>
                    </div>
                </div>

                {/* 3. Risk Matrix (Quadrant) */}
                <div className="bg-white dark:bg-card-bg-dark p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <h3 className="text-xl font-bold mb-2 text-amber-900 dark:text-amber-400">Risk Matrix (Pulse vs RR)</h3>
                    <div className="h-[400px]">
                        <Plot
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            data={[
                                {
                                    x: quadrantData.map(d => d.pulse),
                                    y: quadrantData.map(d => d.rr),
                                    mode: 'markers',
                                    type: 'scatter',
                                    marker: { size: 12, color: quadrantData.map(d => (d.pulse > 90 || d.rr > 20) ? '#ef4444' : '#10b981') }, // Red if high
                                    name: 'Subjects'
                                },
                                // WMA Box Trace (Pulse vs Resp)
                                {
                                    x: [WMA_RANGES['Pulse'].min, WMA_RANGES['Pulse'].max, WMA_RANGES['Pulse'].max, WMA_RANGES['Pulse'].min, WMA_RANGES['Pulse'].min],
                                    y: [WMA_RANGES['Resp'].min, WMA_RANGES['Resp'].min, WMA_RANGES['Resp'].max, WMA_RANGES['Resp'].max, WMA_RANGES['Resp'].min],
                                    fill: 'toself',
                                    fillcolor: 'rgba(59, 130, 246, 0.15)',
                                    line: { color: 'rgba(59, 130, 246, 0.6)', width: 1, dash: 'dot' },
                                    name: 'WMA Normal Range',
                                    visible: 'legendonly',
                                    type: 'scatter',
                                    mode: 'lines',
                                    hoverinfo: 'skip'
                                },
                                // IMA Box Trace (Pulse vs Resp)
                                {
                                    x: [IMA_RANGES['Pulse'].min, IMA_RANGES['Pulse'].max, IMA_RANGES['Pulse'].max, IMA_RANGES['Pulse'].min, IMA_RANGES['Pulse'].min],
                                    y: [IMA_RANGES['Resp'].min, IMA_RANGES['Resp'].min, IMA_RANGES['Resp'].max, IMA_RANGES['Resp'].max, IMA_RANGES['Resp'].min],
                                    fill: 'toself',
                                    fillcolor: 'rgba(34, 197, 94, 0.15)',
                                    line: { color: 'rgba(34, 197, 94, 0.6)', width: 1, dash: 'dot' },
                                    name: 'IMA Normal Range',
                                    visible: 'legendonly',
                                    type: 'scatter',
                                    mode: 'lines',
                                    hoverinfo: 'skip'
                                }
                            ] as any}
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            layout={{
                                autosize: true,
                                paper_bgcolor: 'transparent',
                                plot_bgcolor: 'transparent',
                                font: { color: textColor },
                                xaxis: { gridcolor: gridColor, title: 'Pulse (bpm)', range: [50, 130] },
                                yaxis: { gridcolor: gridColor, title: 'Resp Rate (bpm)', range: [10, 30] },
                                showlegend: true,
                                legend: { orientation: 'h', y: 1.1 },
                                shapes: [
                                    // Optional Quadrant Lines (Keep existing)
                                    { type: 'line', x0: 90, x1: 90, y0: 0, y1: 100, line: { color: gridColor, width: 1, dash: 'dot' } },
                                    { type: 'line', x0: 0, x1: 200, y0: 20, y1: 20, line: { color: gridColor, width: 1, dash: 'dot' } }
                                ],
                                annotations: [
                                    { x: 70, y: 15, text: 'Healthy', showarrow: false, font: { color: '#10b981', size: 14 } },
                                    { x: 110, y: 25, text: 'High Stress', showarrow: false, font: { color: '#ef4444', size: 14 } }
                                ]
                            } as any}
                            useResizeHandler={true}
                            className="w-full h-full"
                        />
                    </div>
                    {/* Description & Insight */}
                    {/* Chart Description */}
                    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-l-4 border-gray-400">
                        <h4 className="font-bold text-sm text-gray-700 dark:text-gray-300 uppercase mb-1">Chart Description</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            <strong>Quadrant Chart:</strong> Maps subjects based on Pulse Rate (X) and Respiratory Rate (Y).
                        </p>
                    </div>
                    {/* Insight */}
                    <div className="mt-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                        <h4 className="font-bold text-sm text-blue-800 dark:text-blue-300 uppercase mb-1">Insight</h4>
                        <p className="text-sm text-blue-700 dark:text-blue-200">
                            <strong>Insight:</strong> The top-right quadrant (High Pulse, High RR) represents the "High Stress" zone. Subjects falling here are physiologically strained. The bottom-left is the "Healthy/Relaxed" zone.
                        </p>
                    </div>
                </div>

                {/* 4. Circadian Rhythm Polar Chart */}
                <div className="bg-white dark:bg-card-bg-dark p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <h3 className="text-xl font-bold mb-2 text-amber-900 dark:text-amber-400">Biological Clock (AM vs PM Intensity)</h3>
                    <div className="h-[400px]">
                        <Plot
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            data={[
                                {
                                    r: [
                                        calculateStats(polarData['Temp']?.AM || []).mean,
                                        calculateStats(polarData['Temp']?.PM || []).mean,
                                        calculateStats(polarData['Temp']?.AM || []).mean // Close loop? Barpolar doesn't need close.
                                    ],
                                    theta: ['AM', 'PM', 'AM'],
                                    type: 'barpolar',
                                    marker: { color: ['#60a5fa', '#f59e0b'] },
                                    name: 'Skin Temp'
                                }
                            ] as any}
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            layout={{
                                polar: {
                                    radialaxis: { visible: true },
                                    angularaxis: { direction: "clockwise" },
                                    bgcolor: 'transparent'
                                },
                                paper_bgcolor: 'transparent',
                                plot_bgcolor: 'transparent',
                                font: { color: textColor },
                                showlegend: false
                            } as any}
                            useResizeHandler={true}
                            className="w-full h-full"
                        />
                    </div>
                    {/* Description & Insight */}
                    {/* Chart Description */}
                    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-l-4 border-gray-400">
                        <h4 className="font-bold text-sm text-gray-700 dark:text-gray-300 uppercase mb-1">Chart Description</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            <strong>Polar Area Chart:</strong> Compares visual "petals" for AM (Morning) and PM (Evening) Skin Temperature averages.
                        </p>
                    </div>
                    {/* Insight */}
                    <div className="mt-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                        <h4 className="font-bold text-sm text-blue-800 dark:text-blue-300 uppercase mb-1">Insight</h4>
                        <p className="text-sm text-blue-700 dark:text-blue-200">
                            <strong>Insight:</strong> If the PM petal is significantly larger, it indicates a strong circadian rhythm (temperature rising in the evening). Balanced petals might indicate a disrupted cycle.
                        </p>
                    </div>
                </div>
            </div>

            {/* 5. Subject Stability Heatmap */}
            <div className="bg-white dark:bg-card-bg-dark p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold mb-2 text-amber-900 dark:text-amber-400">Subject Stability Heatmap (Daily Pulse CV)</h3>
                <div style={{ height: `${heatmapHeight}px` }} className="w-full">
                    <Plot
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        data={[
                            {
                                x: heatmapX,
                                y: heatmapY,
                                z: heatmapZ,
                                type: 'heatmap',
                                colorscale: [
                                    [0, '#3b82f6'],     // Low CV = Blue (Stable)
                                    [0.5, '#ffffff'],
                                    [1, '#ef4444']      // High CV = Red (Unstable)
                                ],
                                showscale: true
                            }
                        ] as any}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        layout={{
                            autosize: true,
                            paper_bgcolor: 'transparent',
                            plot_bgcolor: 'transparent',
                            font: { color: textColor },
                            xaxis: { gridcolor: gridColor, title: 'Date' },
                            yaxis: {
                                gridcolor: gridColor,
                                title: 'Subject',
                                automargin: true,
                                dtick: 1 // Ensure every subject name is shown
                            },
                            margin: { l: 150 } // Extra margin for names
                        } as any}
                        useResizeHandler={true}
                        className="w-full h-full"
                    />
                </div>
                {/* Description & Insight */}
                {/* Chart Description */}
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-l-4 border-gray-400">
                    <h4 className="font-bold text-sm text-gray-700 dark:text-gray-300 uppercase mb-1">Chart Description</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        <strong>Stability Heatmap:</strong> A grid showing the Coefficient of Variation (CV) for Pulse Rate for each subject (Y-axis) per Date (X-axis).
                    </p>
                </div>
                {/* Insight */}
                <div className="mt-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                    <h4 className="font-bold text-sm text-blue-800 dark:text-blue-300 uppercase mb-1">Insight</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-200">
                        <strong>Insight:</strong> Red squares indicate high instability (high stress/noise) for that day. Blue squares indicate stable, calm readings. Vertical red stripes would suggest a "High-Stress Day" across the entire office.
                    </p>
                </div>
            </div>
        </div>
    );
};
