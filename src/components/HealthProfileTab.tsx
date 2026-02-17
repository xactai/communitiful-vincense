import React, { useMemo } from 'react';
import { Heart, Activity, Wind, Thermometer, User, CheckCircle, AlertCircle, AlertTriangle, X } from 'lucide-react';
import { IMA_RANGES } from '../utils/referenceRanges';
import type { DataDict } from '../types';

interface HealthProfileTabProps {
    data: DataDict;
    isDarkMode: boolean;
    subjectName: string;
}

// Helper to get AVERAGE reading from specific sheet and column
// processing whatever data is passed (already filtered)
const getAverageVital = (data: DataDict, sheetKey: string, columnKey: string): number | null => {
    let sum = 0;
    let count = 0;

    const sheet = data[sheetKey];
    if (!sheet) return null;

    sheet.forEach(row => {
        if (row[columnKey] != null) {
            const val = parseFloat(row[columnKey]);
            if (!isNaN(val)) {
                sum += val;
                count++;
            }
        }
    });

    return count > 0 ? sum / count : null;
};

// Refined Status Logic
type StatusLevel = 'Normal' | 'Warning' | 'Critical';
type OverallStatus = 'All Good' | 'Slight Variation' | 'Keep an Eye On' | 'Needs Prompt Review';

const getVitalStatus = (value: number, type: 'Pulse' | 'SpO2' | 'Resp' | 'Temp'): StatusLevel => {
    const ranges = IMA_RANGES[type];
    if (!ranges) return 'Normal';

    // SPECIAL CONDITION: Skin Temp 26-29 is Environmentally Normal
    if (type === 'Temp' && value >= 26 && value <= 29) return 'Normal';

    if (value >= ranges.min && value <= ranges.max) return 'Normal';

    // Critical Thresholds
    if (type === 'SpO2' && value < 90) return 'Critical';
    if (type === 'Resp' && (value < 10 || value > 25)) return 'Critical';

    // Warning otherwise
    return 'Warning';
};

const getOverallHealth = (vitals: { pulse: number | null, spo2: number | null, resp: number | null, temp: number | null }) => {
    const statuses = {
        pulse: vitals.pulse !== null ? getVitalStatus(vitals.pulse, 'Pulse') : 'Normal',
        spo2: vitals.spo2 !== null ? getVitalStatus(vitals.spo2, 'SpO2') : 'Normal',
        resp: vitals.resp !== null ? getVitalStatus(vitals.resp, 'Resp') : 'Normal',
        temp: vitals.temp !== null ? getVitalStatus(vitals.temp, 'Temp') : 'Normal',
    };

    let overall: OverallStatus = 'All Good';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const criticals = Object.values(statuses).filter((s: any) => s === 'Critical').length;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const warnings = Object.values(statuses).filter((s: any) => s === 'Warning').length;

    // Hierarchy of Severity
    if (criticals > 0) {
        overall = 'Needs Prompt Review';
    } else if (statuses.spo2 === 'Warning' || statuses.resp === 'Warning' || warnings >= 2) {
        // High impact vitals (SpO2/Resp) or multiple warnings
        overall = 'Keep an Eye On';
    } else if (warnings === 1) {
        overall = 'Slight Variation';
    }

    // Observation Text
    let observation = "Most vitals are within expected range, with minor fluctuations observed.";
    if (overall === 'Needs Prompt Review') observation = "Significant deviations detected in key vitals. Immediate attention suggested.";
    else if (overall === 'Keep an Eye On') observation = "Multiple vitals are outside optimal ranges. Efficient monitoring is recommended.";
    else if (overall === 'Slight Variation') observation = "A single vital is slightly varying. Observe for persistence.";

    return { statuses, overall, observation };
};

// Insight Generators
const getDynamicTips = (vitals: { pulse: number | null, spo2: number | null, resp: number | null, temp: number | null }) => {
    const tips: { text: string, color: string }[] = [];

    // Pulse Analysis
    if (vitals.pulse !== null) {
        if (vitals.pulse > 100) tips.push({ text: "Limit caffeine and practice relaxation to lower heart rate.", color: "blue" });
        else if (vitals.pulse > 85) tips.push({ text: "Consider light cardio to improve cardiovascular efficiency.", color: "blue" }); // High Normal
        else if (vitals.pulse < 60) tips.push({ text: "Ensure adequate hydration and monitor for dizziness.", color: "blue" });
        else tips.push({ text: "Maintain current cardiovascular activities.", color: "green" }); // Optimal
    }

    // SpO2 Analysis
    if (vitals.spo2 !== null) {
        if (vitals.spo2 < 95) tips.push({ text: "Practice deep breathing exercises to improve oxygenation.", color: "green" });
        else if (vitals.spo2 >= 95 && vitals.spo2 < 97) tips.push({ text: "Ensure good ventilation in your living space.", color: "green" }); // Low Normal
        else tips.push({ text: "Excellent oxygen saturation levels maintained.", color: "green" }); // Optimal
    }

    // Resp Analysis
    if (vitals.resp !== null) {
        if (vitals.resp > 20) tips.push({ text: "Focus on slow, rhythmic breathing to calm respiratory rate.", color: "green" });
        else if (vitals.resp > 18) tips.push({ text: "Practice mindfulness to regulate breathing pace.", color: "blue" }); // High Normal
        else tips.push({ text: "Respiratory rate is within a healthy range.", color: "green" });
    }

    // Temp Analysis
    if (vitals.temp !== null) {
        if (vitals.temp > 37.5) tips.push({ text: "Stay hydrated and rest in a cool environment.", color: "red" });
        else if (vitals.temp < 36.1) tips.push({ text: "Keep warm and monitor body temperature.", color: "blue" });
        else tips.push({ text: "Body temperature is well-regulated.", color: "green" });
    }

    // Fallback if somehow empty
    if (tips.length === 0) {
        tips.push({ text: "Maintain your current healthy lifestyle routine.", color: "green" });
        tips.push({ text: "Stay hydrated to support overall vitals stability.", color: "blue" });
    }

    // Shuffle and pick top 4 to ensure variety even for similar healthy subjects
    return tips.sort(() => 0.5 - Math.random()).slice(0, 4);
};

const getAvoidanceTips = (vitals: { pulse: number | null, spo2: number | null, resp: number | null, temp: number | null }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const avoid: { text: string, color: string, icon: any }[] = [];

    // Pulse
    if (vitals.pulse !== null) {
        if (vitals.pulse > 100) avoid.push({ text: "Avoid known stressors and stimulants.", color: "red", icon: X });
        else if (vitals.pulse > 90) avoid.push({ text: "Avoid intense workouts late at night.", color: "red", icon: X });
        else avoid.push({ text: "Avoid sedentary behavior for prolonged periods.", color: "red", icon: X });
    }

    // SpO2
    if (vitals.spo2 !== null) {
        if (vitals.spo2 < 95) avoid.push({ text: "Avoid poor ventilation or high-altitude environments.", color: "red", icon: X });
        else avoid.push({ text: "Avoid smoking or passive smoke exposure.", color: "red", icon: X });
    }

    // Temp
    if (vitals.temp !== null) {
        if (vitals.temp > 37.5) avoid.push({ text: "Avoid heavy physical exertion.", color: "red", icon: X });
        else avoid.push({ text: "Avoid extreme temperature changes.", color: "red", icon: X });
    }

    // Defaults
    if (avoid.length < 2) {
        avoid.push({ text: "Avoid irregular sleep patterns.", color: "red", icon: X });
        avoid.push({ text: "Avoid dehydration.", color: "red", icon: X });
    }

    // Shuffle and pick 3
    return avoid.sort(() => 0.5 - Math.random()).slice(0, 3);
};


export const HealthProfileTab: React.FC<HealthProfileTabProps> = ({ data, isDarkMode, subjectName }) => {
    const textColor = isDarkMode ? 'text-gray-100' : 'text-gray-900';

    // Extract Vitals based on Data Provided (Filtered)
    const vitals = useMemo(() => {
        return {
            pulse: getAverageVital(data, 'Pulse', 'Dr Trust Readings'),
            spo2: getAverageVital(data, 'SpO2', 'Dr Trust Readings'),
            resp: getAverageVital(data, 'Resp', 'Dr Trust Readings'),
            temp: getAverageVital(data, 'Temp', 'VinCense Readings'),
        };
    }, [data]);

    // Analyze Health
    const analysis = useMemo(() => {
        const { statuses, overall, observation } = getOverallHealth(vitals);

        // Generate dynamic content
        const tips = getDynamicTips(vitals);
        const avoid = getAvoidanceTips(vitals);

        return { stats: statuses, overall, observation, tips, avoid };
    }, [vitals]);

    // --- content helpers ---
    const StatusColors = {
        'All Good': 'text-green-600 bg-green-50 dark:bg-green-900/20 border-green-200',
        'Slight Variation': 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200',
        'Keep an Eye On': 'text-orange-600 bg-orange-50 dark:bg-orange-900/20 border-orange-200',
        'Needs Prompt Review': 'text-red-600 bg-red-50 dark:bg-red-900/20 border-red-200'
    };

    const overallColor = StatusColors[analysis.overall as keyof typeof StatusColors];

    return (
        <div className="space-y-6 pt-2">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className={`text-2xl font-bold ${textColor} flex items-center gap-2`}>
                        <User className="w-6 h-6 text-indigo-500" />
                        Health Profile Analysis for {subjectName || 'All Subjects'}
                    </h2>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Comprehensive health overview based on average vitals for {subjectName || 'the selected period'}.
                    </p>
                </div>
            </div>

            <div className={`p-6 rounded-3xl border-2 text-center relative overflow-hidden ${overallColor}`}>
                <div className="relative z-10">
                    <div className="text-sm uppercase font-bold tracking-widest opacity-80 mb-2">Overall Status</div>
                    <div className="text-3xl font-extrabold mb-2">{analysis.overall}</div>
                    <div className="opacity-90 text-sm">
                        {analysis.observation}
                    </div>
                </div>
                {/* Decorative BG Ring */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-[20px] border-current opacity-5 rounded-full blur-xl pointer-events-none"></div>
            </div>

            {/* Vitals Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <VitalCard
                    label="Avg Pulse"
                    value={vitals.pulse !== null ? vitals.pulse.toFixed(0) : '--'}
                    unit="bpm"
                    icon={Heart}
                    color="rose"
                    status={analysis.stats.pulse}
                    range="60-100"
                />
                <VitalCard
                    label="Avg SpO2"
                    value={vitals.spo2 !== null ? vitals.spo2.toFixed(1) : '--'}
                    unit="%"
                    icon={Activity}
                    color="cyan"
                    status={analysis.stats.spo2}
                    range="95-100"
                />
                <VitalCard
                    label="Avg Resp."
                    value={vitals.resp !== null ? vitals.resp.toFixed(0) : '--'}
                    unit="brpm"
                    icon={Wind}
                    color="emerald"
                    status={analysis.stats.resp}
                    range="12-20"
                />
                <VitalCard
                    label="Avg Temp"
                    value={vitals.temp !== null ? vitals.temp.toFixed(1) : '--'}
                    unit="°C"
                    icon={Thermometer}
                    color="amber"
                    status={analysis.stats.temp}
                    range="36.1-37.5"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Lifestyle Guidance */}
                <div className={`p-6 rounded-2xl ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} shadow-sm border`}>
                    <h3 className={`font-bold ${textColor} mb-4 flex items-center gap-2`}>
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        Health Tips
                    </h3>
                    <ul className="space-y-3">
                        {analysis.tips.map((tip, i) => (
                            <TipItem key={i} text={tip.text} color={tip.color} />
                        ))}
                    </ul>
                </div>

                {/* Avoidance Tips */}
                <div className={`p-6 rounded-2xl ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} shadow-sm border`}>
                    <h3 className={`font-bold ${textColor} mb-4 flex items-center gap-2`}>
                        <X className="w-5 h-5 text-red-500" />
                        Things to Avoid
                    </h3>
                    <ul className="space-y-3">
                        {analysis.avoid.map((item, i) => (
                            <TipItem key={i} text={item.text} color={item.color} icon={item.icon} />
                        ))}
                    </ul>
                </div>
            </div>

            {/* Disclaimer */}
            <div className="text-xs text-gray-400 text-center border-t dark:border-gray-800 pt-4">
                This health profile is intended for observational and research purposes only and does not replace medical advice.
            </div>
        </div>
    );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const VitalCard = ({ label, value, unit, icon: Icon, color, status, range }: any) => {
    // Dynamic color mapping
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const colors: any = {
        rose: 'text-rose-500 bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-900/30',
        cyan: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-900/20 border-cyan-100 dark:border-cyan-900/30',
        emerald: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/30',
        amber: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/30',
    };

    // Status Indicator
    let statusIcon = null;
    if (status === 'Warning') statusIcon = <AlertCircle className="w-3 h-3 text-orange-500" />;
    if (status === 'Critical') statusIcon = <AlertTriangle className="w-3 h-3 text-red-500" />;

    return (
        <div className={`p-4 rounded-2xl border ${colors[color]} relative overflow-hidden transition-all hover:scale-[1.02]`}>
            <div className="flex justify-between items-start mb-2">
                <Icon className={`w-5 h-5 opacity-80`} />
                {statusIcon}
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                {value} <span className="text-xs font-normal opacity-60">{unit}</span>
            </div>
            <div className="text-[10px] font-medium opacity-60 uppercase tracking-wider">{label}</div>
            <div className="text-[10px] mt-2 opacity-50">Range: {range}</div>
        </div>
    );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TipItem = ({ text, color, icon: Icon = CheckCircle }: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const colors: any = {
        blue: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
        green: 'text-green-600 bg-green-50 dark:bg-green-900/20',
        red: 'text-rose-600 bg-rose-50 dark:bg-rose-900/20',
    };

    return (
        <li className={`flex items-start gap-3 p-3 rounded-xl ${colors[color]} text-sm font-medium`}>
            <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
            {text}
        </li>
    );
};
