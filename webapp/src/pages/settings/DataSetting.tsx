import { useState, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { exportToExcelTemplate, parseExcelFile, EXPORT_TABLES } from '../../lib/excelUtils';
import { SettingsTabs } from './UsersSetting';
import { Download, Upload, Database } from 'lucide-react';
import { TABLES } from '../../lib/tableConfig';

export default function DataSetting() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [exportTable, setExportTable] = useState('thong_tin_quan_nhan');
  const [importTable, setImportTable] = useState('thong_tin_quan_nhan');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getTableLabel = (id: string) => {
    const t = TABLES.find(x => x.id === id);
    return t ? t.label : id;
  };

  const handleExport = async () => {
    try {
      setIsProcessing(true);
      const dataByTable: Record<string, any[]> = {};
      const { data: tableData, error } = await supabase.from(exportTable).select('*');
      if (error) throw error;
      
      dataByTable[exportTable] = tableData || [];
      exportToExcelTemplate(dataByTable, [exportTable], `Mau_Nhap_Lieu_${exportTable}.xlsx`);
    } catch (err: any) {
      alert('Lỗi xuất Excel: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      const dataByTable = await parseExcelFile(file, [importTable]);

      if (dataByTable[importTable] && dataByTable[importTable].length > 0) {
         const records = dataByTable[importTable];
         let successCount = 0;
         
         for (const record of records) {
            if (!record.ma_dinh_danh) continue; 
            const { data, error } = await supabase.from(importTable).update(record).eq('ma_dinh_danh', record.ma_dinh_danh).select();
            
            if (error) {
              console.error(`Lỗi cập nhật mã ${record.ma_dinh_danh}:`, error);
            } else if (!data || data.length === 0) {
              const { error: insErr } = await supabase.from(importTable).insert([record]);
              if (insErr) {
                console.error(`Lỗi thêm mới mã ${record.ma_dinh_danh}:`, insErr);
              } else {
                successCount++;
              }
            } else {
              successCount++;
            }
         }
         alert(`Đã nhập liệu thành công ${successCount}/${records.length} bản ghi vào bảng ${getTableLabel(importTable)}.`);
      } else {
         alert(`Không tìm thấy dữ liệu hợp lệ trong file Excel cho bảng ${getTableLabel(importTable)}. Vui lòng đảm bảo Tên Sheet (Trang tính) trong Excel phải chính xác là "${getTableLabel(importTable)}".`);
      }

    } catch (err: any) {
      alert('Lỗi nhập Excel: ' + err.message);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="layout-content">
      <div className="layout-header">
        <h1 className="layout-title">
          <Database className="title-icon" />
          Nhập/Xuất Dữ Liệu
        </h1>
      </div>

      <div className="main-content">
        <SettingsTabs />

        <div className="glass-panel" style={{ padding: '1.5rem', marginTop: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', color: 'var(--text-main)' }}>Xuất dữ liệu / Tải file mẫu</h2>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', maxWidth: '500px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Chọn bảng cần xuất:</label>
              <select 
                className="form-control" 
                value={exportTable} 
                onChange={(e) => setExportTable(e.target.value)}
                disabled={isProcessing}
              >
                {EXPORT_TABLES.map(t => (
                  <option key={t} value={t}>{getTableLabel(t)}</option>
                ))}
              </select>
            </div>
            <button className="btn btn-primary" onClick={handleExport} disabled={isProcessing}>
              <Download size={18} />
              Tải xuống
            </button>
          </div>
          <p style={{ marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Hệ thống sẽ tạo một file Excel chỉ chứa sheet của bảng đã chọn, kèm theo toàn bộ dữ liệu hiện tại để bạn có thể chỉnh sửa hàng loạt.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', marginTop: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', color: 'var(--text-main)' }}>Nhập dữ liệu</h2>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', maxWidth: '500px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Chọn bảng cần nhập:</label>
              <select 
                className="form-control" 
                value={importTable} 
                onChange={(e) => setImportTable(e.target.value)}
                disabled={isProcessing}
              >
                {EXPORT_TABLES.map(t => (
                  <option key={t} value={t}>{getTableLabel(t)}</option>
                ))}
              </select>
            </div>
            <label className="btn btn-primary" style={{ margin: 0, cursor: isProcessing ? 'not-allowed' : 'pointer', opacity: isProcessing ? 0.7 : 1 }}>
              <Upload size={18} />
              Tải lên file Excel
              <input 
                type="file" 
                accept=".xlsx, .xls" 
                style={{ display: 'none' }} 
                onChange={handleImport}
                ref={fileInputRef}
                disabled={isProcessing}
              />
            </label>
          </div>
          <p style={{ marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Lưu ý: Tên Sheet trong file Excel tải lên phải khớp chính xác với tên cấu hình của bảng. Hệ thống sẽ căn cứ vào Mã định danh để cập nhật dữ liệu tương ứng.
          </p>
        </div>
      </div>
    </div>
  );
}
