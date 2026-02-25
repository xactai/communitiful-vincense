import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface AddVitalsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AddVitalsModal: React.FC<AddVitalsModalProps> = ({ isOpen, onClose }) => {
    const [isLoading, setIsLoading] = useState(true);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full max-w-3xl bg-white dark:bg-card-bg-dark rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                        style={{ height: '85vh' }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Add New Vitals</h2>
                            <button
                                onClick={onClose}
                                className="p-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                title="Close"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Iframe Container */}
                        <div className="flex-1 w-full bg-white dark:bg-gray-900 relative">
                            {isLoading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-900 z-10">
                                    <div className="flex flex-col items-center">
                                        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                        <span className="mt-4 text-sm font-medium text-gray-500 dark:text-gray-400">Loading form...</span>
                                    </div>
                                </div>
                            )}
                            <iframe
                                src="https://forms.gle/tQyj3B6NTsEyw3pp9"
                                className="w-full h-full border-0 absolute inset-0 z-20"
                                title="Add Vitals Form"
                                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                                onLoad={() => setIsLoading(false)}
                            />
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
