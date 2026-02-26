import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import userManualPdf from '../assets/Device-to-Dashboard Operations Handbook.pdf';

const UserManual: React.FC = () => {
    const [isLoading, setIsLoading] = useState(true);

    return (
        <div className="min-h-screen bg-[#f0ebf8] dark:bg-slate-950 -m-4 md:-m-8 p-4 md:p-8">
            {/* Google Form Style Card Container */}
            <div className="max-w-3xl mx-auto flex flex-col gap-4">
                {/* Main Card */}
                <div className="relative bg-white dark:bg-card-bg-dark rounded-lg shadow-sm border-t-[10px] border-indigo-700 dark:border-indigo-600 overflow-hidden flex flex-col min-h-[85vh]">
                    {isLoading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/95 dark:bg-slate-950/95 z-10 transition-opacity duration-300">
                            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
                            <p className="text-gray-500 dark:text-gray-400 font-medium">Loading User Manual...</p>
                        </div>
                    )}

                    <div className="flex-grow relative">
                        <iframe
                            src={`${userManualPdf}#toolbar=0&navpanes=0&scrollbar=1`}
                            className="w-full h-full border-none absolute inset-0"
                            style={{ minHeight: '800px' }}
                            title="VinCense User Manual"
                            onLoad={() => setIsLoading(false)}
                        />
                    </div>
                </div>

                {/* Footer/Bottom spacing bit to match Google Form look */}
                <div className="h-12" />
            </div>
        </div>
    );
};

export default UserManual;
