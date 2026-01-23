import { useEffect, useState, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { fetchAndParseData, filterData } from './utils/dataLoader';
import type { DataDict } from './types';
import { format } from 'date-fns';
import { HomeTab } from './components/HomeTab';
import { CompareTab } from './components/CompareTab';
import { DeviationTab } from './components/DeviationTab';
import { DeepDiveTab } from './components/DeepDiveTab';
import { SourceTab } from './components/SourceTab';

function App() {
  const [data, setData] = useState<DataDict>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('All Dates');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('Home');

  // Theme Toggle Effect
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Data Fetching
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const loadedData = await fetchAndParseData();
      setData(loadedData);
    } catch (err) {
      setError("Failed to load data. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute Available Subjects
  const subjects = useMemo(() => {
    const allSubjects = new Set<string>();
    Object.values(data).forEach(sheetData => {
      sheetData.forEach(row => {
        if (row['Subject Name']) {
          allSubjects.add(String(row['Subject Name']));
        }
      });
    });
    return Array.from(allSubjects).sort();
  }, [data]);

  // Set default subject if not selected
  useEffect(() => {
    if (!selectedSubject && subjects.length > 0) {
      setSelectedSubject(subjects[0]);
    }
  }, [subjects, selectedSubject]);

  // Compute Available Dates for Selected Subject
  const dates = useMemo(() => {
    const allDates = new Set<string>();
    if (selectedSubject) {
      Object.values(data).forEach(sheetData => {
        sheetData.forEach(row => {
          if (row['Subject Name'] === selectedSubject && row['Date']) {
            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const rawDate: any = row['Date'];
                const d = rawDate instanceof Date ? rawDate : new Date(rawDate);
                if (!isNaN(d.getTime())) {
                   allDates.add(format(d, 'dd-MM-yyyy'));
                }
            } catch (e) {
                // ignore invalid dates
            }
          }
        });
      });
    }
    return ['All Dates', ...Array.from(allDates).sort((a, b) => {
         const [da, ma, ya] = a.split('-').map(Number);
         const [db, mb, yb] = b.split('-').map(Number);
         return new Date(yb, mb-1, db).getTime() - new Date(ya, ma-1, da).getTime();
    })]; 
  }, [data, selectedSubject]);

  // Reset Date when Subject changes
  useEffect(() => {
     if (selectedDate !== 'All Dates' && !dates.includes(selectedDate)) {
         setSelectedDate(dates.length > 1 ? dates[1] : 'All Dates');
     } else if (selectedDate === 'All Dates' && dates.length > 1 && !selectedDate) {
         setSelectedDate(dates[1]); 
     }
     if (selectedDate === '' && dates.length > 0) {
         setSelectedDate(dates.length > 1 ? dates[1] : dates[0]);
     }
  }, [dates, selectedDate]);


  // Filter Data
  const filteredData = useMemo(() => {
    return filterData(data, selectedSubject, selectedDate);
  }, [data, selectedSubject, selectedDate]);

  const tabs = [
      { id: 'Home', label: 'Home' },
      { id: 'Compare', label: 'Cross Device Comparison' },
      { id: 'Deviation', label: 'Error & Deviation Analytics' },
      { id: 'DeepDive', label: 'VinCense Accuracy Overview' },
      { id: 'Source', label: 'Data Source' }
  ];

  return (
    <div className="flex h-screen bg-bg-light dark:bg-bg-dark text-text-light dark:text-text-dark overflow-hidden">
      <Sidebar
        subjects={subjects}
        dates={dates}
        selectedSubject={selectedSubject}
        selectedDate={selectedDate}
        onSubjectChange={setSelectedSubject}
        onDateChange={setSelectedDate}
        onRefresh={loadData}
        isDarkMode={isDarkMode}
        toggleTheme={() => setIsDarkMode(!isDarkMode)}
      />
      
      <main className="flex-1 overflow-auto p-8 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-black/50 z-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        )}
        
        {error && (
             <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800" role="alert">
                <span className="font-medium">Error:</span> {error}
             </div>
        )}

        {!loading && !error && (
           <div className="max-w-7xl mx-auto">
               {/* Header */}
               <div className="flex justify-between items-start mb-8">
                   <h1 className="text-3xl font-bold text-blue-900 dark:text-blue-400">
                        {tabs.find(t => t.id === activeTab)?.label || 'Dashboard'}
                   </h1>
                   <div className="text-right text-sm">
                       <div><span className="font-bold">Subject:</span> {selectedSubject}</div>
                       <div><span className="font-bold">Date:</span> {selectedDate}</div>
                   </div>
               </div>
               
               {/* Tabs */}
               <div className="border-b border-gray-200 dark:border-gray-700 mb-6 overflow-x-auto">
                   <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                       {tabs.map(tab => (
                           <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                                    ${activeTab === tab.id
                                        ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'}
                                `}
                           >
                               {tab.label}
                           </button>
                       ))}
                   </nav>
               </div>
               
               <div className="min-h-[500px]">
                   {activeTab === 'Home' && <HomeTab data={filteredData} />}
                   {activeTab === 'Compare' && <CompareTab data={filteredData} isDarkMode={isDarkMode} />}
                   {activeTab === 'Deviation' && <DeviationTab data={filteredData} isDarkMode={isDarkMode} />}
                   {activeTab === 'DeepDive' && <DeepDiveTab data={filteredData} isDarkMode={isDarkMode} />}
                   {activeTab === 'Source' && <SourceTab data={data} isDarkMode={isDarkMode} />}
               </div>
           </div>
        )}
      </main>
    </div>
  );
}

export default App;
