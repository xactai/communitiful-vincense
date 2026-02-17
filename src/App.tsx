import { useEffect, useState, useMemo, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { fetchAndParseData, filterData } from './utils/dataLoader';
import type { DataDict } from './types';
import { format } from 'date-fns';
import { HomeTab } from './components/HomeTab';
import { CompareTab } from './components/CompareTab';
import { DeviationTab } from './components/DeviationTab';
import { DeepDiveTab } from './components/DeepDiveTab';
import { SourceTab } from './components/SourceTab';
import { GenderAnalyticsTab } from './components/GenderAnalyticsTab';
import { AgeGroupAnalyticsTab } from './components/AgeGroupAnalyticsTab';
import { CircumstanceAnalyticsTab } from './components/CircumstanceAnalyticsTab';
import { TrustOdinComparisonTab } from './components/TrustOdinComparisonTab';
import { WelcomeTab } from './components/WelcomeTab';
import { VideoGalleryTab } from './components/VideoGalleryTab';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Moon, Sun, Home } from 'lucide-react';
import { ScrollToTop } from './components/ScrollToTop';
import { HealthProfileTab } from './components/HealthProfileTab';
import { FAQPanel } from './components/FAQPanel';

import type { DateRange } from 'react-day-picker';

function App() {
  const [data, setData] = useState<DataDict>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [showFAQ, setShowFAQ] = useState<boolean>(false);
  const mainRef = useRef<HTMLDivElement>(null);

  // Date State: Range or Single (from react-day-picker)
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange | undefined>(undefined);



  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('Welcome');

  // Theme Toggle Effect
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Data Fetching
  // Sync Popup State
  const [syncStats, setSyncStats] = useState<{ visible: boolean; newCount: number } | null>(null);

  const loadData = async (isManualSync = false) => {
    setLoading(true);
    setError(null);
    try {
      // Capture previous count if manual sync
      const prevCount = isManualSync ? (data['Consolidated']?.length || 0) : 0;

      const loadedData = await fetchAndParseData();
      setData(loadedData);

      if (isManualSync) {
        const newTotal = loadedData['Consolidated']?.length || 0;
        const diff = Math.max(0, newTotal - prevCount);
        setSyncStats({ visible: true, newCount: diff });


      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute Available Subjects (Lines 51-61 remain same)
  const subjects = useMemo(() => {
    const allSubjects = new Set<string>();
    Object.values(data).forEach(sheetData => {
      sheetData.forEach(row => {
        if (row['Subject Name']) {
          const name = String(row['Subject Name']).trim();
          if (name) {
            allSubjects.add(name);
          }
        }
      });
    });
    return ['All Subjects', ...Array.from(allSubjects).sort((a, b) => a.localeCompare(b))];
  }, [data]);

  // Set default subject if not selected
  useEffect(() => {
    if (!selectedSubject && subjects.length > 0) {
      setSelectedSubject(subjects[0]);
    }
  }, [subjects, selectedSubject]);

  // Compute Available Dates for Selected Subject
  const availableDates = useMemo<Date[]>(() => {
    const datesSet = new Set<number>();
    if (selectedSubject) {
      Object.values(data).forEach(sheetData => {
        sheetData.forEach(row => {
          if (row['Subject Name'] === selectedSubject && row['Date']) {
            try {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const rawDate: any = row['Date'];
              const d = rawDate instanceof Date ? rawDate : new Date(rawDate);
              const time = d.setHours(0, 0, 0, 0);
              if (!isNaN(time)) {
                datesSet.add(time);
              }
            } catch (e) {
              // ignore
            }
          }
        });
      });
    }
    return Array.from(datesSet).map(t => new Date(t)).sort((a, b) => b.getTime() - a.getTime());
  }, [data, selectedSubject]);

  // Filter Data (Subject + Date)
  const filteredData = useMemo(() => {
    return filterData(data, selectedSubject, selectedDateRange);
  }, [data, selectedSubject, selectedDateRange]);

  // Data Filtered ONLY by Date (for Aggregates like Age Group Tab)
  const dateFilteredData = useMemo(() => {
    return filterData(data, 'All Subjects', selectedDateRange);
  }, [data, selectedDateRange]);

  const tabs = [
    // Home tab removed from navigation list
    { id: 'Gender', label: 'Gender Analytics' },
    { id: 'AgeGroup', label: 'Age Group Analytics' },
    { id: 'Circumstance', label: 'Circumstance Analytics' },
    { id: 'Compare', label: 'Cross Device Comparison' },
    { id: 'Deviation', label: 'Error & Deviation Analytics' },
    { id: 'TrustOdin', label: 'Dr Trust v/s Dr Odin' },
    { id: 'DeepDive', label: 'VinCense Accuracy Overview' },
    { id: 'HealthProfile', label: 'Health Profile' },
    { id: 'Source', label: 'Data Source' }
  ];

  // Visited Tabs State
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(new Set(['Welcome']));

  const handleTabChange = (tabId: string) => {
    setVisitedTabs(prev => new Set(prev).add(activeTab)); // Add *previous* tab to visited
    setActiveTab(tabId);
  };

  // Ensure current tab is marked visited when mounted or changed
  useEffect(() => {
    setVisitedTabs(prev => {
      const next = new Set(prev);
      next.add(activeTab);
      return next;
    });
  }, [activeTab]);


  // Landing Page Mode
  if (activeTab === 'Welcome') {
    return <WelcomeTab onStart={() => { loadData(true); setActiveTab('Home'); }} isDarkMode={isDarkMode} />;
  }

  return (
    <div className="flex h-screen bg-bg-light dark:bg-bg-dark text-text-light dark:text-text-dark overflow-hidden">
      <Sidebar
        subjects={subjects}
        availableDates={availableDates}
        selectedSubject={selectedSubject}
        selectedDateRange={selectedDateRange}
        onSubjectChange={setSelectedSubject}
        onDateRangeChange={setSelectedDateRange}
        onRefresh={() => loadData(true)}
        isDarkMode={isDarkMode}

        onShowFAQ={() => setShowFAQ(true)}
        onShowHealthProfile={() => setActiveTab('HealthProfile')}
        onShowVideoGallery={() => setActiveTab('VideoGallery')}
      />

      <main ref={mainRef} className="flex-1 overflow-auto p-4 md:p-8 pt-16 md:pt-8 relative transition-all duration-300">

        {/* Sync Popup */}
        <AnimatePresence>
          {syncStats && syncStats.visible && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
            >
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl border border-indigo-100 dark:border-indigo-900 pointer-events-auto flex flex-col items-center gap-4 max-w-sm mx-4">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                  <ShieldCheck className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Data Synced Successfully</h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    {syncStats.newCount > 0
                      ? `Added ${syncStats.newCount} new vital logs.`
                      : "No new logs found. Data is up to date."}
                  </p>
                </div>
                <button
                  onClick={() => setSyncStats(null)}
                  className="px-6 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold rounded-lg transition-colors text-sm"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading / Error States */}
        {loading && !syncStats?.visible && (
          <div className="flex items-center justify-center p-12">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-3 text-indigo-600 dark:text-indigo-400 font-medium">Loading Vitals...</span>
          </div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800" role="alert"
          >
            <span className="font-medium">Error:</span> {error}
          </motion.div>
        )}

        {!loading && !error && (
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <h1 className="text-3xl font-bold text-blue-900 dark:text-blue-400">
                {activeTab === 'Home' ? 'Home' : activeTab === 'VideoGallery' ? 'Video Gallery' : (tabs.find(t => t.id === activeTab)?.label || 'Dashboard')}
              </h1>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => setActiveTab('Home')}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
                  title="Go to Home Dashboard"
                >
                  <Home size={20} />
                </button>
                <button
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
                  title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                >
                  {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
                </button>


                <div className="text-left md:text-right text-sm bg-white dark:bg-card-bg-dark p-3 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                  <div><span className="font-bold text-gray-500 dark:text-gray-400">Subject:</span> {selectedSubject}</div>
                  <div>
                    <span className="font-bold text-gray-500 dark:text-gray-400">Date:</span>{' '}
                    {selectedDateRange?.from ? (
                      <>
                        {format(selectedDateRange.from, 'dd-MM-yyyy')}
                        {selectedDateRange.to ? ` - ${format(selectedDateRange.to, 'dd-MM-yyyy')}` : ''}
                      </>
                    ) : <span className="italic">All Dates</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}

            {/* Tabs - Hidden when in Health Profile or Video Gallery */}
            {!['HealthProfile', 'VideoGallery'].includes(activeTab) && (
              <div
                className="border-b border-gray-200 dark:border-gray-700 mb-6 overflow-x-auto overflow-y-hidden whitespace-nowrap"
                onWheel={(e) => {
                  // Optional: Enable horizontal scrolling with vertical mouse wheel
                  if (e.deltaY !== 0) {
                    e.currentTarget.scrollLeft += e.deltaY;
                  }
                }}
              >
                <nav className="-mb-px flex flex-nowrap space-x-8 px-4 min-w-full" aria-label="Tabs">
                  {tabs.map(tab => {
                    const isActive = activeTab === tab.id;
                    const isVisited = visitedTabs.has(tab.id);

                    return (
                      <button
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id)}
                        className={`
                                      whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 flex-shrink-0
                                      ${isActive
                            ? 'hidden' // Active: Hidden from list
                            : isVisited
                              ? 'border-transparent text-gray-700 dark:text-gray-300 hover:text-gray-900 hover:border-gray-300' // Visited: Darker Gray
                              : 'border-transparent text-gray-400 hover:text-gray-600 dark:text-gray-500 hover:border-gray-300' // Unvisited: Lighter Gray
                          }
                                  `}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </nav>
              </div>
            )}

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="min-h-[500px]"
              >
                {activeTab === 'Home' && <HomeTab data={filteredData} isDarkMode={isDarkMode} />}
                {activeTab === 'Gender' && <GenderAnalyticsTab data={filteredData} isDarkMode={isDarkMode} />}
                {activeTab === 'AgeGroup' && <AgeGroupAnalyticsTab data={dateFilteredData} isDarkMode={isDarkMode} />}
                {activeTab === 'Circumstance' && <CircumstanceAnalyticsTab data={filteredData} isDarkMode={isDarkMode} />}
                {activeTab === 'Compare' && <CompareTab data={filteredData} isDarkMode={isDarkMode} />}
                {activeTab === 'Deviation' && <DeviationTab data={filteredData} isDarkMode={isDarkMode} />}
                {activeTab === 'TrustOdin' && <TrustOdinComparisonTab data={filteredData} isDarkMode={isDarkMode} />}
                {activeTab === 'DeepDive' && <DeepDiveTab data={filteredData} isDarkMode={isDarkMode} />}
                {activeTab === 'HealthProfile' && <HealthProfileTab data={filteredData} isDarkMode={isDarkMode} subjectName={selectedSubject} />}
                {activeTab === 'VideoGallery' && <VideoGalleryTab isDarkMode={isDarkMode} />}
                {activeTab === 'Source' && <SourceTab data={data} isDarkMode={isDarkMode} />}
              </motion.div>
            </AnimatePresence>

            {/* FAQ Panel Component - NEW */}
            <FAQPanel
              isOpen={showFAQ}
              onClose={() => setShowFAQ(false)}
            />
            <FAQPanel
              isOpen={showFAQ}
              onClose={() => setShowFAQ(false)}
            />
          </div>
        )}
        <ScrollToTop scrollContainerRef={mainRef} />
      </main>
    </div>
  );
}

export default App;
