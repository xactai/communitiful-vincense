import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import type { DataDict, Reading } from '../types';


const EXCEL_URL = import.meta.env.DEV
  ? '/api/vitals'
  : 'https://docs.google.com/spreadsheets/d/1moJ6MTDPs5JY3Uyut-rkCIRqDYJzjqMHxsZJKh28kvk/export?format=xlsx';

export const fetchAndParseData = async (): Promise<DataDict> => {
  try {
    const response = await fetch(`${EXCEL_URL}${EXCEL_URL.includes('?') ? '&' : '?'}t=${Date.now()}`);
    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: false });

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
          // Manual Excel Serial Date to JS Date (UTC)
          // Excel base date: Dec 30 1899
          // 25569 = Days between 1899-12-30 and 1970-01-01
          const utcMillis = (rawDate - 25569) * 86400 * 1000;
          dateObj = new Date(utcMillis);

          // Adjust for local timezone offset to ensure "2026-02-04" stays "2026-02-04" 
          // when we use it as a base for setHours later.
          // Actually, if we just want the YMD components, using the UTC date object is risky if we use getFullYear() (local).
          // We intentionally construct it as a UTC timestamp. 
          // new Date(utcMillis) creates a Date object pointing to that moment.
          // In Browser (IST), a UTC timestamp of "Midnight" will show as 05:30.
          // This is fine, as long as we don't subtract hours.

        } else if (typeof rawDate === 'string') {
          dateObj = new Date(rawDate);
          if (isNaN(dateObj.getTime())) dateObj = null;
        }

        let timeParts = { h: 0, m: 0, s: 0 };
        let hasTime = false;

        const rawTime = newRow['Time'];
        if (rawTime instanceof Date) {
          timeParts.h = rawTime.getHours();
          timeParts.m = rawTime.getMinutes();
          timeParts.s = rawTime.getSeconds();
          hasTime = true;
        } else if (typeof rawTime === 'number') {
          // Manual Excel Fraction to Time
          // rawTime = 0.5 -> 12:00
          const totalSeconds = Math.round(rawTime * 86400);
          timeParts.h = Math.floor(totalSeconds / 3600);
          timeParts.m = Math.floor((totalSeconds % 3600) / 60);
          timeParts.s = totalSeconds % 60;
          hasTime = true;
        } else if (typeof rawTime === 'string') {
          // ... existing string logic ...
          const parsed = new Date(rawTime);
          if (!isNaN(parsed.getTime())) {
            timeParts.h = parsed.getHours();
            timeParts.m = parsed.getMinutes();
            timeParts.s = parsed.getSeconds();
            hasTime = true;
          } else {
            const parts = rawTime.split(':');
            if (parts.length >= 2) {
              timeParts.h = parseInt(parts[0]) || 0;
              timeParts.m = parseInt(parts[1]) || 0;
              timeParts.s = parseInt(parts[2]) || 0;
              hasTime = true;
            }
          }
        }

        if (dateObj) {
          // If dateObj came from Excel Serial (UTC midnight), it is e.g. 05:30 IST.
          // We want the resulting date to have the Y-M-D of the Excel Date, and H-M-S of the Time.
          // If we use local setters on dateObj:
          // dateObj.setHours(h, m, s).
          // If dateObj is 05:30 IST (starts as UTC midnight).
          // And we set 12:30. It becomes Feb 4 12:30 IST.
          // This preserves the Date (Feb 4) and sets the Time.
          // This assumes Excel Serial Date logic (UTC Midnight) + setHours (Local) works out to "Same Day different time".
          // It DOES, provided timezone offset < 24h.
          // e.g. UTC Midnight = 05:30 IST. setHours(12) -> 12:30 IST. Same day.
          // e.g. UTC Midnight = 19:00 EST (Prev Day). setHours(12) -> 12:00 EST (Next Day? No, same day as 19:00).
          // Wait.
          // If I am in EST (UTC-5).
          // UTC Midnight (Feb 4) is Feb 3 19:00 EST.
          // If I do dateObj.setHours(12).
          // It sets it to Feb 3 12:00 EST.
          // WRONG. It should be Feb 4.

          // Better approach: Extract YMD from the UTC date component, and construct new Local Date.
          // dateObj is from Multi-Platform (String or Number).
          // If Number: dateObj is based on UTC Midnight.
          // If String: dateObj is Local?

          let y, m, d;
          if (typeof rawDate === 'number') {
            // Use UTC methods because we created it from UTC millis
            y = dateObj.getUTCFullYear();
            m = dateObj.getUTCMonth();
            d = dateObj.getUTCDate();
          } else {
            // Use Local methods because new Date("string") is usually local
            y = dateObj.getFullYear();
            m = dateObj.getMonth();
            d = dateObj.getDate();
          }

          const combined = new Date(y, m, d); // Local Midnight
          if (hasTime) {
            combined.setHours(timeParts.h, timeParts.m, timeParts.s);
          } else {
            combined.setHours(0, 0, 0, 0);
          }

          newRow['Timestamp'] = combined.toISOString();
          newRow['Date'] = combined; // Use the Combined Local Date object for filtering

          // Only add DateStr for non-vital sheets (User Request #65)
          if (!['Pulse', 'SpO2', 'Temp', 'Resp'].includes(canonicalKey)) {
            newRow['DateStr'] = format(combined, 'yyyy-MM-dd');
          }
        } else {
          if (!['Pulse', 'SpO2', 'Temp', 'Resp'].includes(canonicalKey)) {
            newRow['DateStr'] = 'Unknown';
          }
        }

        // Global Time Standardization (User Request #66)
        if (hasTime) {
          const t = new Date(0);
          t.setHours(timeParts.h, timeParts.m, timeParts.s);
          newRow['Time'] = format(t, 'HH:mm:ss');
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
