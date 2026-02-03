export const COLOR_MAP: Record<string, string> = {
    'VinCense': '#ec4899',       // Pink
    'Dr Trust': '#3b82f6',       // Blue
    'Dr Trust Oximeter': '#3b82f6',
    'Dr Trust Pulse Oximeter': '#3b82f6',
    'Dr Odin': '#eab308',        // Yellow - Using same color as replaced device
    'Dr Odin SmartWatch': '#eab308',
    'IMA': '#6b7280',            // Gray
    'WMA': '#9ca3af'             // Gray
};

export const getColor = (deviceName: string): string => {
    for (const key of Object.keys(COLOR_MAP)) {
        if (deviceName.toLowerCase().includes(key.toLowerCase())) {
            return COLOR_MAP[key];
        }
    }
    return '#6366f1'; // Default Indigo
};
