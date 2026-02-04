import React, { useMemo, useState } from 'react';
import type { DataDict } from '../types';
import Plot from 'react-plotly.js';
import { format } from 'date-fns';
import { getRangeTraces } from '../utils/referenceRanges';

interface Props {
    data: DataDict;
    isDarkMode: boolean;
}

export const GenderAnalyticsTab: React.FC<Props> = ({ data, isDarkMode }) => {
    // 1. Vital Config
    const vitals = [
        { key: 'Pulse', label: 'Pulse Rate', unit: 'bpm', normalMin: 60, normalMax: 100, warningLow: 50, warningHigh: 110 },
        { key: 'SpO2', label: 'SpO2', unit: '%', normalMin: 95, normalMax: 100, warningLow: 90, warningHigh: 94 },
        { key: 'Resp', label: 'Respiratory Rate', unit: 'bpm', normalMin: 12, normalMax: 20, warningLow: 10, warningHigh: 25 },
        { key: 'Temp', label: 'Skin Temperature', unit: '°C', normalMin: 36, normalMax: 37.5, warningLow: 35, warningHigh: 38 }
    ];

    // Helper: Calculate Stats
    const calculateStats = (values: number[]) => {
        if (values.length === 0) return { mean: 0, median: 0, sd: 0, min: 0, max: 0, count: 0, cv: 0 };
        const sum = values.reduce((a, b) => a + b, 0);
        const mean = sum / values.length;
        const sorted = [...values].sort((a, b) => a - b);
        const median = sorted[Math.floor(sorted.length / 2)];
        const sqDiffs = values.map(v => Math.pow(v - mean, 2));
        const avgSqDiff = sqDiffs.reduce((a, b) => a + b, 0) / values.length;
        const sd = Math.sqrt(avgSqDiff);
        const cv = mean === 0 ? 0 : (sd / mean);
        return { mean, median, sd, min: sorted[0], max: sorted[sorted.length - 1], count: values.length, cv };
    };

    // 2. Process Data
    const processedData = useMemo(() => {
        const genders = new Set<string>();
        const allDates = new Set<string>();

        // Structure: { [Vital]: { [Gender]: { all: [], am: [], pm: [], dailyCV: { [date]: vals[] }, zones: { normal, warning, alert } } } }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result: Record<string, Record<string, any>> = {};

        vitals.forEach(v => {
            result[v.key] = {};
            const sheet = data[v.key];
            if (!sheet) return;

            sheet.forEach(row => {
                const g = row['Gender'] || 'Unknown';
                if (g === 'Unknown') return;
                genders.add(g);

                if (!result[v.key][g]) {
                    result[v.key][g] = {
                        all: [] as number[],
                        am: [] as number[],
                        pm: [] as number[],
                        daily: {} as Record<string, number[]>,
                        zones: { normal: 0, warning: 0, alert: 0 }
                    };
                }

                // Use VinCense readings primarily for analytics to be consistent
                const val = Number(row['VinCense Readings']);
                if (isNaN(val)) return; // Skip if no reading

                // 1. All Data (for Boxplot)
                result[v.key][g].all.push(val);

                // 2. AM vs PM (based on Time)
                // Assuming 'Timestamp' or 'Time' field exists. 
                // dataLoader parses 'Time' into a Date object or string.
                // Let's rely on 'Timestamp' ISO string if available or 'Time'
                let hour = -1;
                if (row['Timestamp']) {
                    hour = new Date(row['Timestamp']).getHours();
                } else if (row['Time'] instanceof Date) {
                    hour = row['Time'].getHours();
                }

                if (hour !== -1) {
                    if (hour < 12) result[v.key][g].am.push(val);
                    else result[v.key][g].pm.push(val);
                }

                // 3. Daily Data (for Stability)
                let dateStr = 'Unknown';
                if (row['Date'] instanceof Date) {
                    dateStr = format(row['Date'], 'yyyy-MM-dd');
                }

                if (dateStr !== 'Unknown') {
                    allDates.add(dateStr);
                    if (!result[v.key][g].daily[dateStr]) result[v.key][g].daily[dateStr] = [];
                    result[v.key][g].daily[dateStr].push(val);
                }

                // 4. Zones
                let zone = 'alert';
                if (val >= v.normalMin && val <= v.normalMax) {
                    zone = 'normal';
                } else if ((val >= v.warningLow && val < v.normalMin) || (val > v.normalMax && val <= v.warningHigh)) {
                    zone = 'warning';
                } else {
                    zone = 'alert';
                }
                result[v.key][g].zones[zone]++;
            });
        });

        return { data: result, genders: Array.from(genders).sort(), allDates: Array.from(allDates).sort() };
    }, [data, vitals]); // vitals is const but inside component, careful. It's static basically.

    const { data: genderData, genders } = processedData;
    // 4. State for UI
    const [activeVital, setActiveVital] = useState<string>('Pulse');
    const [zoneFilter, setZoneFilter] = useState<string>('All');

    const textColor = isDarkMode ? '#e5e7eb' : '#374151';
    const gridColor = isDarkMode ? '#374151' : '#e5e7eb';

    if (genders.length === 0) {
        return <div className="p-8 text-center text-gray-500">No gender data available for the selected filters.</div>;
    }

    // Get current vital config and data
    const currentVital = vitals.find(v => v.key === activeVital) || vitals[0];
    const currentData = genderData[activeVital];

    // Note: We use 'genders' (all) for comparison charts, and 'zoneFilter' for the Zone Analysis.

    return (
        <div className="space-y-6 p-4">
            {/* Header: Sub-Tabs Only */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-card-bg-dark p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                <span className="text-xl font-bold text-gray-800 dark:text-gray-200">Gender Analytics</span>

                {/* Vital Sub-Tabs */}
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

            {/* Content Area (Lazy interaction by virtue of React state) */}
            <div className="bg-white dark:bg-card-bg-dark p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold mb-6 text-blue-900 dark:text-blue-400 flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-4">
                    {currentVital.label} Analytics <span className="text-sm font-normal text-gray-500">({currentVital.unit})</span>
                </h3>

                <div className="space-y-12">

                    {/* 1. Gendered Distribution (Boxplot) - SHOW ALL GENDERS */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        <div className="xl:col-span-2 h-[450px] bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                            <h4 className="text-sm font-bold text-gray-500 mb-4 uppercase text-center">Gendered Distribution (Normal Range)</h4>
                            <Plot
                                data={[
                                    ...getRangeTraces(currentVital.key, genders),
                                    ...genders.map(g => ({
                                        y: currentData?.[g]?.all || [],
                                        type: 'box',
                                        name: g,
                                        boxpoints: 'outliers',
                                        jitter: 0.3,
                                        pointpos: -1.8,
                                        marker: { color: g === 'Male' ? '#3b82f6' : '#ec4899' }
                                    }))
                                ] as any}
                                layout={{
                                    autosize: true,
                                    paper_bgcolor: 'transparent',
                                    plot_bgcolor: 'transparent',
                                    font: { color: textColor },
                                    xaxis: { gridcolor: gridColor, showgrid: false },
                                    yaxis: { gridcolor: gridColor, title: currentVital.unit },
                                    showlegend: true,
                                    legend: { orientation: 'h', y: 1.05 },
                                    margin: { l: 50, r: 20, t: 30, b: 30 }
                                } as any}
                                useResizeHandler={true}
                                className="w-full h-full"
                            />
                        </div>
                        <div className="xl:col-span-1 space-y-4 flex flex-col justify-center">
                            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-l-4 border-gray-400">
                                <h4 className="font-bold text-sm text-gray-700 dark:text-gray-300 uppercase mb-1">Chart Description</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Compares the distribution of {currentVital.label} levels across all genders.
                                </p>
                            </div>
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                                <h4 className="font-bold text-sm text-blue-800 dark:text-blue-300 uppercase mb-1">Insight</h4>
                                <p className="text-sm text-blue-700 dark:text-blue-200">
                                    <strong>Insight:</strong> Observe if the median line or box height differs significantly between genders, indicating physiological variances.
                                </p>
                            </div>
                        </div>
                    </div>

                    <hr className="border-gray-100 dark:border-gray-800" />

                    {/* 2. AM vs PM Shift - SHOW ALL GENDERS */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        <div className="xl:col-span-2 h-[450px] bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                            <h4 className="text-sm font-bold text-gray-500 mb-4 uppercase text-center">AM vs PM Shift (Diurnal Delta)</h4>
                            <Plot
                                data={[
                                    ...getRangeTraces(currentVital.key, ['AM', 'PM']),
                                    ...genders.map(g => {
                                        const amVals = currentData?.[g]?.am || [];
                                        const pmVals = currentData?.[g]?.pm || [];
                                        const amMean = calculateStats(amVals).mean;
                                        const pmMean = calculateStats(pmVals).mean;

                                        return {
                                            x: ['AM', 'PM'],
                                            y: [amMean, pmMean],
                                            type: 'scatter',
                                            mode: 'lines+markers',
                                            name: g,
                                            line: { width: 3, color: g === 'Male' ? '#3b82f6' : '#ec4899' },
                                            marker: { size: 10 }
                                        };
                                    })
                                ] as any}
                                layout={{
                                    autosize: true,
                                    paper_bgcolor: 'transparent',
                                    plot_bgcolor: 'transparent',
                                    font: { color: textColor },
                                    xaxis: { gridcolor: gridColor, showgrid: false },
                                    yaxis: { gridcolor: gridColor, title: `Mean ${currentVital.unit}` },
                                    showlegend: true,
                                    legend: { orientation: 'h', y: 1.05 },
                                    margin: { l: 50, r: 20, t: 30, b: 30 }
                                } as any}
                                useResizeHandler={true}
                                className="w-full h-full"
                            />
                        </div>
                        <div className="xl:col-span-1 space-y-4 flex flex-col justify-center">
                            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-l-4 border-gray-400">
                                <h4 className="font-bold text-sm text-gray-700 dark:text-gray-300 uppercase mb-1">Chart Description</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Visualizes the average change in current vital signs from Morning (AM) to Evening (PM).
                                </p>
                            </div>
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                                <h4 className="font-bold text-sm text-blue-800 dark:text-blue-300 uppercase mb-1">Insight</h4>
                                <p className="text-sm text-blue-700 dark:text-blue-200">
                                    <strong>Insight:</strong> Steep text slopes indicate strong diurnal rhythms. Flattened lines suggest consistent readings throughout the day.
                                </p>
                            </div>
                        </div>
                    </div>

                    <hr className="border-gray-100 dark:border-gray-800" />

                    {/* 3. Stability Index - SHOW ALL GENDERS */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        <div className="xl:col-span-2 h-[450px] bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                            <h4 className="text-sm font-bold text-gray-500 mb-4 uppercase text-center">Stability Index (CV Over Time)</h4>
                            <Plot
                                data={[
                                    // Stability is CV (ratio), so we don't usually overlay absolute ranges (beats/min) on it.
                                    // The IMA/WMA ranges (e.g. 60-100 bpm) are not relevant for CV axis (usually 0.0 - 0.2 etc).
                                    // SKIP ranges for Stability Index.
                                    ...genders.map(g => {
                                        const daily = currentData?.[g]?.daily || {};
                                        const sortedDates = Object.keys(daily).sort();
                                        const yVals = sortedDates.map(d => calculateStats(daily[d]).cv);

                                        return {
                                            x: sortedDates,
                                            y: yVals,
                                            type: 'scatter',
                                            mode: 'lines',
                                            name: g,
                                            line: { shape: 'spline', width: 2, color: g === 'Male' ? '#3b82f6' : '#ec4899' }
                                        };
                                    })
                                ] as any}
                                layout={{
                                    autosize: true,
                                    paper_bgcolor: 'transparent',
                                    plot_bgcolor: 'transparent',
                                    font: { color: textColor },
                                    xaxis: { gridcolor: gridColor, showgrid: false },
                                    yaxis: { gridcolor: gridColor, title: 'CV (SD / Mean)', tickformat: '.2f' },
                                    showlegend: true,
                                    legend: { orientation: 'h', y: 1.05 },
                                    margin: { l: 50, r: 20, t: 30, b: 30 }
                                } as any}
                                useResizeHandler={true}
                                className="w-full h-full"
                            />
                        </div>
                        <div className="xl:col-span-1 space-y-4 flex flex-col justify-center">
                            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-l-4 border-gray-400">
                                <h4 className="font-bold text-sm text-gray-700 dark:text-gray-300 uppercase mb-1">Chart Description</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Tracks the Coefficient of Variation (CV) each day. Higher values mean more fluctuating/unstable readings.
                                </p>
                            </div>
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                                <h4 className="font-bold text-sm text-blue-800 dark:text-blue-300 uppercase mb-1">Insight</h4>
                                <p className="text-sm text-blue-700 dark:text-blue-200">
                                    <strong>Insight:</strong> Spikes indicate days of instability. A downward trend suggests improving consistency in the patient's condition.
                                </p>
                            </div>
                        </div>
                    </div>

                    <hr className="border-gray-100 dark:border-gray-800" />

                    {/* 4. Zone Analysis Donut - WITH LOCAL TOGGLE */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        <div className="xl:col-span-2 h-[450px] bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 flex flex-col">
                            <h4 className="text-sm font-bold text-gray-500 mb-4 uppercase text-center">Zone Analysis (Normal, Warning, Alert)</h4>

                            {/* Local Toggle */}
                            <div className="flex justify-center mb-4">
                                <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-1">
                                    {['All', 'Female', 'Male'].map((g) => (
                                        <button
                                            key={g}
                                            onClick={() => setZoneFilter(g)}
                                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${zoneFilter === g
                                                ? 'bg-indigo-500 text-white shadow-sm'
                                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                                }`}
                                        >
                                            {g}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Chart Logic Block */}
                            {(() => {
                                let normal = 0, warning = 0, alert = 0;
                                // Filter logic based on local toggle
                                const gendersToSum = zoneFilter === 'All' ? genders : genders.filter(g => g === zoneFilter);

                                gendersToSum.forEach(g => {
                                    normal += currentData?.[g]?.zones?.normal || 0;
                                    warning += currentData?.[g]?.zones?.warning || 0;
                                    alert += currentData?.[g]?.zones?.alert || 0;
                                });

                                const total = normal + warning + alert;

                                return (
                                    <Plot
                                        data={[{
                                            labels: ['Normal', 'Warning', 'Alert'],
                                            values: [normal, warning, alert],
                                            type: 'pie',
                                            hole: 0.6,
                                            marker: {
                                                colors: ['#10b981', '#f59e0b', '#ef4444']
                                            },
                                            textinfo: 'label+percent',
                                            textposition: 'outside',
                                            hoverinfo: 'label+value+percent'
                                        }]}
                                        layout={{
                                            autosize: true,
                                            paper_bgcolor: 'transparent',
                                            plot_bgcolor: 'transparent',
                                            font: { color: textColor },
                                            showlegend: true,
                                            legend: { orientation: 'h', y: -0.1 },
                                            annotations: [
                                                {
                                                    font: { size: 20, weight: 'bold', color: textColor },
                                                    showarrow: false,
                                                    text: `${total}<br><span style="font-size:12px; font-weight:normal;">Readings</span>`,
                                                    x: 0.5,
                                                    y: 0.5
                                                }
                                            ],
                                            margin: { t: 20, b: 20, l: 20, r: 20 }
                                        } as any}
                                        useResizeHandler={true}
                                        className="w-full flex-1"
                                    />
                                );
                            })()}
                        </div>
                        <div className="xl:col-span-1 space-y-4 flex flex-col justify-center">
                            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-l-4 border-gray-400">
                                <h4 className="font-bold text-sm text-gray-700 dark:text-gray-300 uppercase mb-1">Chart Description</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Categorizes readings into clinical zones. Use the toggle to filter by gender.
                                </p>
                            </div>
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                                <h4 className="font-bold text-sm text-blue-800 dark:text-blue-300 uppercase mb-1">Insight</h4>
                                <p className="text-sm text-blue-700 dark:text-blue-200">
                                    <strong>Insight:</strong> Dominance of Green segments confirms health. Red segments require attention.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
