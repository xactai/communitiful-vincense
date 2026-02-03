
import * as XLSX from 'xlsx';

const EXCEL_URL = "https://docs.google.com/spreadsheets/d/1moJ6MTDPs5JY3Uyut-rkCIRqDYJzjqMHxsZJKh28kvk/export?format=xlsx";

const debug = async () => {
    try {
        console.log("Fetching...");
        const response = await fetch(EXCEL_URL);
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });

        workbook.SheetNames.forEach((name) => {
            const ws = workbook.Sheets[name];
            const json = XLSX.utils.sheet_to_json(ws, { limit: 1 });
            if (json.length > 0) {
                console.log(`Sheet: "${name}" columns:`, Object.keys(json[0]));
            }
        });

    } catch (e) {
        console.error(e);
    }
}

debug();
