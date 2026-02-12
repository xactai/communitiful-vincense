import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Activity, Wind, Thermometer, User, ChevronDown, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';
import { IMA_RANGES } from '../utils/referenceRanges';
import type { DataDict } from '../types';

interface HealthProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: DataDict;
    initialSubject: string;
    allSubjects: string[];
}

// Helper to get AVERAGE reading from specific sheet and column
const getAverageVital = (data: DataDict, subject: string, sheetKey: string, columnKey: string): number | null => {
    let sum = 0;
    let count = 0;

    const sheet = data[sheetKey];
    if (!sheet) return null;

    sheet.forEach(row => {
        if (row['Subject Name'] === subject) {
            if (row[columnKey] != null) {
                const val = parseFloat(row[columnKey]);
                if (!isNaN(val)) {
                    sum += val;
                    count++;
                }
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

    // Pulse
    if (vitals.pulse) {
        if (vitals.pulse > 100) tips.push({ text: "Limit caffeine and practice relaxation to lower heart rate.", color: "blue" });
        if (vitals.pulse < 60) tips.push({ text: "Ensure adequate hydration and monitor for dizziness.", color: "blue" });
    }

    // SpO2
    if (vitals.spo2 && vitals.spo2 < 95) {
        tips.push({ text: "Practice deep breathing exercises to improve oxygenation.", color: "green" });
    }

    // Resp
    if (vitals.resp && vitals.resp > 20) {
        tips.push({ text: "Focus on slow, rhythmic breathing to calm respiratory rate.", color: "green" });
    }

    // Temp
    if (vitals.temp && vitals.temp > 37.5) {
        tips.push({ text: "Stay hydrated and rest in a cool environment.", color: "red" });
    }

    // Defaults if healthy
    if (tips.length === 0) {
        tips.push({ text: "Maintain your current healthy lifestyle routine.", color: "green" });
        tips.push({ text: "Stay hydrated to support overall vitals stability.", color: "blue" });
    }

    return tips.slice(0, 3); // Limit to top 3
};

const getAvoidanceTips = (vitals: { pulse: number | null, spo2: number | null, resp: number | null, temp: number | null }) => {
    const avoid: { text: string, color: string, icon: any }[] = [];

    if (vitals.pulse && vitals.pulse > 100) avoid.push({ text: "Avoid known stressors and stimulants.", color: "red", icon: X });
    if (vitals.spo2 && vitals.spo2 < 95) avoid.push({ text: "Avoid poor ventilation or high-altitude environments.", color: "red", icon: X });
    if (vitals.temp && vitals.temp > 37.5) avoid.push({ text: "Avoid heavy physical exertion.", color: "red", icon: X });

    // Defaults
    if (avoid.length === 0) {
        avoid.push({ text: "Avoid irregular sleep patterns.", color: "red", icon: X });
        avoid.push({ text: "Avoid prolonged inactivity.", color: "red", icon: X });
    }

    return avoid.slice(0, 3);
};


export const HealthProfileModal: React.FC<HealthProfileModalProps> = ({ isOpen, onClose, data, initialSubject, allSubjects }) => {
    // If initialSubject is "All Subjects" (or invalid), default to the first available subject
    const getEffectiveSubject = (subj: string) => {
        if (subj === 'All Subjects' && allSubjects.length > 0) return allSubjects[0];
        return subj;
    };

    const [selectedSubject, setSelectedSubject] = useState(getEffectiveSubject(initialSubject));

    useEffect(() => {
        if (isOpen) setSelectedSubject(getEffectiveSubject(initialSubject));
    }, [isOpen, initialSubject, allSubjects]);


    // Extract Vitals based on User Request - AVERAGES
    const vitals = useMemo(() => {
        return {
            pulse: getAverageVital(data, selectedSubject, 'Pulse', 'Dr Trust Readings'),
            spo2: getAverageVital(data, selectedSubject, 'SpO2', 'Dr Trust Readings'),
            resp: getAverageVital(data, selectedSubject, 'Resp', 'Dr Trust Readings'),
            temp: getAverageVital(data, selectedSubject, 'Temp', 'VinCense Readings'),
        };
    }, [data, selectedSubject]);

    // Analyze Health
    const analysis = useMemo(() => {
        const { statuses, overall, observation } = getOverallHealth(vitals);

        // Generate dynamic content
        const tips = getDynamicTips(vitals);
        const avoid = getAvoidanceTips(vitals);

        return { stats: statuses, overall, observation, tips, avoid };
    }, [vitals]);

    if (!isOpen) return null;

    // --- content helpers ---
    const StatusColors = {
        'All Good': 'text-green-600 bg-green-50 dark:bg-green-900/20 border-green-200',
        'Slight Variation': 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200',
        'Keep an Eye On': 'text-orange-600 bg-orange-50 dark:bg-orange-900/20 border-orange-200',
        'Needs Prompt Review': 'text-red-600 bg-red-50 dark:bg-red-900/20 border-red-200'
    };

    const overallColor = StatusColors[analysis.overall as keyof typeof StatusColors];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-end"
                    >
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            onClick={e => e.stopPropagation()}
                            className="w-full max-w-md h-full bg-white dark:bg-gray-900 shadow-2xl p-6 overflow-y-auto"
                        >
                            {/* Header */}
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                    <User className="w-6 h-6 text-indigo-500" />
                                    Health Profile
                                </h2>
                                <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                                    <X className="w-6 h-6 text-gray-500" />
                                </button>
                            </div>

                            {/* Subject Selector */}
                            <div className="mb-8 relative">
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Subject</label>
                                <div className="relative">
                                    <select
                                        value={selectedSubject}
                                        onChange={(e) => setSelectedSubject(e.target.value)}
                                        className="w-full appearance-none bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 py-3 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                                    >
                                        {allSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                </div>
                            </div>

                            {/* Hero: Overall Status */}
                            <div className={`mb-8 p-6 rounded-3xl border-2 text-center relative overflow-hidden ${overallColor}`}>
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
                            <div className="grid grid-cols-2 gap-4 mb-8">
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

                            {/* Lifestyle Guidance */}
                            <div className="mb-6">
                                <h3 className="font-bold text-gray-900 dark:text-white mb-4">Health Tips Based on Averages</h3>
                                <ul className="space-y-3">
                                    {analysis.tips.map((tip, i) => (
                                        <TipItem key={i} text={tip.text} color={tip.color} />
                                    ))}
                                </ul>
                            </div>

                            {/* Aviodance Tips */}
                            <div className="mb-10">
                                <h3 className="font-bold text-gray-900 dark:text-white mb-4">Things to Avoid</h3>
                                <ul className="space-y-3">
                                    {analysis.avoid.map((item, i) => (
                                        <TipItem key={i} text={item.text} color={item.color} icon={item.icon} />
                                    ))}
                                </ul>
                            </div>

                            {/* Disclaimer */}
                            <div className="text-xs text-gray-400 text-center border-t dark:border-gray-800 pt-4">
                                This health profile is intended for observational and research purposes only and does not replace medical advice.
                            </div>

                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

const VitalCard = ({ label, value, unit, icon: Icon, color, status, range }: any) => {
    // Dynamic color mapping
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

const TipItem = ({ text, color, icon: Icon = CheckCircle }: any) => {
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
