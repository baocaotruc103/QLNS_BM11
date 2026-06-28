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
    if (tableName === 'luong' || tableName === 'qua_trinh_luong') {
      fetch('/data/quy_tac_luong.json')
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
      
      if (tableName === 'luong' && maDinhDanh) {
        supabase
          .from('luong')
          .select('loai_ngach, nhom, bac, dien_quan_ly, don_vi_cong_tac, don_vi_cong_tac_chi_tiet')
          .eq('ma_dinh_danh', maDinhDanh)
          .order('tu_thang_nam', { ascending: false, nullsFirst: false })
          .limit(1)
          .then(({ data }) => {
            if (data && data.length > 0) {
              const latest = data[0];
              const newData = { ...defaultData };
              if (latest.dien_quan_ly) newData.dien_quan_ly = latest.dien_quan_ly;
              if (latest.loai_ngach) newData.loai_ngach = latest.loai_ngach;
              if (latest.nhom) newData.nhom = latest.nhom;
              if (latest.don_vi_cong_tac) newData.don_vi_cong_tac = latest.don_vi_cong_tac;
              if (latest.don_vi_cong_tac_chi_tiet) newData.don_vi_cong_tac_chi_tiet = latest.don_vi_cong_tac_chi_tiet;
              
              if (latest.bac) {
                const bacStr = String(latest.bac);
                const bacMatch = bacStr.match(/(\d+)$/);
                if (bacMatch) {
                  const newBacNum = parseInt(bacMatch[1]) + 1;
                  newData.bac = bacStr.replace(/\d+$/, String(newBacNum));
                }
              }
              
              // Apply rules if available
              if (luongRules && newData.dien_quan_ly && newData.loai_ngach && newData.nhom && newData.bac) {
                const nhomStr = newData.nhom.includes('Nhóm') ? newData.nhom : `Nhóm ${newData.nhom}`;
                const bacNum = parseInt(newData.bac);
                const rule = luongRules.he_so_luong?.find((r: any) => 
                  r.doi_tuong_luong === 'Quân nhân chuyên nghiệp' &&
                  r.loai_ngach === newData.loai_ngach &&
                  r.nhom_luong === nhomStr &&
                  r.bac_luong === bacNum
                );
                
                if (rule && rule.he_so_luong) {
                  newData.he_so_quy_doi = rule.he_so_luong;
                  const qhRule = luongRules.quan_ham_theo_he_so?.find((r: any) => 
                    (r.doi_tuong_luong === 'Quân nhân chuyên nghiệp' || r.doi_tuong_luong === 'Quân nhân chuyên nghiệp (theo hệ số)') &&
                    rule.he_so_luong >= r.he_so_tu &&
                    (r.he_so_den_duoi === null || rule.he_so_luong < r.he_so_den_duoi)
                  );
                  if (qhRule) {
                    newData.cap_bac = qhRule.cap_bac_hien_tai;
                  }
                }
              }

              setFormData(newData);
            } else {
              setFormData(defaultData);
            }
          });
      } else {
        setFormData(defaultData);
      }
    }
  }, [mode, record, maDinhDanh, tableName, luongRules]);

  const mapDienQuanLyToSubjectType = (d: string) => {
    if (!d) return null;
    if (d.includes('Sĩ quan')) return 'SQ';
    if (d.includes('Quân nhân chuyên nghiệp') || d === 'QNCN') return 'QNCN';
    if (d.includes('Công nhân quốc phòng')) return 'CNQP';
    if (d.includes('Viên chức quốc phòng')) return 'VCQP';
    if (d === 'Viên chức') return 'VC';
    if (d.includes('Lao động hợp đồng') || d.includes('LĐHĐ')) return 'LDHD';
    if (d.includes('Hạ sĩ quan, Binh sĩ')) return 'HSQBS';
    return null;
  };

  const handleChange = (col: string, val: string) => {
    setFormData((prev: any) => {
      const next = { ...prev, [col]: val };

      // Tự động điền Hệ số và Quân hàm cho bảng lương
      if ((tableName === 'luong' || tableName === 'qua_trinh_luong') && luongRules?.salary_tables) {
        const dienQuanLy = next.dien_quan_ly;
        const subjectType = mapDienQuanLyToSubjectType(dienQuanLy);
        if (subjectType && (next.loai_ngach || next.nhom || next.cap_bac) && next.bac) {
            const bacMatch = String(next.bac).match(/\d+/);
            const bacNum = bacMatch ? parseInt(bacMatch[0]) : 1;
            
            let foundTable: any = null;
            
            for (const key in luongRules.salary_tables) {
                const table = luongRules.salary_tables[key];
                if (table.subject_type === subjectType) {
                    let tableClass = (table.salary_class || '').toLowerCase();
                    let tableGroup = (table.salary_group || '').toLowerCase();
                    
                    let inputClass = (next.loai_ngach || '').toLowerCase().trim();
                    if (inputClass.includes('cao cấp')) inputClass = 'cao cấp';
                    else if (inputClass.includes('trung cấp')) inputClass = 'trung cấp';
                    else if (inputClass.includes('sơ cấp')) inputClass = 'sơ cấp';
                    else if (inputClass.includes('a3')) inputClass = 'a3';
                    else if (inputClass.includes('a2')) inputClass = 'a2';
                    else if (inputClass.includes('a1')) inputClass = 'a1';
                    else if (inputClass.includes('a0')) inputClass = 'a0';
                    else if (inputClass.includes('b')) inputClass = 'loại b';
                    else if (inputClass.includes('c')) inputClass = 'loại c';
                    
                    let inputGroup = (next.nhom || '').toLowerCase().trim();
                    if (subjectType !== 'SQ') {
                        const match = inputGroup.match(/\d+/);
                        if (match) inputGroup = 'nhóm ' + match[0];
                    } else {
                        inputGroup = (next.cap_bac || next.nhom || '').toLowerCase().trim();
                    }
                    
                    const classMatch = !tableClass || !inputClass || tableClass.includes(inputClass);
                    const groupMatch = !tableGroup || !inputGroup || tableGroup.includes(inputGroup) || inputGroup.includes(tableGroup);
                    
                    if (classMatch && groupMatch) {
                        foundTable = table;
                        break;
                    }
                }
            }
            
            if (foundTable && foundTable.coefficients && foundTable.coefficients[bacNum]) {
                next.he_so_quy_doi = foundTable.coefficients[bacNum];
                
                if (subjectType === 'SQ' && foundTable.salary_group) {
                    next.cap_bac = foundTable.salary_group;
                } else if (subjectType === 'QNCN') {
                    // Cấp bậc cứng cho QNCN dựa trên hệ số
                    const hs = parseFloat(next.he_so_quy_doi);
                    if (hs < 3.95) next.cap_bac = 'Thiếu úy QNCN';
                    else if (hs < 4.45) next.cap_bac = 'Trung úy QNCN';
                    else if (hs < 4.90) next.cap_bac = 'Thượng úy QNCN';
                    else if (hs < 5.30) next.cap_bac = 'Đại úy QNCN';
                    else if (hs < 6.10) next.cap_bac = 'Thiếu tá QNCN';
                    else if (hs < 6.80) next.cap_bac = 'Trung tá QNCN';
                    else if (hs < 7.50) next.cap_bac = 'Thượng tá QNCN';
                    else next.cap_bac = 'Đại tá QNCN';
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
                ) : ['tinh_tham_nien', 'tinh_huong_tro_cap', 'tinh_dong_bhxh'].includes(col) ? (
                  <select
                    className="form-control"
                    value={formData[col] || ''}
                    onChange={e => handleChange(col, e.target.value)}
                    disabled={false}
                  >
                    <option value="">Chọn...</option>
                    <option value="Có">Có</option>
                    <option value="Không">Không</option>
                  </select>
                ) : col === 'che_do_luong' ? (
                  <select
                    className="form-control"
                    value={formData[col] || ''}
                    onChange={e => handleChange(col, e.target.value)}
                    disabled={false}
                  >
                    <option value="">Chọn chế độ...</option>
                    <option value="Tuyển dụng LĐHĐ">Tuyển dụng LĐHĐ</option>
                    <option value="Tuyển dụng QNCN">Tuyển dụng QNCN</option>
                    <option value="Tuyển chọn QNCN">Tuyển chọn QNCN</option>
                    <option value="HSQ-BS sang QNCN">HSQ-BS sang QNCN</option>
                    <option value="VCQP sang QNCN">VCQP sang QNCN</option>
                    <option value="VCQP sang Sỹ quan">VCQP sang Sỹ quan</option>
                    <option value="Tuyển chọn VCQP">Tuyển chọn VCQP</option>
                  </select>
                ) : col === 'dien_quan_ly' ? (
                  <select
                    className="form-control"
                    value={formData[col] || ''}
                    onChange={e => handleChange(col, e.target.value)}
                    disabled={false}
                  >
                    <option value="">Chọn diện quản lý...</option>
                    <option value="Sĩ quan">Sĩ quan</option>
                    <option value="Quân nhân chuyên nghiệp">Quân nhân chuyên nghiệp (QNCN)</option>
                    <option value="Công nhân quốc phòng">Công nhân quốc phòng (CNQP)</option>
                    <option value="Viên chức quốc phòng">Viên chức quốc phòng (VCQP)</option>
                    <option value="Hạ sĩ quan, Binh sĩ">Hạ sĩ quan, Binh sĩ</option>
                    <option value="Lao động hợp đồng">Lao động hợp đồng (LĐHĐ)</option>
                  </select>
                ) : col === 'loai_ngach' && luongRules?.fields?.salary_class?.options_by_subject_type?.[mapDienQuanLyToSubjectType(formData.dien_quan_ly) || ''] ? (
                  <select
                    className="form-control"
                    value={formData[col] || ''}
                    onChange={e => handleChange(col, e.target.value)}
                    disabled={false}
                  >
                    <option value="">Chọn loại/ngạch...</option>
                    {luongRules.fields.salary_class.options_by_subject_type[mapDienQuanLyToSubjectType(formData.dien_quan_ly)!].map((opt: string) => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : col === 'nhom' && luongRules?.fields?.salary_group?.options_by_salary_class?.[formData.loai_ngach] ? (
                  <select
                    className="form-control"
                    value={formData[col] || ''}
                    onChange={e => handleChange(col, e.target.value)}
                    disabled={false}
                  >
                    <option value="">Chọn nhóm...</option>
                    {luongRules.fields.salary_group.options_by_salary_class[formData.loai_ngach].map((opt: any) => (
                        <option key={opt.code} value={opt.label}>{opt.label}</option>
                    ))}
                  </select>
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
