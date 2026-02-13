import * as XLSX from "xlsx";

/**
 * Convert a CSV or Excel file buffer into a plain-text table representation
 * that can be sent to the LLM for structured extraction.
 */
export function spreadsheetToText(buffer: Buffer, mimeType: string): string {
  const workbook = XLSX.read(buffer, { type: "buffer" });

  const sheets: string[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const csv = XLSX.utils.sheet_to_csv(sheet, { blankrows: false });

    if (csv.trim()) {
      sheets.push(
        workbook.SheetNames.length > 1
          ? `--- Sheet: ${sheetName} ---\n${csv}`
          : csv,
      );
    }
  }

  return sheets.join("\n\n");
}

const SPREADSHEET_MIMES = new Set([
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

export function isSpreadsheet(mimeType: string): boolean {
  return SPREADSHEET_MIMES.has(mimeType);
}
