import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, HelpCircle, Bot, User } from 'lucide-react';

interface FAQPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

// Data Structure
type FAQCategory = {
    id: string;
    title: string;
    description: string;
    questions: FAQQuestion[];
};

type FAQQuestion = {
    id: string;
    question: string;
    answer: string;
};

const FAQ_DATA: FAQCategory[] = [
    {
        id: 'device',
        title: 'Device & Measurement',
        description: 'Questions about devices, accuracy, and measurement methods.',
        questions: [
            {
                id: 'd1',
                question: 'Does movement or posture affect the readings?',
                answer: 'Yes. Movement, posture changes, or talking can temporarily affect readings. For this reason, measurements are usually observed during relatively calm and consistent conditions.'
            },
            {
                id: 'd2',
                question: 'Do all devices measure vitals in the same way?',
                answer: 'No. While devices measure similar vitals, they may use different sensors, placement methods, and signal-processing techniques, which can lead to slight variations in readings.'
            },
            {
                id: 'd3',
                question: 'Which device is more accurate? Why?',
                answer: 'Dr Trust is medically certified, which makes it a reliable reference device for vital measurements. VinCense and other devices are compared against it to understand consistency, variation, and real-world performance across different conditions. Using multiple devices helps the study evaluate patterns rather than depend on a single source.'
            },
            {
                id: 'd4',
                question: 'Why does VinCense have a watch and a probe?',
                answer: 'The watch and probe are designed to capture vitals from different points of contact, helping improve signal quality and reliability across different physiological parameters.'
            },
            {
                id: 'd5',
                question: 'Why are we using VinCense?',
                answer: 'VinCense is used because it captures multiple vitals simultaneously and provides data, which can be further processed as inputs to the stress algorithm developed in this study. This enables a more holistic understanding of physiological responses in real-world conditions.'
            },
            {
                id: 'd6',
                question: 'Why are multiple devices used in this study?',
                answer: 'Using multiple devices allows cross-comparison of readings, improves confidence in observed trends, and helps understand how different measurement approaches behave under similar conditions.'
            },
            {
                id: 'd7',
                question: 'How reliable are short-duration measurements?',
                answer: 'Short-duration measurements provide useful snapshots but may reflect momentary conditions. They are most meaningful when observed alongside trends or repeated readings.'
            }
        ]
    },
    {
        id: 'about',
        title: 'About VinCense',
        description: 'General information about VinCense and its role.',
        questions: [
            {
                id: 'a1',
                question: 'VinCense. What’s that?',
                answer: 'VinCense is a pioneering Wireless Health Monitoring System (WHMS). It maintains a close watch over the vital parameters of patients, chronic disease sufferers, working population and senior citizens. Each patient gets to wear a device on his or her wrist, like a watch. This wearable device transmits data to an online system using an Android mobile device of the patient, such as a smartphone or tablet.'
            },
            {
                id: 'a2',
                question: 'Why is VinCense used in this study?',
                answer: 'VinCense supports continuous vitals monitoring and enables analysis related to stress and physiological changes, aligning closely with the objectives of this study.'
            },
            {
                id: 'a3',
                question: 'What vitals does VinCense capture?',
                answer: 'VinCense captures pulse (heart rate), blood oxygen saturation (SpO₂), respiratory rate, and skin temperature.'
            },
            {
                id: 'a4',
                question: 'How is VinCense different from other health devices?',
                answer: 'VinCense is designed for integrated vitals capture and analytics, with a focus on understanding physiological patterns rather than just displaying raw numbers.'
            },
            {
                id: 'a5',
                question: 'Is VinCense a medical device?',
                answer: 'No. VinCense is not intended for medical diagnosis or treatment. It is used for observational and research purposes only.'
            }
        ]
    },
    {
        id: 'data',
        title: 'Data & Analytics',
        description: 'Understanding insights, fluctuations, and health status.',
        questions: [
            {
                id: 'da1',
                question: 'How are vitals converted into insights?',
                answer: 'Collected vitals are analyzed to identify patterns, trends, comparisons, and deviations across time, subjects, and devices, which are then presented visually on the Dashboard.'
            },
            {
                id: 'da2',
                question: 'Why do some values fluctuate during the day?',
                answer: 'Vitals naturally change due to activity, rest, emotions, environment, and daily routines. Such fluctuations are expected and normal.'
            },
            {
                id: 'da3',
                question: 'How is the overall health status determined?',
                answer: 'Overall health status is derived by observing all four vitals together, considering their ranges, patterns, and consistency over time, without making medical judgments.'
            }
        ]
    },
    {
        id: 'subjects',
        title: 'Subjects & Participation',
        description: 'Details about the people in the study.',
        questions: [
            {
                id: 's1',
                question: 'Why is data collected from different age groups and genders?',
                answer: 'Collecting data from diverse age groups and genders helps improve the study’s inclusivity, reliability, and ability to reflect real-world variation.'
            },
            {
                id: 's2',
                question: 'Is this data used for diagnosis or treatment?',
                answer: 'No. The data is used strictly for research, analysis, and understanding patterns, not for diagnosing or treating any medical condition.'
            }
        ]
    },
    {
        id: 'env',
        title: 'Environment & Conditions',
        description: 'Impact of surroundings on health data.',
        questions: [
            {
                id: 'e1',
                question: 'Do surroundings affect vitals readings?',
                answer: 'Yes. Factors such as temperature, noise, stress levels, and air-conditioning can influence certain vitals, especially skin temperature and heart rate.'
            },
            {
                id: 'e2',
                question: 'Are readings taken during rest or activity?',
                answer: 'Readings are observed during rest and light everyday activities to reflect realistic conditions. This helps the study understand how vitals behave naturally, rather than only in controlled or artificial settings.'
            },
            {
                id: 'e3',
                question: 'Do food or caffeine intake affect vitals?',
                answer: 'Yes. Food, caffeine, hydration, and sleep can temporarily influence vitals like heart rate and respiratory rate, which is why context is important when interpreting data.'
            }
        ]
    }
];

// --- Chat Bubble Components ---

const BotMessage = ({ children }: { children: React.ReactNode }) => (
    <div className="flex gap-3 mb-4">
        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
            <Bot className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 p-4 rounded-2xl rounded-tl-none text-sm shadow-sm max-w-[85%] border border-gray-200 dark:border-gray-700">
            {children}
        </div>
    </div>
);

const UserMessage = ({ children }: { children: React.ReactNode }) => (
    <div className="flex gap-3 mb-4 justify-end">
        <div className="bg-indigo-600 text-white p-3 rounded-2xl rounded-tr-none text-sm shadow-md max-w-[85%]">
            {children}
        </div>
        <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/10 flex items-center justify-center flex-shrink-0 border border-indigo-100 dark:border-indigo-900">
            <User className="w-5 h-5 text-indigo-500" />
        </div>
    </div>
);

const OptionButton = ({ onClick, children, delay = 0 }: { onClick: () => void, children: React.ReactNode, delay?: number }) => (
    <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: delay * 0.05 }}
        onClick={onClick}
        className="block w-fit mb-2 ml-11 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 px-4 py-2 rounded-full text-sm font-medium transition-all text-left shadow-sm hover:shadow-md hover:border-indigo-300"
    >
        {children}
    </motion.button>
);

export const FAQPanel: React.FC<FAQPanelProps> = ({ isOpen, onClose }) => {
    const [view, setView] = useState<'home' | 'category' | 'answer'>('home');
    const [selectedCategory, setSelectedCategory] = useState<FAQCategory | null>(null);
    const [selectedQuestion, setSelectedQuestion] = useState<FAQQuestion | null>(null);

    // Reset view on close
    useEffect(() => {
        if (!isOpen) {
            // Optional: reset state after animation?
            // setTimeout(() => {
            //     setView('home');
            //     setSelectedCategory(null);
            //     setSelectedQuestion(null);
            // }, 300);
        }
    }, [isOpen]);

    const handleCategoryClick = (cat: FAQCategory) => {
        setSelectedCategory(cat);
        setView('category');
    };

    const handleQuestionClick = (q: FAQQuestion) => {
        setSelectedQuestion(q);
        setView('answer');
    };

    const goBackToHome = () => {
        setView('home');
        setSelectedCategory(null);
    };

    const goBackToCategory = () => {
        setView('category');
        setSelectedQuestion(null);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/20 backdrop-blur-[1px] z-40"
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="fixed right-0 top-0 h-full w-full max-w-sm bg-white dark:bg-gray-900 shadow-2xl z-50 flex flex-col border-l border-gray-200 dark:border-gray-800"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-10">
                            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold">
                                <HelpCircle className="w-5 h-5" />
                                <span>Help & FAQ</span>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Chat Area */}
                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50 dark:bg-slate-950/30">

                            {/* --- HOME VIEW --- */}
                            {view === 'home' && (
                                <motion.div
                                    key="home"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0, position: 'absolute' }}
                                    className="pb-8"
                                >
                                    <BotMessage>
                                        <p className="font-semibold mb-1">Hi 👋</p>
                                        <p>I’m here to help you understand the Dashboard. Please choose a topic to get started:</p>
                                    </BotMessage>

                                    {FAQ_DATA.map((cat, i) => (
                                        <OptionButton key={cat.id} onClick={() => handleCategoryClick(cat)} delay={i}>
                                            {cat.title}
                                        </OptionButton>
                                    ))}
                                </motion.div>
                            )}

                            {/* --- CATEGORY VIEW --- */}
                            {view === 'category' && selectedCategory && (
                                <motion.div
                                    key="category"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20, position: 'absolute' }}
                                    className="pb-8"
                                >
                                    {/* History simulation */}
                                    <UserMessage>{selectedCategory.title}</UserMessage>

                                    <BotMessage>
                                        <p>Here are some common questions about <span className="font-semibold text-indigo-600 dark:text-indigo-400">{selectedCategory.title}</span>:</p>
                                    </BotMessage>

                                    {selectedCategory.questions.map((q, i) => (
                                        <OptionButton key={q.id} onClick={() => handleQuestionClick(q)} delay={i}>
                                            {q.question}
                                        </OptionButton>
                                    ))}

                                    <div className="mt-6 border-t border-gray-200 dark:border-gray-800 pt-4">
                                        <button
                                            onClick={goBackToHome}
                                            className="w-full text-xs text-gray-500 hover:text-indigo-600 flex items-center justify-center gap-1 py-2"
                                        >
                                            <ChevronLeft className="w-3 h-3" /> Back to Topics
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {/* --- ANSWER VIEW --- */}
                            {view === 'answer' && selectedQuestion && selectedCategory && (
                                <motion.div
                                    key="answer"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20, position: 'absolute' }}
                                    className="pb-8"
                                >
                                    {/* History simulation */}
                                    <UserMessage>{selectedQuestion.question}</UserMessage>

                                    <BotMessage>
                                        <p className="leading-relaxed">{selectedQuestion.answer}</p>
                                    </BotMessage>

                                    <BotMessage>
                                        <p>Do you have any other questions about this topic?</p>
                                    </BotMessage>

                                    {selectedCategory.questions.filter(q => q.id !== selectedQuestion.id).map((q, i) => (
                                        <OptionButton key={q.id} onClick={() => handleQuestionClick(q)} delay={i}>
                                            {q.question}
                                        </OptionButton>
                                    ))}

                                    <div className="mt-6 border-t border-gray-200 dark:border-gray-800 pt-4 flex justify-between">
                                        <button
                                            onClick={goBackToCategory}
                                            className="text-xs text-gray-500 hover:text-indigo-600 flex items-center gap-1 py-2"
                                        >
                                            <ChevronLeft className="w-3 h-3" /> Back to {selectedCategory.title}
                                        </button>
                                        <button
                                            onClick={goBackToHome}
                                            className="text-xs text-gray-500 hover:text-indigo-600 flex items-center gap-1 py-2"
                                        >
                                            Start Over
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
