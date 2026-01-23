import React from 'react';
import { RefreshCw } from 'lucide-react';

interface SidebarProps {
  subjects: string[];
  dates: string[];
  selectedSubject: string;
  selectedDate: string;
  onSubjectChange: (subject: string) => void;
  onDateChange: (date: string) => void;
  onRefresh: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  subjects,
  dates,
  selectedSubject,
  selectedDate,
  onSubjectChange,
  onDateChange,
  onRefresh,
  isDarkMode,
  toggleTheme
}) => {
  return (
    <div className="w-64 bg-card-bg-light dark:bg-sidebar-bg border-r border-border-light dark:border-border-dark flex flex-col h-full p-4 transition-colors duration-200">
      <h2 className="text-xl font-bold mb-6 text-text-light dark:text-text-dark">Device Analytics</h2>
      
      {/* Theme Toggle */}
      <div className="flex items-center justify-between mb-6">
        <span className="text-sm font-medium text-text-light dark:text-text-dark">Dark Theme</span>
        <button 
          onClick={toggleTheme}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
            isDarkMode ? 'bg-blue-600' : 'bg-gray-200'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isDarkMode ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      <div className="space-y-6 flex-grow">
         {/* Subject Select */}
         <div>
            <label className="block text-sm font-medium text-text-light dark:text-gray-300 mb-1">Subject Name</label>
            <select
              value={selectedSubject}
              onChange={(e) => onSubjectChange(e.target.value)}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-card-bg-dark text-text-light dark:text-text-dark py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
            >
              {subjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
         </div>

         {/* Date Select */}
         {selectedSubject && (
            <div>
              <label className="block text-sm font-medium text-text-light dark:text-gray-300 mb-1">Select Date</label>
              <select
                value={selectedDate}
                onChange={(e) => onDateChange(e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-card-bg-dark text-text-light dark:text-text-dark py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
              >
                {dates.map(date => (
                  <option key={date} value={date}>{date}</option>
                ))}
              </select>
            </div>
         )}
      </div>

      {/* Sync Data */}
      <div className="mt-auto pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onRefresh}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <RefreshCw size={16} />
          Sync Live Data
        </button>
      </div>
    </div>
  );
};
