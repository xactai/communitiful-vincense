import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import type { DataDict, Reading } from '../types';

const GOOGLE_SHEET_URL = "https://docs.google.com/spreadsheets/d/1moJ6MTDPs5JY3Uyut-rkCIRqDYJzjqMHxsZJKh28kvk/export?format=xlsx";

const EXCEL_URL = import.meta.env.DEV
  ? '/api/vitals'
  : `https://api.allorigins.win/raw?url=${encodeURIComponent(GOOGLE_SHEET_URL)}`;

export const fetchAndParseData = async (): Promise<DataDict> => {
  try {
    const response = await fetch(EXCEL_URL);
    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });

    const data: DataDict = {};

    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let jsonData = XLSX.utils.sheet_to_json<any>(worksheet, { defval: null });

      const normalizedName = sheetName.toLowerCase().replace(/\s+/g, ' ').trim();

      // Determine the canonical key for this sheet
      let canonicalKey = '';
      if (normalizedName.includes('pulse deviations')) canonicalKey = 'Pulse';
      else if (normalizedName.includes('spo2 deviations')) canonicalKey = 'SpO2';
      else if (normalizedName.includes('skin temp deviations')) canonicalKey = 'Temp';
      else if (normalizedName.includes('respiratory rate')) canonicalKey = 'Resp'; // Relaxed match for truncated title "VinCense Respiratory Rate Devia"
      else if (normalizedName.includes('google form data')) canonicalKey = 'Consolidated';
      else return; // specific requirement to remove unrelated things

      // Process Data Row by Row
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      jsonData = jsonData.map((row: any) => {
        const newRow: Reading = {};

        // 1. Column Mapping & Normalization
        Object.keys(row).forEach(key => {
          let val = row[key];
          let newKey = key.trim(); // Handle "Dr Odin  Readings" double space

          // Map Date/Time
          if (newKey === 'Date of Measurement') newKey = 'Date';
          if (newKey === 'Time of Measurement (24-Hour Format)') newKey = 'Time';
          if (newKey === 'Circumstance of Measurement' || newKey.includes('Circumstance of Measurement')) newKey = 'Circumstance';

          // Map Readings columns (Standardize)
          // VinCense Readings -> same
          // Dr Trust Readings -> same
          // Dr Odin Readings -> same
          // Clean up double spaces
          newKey = newKey.replace(/\s+/g, ' ');

          newRow[newKey] = val;
        });

        // 2. Date/Time Parsing Logic
        let dateObj: Date | null = null;
        const rawDate = newRow['Date'];
        if (rawDate instanceof Date) {
          dateObj = rawDate;
        } else if (typeof rawDate === 'number') {
          dateObj = new Date(Math.round((rawDate - 25569) * 86400 * 1000));
        } else if (typeof rawDate === 'string') {
          dateObj = new Date(rawDate);
          if (isNaN(dateObj.getTime())) dateObj = null;
        }

        let timeObj: Date | null = null;
        const rawTime = newRow['Time'];
        if (rawTime instanceof Date) {
          timeObj = rawTime;
        } else if (typeof rawTime === 'number') {
          const totalSeconds = Math.round(rawTime * 86400);
          timeObj = new Date(0);
          timeObj.setSeconds(totalSeconds);
        } else if (typeof rawTime === 'string') {
          // 1. Try parsing full date string (e.g., "Sat Dec 30 ...")
          const parsed = new Date(rawTime);
          if (!isNaN(parsed.getTime())) {
            timeObj = parsed;
          } else {
            // 2. Fallback to "HH:MM:SS"
            const parts = rawTime.split(':');
            if (parts.length >= 2) {
              timeObj = new Date(0);
              timeObj.setHours(parseInt(parts[0]) || 0, parseInt(parts[1]) || 0, parseInt(parts[2]) || 0);
            }
          }
        }

        if (dateObj) {
          const combined = new Date(dateObj);
          if (timeObj) {
            combined.setHours(timeObj.getHours(), timeObj.getMinutes(), timeObj.getSeconds());
          } else {
            combined.setHours(0, 0, 0, 0);
          }
          newRow['Timestamp'] = combined.toISOString();
          newRow['Date'] = dateObj; // Keep object

          // Only add DateStr for non-vital sheets (User Request #65)
          if (!['Pulse', 'SpO2', 'Temp', 'Resp'].includes(canonicalKey)) {
            newRow['DateStr'] = format(dateObj, 'yyyy-MM-dd');
          }
        } else {
          if (!['Pulse', 'SpO2', 'Temp', 'Resp'].includes(canonicalKey)) {
            newRow['DateStr'] = 'Unknown';
          }
        }

        // Global Time Standardization (User Request #66)
        if (timeObj) {
          newRow['Time'] = format(timeObj, 'HH:mm:ss');
        } else {
          newRow['Time'] = null;
        }

        return newRow;
      });

      data[canonicalKey] = jsonData;
    });

    // Post-Processing: Backfill Gender and Age Group based on Subject Name
    // 1. Build Maps
    const subjectGenderMap: Record<string, string> = {};
    const subjectAgeMap: Record<string, string> = {};

    // Scan all sheets for info
    Object.values(data).forEach(rows => {
      rows.forEach(row => {
        const subj = row['Subject Name'];
        if (!subj) return;
        if (row['Gender']) subjectGenderMap[subj] = row['Gender'];
        if (row['Age Group']) subjectAgeMap[subj] = row['Age Group'];
      });
    });

    // 2. Fill missing info
    Object.values(data).forEach(rows => {
      rows.forEach(row => {
        const subj = row['Subject Name'];
        if (!subj) return;

        if (!row['Gender']) {
          const g = subjectGenderMap[subj];
          if (g) row['Gender'] = g;
        }
        if (!row['Age Group']) {
          const a = subjectAgeMap[subj];
          if (a) row['Age Group'] = a;
        }
      });
    });

    return data;
  } catch (error) {
    console.error("Error loading data:", error);
    throw error;
  }
};

import { startOfDay, endOfDay, isWithinInterval, isSameDay } from 'date-fns';
import type { DateRange } from 'react-day-picker';

// ... (existing helper function usually needed?)
// Actually we can just import from date-fns

// Helper to filter data
export const filterData = (data: DataDict, subject: string, dateRange: DateRange | undefined): DataDict => {
  const filtered: DataDict = {};

  Object.keys(data).forEach(key => {
    const sheetData = data[key];
    if (!sheetData) return;

    // Filter by Subject
    let subset = subject === 'All Subjects'
      ? sheetData
      : sheetData.filter(row => row['Subject Name'] === subject);

    // Filter by Date Range
    if (dateRange?.from) {
      subset = subset.filter(row => {
        if (!row['Date']) return false;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const d = row['Date'] instanceof Date ? row['Date'] : new Date(row['Date'] as any);
        if (isNaN(d.getTime())) return false;

        if (dateRange.to) {
          // Range selection
          return isWithinInterval(d, { start: startOfDay(dateRange.from!), end: endOfDay(dateRange.to) });
        } else {
          // Single date selection
          return isSameDay(d, dateRange.from!);
        }
      });
    }

    filtered[key] = subset;
  });
  return filtered;
};
