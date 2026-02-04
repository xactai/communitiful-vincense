import React, { useState } from 'react';
import { Maximize2, X } from 'lucide-react';

interface ExpandableChartProps {
    title?: string;
    children: React.ReactNode;
    className?: string; // Wrapper className
}

export const ExpandableChart: React.FC<ExpandableChartProps> = ({ title, children, className }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    if (isExpanded) {
        return (
            <div className="fixed inset-0 z-[9999] bg-white dark:bg-gray-900 flex flex-col p-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{title || 'Chart'} - Full Screen</h3>
                    <button
                        onClick={() => setIsExpanded(false)}
                        className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        aria-label="Close Full Screen"
                    >
                        <X size={24} />
                    </button>
                </div>
                <div className="flex-1 w-full h-full p-4 border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900/50 shadow-inner overflow-hidden">
                    {/* Re-render children in expanded state - Plotly usually handles resize automatically if autosize is true */}
                    {children}
                </div>
            </div>
        );
    }

    return (
        <div className={`relative group w-full ${className || ''}`}>
            <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={() => setIsExpanded(true)}
                    className="p-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-sm hover:text-indigo-600 dark:hover:text-indigo-400"
                    title="Maximize Chart"
                >
                    <Maximize2 size={16} />
                </button>
            </div>
            {children}
        </div>
    );
};
