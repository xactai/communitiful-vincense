import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType, TextRun } from 'docx';
import { saveAs } from 'file-saver';
import type { Reading } from '../types';

export const exportCSV = (data: Reading[], filename: string) => {
  const ws = XLSX.utils.json_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `${filename}.csv`);
};

export const exportExcel = (data: Reading[], sheetName: string, filename: string) => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

export const exportPDF = (data: Reading[], title: string, filename: string) => {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  
  // Table
  if (data.length > 0) {
      const headers = Object.keys(data[0]);
      // Limit to first 10 columns for PDF width issues or landscape?
      // Streamlit code just took all columns but PDF might overflow.
      // AutoTable handles this somewhat.
      
      const rows = data.map(row => headers.map(h => String(row[h] ?? '')));
      
      autoTable(doc, {
          head: [headers],
          body: rows,
          startY: 30,
          styles: { fontSize: 8 },
          theme: 'grid'
      });
  }
  
  doc.save(`${filename}.pdf`);
};

export const exportDOCX = async (data: Reading[], title: string, filename: string) => {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const rows = data.map(row => 
      new TableRow({
          children: headers.map(h => 
              new TableCell({
                  children: [new Paragraph(String(row[h] ?? ''))],
              })
          ),
      })
  );

  const table = new Table({
      rows: [
          new TableRow({
              children: headers.map(h => 
                  new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: h, bold: true })] })],
                  })
              ),
          }),
          ...rows
      ],
      width: {
          size: 100,
          type: WidthType.PERCENTAGE,
      },
  });

  const doc = new Document({
      sections: [{
          properties: {},
          children: [
              new Paragraph({ text: title, heading: "Heading1" }),
              table
          ],
      }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${filename}.docx`);
};
