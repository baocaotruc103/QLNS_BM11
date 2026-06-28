import * as XLSX from 'xlsx';
import { TABLES, formatFieldLabel } from './tableConfig';

export const EXPORT_TABLES = ['thong_tin_quan_nhan', 'thong_tin_chung', 'bhyt_than_nhan'];

// Translate column keys to Vietnamese labels for Excel headers
export const getHeadersForTable = (tableName: string) => {
  const tableConfig = TABLES.find(t => t.id === tableName);
  if (!tableConfig) return [];
  return tableConfig.columns.map(col => ({
    key: col,
    label: formatFieldLabel(col)
  }));
};

// Create a workbook with sheets for the specified tables
export const exportToExcelTemplate = (dataByTable: Record<string, any[]>, filename: string = 'Mau_Nhap_Lieu_Nhan_Su.xlsx') => {
  const wb = XLSX.utils.book_new();

  EXPORT_TABLES.forEach(tableName => {
    const tableConfig = TABLES.find(t => t.id === tableName);
    if (!tableConfig) return;

    const headers = getHeadersForTable(tableName);
    const headerRow = headers.map(h => h.label);
    
    // Prepare data rows
    const data = dataByTable[tableName] || [];
    const rows = data.map(row => {
      return headers.map(h => row[h.key] === null || row[h.key] === undefined ? '' : row[h.key]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet([headerRow, ...rows]);
    
    // Auto-size columns slightly
    const colWidths = headerRow.map(h => ({ wch: Math.max(h.length, 15) }));
    worksheet['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, worksheet, tableConfig.label);
  });

  XLSX.writeFile(wb, filename);
};

export const parseExcelFile = async (file: File): Promise<Record<string, any[]>> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        
        const result: Record<string, any[]> = {};

        EXPORT_TABLES.forEach(tableName => {
          const tableConfig = TABLES.find(t => t.id === tableName);
          if (!tableConfig) return;

          const sheetName = tableConfig.label;
          const worksheet = workbook.Sheets[sheetName];
          
          if (worksheet) {
            const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            if (rawData.length > 1) {
              const headers = getHeadersForTable(tableName);
              const headerRow = rawData[0];
              
              // Map Vietnamese labels back to DB column keys
              const keyMap: Record<number, string> = {};
              headerRow.forEach((label: string, index: number) => {
                const headerDef = headers.find(h => h.label === label);
                if (headerDef) {
                  keyMap[index] = headerDef.key;
                }
              });

              const rowsData = [];
              for (let i = 1; i < rawData.length; i++) {
                const row = rawData[i];
                if (!row || row.length === 0) continue;
                
                let isEmpty = true;
                const rowObj: any = {};
                
                Object.keys(keyMap).forEach(idxStr => {
                  const idx = parseInt(idxStr);
                  let val = row[idx];
                  
                  // Handle Date objects parsed by sheetjs
                  if (val instanceof Date) {
                    val = new Date(val.getTime() - (val.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
                  } else if (typeof val === 'string') {
                    val = val.trim();
                  }

                  if (val !== undefined && val !== null && val !== '') {
                    isEmpty = false;
                    rowObj[keyMap[idx]] = val;
                  }
                });

                if (!isEmpty) {
                  rowsData.push(rowObj);
                }
              }
              
              result[tableName] = rowsData;
            }
          }
        });

        resolve(result);
      } catch (err) {
        reject(err);
      }
    };
    
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};
