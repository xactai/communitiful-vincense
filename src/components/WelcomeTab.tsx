import React from 'react';
import logo from '../assets/VinCense Logo.png';
import { motion } from 'framer-motion';
import { Activity, Heart, Wind, Thermometer, ShieldCheck, BarChart2, MousePointer } from 'lucide-react';

interface WelcomeTabProps {
    onStart: () => void;
    isDarkMode: boolean;
}

export const WelcomeTab: React.FC<WelcomeTabProps> = ({ onStart, isDarkMode }) => {
    const textColor = isDarkMode ? 'text-gray-200' : 'text-gray-800';
    const subTextColor = isDarkMode ? 'text-gray-400' : 'text-gray-600';
    const cardBg = isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100';

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <div className="min-h-screen w-full bg-bg-light dark:bg-bg-dark text-text-light dark:text-text-dark overflow-auto transition-colors duration-300">
            <div className="absolute top-4 right-4">
                {/* Optional: Theme Toggle could be here or just inherit/hidden. User said 'Clean'. Let's keep it simple or minimal. */}
            </div>

            <motion.div
                className="max-w-5xl mx-auto py-12 px-4 space-y-12"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* 1. Identity & Overview */}
                <motion.div className="text-center space-y-6" variants={itemVariants}>
                    <div className="inline-block mb-4">
                        <img src={logo} alt="VinCense Logo" className="h-32 w-auto mx-auto" />
                    </div>
                    <h1 className={`text-4xl md:text-5xl font-extrabold ${textColor} tracking-tight`}>
                        VinCense <span className="text-indigo-600 dark:text-indigo-400">Vitals Dashboard</span>
                    </h1>
                    <p className={`text-xl md:text-2xl ${subTextColor} max-w-3xl mx-auto leading-relaxed`}>
                        Advanced medical vitals analysis and cross-device validation platform.
                    </p>
                    <p className={`${subTextColor} max-w-2xl mx-auto`}>
                        This dashboard provides a comprehensive analysis of physiological data spread across multiple demographics and conditions.
                        It strictly utilizes recorded Excel data to validate the accuracy and consistency of VinCense against medical-grade reference devices.
                    </p>
                </motion.div>

                {/* 3. Vitals Snapshot */}
                <motion.div variants={itemVariants}>
                    <h3 className={`text-lg font-bold uppercase tracking-wider ${subTextColor} mb-6 text-center`}>Core Vitals Analyzed</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { icon: Heart, label: 'Pulse Rate', desc: 'Heart beats per minute (BPM)', color: 'text-rose-500' },
                            { icon: Activity, label: 'SpO₂', desc: 'Blood oxygen saturation (%)', color: 'text-cyan-500' },
                            { icon: Wind, label: 'Respiratory Rate', desc: 'Breaths per minute', color: 'text-emerald-500' },
                            { icon: Thermometer, label: 'Skin Temperature', desc: 'Surface body comparison (°C)', color: 'text-amber-500' }
                        ].map((vital, i) => (
                            <div key={i} className={`${cardBg} border p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow text-center flex flex-col items-center group`}>
                                <div className={`p-3 rounded-full bg-gray-50 dark:bg-gray-700 mb-4 group-hover:scale-110 transition-transform`}>
                                    <vital.icon className={`w-8 h-8 ${vital.color}`} />
                                </div>
                                <h4 className={`text-lg font-bold ${textColor} mb-2`}>{vital.label}</h4>
                                <p className={`text-sm ${subTextColor}`}>{vital.desc}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* 4. Device Comparison Context */}
                    <motion.div variants={itemVariants} className={`${cardBg} border p-8 rounded-2xl shadow-sm`}>
                        <div className="flex items-start gap-4 mb-4">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <BarChart2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <h3 className={`text-xl font-bold ${textColor} mb-2`}>Device Comparison Logic</h3>
                                <p className={`${subTextColor} leading-relaxed`}>
                                    The core function of this platform is to benchmark the <strong>VinCense</strong> wearable against established market references.
                                    We analyze agreement, identifying deviations, bias, and stability across various subjects and activities to ensure data integrity.
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* 6. Medical Credibility */}
                    <motion.div variants={itemVariants} className={`${cardBg} border p-8 rounded-2xl shadow-sm`}>
                        <div className="flex items-start gap-4 mb-4">
                            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                <ShieldCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <h3 className={`text-xl font-bold ${textColor} mb-2`}>Data Integrity Assurance</h3>
                                <p className={`${subTextColor} leading-relaxed`}>
                                    Analytics are generated <strong>strictly</strong> from the provided dataset. We use medically accepted baseline ranges for abnormality detection.
                                    <br /><span className="italic text-xs mt-2 block opacity-80">Note: No synthetic data generation or interpolation is performed.</span>
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* 5. How to Use */}
                <motion.div variants={itemVariants} className={`${cardBg} border p-8 rounded-2xl shadow-sm bg-gradient-to-br from-indigo-50 to-white dark:from-gray-800 dark:to-gray-900`}>
                    <h3 className={`text-lg font-bold uppercase tracking-wider ${subTextColor} mb-6 text-center`}>How to Navigate</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { step: '1', title: 'Select Context', text: 'Use the sidebar to filter by Subject, Date, or specific Date Ranges.' },
                            { step: '2', title: 'Explore Tabs', text: 'Navigate vertically through Demographics (Gender, Age) and Conditions (Circumstance).' },
                            { step: '3', title: 'Analyze Trends', text: 'Dive into deep comparisons and error analytics to validate device performance.' }
                        ].map((step, i) => (
                            <div key={i} className="flex flex-col items-center text-center">
                                <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-lg mb-4 shadow-lg shadow-indigo-500/30">
                                    {step.step}
                                </div>
                                <h4 className={`font-bold ${textColor} mb-2`}>{step.title}</h4>
                                <p className={`text-sm ${subTextColor}`}>{step.text}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* 7. Call to Action */}
                <motion.div variants={itemVariants} className="flex justify-center pt-8">
                    <button
                        onClick={onStart}
                        className="group relative px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg rounded-full shadow-xl shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-3"
                    >
                        Start Navigating Dashboard
                        <MousePointer className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                </motion.div>

            </motion.div>
        </div>
    );
};
