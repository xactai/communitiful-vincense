
import * as XLSX from 'xlsx';

const EXCEL_URL = "https://docs.google.com/spreadsheets/d/1moJ6MTDPs5JY3Uyut-rkCIRqDYJzjqMHxsZJKh28kvk/export?format=xlsx";

const debug = async () => {
    try {
        console.log("Fetching data from:", EXCEL_URL);
        const response = await fetch(`${EXCEL_URL}&t=${Date.now()}`);
        console.log("Response status:", response.status);

        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });

        console.log("\nSheet Names:", workbook.SheetNames);

        workbook.SheetNames.forEach((name) => {
            // Look for the "Consolidated" sheet or similar which usually has the data
            const normalizedName = name.toLowerCase();
            if (normalizedName.includes('consolidated') || normalizedName.includes('google form data')) {
                console.log(`\n--- Inspecting Sheet: ${name} ---`);
                const ws = workbook.Sheets[name];
                const json = XLSX.utils.sheet_to_json(ws);

                // Sort by date/timestamp if possible to see latest
                console.log(`Total rows: ${json.length}`);
                if (json.length > 0) {
                    // Check the last few rows
                    const lastRows = json.slice(-10);
                    console.log("\nLast 10 rows:");
                    lastRows.forEach((row, i) => {
                        console.log(`[${json.length - 10 + i + 1}]`, JSON.stringify(row));
                    });
                }
            }
        });

    } catch (e) {
        console.error("Error fetching data:", e);
    }
}

debug();
