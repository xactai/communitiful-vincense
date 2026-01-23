import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import type { DataDict, Reading } from '../types';

const EXCEL_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQPCLzin2pR5jVa0bhrkCFA1-OKLK4keneBdnzOhwucVjbqCogAr3xWyQ3ivxxgwHDFsSICVo_G4nA5/pub?output=xlsx";

export const fetchAndParseData = async (): Promise<DataDict> => {
  try {
    const response = await fetch(EXCEL_URL);
    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
    
    const data: DataDict = {};

    workbook.SheetNames.forEach(sheetName => {
      if (['Sunaina', 'Chandini'].includes(sheetName)) return;

      const worksheet = workbook.Sheets[sheetName];
      let jsonData = XLSX.utils.sheet_to_json<Reading>(worksheet, { defval: null });

      // Process Data
      jsonData = jsonData.map(row => {
        // Create a shallow copy to modify
        const newRow: Reading = { ...row };
        
        // Ensure Date is a Date object if it was parsed as such, or string
        let dateObj: Date | null = null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawDate: any = row['Date'];
        if (rawDate instanceof Date) {
            dateObj = rawDate;
        } else if (typeof rawDate === 'number') {
             // XLSX should have handled this with cellDates: true, but just in case
             dateObj = new Date(Math.round((rawDate - 25569)*86400*1000));
        } else if (typeof rawDate === 'string') {
             // Try parsing
             dateObj = new Date(rawDate);
             if (isNaN(dateObj.getTime())) dateObj = null;
        }

        let timeObj: Date | null = null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawTime: any = row['Time'];
        if (rawTime instanceof Date) {
            timeObj = rawTime;
        } else if (typeof rawTime === 'number') {
             // Fraction of day
             const totalSeconds = Math.round(rawTime * 86400);
             timeObj = new Date(0);
             timeObj.setSeconds(totalSeconds);
        } else if (typeof rawTime === 'string') {
             // Parse "HH:MM:SS"
             const parts = rawTime.split(':');
             if (parts.length >= 2) {
                 timeObj = new Date(0);
                 timeObj.setHours(parseInt(parts[0]) || 0, parseInt(parts[1]) || 0, parseInt(parts[2]) || 0);
             }
        }

        // Combine
        if (dateObj) {
             // Fix timezone offset issues if simple Date() usage shifted it?
             // Usually Excel dates are local or UTC depending on parsing.
             // We'll treat them as local for simplicity.
             
             const combined = new Date(dateObj);
             if (timeObj) {
                 combined.setHours(timeObj.getHours(), timeObj.getMinutes(), timeObj.getSeconds());
             } else {
                 // Default to midnight if no time
                 combined.setHours(0, 0, 0, 0);
             }
             newRow['Timestamp'] = combined.toISOString(); // Store as ISO string for serialization
             newRow['Date'] = dateObj; // Keep the Date object for filtering
             
             // Format Date string for display/filtering if needed
             // We might want a standardized string 'YYYY-MM-DD' for easier filtering
             newRow['DateStr'] = format(dateObj, 'yyyy-MM-dd');
        }
        
        return newRow;
      });
      
      // Rename columns logic
      // Python: 'Dr Trust' -> 'Dr Trust Pulse Oximeter' etc.
      jsonData = jsonData.map(row => {
        const renamedRow: Reading = {};
        Object.keys(row).forEach(key => {
          let newKey = key;
          if (key.includes('Dr Trust') && !key.includes('Pulse Oximeter')) {
            newKey = key.replace('Dr Trust', 'Dr Trust Pulse Oximeter');
          }
          if (key.includes('Noise') && !key.includes('SmartWatch')) {
            newKey = key.replace('Noise', 'Noise SmartWatch');
          }
          renamedRow[newKey] = row[key];
        });
        return renamedRow;
      });

      // Special handling for Consolidated sheet (limit cols?)
      // Python: if sheet == 'Consolidated': usecols=range(7)
      if (sheetName === 'Consolidated') {
          // Filter keys to first 7 if we knew which ones, but JSON objects are unordered.
          // We'll skip specific col limiting for now unless critical.
          data['Consolidated'] = jsonData;
      } else {
          // Map to standardized keys based on sheet name
          if (sheetName.includes('Pulse') && sheetName.includes('Deviations')) data['Pulse'] = jsonData;
          else if (sheetName.includes('SPO2') && sheetName.includes('Deviations')) data['SpO2'] = jsonData;
          else if (sheetName.includes('SpO2') && sheetName.includes('Deviations')) data['SpO2'] = jsonData;
          else if (sheetName.includes('Respiratory') && sheetName.includes('Deviations')) data['Resp'] = jsonData;
          else if (sheetName.includes('Skin Temp') && sheetName.includes('Deviations')) data['Temp'] = jsonData;
          else data[sheetName] = jsonData;
      }
    });

    return data;
  } catch (error) {
    console.error("Error loading data:", error);
    throw error;
  }
};

// Helper to filter data
export const filterData = (data: DataDict, subject: string, dateStr: string): DataDict => {
  const filtered: DataDict = {};
  Object.keys(data).forEach(key => {
    const sheetData = data[key];
    if (!sheetData) return;

    // Filter by Subject
    let subset = sheetData.filter(row => row['Subject Name'] === subject);
    
    // Filter by Date
    if (dateStr && dateStr !== "All Dates") {
       // dateStr is 'DD-MM-YYYY' from the UI options
       // row['Date'] is a Date object (if we parsed correctly)
       subset = subset.filter(row => {
           if (!row['Date']) return false;
           // eslint-disable-next-line @typescript-eslint/no-explicit-any
           const d = row['Date'] instanceof Date ? row['Date'] : new Date(row['Date'] as any);
           if (isNaN(d.getTime())) return false;
           return format(d, 'dd-MM-yyyy') === dateStr;
       });
    }
    
    filtered[key] = subset;
  });
  return filtered;
};
