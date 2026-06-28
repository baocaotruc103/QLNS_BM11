import * as XLSX from 'xlsx';
import { TABLES, formatFieldLabel } from './tableConfig';

export const EXPORT_TABLES = ['thong_tin_quan_nhan', 'thong_tin_chung', 'bhyt_than_nhan', 'thong_tin_nhan_than', 'luong'];

// Translate column keys to Vietnamese labels for Excel headers
export const getHeadersForTable = (tableName: string) => {
  const tableConfig = TABLES.find(t => t.id === tableName);
  if (!tableConfig) return [];
  const columns = ['id', ...tableConfig.columns.filter(c => c !== 'id')];
  return columns.map(col => ({
    key: col,
    label: col === 'id' ? 'ID (Không sửa)' : formatFieldLabel(col)
  }));
};

// Create a workbook with sheets for the specified tables
export const exportToExcelTemplate = (dataByTable: Record<string, any[]>, tablesToExport: string[] = EXPORT_TABLES, filename: string = 'Mau_Nhap_Lieu_Nhan_Su.xlsx') => {
  const wb = XLSX.utils.book_new();

  tablesToExport.forEach(tableName => {
    const tableConfig = TABLES.find(t => t.id === tableName);
    if (!tableConfig) return;

    const headers = getHeadersForTable(tableName);
    const headerRow = headers.map(h => h.label);
    
    // Prepare data rows
    const data = dataByTable[tableName] || [];
    const rows = data.map(row => {
      return headers.map(h => {
        let val = row[h.key];
        if (val === null || val === undefined) return '';
        if (typeof val === 'string') {
          if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
            const [y, m, d] = val.split('-');
            return `${d}/${m}/${y}`;
          } else if (/^\d{4}-\d{2}$/.test(val)) {
            const [y, m] = val.split('-');
            return `${m}/${y}`;
          }
        }
        return val;
      });
    });

    const worksheet = XLSX.utils.aoa_to_sheet([headerRow, ...rows]);
    
    // Auto-size columns slightly
    const colWidths = headerRow.map(h => ({ wch: Math.max(h.length, 15) }));
    worksheet['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, worksheet, tableConfig.label);
  });

  XLSX.writeFile(wb, filename);
};

export const parseExcelFile = async (file: File, tablesToImport: string[] = EXPORT_TABLES): Promise<Record<string, any[]>> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        
        const result: Record<string, any[]> = {};

        tablesToImport.forEach(tableName => {
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
                    // Convert dd/mm/yyyy to yyyy-mm-dd
                    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(val)) {
                      const parts = val.split('/');
                      const d = parts[0].padStart(2, '0');
                      const m = parts[1].padStart(2, '0');
                      const y = parts[2];
                      val = `${y}-${m}-${d}`;
                    } 
                    // Convert mm/yyyy to yyyy-mm-01
                    else if (/^\d{1,2}\/\d{4}$/.test(val)) {
                      const parts = val.split('/');
                      const m = parts[0].padStart(2, '0');
                      const y = parts[1];
                      val = `${y}-${m}-01`;
                    }
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
