import React, { useState } from 'react';
import { format } from 'date-fns';
import type { DataDict } from '../types';
import { exportCSV, exportExcel, exportPDF, exportDOCX } from '../utils/export';
import { FileText, FileSpreadsheet, FileJson, File } from 'lucide-react';

interface SourceTabProps {
    data: DataDict;
    isDarkMode: boolean;
}

export const SourceTab: React.FC<SourceTabProps> = ({ data }) => {
    // Available keys (sheets)
    // Conslidated first
    const keys = Object.keys(data).filter(k => k !== 'Consolidated');
    if (data['Consolidated']) keys.unshift('Consolidated');

    const [activeSheet, setActiveSheet] = useState<string>(keys[0] || '');

    if (!activeSheet || !data[activeSheet]) return <div>No Data Available</div>;

    const sortedData = [...data[activeSheet]].sort((a, b) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const dateA = a.Date instanceof Date ? a.Date.getTime() : new Date((a as any).Date || 0).getTime();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const dateB = b.Date instanceof Date ? b.Date.getTime() : new Date((b as any).Date || 0).getTime();
        return dateB - dateA;
    });

    const displayData = sortedData.map(({ Timestamp, Date: DateObj, ...rest }) => ({
        // Format Date for display
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Date: DateObj instanceof Date ? format(DateObj, 'dd MMM yyyy') : (rest as any)['Date'], // DD MMM YYYY
        ...rest
    }));

    const headers = displayData.length > 0 ? Object.keys(displayData[0]) : [];

    return (
        <div>
            {/* Header with Tabs */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-card-bg-dark p-4 rounded-xl border border-gray-200 dark:border-gray-700 mb-6">
                <span className="text-xl font-bold text-gray-800 dark:text-gray-200">Raw Data</span>
                <div className="flex space-x-2 overflow-x-auto pb-1 md:pb-0 overflow-y-hidden scrollbar-hide">
                    {keys.map(key => (
                        <button
                            key={key}
                            onClick={() => setActiveSheet(key)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors flex-shrink-0 ${activeSheet === key
                                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                                : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                                }`}
                        >
                            {key}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="bg-white dark:bg-card-bg-dark rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">

                {/* Age Group Legend */}
                <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700 text-sm">
                    <span className="font-bold text-gray-700 dark:text-gray-300">Age Group Ranges:</span>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                        <span className="text-gray-600 dark:text-gray-400">Young Adult (18-25)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                        <span className="text-gray-600 dark:text-gray-400">Adult (25-50)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                        <span className="text-gray-600 dark:text-gray-400">Senior (51+)</span>
                    </div>
                </div>

                <h3 className="text-lg font-semibold mb-4">Sheet: {activeSheet}</h3>

                {/* Table */}
                <div className="overflow-x-auto mb-6 max-h-[600px] overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm relative">
                        <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10 shadow-sm">
                            <tr>
                                {headers.map(h => (
                                    <th key={h} className="px-3 py-3 text-left font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-800">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-card-bg-dark divide-y divide-gray-200 dark:divide-gray-700">
                            {displayData.map((row, i) => (
                                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                    {headers.map(h => (
                                        <td key={h} className="px-3 py-2 whitespace-nowrap text-text-light dark:text-text-dark">
                                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                            {String((row as any)[h] ?? '')}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="mt-2 text-xs text-gray-500 text-center">Showing all rows ({displayData.length})</div>

                {/* Downloads */}
                <h4 className="font-semibold mb-3">Downloads</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <button
                        onClick={() => exportCSV(displayData, `${activeSheet}_data`)}
                        className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                        <FileText size={16} /> Download CSV
                    </button>
                    <button
                        onClick={() => exportExcel(displayData, activeSheet, `${activeSheet}_data`)}
                        className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                        <FileSpreadsheet size={16} /> Download Excel
                    </button>
                    <button
                        onClick={() => exportPDF(displayData.slice(0, 100), activeSheet, `${activeSheet}_data`)}
                        className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                        <File size={16} /> Download PDF
                    </button>
                    <button
                        onClick={() => exportDOCX(displayData.slice(0, 100), activeSheet, `${activeSheet}_data`)}
                        className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                        <FileJson size={16} /> Download Word
                    </button>
                </div>
            </div>
        </div>
    );
};
