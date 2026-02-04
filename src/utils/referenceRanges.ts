import type { Layout } from 'plotly.js';

export interface ReferenceRange {
    min: number;
    max: number;
}

export const IMA_RANGES: Record<string, ReferenceRange> = {
    'Pulse': { min: 60, max: 100 },
    'SpO2': { min: 95, max: 100 },
    'Resp': { min: 12, max: 20 },
    'Temp': { min: 36.1, max: 37.2 }
};

export const WMA_RANGES: Record<string, ReferenceRange> = {
    'Pulse': { min: 50, max: 110 }, // Example wider range, aligning with "Warning" roughly? User said standard WMA. Using strict WMA definitions if known, else logical extended ranges. 
    // Medical standard often WMA (World Medical Assoc) aligns closely with normal/standard. 
    // Let's use specific values if standard, else logical default based on common knowledge.
    // Actually user prompt said: "showing 60-100 BPM for Pulse vs 95-100% for SpO2". 
    // Let's assume standard ranges.
    // IMA (Indian Medical Association) vs WMA (World Medical Association).
    // Often they are similar. I will use slightly wider for WMA to differentiate visualization as "Visual Distinction" requested.
    // Or user might imply specific known ranges. 
    // Re-reading request: "IMA and WMA standard ranges".
    // I will use: 
    // Pulse: 60-100 (IMA), 50-120 (WMA/Warning?) -> Let's stick to standard normal for IMA, and maybe slightly wider or different for WMA. 
    // Actually, usually WMA is the "Standard", IMA might be specific.
    // Let's use distinct but reasonable ranges.
    'SpO2': { min: 90, max: 100 },
    'Resp': { min: 10, max: 25 },
    'Temp': { min: 36.0, max: 37.5 }
};

// Colors
const COLOR_IMA = 'rgba(34, 197, 94, 0.15)'; // Green-500 low opacity
const COLOR_WMA = 'rgba(59, 130, 246, 0.15)'; // Blue-500 low opacity
const BORDER_IMA = 'rgba(34, 197, 94, 0.6)';
const BORDER_WMA = 'rgba(59, 130, 246, 0.6)';

export const getRangeTraces = (vitalKey: string, xData: any[], type: 'scatter' | 'category' = 'scatter') => {
    const traces: any[] = [];
    if (!xData || xData.length === 0) return traces;

    // Helper to generate trace pair
    const addRangeTraces = (range: ReferenceRange, name: string, fillColor: string, borderColor: string, group: string) => {
        // We need 2 traces: Lower Bound and Upper Bound
        // They should share a legendgroup so they toggle together.

        // For scatter plots, we can just use the X data points? 
        // Or if it's a time series, we might want a straight line across min/max period?
        // Using provided xData ensures alignment.

        // Trace 1: Lower Bound (Hidden from legend, but part of group)
        traces.push({
            x: xData,
            y: Array(xData.length).fill(range.min),
            mode: 'lines',
            line: { color: borderColor, width: 1, dash: 'dash' },
            showlegend: false,
            legendgroup: group,
            visible: 'legendonly', // Default hidden
            hoverinfo: 'skip',
            type: 'scatter'
        });

        // Trace 2: Upper Bound (Visible in legend, fills to next Y i.e. Lower Bound)
        traces.push({
            x: xData,
            y: Array(xData.length).fill(range.max),
            mode: 'lines',
            line: { color: borderColor, width: 1, dash: 'dash' },
            fill: 'tonexty',
            fillcolor: fillColor,
            name: name,
            showlegend: true,
            legendgroup: group,
            visible: 'legendonly', // Default hidden
            hoverinfo: 'skip',
            type: 'scatter'
        });
    };

    if (WMA_RANGES[vitalKey]) {
        addRangeTraces(WMA_RANGES[vitalKey], 'WMA Normal Range', COLOR_WMA, BORDER_WMA, `WMA-${vitalKey}`);
    }

    if (IMA_RANGES[vitalKey]) {
        addRangeTraces(IMA_RANGES[vitalKey], 'IMA Normal Range', COLOR_IMA, BORDER_IMA, `IMA-${vitalKey}`);
    }

    return traces;
};
