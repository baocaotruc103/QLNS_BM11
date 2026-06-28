import { useState, useEffect, useRef } from 'react';
import { X, Save, Camera } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import LocationSelect from './LocationSelect';
import { extractDataFromImage } from '../lib/aiService';

interface RecordModalProps {
  mode: 'view' | 'edit' | 'add';
  tableName: string;
  columns: string[];
  record?: any;
  maDinhDanh?: string;
  formatLabel: (key: string) => string;
  onClose: () => void;
  onRefresh: () => void;
}

const isMonthYearField = (col: string) => col.includes('thang_nam') && !col.includes('ngay_');
const isFullDateField = (col: string) => col.includes('ngay_') || col === 'thoi_gian' || col === 'han_dung';

const renderLabel = (label: string) => {
  if (!label) return label;
  const parts = label.split(/(\(.*?\))/g);
  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith('(') && part.endsWith(')')) {
          return <i key={index} style={{ fontWeight: 'normal', opacity: 0.9 }}>{part}</i>;
        }
        return part;
      })}
    </>
  );
};

const getNoiCapCccd = (dateStr: string) => {
  let parsedDate: Date | null = null;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    const [dd, mm, yyyy] = dateStr.split('/');
    parsedDate = new Date(`${yyyy}-${mm}-${dd}`);
  } else if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    parsedDate = new Date(dateStr);
  }

  if (parsedDate && !isNaN(parsedDate.getTime())) {
    const d2018 = new Date('2018-10-10');
    const d2016 = new Date('2016-01-01');
    if (parsedDate >= d2018) return 'Cục Cảnh sát QLHC về TTXH';
    if (parsedDate >= d2016) return 'Cục Cảnh sát ĐKQL cư trú và DLQG về dân cư';
  }
  return null;
};

export default function RecordModal({ mode, tableName, columns, record, maDinhDanh, formatLabel, onClose, onRefresh }: RecordModalProps) {
  const [formData, setFormData] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [luongRules, setLuongRules] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (tableName === 'luong') {
      fetch('/data/luong_quan_ham_rules.json')
        .then(res => res.json())
        .then(data => setLuongRules(data))
        .catch(console.error);
    }
  }, [tableName]);

  useEffect(() => {
    if (mode === 'edit' || mode === 'view') {
      const initialData = { ...(record || {}) };
      columns.forEach(c => {
        if (isMonthYearField(c) && initialData[c] && /^\d{4}-\d{2}-\d{2}/.test(initialData[c])) {
          const match = initialData[c].match(/^(\d{4})-(\d{2})/);
          if (match) initialData[c] = `${match[2]}/${match[1]}`;
        } else if (isFullDateField(c) && initialData[c] && /^\d{4}-\d{2}-\d{2}/.test(initialData[c])) {
          const match = initialData[c].match(/^(\d{4})-(\d{2})-(\d{2})/);
          if (match) initialData[c] = `${match[3]}/${match[2]}/${match[1]}`;
        }
      });
      setFormData(initialData);
    } else {
      const defaultData: any = {};
      if (maDinhDanh) defaultData.ma_dinh_danh = maDinhDanh;
      if (tableName === 'thong_tin_quan_nhan') {
        defaultData.noi_dang_ky_kcb = 'BVQY103';
        defaultData.dan_toc = 'Kinh';
        defaultData.ton_giao = 'Không';
      }
      setFormData(defaultData);
    }
  }, [mode, record, maDinhDanh, tableName]);

  const handleChange = (col: string, val: string) => {
    setFormData((prev: any) => {
      const next = { ...prev, [col]: val };

      // Tự động điền Hệ số và Quân hàm cho bảng lương
      if (tableName === 'luong' && luongRules) {
        const dienQuanLy = next.dien_quan_ly;
        
        // Xử lý cho Sĩ quan
        if (dienQuanLy === 'Sĩ quan' && col === 'cap_bac') {
          const rule = luongRules.he_so_luong?.find((r: any) => 
            r.doi_tuong_luong === 'Sĩ quan' && r.cap_bac_hien_tai === next.cap_bac
          );
          if (rule) {
            next.he_so_quy_doi = rule.he_so_luong;
          }
        } 
        // Xử lý cho Quân nhân chuyên nghiệp
        else if ((dienQuanLy === 'Quân nhân chuyên nghiệp' || dienQuanLy === 'QNCN') && ['loai_ngach', 'nhom', 'bac', 'dien_quan_ly'].includes(col)) {
          if (next.loai_ngach && next.nhom && next.bac) {
            const nhomStr = next.nhom.includes('Nhóm') ? next.nhom : `Nhóm ${next.nhom}`;
            const bacNum = parseInt(next.bac);
            
            const rule = luongRules.he_so_luong?.find((r: any) => 
              r.doi_tuong_luong === 'Quân nhân chuyên nghiệp' &&
              r.loai_ngach === next.loai_ngach &&
              r.nhom_luong === nhomStr &&
              r.bac_luong === bacNum
            );
            
            if (rule && rule.he_so_luong) {
              next.he_so_quy_doi = rule.he_so_luong;
              
              // Tự động suy ra quân hàm từ hệ số
              const qhRule = luongRules.quan_ham_theo_he_so?.find((r: any) => 
                (r.doi_tuong_luong === 'Quân nhân chuyên nghiệp' || r.doi_tuong_luong === 'Quân nhân chuyên nghiệp (theo hệ số)') &&
                rule.he_so_luong >= r.he_so_tu &&
                (r.he_so_den_duoi === null || rule.he_so_luong < r.he_so_den_duoi)
              );
              if (qhRule) {
                next.cap_bac = qhRule.cap_bac_hien_tai;
              }
            }
          }
        }
      }

      if (col === 'so_the_bhyt' && val && val.length >= 10) {
        next.so_so_bhyt = val.slice(-10);
      }
      if (col === 'ngay_cap_cccd' && val && val.length === 10) {
        const autoNoiCap = getNoiCapCccd(val);
        if (autoNoiCap) next.noi_cap_cccd = autoNoiCap;
      }
      return next;
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExtracting(true);
    try {
      const extractedData = await extractDataFromImage(file);
      setFormData((prev: any) => ({
        ...prev,
        ...extractedData
      }));
    } catch (err: any) {
      alert("Lỗi trích xuất thông tin: " + (err.message || 'Lỗi không xác định'));
    } finally {
      setExtracting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    setSaving(true);
    
    // Only save columns that are in the table schema
    const cleanData: any = {};
    columns.forEach(c => {
      if (formData[c] !== undefined) {
        let val = formData[c];
        if (isMonthYearField(c) && typeof val === 'string' && /^\d{2}\/\d{4}$/.test(val)) {
          const [mm, yyyy] = val.split('/');
          val = `${yyyy}-${mm}-01`;
        } else if (isFullDateField(c) && typeof val === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(val)) {
          const [dd, mm, yyyy] = val.split('/');
          val = `${yyyy}-${mm}-${dd}`;
        }
        cleanData[c] = val === '' ? null : val;
      }
    });

    if (mode === 'edit') {
      const { error } = await supabase.from(tableName).update(cleanData).eq('id', record.id);
      if (!error) {
        onRefresh();
        onClose();
      } else alert("Lỗi khi lưu: " + error.message);
    } else if (mode === 'add') {
      if (maDinhDanh) {
        cleanData.ma_dinh_danh = maDinhDanh;
      }
      const { error } = await supabase.from(tableName).insert([cleanData]);
      if (!error) {
        onRefresh();
        onClose();
      } else alert("Lỗi khi lưu: " + error.message);
    }
    setSaving(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-fade-in" onClick={e => e.stopPropagation()} style={{ width: '90%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
          <h2>
            {mode === 'view' ? 'Chi tiết bản ghi' : mode === 'edit' ? 'Chỉnh sửa bản ghi' : 'Thêm bản ghi mới'}
          </h2>
          <button className="btn btn-outline" style={{ padding: '0.25rem', border: 'none' }} onClick={onClose}><X size={20} /></button>
        </div>

        {tableName === 'thong_tin_quan_nhan' && (['add', 'edit'].includes(mode)) && (
          <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--bg-glass)', padding: '1rem', borderRadius: '12px' }}>
            <input 
              type="file" 
              accept="image/*" 
              capture="environment" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleImageUpload} 
            />
            <button 
              className="btn btn-primary" 
              onClick={() => fileInputRef.current?.click()}
              disabled={extracting}
            >
              <Camera size={18} />
              {extracting ? 'Đang trích xuất...' : 'Chụp ảnh / Tải ảnh lên'}
            </button>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Tự động điền dữ liệu từ ảnh thẻ/hồ sơ bằng AI.
            </div>
            {extracting && <div className="spinner" style={{ width: '20px', height: '20px', borderBottomColor: 'transparent' }}></div>}
          </div>
        )}

        <div className="grid-responsive-4">
          {columns.map(col => {
            if (col === 'id' || col === 'created_at' || col === 'ma_dinh_danh') return null;
            const isAddress = col.includes('_tinh') || col.includes('_xa') || col.includes('_chi_tiet') || col === 'tinh_tp' || col === 'xa_phuong' || col === 'noi_o_chi_tiet';
            return (
              <div className={`form-group ${isAddress ? 'address-field' : ''}`} key={col} style={{ marginBottom: 0 }}>
                <label className="form-label">{renderLabel(formatLabel(col))}</label>
                {mode === 'view' ? (
                  <div className="form-control field-readonly">{formData[col] !== null && formData[col] !== undefined && formData[col] !== '' ? String(formData[col]) : <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Không có dữ liệu</span>}</div>
                ) : col === 'que_quan' ? (
                  <LocationSelect
                    type="combined"
                    value={formData[col] || ''}
                    onChange={(val) => handleChange(col, val)}
                    placeholder={`Chọn ${formatLabel(col).toLowerCase()}...`}
                    disabled={false}
                  />
                ) : col === 'tinh_trang_hon_nhan' ? (
                  <select
                    className="form-control"
                    value={formData[col] || ''}
                    onChange={e => handleChange(col, e.target.value)}
                    disabled={false}
                  >
                    <option value="">Chọn tình trạng...</option>
                    <option value="Độc thân">Độc thân</option>
                    <option value="Đã kết hôn">Đã kết hôn</option>
                    <option value="Đã ly hôn">Đã ly hôn</option>
                  </select>
                ) : col === 'tinh_tp' || col === 'hien_tai_tinh' || col === 'thuong_tru_tinh' || col === 'tam_tru_tinh' ? (
                  <LocationSelect
                    type="province"
                    value={formData[col] || ''}
                    onChange={(val) => {
                      handleChange(col, val);
                      if (col === 'tinh_tp') handleChange('xa_phuong', '');
                      if (col === 'thuong_tru_tinh') handleChange('thuong_tru_xa', '');
                      if (col === 'tam_tru_tinh') handleChange('tam_tru_xa', '');
                      if (col === 'hien_tai_tinh') handleChange('hien_tai_xa', '');
                    }}
                    placeholder={`Chọn ${formatLabel(col).toLowerCase()}...`}
                    disabled={false}
                  />
                ) : col === 'xa_phuong' || col === 'thuong_tru_xa' || col === 'tam_tru_xa' || col === 'hien_tai_xa' ? (
                  <LocationSelect
                    type="ward"
                    value={formData[col] || ''}
                    onChange={(val) => handleChange(col, val)}
                    parentValue={formData[col === 'xa_phuong' ? 'tinh_tp' : col.replace('_xa', '_tinh')] || ''}
                    placeholder={`Chọn ${formatLabel(col).toLowerCase()}...`}
                    disabled={false}
                  />
                ) : isMonthYearField(col) ? (
                  <input
                    type="text"
                    className="form-control"
                    value={formData[col] || ''}
                    disabled={false}
                    placeholder="mm/yyyy"
                    onChange={(e) => {
                      let cleaned = e.target.value.replace(/[^\d/]/g, '');
                      if (cleaned.length === 3 && !cleaned.includes('/')) {
                        cleaned = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
                      }
                      if (cleaned.length > 7) cleaned = cleaned.slice(0, 7);
                      handleChange(col, cleaned);
                    }}
                  />
                ) : isFullDateField(col) ? (
                  <input
                    type="text"
                    className="form-control"
                    value={formData[col] || ''}
                    disabled={false}
                    placeholder="dd/mm/yyyy"
                    onChange={(e) => {
                      let cleaned = e.target.value.replace(/[^\d/]/g, '');
                      if (cleaned.length === 3 && !cleaned.includes('/')) {
                        cleaned = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
                      }
                      if (cleaned.length === 6 && cleaned.split('/').length === 2) {
                        cleaned = cleaned.slice(0, 5) + '/' + cleaned.slice(5);
                      }
                      if (cleaned.length > 10) cleaned = cleaned.slice(0, 10);
                      handleChange(col, cleaned);
                    }}
                  />
                ) : (
                  <>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={formData[col] || ''} 
                      onChange={e => handleChange(col, e.target.value)}
                      placeholder={`Nhập ${formatLabel(col).toLowerCase()}...`}
                      disabled={false}
                      maxLength={col === 'so_the_bhyt' ? 15 : undefined}
                    />
                    {col === 'so_the_bhyt' && formData[col] && formData[col].length < 15 && (
                      <div style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '4px' }}>
                        ⚠️ Thiếu thông tin số thẻ (cần 15 ký tự)
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>

        {mode !== 'view' && (
          <div className="modal-footer" style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button className="btn btn-outline" onClick={onClose} disabled={saving}>Hủy</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              <Save size={18} /> {saving ? 'Đang lưu...' : 'Lưu lại'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
