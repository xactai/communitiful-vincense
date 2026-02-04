import React, { useState, useEffect, useRef } from 'react';
import logo from '../assets/VinCense Logo.png';
import { RefreshCw, Moon, Sun, Menu, X, Activity, Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DayPicker } from 'react-day-picker';
import type { DateRange } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { format, isSameDay } from 'date-fns';

interface SidebarProps {
  subjects: string[];
  availableDates: Date[];
  selectedSubject: string;
  selectedDateRange: DateRange | undefined;
  onSubjectChange: (subject: string) => void;
  onDateRangeChange: (range: DateRange | undefined) => void;
  onRefresh: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;

}

export const Sidebar: React.FC<SidebarProps> = ({
  subjects,
  availableDates,
  selectedSubject,
  selectedDateRange,
  onSubjectChange,
  onDateRangeChange,
  onRefresh,
  isDarkMode,
  toggleTheme,

}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) setIsOpen(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sync initial state
  useEffect(() => {
    if (window.innerWidth >= 768) setIsOpen(true);
  }, []);

  // Close date picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const SidebarContent = () => (
    <div className={`flex flex-col h-full transition-all duration-300 relative`}>

      {/* Collapse Toggle Button (Desktop) - Outside Scroll Area */}
      {!isMobile && (
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-8 bg-white dark:bg-card-bg-dark border border-gray-200 dark:border-gray-700 rounded-full p-1 shadow-md hover:bg-gray-50 focus:outline-none z-50 text-gray-500 hover:text-indigo-600 transition-colors"
          style={{ right: '-12px' }}
        >
          {isCollapsed ? <Menu size={16} /> : <X size={16} />}
        </button>
      )}

      {/* Main Content Area - Scrollable */}
      <div className={`flex-1 overflow-y-auto overflow-x-hidden ${isCollapsed ? 'p-2' : 'p-6'}`}>
        <div className={`flex items-center gap-3 mb-8 ${isCollapsed ? 'justify-center' : ''}`}>
          <div className={`flex items-center gap-3 mb-8 ${isCollapsed ? 'justify-center' : ''}`}>
            {!isCollapsed ? (
              <img src={logo} alt="VinCense" className="h-20 w-auto object-contain mx-auto" />
            ) : (
              <div className="bg-indigo-600 p-2 rounded-lg shadow-lg shadow-indigo-500/30 shrink-0">
                <Activity className="text-white h-6 w-6" />
              </div>
            )}
          </div>
        </div>

        {!isCollapsed ? (
          <>
            {/* Theme Toggle */}
            <div className="flex items-center justify-between mb-8 p-3 bg-gray-50 dark:bg-black/20 rounded-xl border border-gray-100 dark:border-gray-800 backdrop-blur-sm">
              <span className="text-sm font-medium text-text-light dark:text-text-dark flex items-center gap-2">
                {isDarkMode ? <Moon size={16} /> : <Sun size={16} />}
                {isDarkMode ? 'Dark Mode' : 'Light Mode'}
              </span>
              <button
                onClick={toggleTheme}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isDarkMode ? 'bg-indigo-600' : 'bg-gray-300'
                  }`}
              >
                <motion.span
                  layout
                  className="inline-block h-4 w-4 transform rounded-full bg-white shadow-md"
                  animate={{ x: isDarkMode ? 22 : 2 }}
                />
              </button>
            </div>

            <div className="space-y-6 flex-grow">
              {/* Subject Select */}
              <div className="group">
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Subject Name</label>
                <div className="relative">
                  <select
                    value={selectedSubject}
                    onChange={(e) => onSubjectChange(e.target.value)}
                    className="w-full appearance-none rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-transparent text-text-light dark:text-text-dark py-2.5 px-4 shadow-sm transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 hover:border-indigo-300 text-sm"
                  >
                    {subjects.map(subject => (
                      <option key={subject} value={subject} className="dark:bg-card-bg-dark">{subject}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                    <ChevronDown size={14} />
                  </div>
                </div>
              </div>

              {/* Date Calendar Picker */}
              <AnimatePresence>
                {selectedSubject && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="group relative"
                    ref={datePickerRef}
                  >
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Select Date / Range</label>

                    <button
                      onClick={() => setShowDatePicker(!showDatePicker)}
                      className="w-full flex items-center justify-between rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-transparent text-text-light dark:text-text-dark py-2.5 px-4 shadow-sm transition-all hover:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <span className="flex items-center gap-2 text-sm overflow-hidden whitespace-nowrap text-ellipsis">
                        <CalendarIcon size={16} className="text-indigo-500" />
                        {selectedDateRange?.from ? (
                          <>
                            {format(selectedDateRange.from, 'dd MMM')}
                            {selectedDateRange.to ? ` - ${format(selectedDateRange.to, 'dd MMM')}` : ''}
                          </>
                        ) : "Select Data Range"}
                      </span>
                      <ChevronDown size={14} className="text-gray-400" />
                    </button>

                    {showDatePicker && (
                      <div className="absolute top-full left-0 z-50 mt-2 p-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 w-full overflow-hidden">
                        <DayPicker
                          mode="range"
                          selected={selectedDateRange}
                          onSelect={onDateRangeChange}
                          disabled={(date) => availableDates.length > 0 ? !availableDates.some(d => isSameDay(d, date)) : false}
                          modifiers={{
                            available: availableDates
                          }}
                          modifiersStyles={{
                            available: { fontWeight: 'bold' }
                          }}
                          style={{
                            '--rdp-cell-size': '22px',
                            '--rdp-caption-font-size': '12px',
                            margin: 0,
                            width: '100%',
                            maxWidth: '100%'
                          } as React.CSSProperties}
                          styles={{
                            caption: { color: isDarkMode ? '#e5e7eb' : '#374151', padding: '0 0.5rem' },
                            head_cell: { color: isDarkMode ? '#9ca3af' : '#6b7280', fontSize: '0.65rem' },
                            day: { color: isDarkMode ? '#e5e7eb' : '#1f2937', fontSize: '0.75rem' },
                            table: { maxWidth: '100%' }
                          }}
                          classNames={{
                            day_selected: "bg-indigo-600 text-white hover:bg-indigo-600",
                            day_today: "text-indigo-500 font-bold",
                          }}
                        />
                      </div>
                    )}

                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Reference Ranges */}


            {/* Sync Data */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800 pb-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onRefresh}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg shadow-lg shadow-indigo-500/20 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
              >
                <RefreshCw size={18} className="animate-spin-slow" />
                Sync Vitals Log
              </motion.button>
            </div>
          </>
        ) : (
          /* Collapsed View */
          <div className="flex flex-col items-center gap-6 mt-4">
            <button onClick={toggleTheme} className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700">
              {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <button onClick={onRefresh} className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200">
              <RefreshCw size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-card-bg-dark rounded-md shadow-md border border-gray-200 dark:border-gray-700"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobile && isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      <motion.div
        className={`fixed md:relative z-50 h-full bg-white dark:bg-card-bg-dark md:bg-card-bg-light md:dark:bg-sidebar-bg border-r border-border-light dark:border-border-dark shadow-2xl md:shadow-none overflow-visible`} // overflow-visible for toggle button
        initial={false}
        animate={{
          x: isMobile ? (isOpen ? 0 : -320) : 0,
          width: isMobile ? 320 : (isCollapsed ? 80 : 370)
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        style={{ position: isMobile ? 'fixed' : 'relative', transform: 'none' }}
      >
        <SidebarContent />
      </motion.div>
    </>
  );
};
