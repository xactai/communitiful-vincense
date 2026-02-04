
import * as XLSX from 'xlsx';

const EXCEL_URL = "https://docs.google.com/spreadsheets/d/1moJ6MTDPs5JY3Uyut-rkCIRqDYJzjqMHxsZJKh28kvk/export?format=xlsx";

const debug = async () => {
    try {
        console.log("Fetching...");
        const response = await fetch(`${EXCEL_URL}&t=${Date.now()}`);
        const arrayBuffer = await response.arrayBuffer();

        // cellDates: false (default)
        const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: false });

        workbook.SheetNames.forEach((name) => {
            const normalizedName = name.toLowerCase();
            if (normalizedName.includes('consolidated') || normalizedName.includes('google form data')) {
                console.log(`\n--- Inspecting Sheet: ${name} (No Date Parsing) ---`);
                const ws = workbook.Sheets[name];
                const json = XLSX.utils.sheet_to_json(ws);

                if (json.length > 0) {
                    const lastRows = json.slice(-5);
                    console.log("\nLast 5 rows:");
                    lastRows.forEach((row, i) => {
                        // Log Date columns specifically
                        console.log(`Row: ${JSON.stringify(row)}`);
                        console.log(`Date Value: ${row['Date of Measurement']}, Type: ${typeof row['Date of Measurement']}`);
                    });
                }
            }
        });

    } catch (e) {
        console.error(e);
    }
}

debug();
