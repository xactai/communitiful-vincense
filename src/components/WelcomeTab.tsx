import React, { useState, useEffect } from 'react';
import logo from '../assets/VinCense Logo.png';
import img1 from '../assets/1.jpeg';
import img2 from '../assets/2.jpg';
import img3 from '../assets/3.png';
import img4 from '../assets/4.png';
import img5 from '../assets/5.png';
import img6 from '../assets/6.png';
import imgMan from '../assets/man.avif';
import imgSubject662 from '../assets/subject 662.png';
import imgSubject1 from '../assets/subject 1.png';
import imgSubject673 from '../assets/subject 673.jpeg';
import imgSubject3 from '../assets/subject 3.png';

import { motion, AnimatePresence } from 'framer-motion';
import {
    BarChart2,
    ArrowRight,
    Map,
    Info,
    Quote,
    Heart,
    Activity,
    Wind,
    Thermometer,
    X,
    Users,
    Zap
} from 'lucide-react';

interface WelcomeTabProps {
    onStart: () => void;
    isDarkMode: boolean;
}

export const WelcomeTab: React.FC<WelcomeTabProps> = ({ onStart, isDarkMode }) => {
    // --- Theme Colors ---
    const textColor = isDarkMode ? 'text-gray-100' : 'text-gray-900';
    const subTextColor = isDarkMode ? 'text-gray-400' : 'text-gray-600';
    const cardBg = isDarkMode ? 'bg-gray-800/80 border-gray-700' : 'bg-white/90 border-gray-200';
    const overlayBg = isDarkMode ? 'bg-gray-900/60' : 'bg-white/60';

    // --- Knowledge Cards Data ---
    const [selectedCardId, setSelectedCardId] = useState<number | null>(null);

    const knowledgeCards = [
        {
            id: 1,
            title: "What is this Dashboard about?",
            teaser: "Turning raw vitals into meaningful insights.",
            icon: BarChart2,
            content: (
                <div className="space-y-4">
                    <p>
                        This Dashboard brings together insights derived from real-world physiological data collected from multiple subjects using three different devices — <strong>VinCense, Dr Trust, and Dr Odin</strong>.
                        It presents a unified analytical view of key vitals across varied dimensions such as age groups, gender, real-life circumstances, and inter-device deviations.
                    </p>
                    <p>
                        By transforming raw vitals into meaningful visual analytics, the Dashboard helps uncover patterns, comparisons, and trends that would otherwise remain hidden.
                    </p>
                </div>
            )
        },
        {
            id: 2,
            title: 'Why "Communitiful × VinCense" ?',
            teaser: "Where emotional engagement meets physiological data.",
            icon: Users,
            content: (
                <div className="space-y-4">
                    <p>
                        <strong>Communitiful</strong> focuses on supporting hospital companions by keeping them engaged and emotionally connected through a shared group chat experience across the hospital ecosystem.
                        <strong>VinCense</strong> complements this by continuously capturing four core vitals and applying a custom-built stress detection algorithm.
                    </p>
                    <p>
                        Together, this collaboration aims to understand how emotional engagement and social connection influence stress levels in hospital companions, using objective physiological data as evidence.
                    </p>
                </div>
            )
        },
        {
            id: 3,
            title: "How Subjects Made This Study Possible?",
            teaser: "Real people. Real scenarios. Real impact.",
            icon: Zap,
            content: (
                <div className="space-y-4">
                    <p>
                        The contribution of our <strong>Subjects</strong> lies at the heart of this study.
                        By participating across different age groups, genders, environments, and real-life scenarios, Subjects enabled the study to expand in both scale and diversity.
                    </p>
                    <p>This wide participation allowed us to:</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>Strengthen the reliability of the analysis</li>
                        <li>Compare readings across devices and demographics</li>
                        <li>Observe stress patterns across varying circumstances</li>
                        <li>Build deeper, data-driven insights</li>
                    </ul>
                    <p className="italic pt-2 border-t border-gray-200 dark:border-gray-700">
                        Every reading, interaction, and moment contributed to making the analytics richer, more inclusive, and more meaningful.
                    </p>
                </div>
            )
        }
    ];

    // --- Carousel State ---
    const [carouselIndex, setCarouselIndex] = useState(0);
    const carouselItems = [
        { id: 1, title: "Community Driven", desc: "Engaging subjects for better health outcomes.", img: img1 },
        { id: 2, title: "Advanced Monitoring", desc: "Real-time vitals tracking and analysis.", img: img2 },
        { id: 3, title: "Data Insights", desc: "Comprehensive analytics for research.", img: img3 },
        { id: 4, title: "Remote Care", desc: "Seamless patient monitoring anywhere.", img: img4 },
        { id: 5, title: "Precision Health", desc: "Accurate medical grade data.", img: img5 },
        { id: 6, title: "Future of Digital Health", desc: "Innovating wellness solutions.", img: img6 },
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setCarouselIndex((prev) => (prev + 1) % carouselItems.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    // --- Testimonials Data ---
    const testimonials = [
        { name: "Subject ID : 113", text: " you'r testing us with device from couple of days, and I’m genuinely impressed. It has a sleek, modern design and feels lightweight yet sturdy on the wrist. The display is clear and easy to read, even in bright light. Most importantly, the accuracy of the vital monitoring and ncluding heart rate and oxygen levels has been consistent and reliable when compared with standard medical devices. Overall, it feels comfortable for daily wear and gives me confidence in tracking my health.", img: imgMan },
        { name: "Subject ID : 662", text: "The VinCense device features a sleek, professional design that looks great on the wrist. Beyond its aesthetics, it is incredibly comfortable for all-day wear, which is essential for consistent monitoring. I’ve been impressed by its accuracy; it consistently captures real-time results for vital signs like blood pressure and respiratory rate.", img: imgSubject662 },
        { name: "Subject ID : 684", text: "The device appearance could be improved, as the overall look and finish did not feel very appealing. I also noticed occasional inconsistencies in responsiveness and accuracy of vital readings, and refinements in usability and calibration would enhance the experience.", img: imgMan },
        { name: "Subject ID : 1", text: "The VinCense device experience is promising and performs well in capturing vitals compared to the reference devices. To enhance its utility for continuous monitoring, the device should minimize missed readings and support automatic storage of continuous measurements without requiring manual confirmation (e.g., clicking OK or submitting each time). With improved reliability and seamless data capture, VinCense can be effectively positioned for continuous monitoring use cases.", img: imgSubject1 },
        { name: "Subject ID : 673", text: "The VinCense device gives results really quickly compared to the other devices. I’m not focusing much on accuracy because we’re using three devices at the same time, but using both the watch-style device and the finger sensor feels like extra work.", img: imgSubject673 },
        { name: "Subject ID : 3", text: "The VinCense monitor offers a unique clinical approach, its reliability is currently undercut by inconsistent readings and significant signal noise compared to established brands like Dr Trust and Dr Odin. The physical design also feels a bit dated and could benefit from a more modern, ergonomic 'watch' aesthetic to better suit daily wear. Additionally, incorporating a seamless real-time data display would greatly improve the user experience, as the current lack of live monitoring makes it difficult to track vital shifts as they happen.", img: imgSubject3 },
    ];

    return (
        <div className="min-h-screen w-full bg-bg-light dark:bg-bg-dark text-text-light dark:text-text-dark overflow-x-hidden overflow-y-auto font-sans selection:bg-indigo-100 dark:selection:bg-indigo-900 relative">

            {/* 1. Logo Section */}
            <header className="pt-12 pb-6 flex justify-center">
                <motion.img
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    src={logo}
                    alt="VinCense Logo"
                    className="h-24 md:h-32 w-auto object-contain drop-shadow-sm"
                />
            </header>

            {/* 2. Title Animation */}
            <section className="text-center px-4 mb-16 overflow-hidden">
                <h1 className={`text-4xl md:text-6xl font-extrabold tracking-tight ${textColor} flex flex-wrap justify-center gap-x-4 gap-y-2`}>
                    {["Communitiful", "x", "VinCense"].map((word, i) => (
                        <motion.span
                            key={i}
                            initial={{
                                opacity: 0,
                                x: i === 0 ? -100 : i === 2 ? 100 : 0,
                                y: i === 1 ? -50 : 0
                            }}
                            animate={{ opacity: 1, x: 0, y: 0 }}
                            transition={{
                                duration: 1,
                                delay: 0.5 + (i * 0.2),
                                type: "spring",
                                stiffness: 100
                            }}
                            className={i === 1 ? "text-indigo-500 font-light" : ""}
                        >
                            {word}
                        </motion.span>
                    ))}
                </h1>
            </section>

            {/* 3. Knowledge Cards (Progressive Reveal) */}
            <section className="max-w-6xl mx-auto px-6 mb-24 relative z-20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {knowledgeCards.map((card) => (
                        <motion.div
                            layoutId={`card-${card.id}`}
                            key={card.id}
                            onClick={() => setSelectedCardId(card.id)}
                            className={`cursor-pointer group relative p-6 rounded-2xl ${cardBg} shadow-sm hover:shadow-xl transition-shadow border overflow-hidden`}
                            whileHover={{ y: -5 }}
                        >
                            <motion.div
                                layoutId={`icon-${card.id}`}
                                className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center mb-4 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform"
                            >
                                <card.icon className="w-5 h-5" />
                            </motion.div>
                            <motion.h3
                                layoutId={`title-${card.id}`}
                                className={`text-lg font-bold ${textColor} mb-2 leading-tight`}
                            >
                                {card.title}
                            </motion.h3>
                            <motion.p
                                layoutId={`teaser-${card.id}`}
                                className={`text-sm ${subTextColor}`}
                            >
                                {card.teaser}
                            </motion.p>

                            {/* Ripple Effect hint on hover */}
                            <div className="absolute inset-0 bg-indigo-50/0 group-hover:bg-indigo-50/5 dark:group-hover:bg-indigo-900/10 transition-colors duration-300 pointer-events-none" />
                        </motion.div>
                    ))}
                </div>

                {/* Expanded Card Overlay */}
                <AnimatePresence>
                    {selectedCardId && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setSelectedCardId(null)}
                                className={`fixed inset-0 z-40 backdrop-blur-sm ${overlayBg}`}
                            />
                            <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none p-4">
                                {knowledgeCards.map((card) => {
                                    if (card.id !== selectedCardId) return null;
                                    return (
                                        <motion.div
                                            layoutId={`card-${card.id}`}
                                            key={card.id}
                                            className={`pointer-events-auto w-full max-w-2xl ${cardBg} rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]`}
                                        >
                                            <div className="p-8 flex-1 overflow-y-auto">
                                                <div className="flex justify-between items-start mb-6">
                                                    <div className="flex items-center gap-4">
                                                        <motion.div
                                                            layoutId={`icon-${card.id}`}
                                                            className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400"
                                                        >
                                                            <card.icon className="w-6 h-6" />
                                                        </motion.div>
                                                        <div>
                                                            <motion.h3
                                                                layoutId={`title-${card.id}`}
                                                                className={`text-2xl font-bold ${textColor}`}
                                                            >
                                                                {card.title}
                                                            </motion.h3>
                                                            <motion.p
                                                                layoutId={`teaser-${card.id}`}
                                                                className={`text-base ${subTextColor} mt-1`}
                                                            >
                                                                {card.teaser}
                                                            </motion.p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setSelectedCardId(null); }}
                                                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                                    >
                                                        <X className={`w-6 h-6 ${subTextColor}`} />
                                                    </button>
                                                </div>

                                                <motion.div
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.2, duration: 0.4 }}
                                                    className={`prose dark:prose-invert max-w-none ${textColor} text-lg leading-relaxed`}
                                                >
                                                    {card.content}
                                                </motion.div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </AnimatePresence>
            </section>

            {/* 4. Image Carousel (Auto-Scrolling) */}
            <section className="mb-20 overflow-hidden relative w-full py-10">
                <div className="flex justify-center items-center h-[500px] md:h-[600px] relative max-w-6xl mx-auto perspective-1000">
                    <AnimatePresence mode='popLayout'>
                        {carouselItems.map((item, index) => {
                            // Calculate position relative to current index
                            let position = (index - carouselIndex);
                            // Normalize to [-length/2, length/2] roughly
                            if (position < -2) position += carouselItems.length;
                            if (position > 3) position -= carouselItems.length;

                            // Determine styles based on position
                            const isCenter = position === 0;

                            // Only render if visible (center +/- 2 usually enough)
                            if (Math.abs(position) > 2) return null;

                            return (
                                <motion.div
                                    key={item.id}
                                    className={`absolute rounded-2xl shadow-xl overflow-hidden cursor-pointer bg-gray-900 border-4 ${isCenter ? 'border-indigo-500' : 'border-transparent'}`}
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{
                                        x: isCenter ? "0%" : position * 70 + "%",
                                        scale: isCenter ? 2.0 : 1 - Math.abs(position) * 0.15,
                                        zIndex: 10 - Math.abs(position),
                                        opacity: isCenter ? 1 : 0.6 - Math.abs(position) * 0.1,
                                        filter: isCenter ? "blur(0px)" : "blur(2px)",
                                        rotateY: isCenter ? 0 : position * -15
                                    }}
                                    transition={{ duration: 0.7, ease: "easeInOut" }}
                                    style={{
                                        width: "300px",
                                        height: "200px",
                                        left: "50%",
                                        marginLeft: "-150px", // Center the card
                                    }}
                                    onClick={() => setCarouselIndex(index)}
                                >
                                    <img src={item.img} alt={item.title} className="w-full h-full object-cover" />
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </section>

            {/* 5. Core Vitals Captured Section */}
            <section className="max-w-7xl mx-auto px-6 mb-20">
                <h3 className={`text-center text-xl font-bold mb-6 ${textColor}`}>Core Vitals Captured</h3>
                <div className="grid grid-cols-2 gap-2">
                    {[
                        {
                            icon: Heart,
                            label: 'Pulse Rate',
                            desc: 'Heart rate is the number of times your heart beats per minute and naturally changes with rest, activity, and stress. For most adults, a normal resting heart rate ranges from 60 to 100 bpm. It increases during exercise and lowers when you\'re relaxed or asleep. Monitoring your heart rate regularly can give you valuable insights into your fitness, recovery, and overall heart health.',
                            color: 'text-rose-500',
                            bg: 'bg-rose-100/50 dark:bg-rose-900/20',
                            rounded: 'rounded-tl-[60px]'
                        },
                        {
                            icon: Activity,
                            label: 'SpO₂',
                            desc: 'SpO₂, or oxygen saturation, measures the percentage of hemoglobin in your blood that is carrying oxygen. It\'s a key indicator of how well your body is delivering oxygen to its cells. Normal SpO₂ levels for healthy individuals typically range from 95% to 100%. Readings below 95% may suggest low blood oxygen, with levels under 90% considered severe.',
                            color: 'text-cyan-500',
                            bg: 'bg-cyan-100/50 dark:bg-cyan-900/20',
                            rounded: 'rounded-tr-[60px]'
                        },
                        {
                            icon: Wind,
                            label: 'Respiratory Rate',
                            desc: 'Respiratory rate measures the number of breaths you take per minute and is an important indicator of how your body responds to physical and emotional demands. For healthy adults at rest, a normal respiratory rate typically ranges from 12 to 20 breaths per minute. Changes in breathing patterns can reflect activity levels, stress, fatigue, or potential respiratory concerns.',
                            color: 'text-emerald-500',
                            bg: 'bg-emerald-100/50 dark:bg-emerald-900/20',
                            rounded: 'rounded-bl-[60px]'
                        },
                        {
                            icon: Thermometer,
                            label: 'Skin Temperature',
                            desc: 'Skin temperature reflects the temperature at the surface of your body and can vary based on environment, activity level, blood flow, and stress. Unlike core body temperature, skin temperature naturally fluctuates throughout the day and between individuals. Sudden drops or rises in skin temperature may indicate changes in circulation, stress response, or environmental exposure.',
                            color: 'text-amber-500',
                            bg: 'bg-amber-100/50 dark:bg-amber-900/20',
                            rounded: 'rounded-br-[60px]'
                        }
                    ].map((vital, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className={`${cardBg} ${vital.bg} ${vital.rounded} p-8 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-lg transition-all border border-gray-100 dark:border-gray-700 h-full group`}
                        >
                            <div className={`p-3 rounded-full bg-white dark:bg-gray-800 mb-4 shadow-sm group-hover:scale-110 transition-transform`}>
                                <vital.icon className={`w-6 h-6 ${vital.color}`} />
                            </div>
                            <h4 className={`text-lg font-bold ${textColor} mb-2`}>{vital.label}</h4>
                            <p className={`text-sm ${subTextColor} leading-relaxed`}>{vital.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* 6. Testimonials Section (Looping Marquee) */}
            <section className="mb-20 overflow-hidden bg-gradient-to-r from-transparent via-indigo-50/50 dark:via-indigo-900/20 to-transparent py-12">
                <div className="max-w-7xl mx-auto px-4">
                    <h3 className={`text-center text-xl font-semibold mb-8 ${subTextColor} uppercase tracking-widest`}>What People Say</h3>
                    <div className="relative flex overflow-x-hidden group">
                        <motion.div
                            className="flex gap-8 whitespace-nowrap"
                            animate={{ x: [0, -1000] }}
                            transition={{
                                repeat: Infinity,
                                ease: "linear",
                                duration: 25 // Adjust speed
                            }}
                        >
                            {[...testimonials, ...testimonials, ...testimonials].map((t, i) => (
                                <div
                                    key={i}
                                    className={`inline-block w-[350px] p-6 rounded-2xl ${cardBg} border shadow-sm flex-shrink-0 whitespace-normal`}
                                >
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-indigo-100 dark:border-indigo-900">
                                            <img src={t.img} alt="User Avatar" className="w-full h-full object-cover" />
                                        </div>
                                        <div>
                                            <p className={`font-bold ${textColor}`}>{t.name}</p>
                                            <div className="flex text-yellow-400 text-xs">★★★★★</div>
                                        </div>
                                    </div>
                                    <p className={`text-sm italic ${subTextColor} flex gap-2`}>
                                        <Quote className="w-4 h-4 opacity-30 flex-shrink-0" />
                                        {t.text}
                                    </p>
                                </div>
                            ))}
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* 7. How to Navigate Section */}
            <section className="max-w-5xl mx-auto px-6 mb-20">
                <div className="text-center mb-12">
                    <h2 className={`text-3xl font-bold ${textColor}`}>How to Navigate</h2>
                    <p className={`mt-2 ${subTextColor}`}>Your journey through the data in 3 simple steps.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                    {/* Connecting Line (Desktop) */}
                    <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gray-200 dark:bg-gray-700 -z-10"></div>

                    {[
                        {
                            step: 1,
                            title: "Select Scope",
                            desc: "Filter by Subject or Date Range in the Sidebar.",
                            icon: Map
                        },
                        {
                            step: 2,
                            title: "Choose Analytics",
                            desc: "Switch between tabs for Demographics, Vitals, or Error Analysis.",
                            icon: BarChart2
                        },
                        {
                            step: 3,
                            title: "Deep Dive",
                            desc: "View detailed charts and export findings.",
                            icon: Info
                        }
                    ].map((item) => (
                        <motion.div
                            key={item.step}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: item.step * 0.2 }}
                            className={`${cardBg} p-8 rounded-3xl border shadow-sm flex flex-col items-center text-center group hover:-translate-y-2 transition-transform duration-300`}
                        >
                            <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-2xl font-bold mb-6 shadow-lg shadow-indigo-600/20 group-hover:scale-110 transition-transform">
                                <item.icon className="w-8 h-8" />
                            </div>
                            <h3 className={`text-xl font-bold ${textColor} mb-3`}>{item.title}</h3>
                            <p className={`${subTextColor}`}>{item.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* 8. Call to Action */}
            <section className="pb-24 flex justify-center px-4">
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onStart}
                    className="group relative inline-flex items-center gap-3 px-10 py-5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xl rounded-full shadow-2xl shadow-indigo-600/40 transition-all overflow-hidden"
                >
                    <span className="relative z-10">Start Exploring</span>
                    <ArrowRight className="w-6 h-6 relative z-10 group-hover:translate-x-1 transition-transform" />

                    {/* Hover Effect Shine */}
                    <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-0"></div>
                </motion.button>
            </section>

        </div>
    );
};
