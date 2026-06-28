import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { ArrowLeft, Edit, Plus, Save, UserCircle, X, Camera } from 'lucide-react';
import DataTable from '../components/DataTable';
import { extractDataFromImage } from '../lib/aiService';

import LocationSelect from '../components/LocationSelect';
import { PARENT_TABLE, TABLES, formatFieldLabel, getTableConfig } from '../lib/tableConfig';

const SYSTEM_COLUMNS = ['id', 'created_at', 'updated_at', 'stt', 'trang_thai_du_lieu_cap_2'];

const isMonthYearField = (col: string) => col.includes('thang_nam') && !col.includes('ngay_');
const isFullDateField = (col: string) => col.includes('ngay_');

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

const formatDateValue = (value: any) => {
  if (!value) return '-';
  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
    const match = text.match(/^(\d{4})-(\d{2})/);
    if (match) return `${match[2]}/${match[1]}`;
  }
  return text;
};
const INLINE_FORM_TABLES = [PARENT_TABLE, 'thong_tin_chung', 'nhan_dang'];

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

const DAO_TAO_TABLE = 'thong_tin_dao_tao';
const DAO_TAO_SUMMARY_COLUMNS = [
  'trinh_do_van_hoa',
  'trinh_do_dao_tao_cao_nhat',
  'nganh_nghe_dao_tao_cao_nhat',
  'nam_tot_nghiep',
  'trinh_do_dt_cnqs',
  'nganh_nghe_dt_cnqs',
];
const DAO_TAO_TABLE_COLUMNS = ['loai', 'thang_nam_bat_dau', 'thang_nam_ket_thuc', 'bac_dao_tao', 'ten_truong'];

const SUC_KHOE_TABLE = 'suc_khoe';
const SUC_KHOE_SUMMARY_COLUMNS = ['phan_loai_suc_khoe', 'chieu_cao', 'can_nang'];
const SUC_KHOE_TABLE_COLUMNS = ['thoi_gian', 'benh_ly', 'ghi_chu'];

const mapLegacyProfile = (item: any) => ({
  ma_dinh_danh: item.ma_dinh_danh,
  ho_va_ten_khai_sinh: item.ho_ten_thuong_dung,
  don_vi: item.khoi_quan,
  thang_nam_vao_quan_doi: item.thang_nam_nhap_ngu,
  __source: 'legacy',
});

export default function ProfileDetail() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState(PARENT_TABLE);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [tabData, setTabData] = useState<any[]>([]);
  const [loadingTab, setLoadingTab] = useState(false);
  const [displayConfig, setDisplayConfig] = useState<Record<string, Record<string, boolean>>>({});
  const [nhanDang, setNhanDang] = useState<any>(null);
  const [thanNhanData, setThanNhanData] = useState<any[]>([]);

  const [modalState, setModalState] = useState<'view' | 'edit' | 'add' | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [inlineEditing, setInlineEditing] = useState(false);
  const [inlineSaving, setInlineSaving] = useState(false);
  const [inlineFormData, setInlineFormData] = useState<any>({});
  
  const [extracting, setExtracting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (id) {
      fetchProfile(id);
    }
  }, [id]);

  useEffect(() => {
    setInlineEditing(false);
    setInlineFormData({});
    setModalState(null);
    setSelectedRecord(null);

    if (!id || activeTab === PARENT_TABLE) return;
    fetchTabData(activeTab, id);
  }, [activeTab, id]);

  const fetchDisplayConfig = async (tableName: string) => {
    const { data } = await supabase
      .from('sys_display_config')
      .select('column_name,is_visible')
      .eq('table_name', tableName);

    const config: Record<string, boolean> = {};
    data?.forEach(item => {
      config[item.column_name] = item.is_visible;
    });

    setDisplayConfig(prev => ({ ...prev, [tableName]: config }));
    return config;
  };

  const fetchProfile = async (maDinhDanh: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from(PARENT_TABLE)
      .select('*')
      .eq('ma_dinh_danh', maDinhDanh)
      .maybeSingle();

    if (!error && data) {
      setProfile(data);
      await fetchDisplayConfig(PARENT_TABLE);
      setLoading(false);
      return;
    }

    const { data: legacyData, error: legacyError } = await supabase
      .from('thong_tin_chung')
      .select('*')
      .eq('ma_dinh_danh', maDinhDanh)
      .maybeSingle();

    if (!legacyError && legacyData) {
      setProfile(mapLegacyProfile(legacyData));
    } else {
      setProfile(null);
    }

    await fetchDisplayConfig(PARENT_TABLE);
    setLoading(false);
  };

  const fetchTabData = async (tableName: string, maDinhDanh: string) => {
    setLoadingTab(true);
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('ma_dinh_danh', maDinhDanh);

    if (!error) {
      setTabData(data || []);
    } else {
      console.error(`Error fetching ${tableName}:`, error);
    }
      
    if (tableName === SUC_KHOE_TABLE) {
      const { data: ndData } = await supabase.from('nhan_dang').select('chieu_cao_m').eq('ma_dinh_danh', maDinhDanh).maybeSingle();
      if (ndData) setNhanDang(ndData);
    }
    
    if (tableName === 'bhyt_than_nhan') {
      const { data: tnData } = await supabase.from('thong_tin_nhan_than').select('*').eq('ma_dinh_danh', maDinhDanh);
      if (tnData) setThanNhanData(tnData);
    }
      
    await fetchDisplayConfig(tableName);
    setLoadingTab(false);
  };

  const currentTab = getTableConfig(activeTab) || TABLES[0];
  const ActiveIcon = currentTab.icon;
  const currentDisplayConfig = displayConfig[activeTab] || {};

  const getColumnsForTable = (tableName: string, rows: any[]) => {
    const tableConfig = getTableConfig(tableName);
    const configuredColumns = tableConfig?.columns || [];
    const rowColumns = rows.length > 0 ? Object.keys(rows[0]) : [];
    const rawColumns = [...configuredColumns, ...rowColumns.filter(column => !configuredColumns.includes(column))];

    return rawColumns.filter(column => {
      if (SYSTEM_COLUMNS.includes(column) || column === '__source' || column === 'ma_dinh_danh' || column.startsWith('ma_')) return false;
      if (tableName === 'nhan_dang' && ['ngay_cap', 'han_dung', 'loai_cap_the'].includes(column)) return false;
      if (tableName === PARENT_TABLE) return true;
      return currentDisplayConfig[column] !== false;
    });
  };

  const getEditableColumnsForTable = (tableName: string, rows: any[]) => {
    const tableConfig = getTableConfig(tableName);
    const configuredColumns = tableConfig?.columns || [];
    const rowColumns = rows.length > 0 ? Object.keys(rows[0]) : [];
    const rawColumns = [...configuredColumns, ...rowColumns.filter(column => !configuredColumns.includes(column))];
    return rawColumns.filter(column => {
      if (SYSTEM_COLUMNS.includes(column) || column === '__source' || column === 'ma_dinh_danh' || column.startsWith('ma_')) return false;
      if (tableName === 'nhan_dang' && ['ngay_cap', 'han_dung', 'loai_cap_the'].includes(column)) return false;
      return true;
    });
  };

  const getInlineRecord = () => {
    if (activeTab === PARENT_TABLE) return profile;
    return tabData[0] || { ma_dinh_danh: id };
  };

  const startInlineEdit = () => {
    const rawData = getInlineRecord() || { ma_dinh_danh: id };
    const cloned = { ...rawData };
    
    if (activeTab === SUC_KHOE_TABLE && nhanDang?.chieu_cao_m && !cloned.chieu_cao) {
      cloned.chieu_cao = nhanDang.chieu_cao_m;
    }

    Object.keys(cloned).forEach(c => {
       if (isMonthYearField(c) && typeof cloned[c] === 'string' && /^\d{4}-\d{2}-\d{2}/.test(cloned[c])) {
          const match = cloned[c].match(/^(\d{4})-(\d{2})/);
          if (match) cloned[c] = `${match[2]}/${match[1]}`;
       } else if (isFullDateField(c) && typeof cloned[c] === 'string' && /^\d{4}-\d{2}-\d{2}/.test(cloned[c])) {
          const match = cloned[c].match(/^(\d{4})-(\d{2})-(\d{2})/);
          if (match) cloned[c] = `${match[3]}/${match[2]}/${match[1]}`;
       }
    });

    if (activeTab === PARENT_TABLE) {
      if (!cloned.dan_toc) cloned.dan_toc = 'Kinh';
      if (!cloned.ton_giao) cloned.ton_giao = 'Không';
      if (!cloned.noi_dang_ky_kcb) cloned.noi_dang_ky_kcb = 'BVQY103';
    }

    setInlineFormData(cloned);
    setInlineEditing(true);
  };

  const cancelInlineEdit = () => {
    setInlineEditing(false);
    setInlineFormData({});
  };

  const handleInlineChange = (key: string, value: string) => {
    setInlineFormData((prev: any) => {
      const next = { ...prev, [key]: value };
      if (key === 'so_the_bhyt' && value && value.length >= 10) {
        next.so_so_bhyt = value.slice(-10);
      }
      if (key === 'ngay_cap_cccd' && value && value.length === 10) {
        const autoNoiCap = getNoiCapCccd(value);
        if (autoNoiCap) next.noi_cap_cccd = autoNoiCap;
      }
      
      // Tự động điền số thẻ đảng theo số CCCD cho những người có ngày vào đảng chính thức
      if (key === 'ngay_chinh_thuc' && value && value.trim() !== '') {
        if (!next.so_the_dang) {
          const currentCccd = next.so_cccd || profile?.so_cccd;
          if (currentCccd) {
            next.so_the_dang = currentCccd;
          }
        }
      }
      if (key === 'so_cccd' && value && value.trim() !== '') {
        if (!next.so_the_dang) {
          const currentNgay = next.ngay_chinh_thuc || profile?.ngay_chinh_thuc;
          if (currentNgay && currentNgay.trim() !== '') {
            next.so_the_dang = value;
          }
        }
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
      setInlineFormData((prev: any) => ({
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

  const renderInlineInput = (key: string) => {
    const value = inlineFormData[key] ?? '';
    const commonProps = {
      className: 'form-control',
      value,
      disabled: key === 'ma_dinh_danh',
      onChange: (event: any) => handleInlineChange(key, event.target.value),
    };

    if (key === 'gioi_tinh') {
      return (
        <select {...commonProps}>
          <option value="">Chọn giới tính...</option>
          <option value="Nam">Nam</option>
          <option value="Nữ">Nữ</option>
        </select>
      );
    }

    if (key === 'que_quan') {
      return (
        <LocationSelect
          type="combined"
          value={value}
          onChange={(val) => handleInlineChange(key, val)}
          disabled={false}
          placeholder={`Chọn ${formatFieldLabel(key).toLowerCase()}...`}
        />
      );
    }

    if (key === 'moi_quan_he') {
      return (
        <select {...commonProps}>
          <option value="">Chọn mối quan hệ...</option>
          {['Ông nội', 'Bà nội', 'Ông ngoại', 'Bà ngoại', 'Bố đẻ', 'Mẹ đẻ', 'Bố vợ', 'Mẹ vợ', 'Bố chồng', 'Mẹ chồng', 'Anh', 'Chị', 'Em', 'Con'].map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );
    }

    if (key === 'tinh_trang_hon_nhan') {
      return (
        <select {...commonProps}>
          <option value="">Chọn tình trạng...</option>
          <option value="Độc thân">Độc thân</option>
          <option value="Đã kết hôn">Đã kết hôn</option>
          <option value="Đã ly hôn">Đã ly hôn</option>
        </select>
      );
    }

    if (key === 'tinh_tp' || key === 'hien_tai_tinh' || key === 'thuong_tru_tinh' || key === 'tam_tru_tinh' || key === 'que_quan_tinh') {
      return (
        <LocationSelect
          type="province"
          value={value}
          onChange={(val) => {
            handleInlineChange(key, val);
            if (key === 'tinh_tp') handleInlineChange('xa_phuong', '');
            if (key === 'thuong_tru_tinh') handleInlineChange('thuong_tru_xa', '');
            if (key === 'tam_tru_tinh') handleInlineChange('tam_tru_xa', '');
            if (key === 'hien_tai_tinh') handleInlineChange('hien_tai_xa', '');
            if (key === 'que_quan_tinh') handleInlineChange('que_quan_xa', '');
          }}
          disabled={false}
          placeholder={`Chọn ${formatFieldLabel(key).toLowerCase()}...`}
        />
      );
    }

    if (key === 'xa_phuong' || key === 'thuong_tru_xa' || key === 'tam_tru_xa' || key === 'hien_tai_xa' || key === 'que_quan_xa') {
      const parentKey = key === 'xa_phuong' ? 'tinh_tp' : key.replace('_xa', '_tinh');
      return (
        <LocationSelect
          type="ward"
          value={value}
          onChange={(val) => handleInlineChange(key, val)}
          parentValue={inlineFormData[parentKey] || ''}
          disabled={false}
          placeholder={`Chọn ${formatFieldLabel(key).toLowerCase()}...`}
        />
      );
    }

    if (key === 'ho_ten' && activeTab === 'bhyt_than_nhan') {
      return (
        <select 
          {...commonProps}
          onChange={(e) => {
            const val = e.target.value;
            handleInlineChange(key, val);
            const selectedTN = thanNhanData.find((t: any) => t.ho_ten === val);
            if (selectedTN) {
              handleInlineChange('moi_quan_he', selectedTN.moi_quan_he || '');
              if (selectedTN.nam_sinh) {
                // If it's just year, mapping might need manual conversion, but we pass it anyway
                handleInlineChange('ngay_thang_nam_sinh', `01/01/${selectedTN.nam_sinh}`);
              }
            }
          }}
        >
          <option value="">Chọn thân nhân...</option>
          {thanNhanData.map((tn: any, idx) => (
            <option key={idx} value={tn.ho_ten}>{tn.ho_ten} ({tn.moi_quan_he})</option>
          ))}
        </select>
      );
    }

    if (key === 'dien_quan_ly') {
      return (
        <select {...commonProps}>
          <option value="">Chọn diện quản lý...</option>
          <option value="Quân lực quản lý">Quân lực quản lý</option>
          <option value="Cán bộ quản lý">Cán bộ quản lý</option>
        </select>
      );
    }

    if (key === 'noi_cap_cccd') {
      return (
        <select {...commonProps}>
          <option value="">Chọn nơi cấp...</option>
          <option value="Cục Cảnh sát QLHC về TTXH">Cục Cảnh sát QLHC về TTXH</option>
          <option value="Cục Cảnh sát ĐKQL cư trú và DLQG về dân cư">Cục Cảnh sát ĐKQL cư trú và DLQG về dân cư</option>
          <option value="Bộ Công an">Bộ Công an</option>
        </select>
      );
    }

    if (key === 'loai_thay_doi') {
      return (
        <select {...commonProps}>
          <option value="">Chọn loại thay đổi...</option>
          <option value="Chuyển diện bố trí">Chuyển diện bố trí</option>
          <option value="Chuyển diện đối tượng">Chuyển diện đối tượng</option>
          <option value="Chuyển ngạch">Chuyển ngạch</option>
          <option value="Chuyển nhóm lương">Chuyển nhóm lương</option>
          <option value="Nâng bậc lương đúng hạn">Nâng bậc lương đúng hạn</option>
          <option value="Nâng bậc lương trước thời hạn">Nâng bậc lương trước thời hạn</option>
          <option value="Nâng loại, ngạch lương">Nâng loại, ngạch lương</option>
          <option value="Thưởng bậc lương">Thưởng bậc lương</option>
          <option value="Kéo dài bậc lương">Kéo dài bậc lương</option>
        </select>
      );
    }

    if (key === 'dien_bo_tri') {
      return (
        <select {...commonProps}>
          <option value="Quân lực">Quân lực</option>
          <option value="Cán bộ">Cán bộ</option>
        </select>
      );
    }

    if (isMonthYearField(key)) {
      return (
        <input
          type="text"
          className="form-control"
          value={value}
          disabled={key === 'ma_dinh_danh'}
          placeholder="mm/yyyy"
          onChange={(e) => {
            let cleaned = e.target.value.replace(/[^\d/]/g, '');
            if (cleaned.length === 3 && !cleaned.includes('/')) {
              cleaned = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
            }
            if (cleaned.length > 7) cleaned = cleaned.slice(0, 7);
            handleInlineChange(key, cleaned);
          }}
        />
      );
    }

    if (isFullDateField(key)) {
      return (
        <input
          type="text"
          className="form-control"
          value={value}
          disabled={key === 'ma_dinh_danh'}
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
            handleInlineChange(key, cleaned);
          }}
        />
      );
    }

    return (
      <>
        <input 
          type="text" 
          {...commonProps} 
          maxLength={key === 'so_the_bhyt' ? 15 : key === 'so_cccd' ? 12 : undefined} 
        />
        {key === 'so_the_bhyt' && value && value.length < 15 && (
          <div style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '4px' }}>
            ⚠️ Thiếu thông tin số thẻ (cần 15 ký tự)
          </div>
        )}
        {key === 'so_cccd' && value && value.length < 12 && (
          <div style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '4px' }}>
            ⚠️ Số CCCD phải đủ 12 ký tự
          </div>
        )}
      </>
    );
  };

  const saveInlineForm = async () => {
    const tableName = activeTab;
    const record = getInlineRecord();
    const editableColumns = getEditableColumnsForTable(tableName, record ? [record] : []);
    const cleanData: any = {};

    editableColumns.forEach(column => {
      if (inlineFormData[column] !== undefined) {
        let val = inlineFormData[column];
        if (isMonthYearField(column) && typeof val === 'string' && /^\d{2}\/\d{4}$/.test(val)) {
          const [mm, yyyy] = val.split('/');
          val = `${yyyy}-${mm}-01`;
        } else if (isFullDateField(column) && typeof val === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(val)) {
          const [dd, mm, yyyy] = val.split('/');
          val = `${yyyy}-${mm}-${dd}`;
        }
        cleanData[column] = val === '' ? null : val;
      }
    });
    cleanData.ma_dinh_danh = id;

    // Remove unmapped legacy fields from PARENT_TABLE to avoid schema errors
    if (tableName === PARENT_TABLE) {
      delete cleanData.hien_tai_tinh;
    }

    setInlineSaving(true);

    const { error } = INLINE_FORM_TABLES.includes(tableName)
      ? await supabase.from(tableName).upsert(cleanData, { onConflict: 'ma_dinh_danh' })
      : record?.id
        ? await supabase.from(tableName).update(cleanData).eq('id', record.id)
        : await supabase.from(tableName).insert([cleanData]);

    setInlineSaving(false);

    if (error) {
      alert('Lỗi khi lưu: ' + error.message);
      return;
    }

    setInlineEditing(false);
    setInlineFormData({});

    if (tableName === PARENT_TABLE && id) {
      await fetchProfile(id);
    } else if (id) {
      await fetchTabData(tableName, id);
    }
  };

  const renderFieldGrid = (record: any, tableName: string, forcedColumns?: string[], isEditingOverride?: boolean) => {
    const columns = forcedColumns || getColumnsForTable(tableName, record ? [record] : []);
    const isCurrentlyEditing = isEditingOverride !== undefined ? isEditingOverride : 
      (modalState === 'edit' || modalState === 'add') && selectedRecord?.id === record?.id;

    return (
      <>
        {tableName === PARENT_TABLE && isCurrentlyEditing && (
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
        <div className={tableName === 'bhyt_than_nhan' ? "grid-responsive-5" : "grid-responsive-4"}>
        {columns.map((key) => {
          let value = isCurrentlyEditing ? inlineFormData[key] : record?.[key];
          
          if (!isCurrentlyEditing && value) {
            if (isFullDateField(key) && /^\d{4}-\d{2}-\d{2}/.test(String(value))) {
              const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
              if (match) value = `${match[3]}/${match[2]}/${match[1]}`;
            } else if (isMonthYearField(key) && /^\d{4}-\d{2}-\d{2}/.test(String(value))) {
              const match = String(value).match(/^(\d{4})-(\d{2})/);
              if (match) value = `${match[2]}/${match[1]}`;
            }
          }

          const isAddress = key.includes('_tinh') || key.includes('_xa') || key.includes('_chi_tiet') || key === 'tinh_tp' || key === 'xa_phuong' || key === 'dia_chi_chi_tiet';

          return (
            <div className={`form-group ${isAddress ? 'address-field' : ''}`} key={key} style={{ marginBottom: 0 }}>
              <span className="form-label">{renderLabel(formatFieldLabel(key))}</span>
              {isCurrentlyEditing ? (
                renderInlineInput(key)
              ) : (
                <div className="form-control field-readonly" style={{ minHeight: '36px', wordBreak: 'break-word' }}>
                  {value !== null && value !== undefined && value !== '' ? String(value) : <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Không có dữ liệu</span>}
                </div>
              )}
            </div>
          );
        })}
        </div>
      </>
    );
  };

  const renderInlineActions = (hasRecord: boolean) => (
    <div className="inline-header-actions">
      {inlineEditing ? (
        <>
          <button className="btn btn-outline" onClick={cancelInlineEdit} disabled={inlineSaving}>
            <X size={16} /> Hủy
          </button>
          <button className="btn btn-primary" onClick={saveInlineForm} disabled={inlineSaving}>
            <Save size={16} /> {inlineSaving ? 'Đang lưu...' : 'Lưu'}
          </button>
        </>
      ) : (
        <button className={hasRecord ? 'btn btn-outline' : 'btn btn-primary'} onClick={startInlineEdit}>
          {hasRecord ? <Edit size={16} /> : <Plus size={16} />}
          {hasRecord ? 'Sửa thông tin' : 'Thêm thông tin'}
        </button>
      )}
    </div>
  );

  const handleTableAction = (action: 'view' | 'edit' | 'add' | null, record?: any) => {
    setModalState(action);
    setSelectedRecord(record || null);

    if (action === 'edit' || action === 'add') {
      const rawData = record || { ma_dinh_danh: id };
      const cloned = { ...rawData };
      
      // Auto-fill so_so_bhxh from profile's so_so_bhyt when adding a new record in luong table
      if (action === 'add' && activeTab === 'luong') {
        cloned.so_so_bhxh = profile?.so_so_bhyt || '';
      }
      
      if (action === 'add' && activeTab === SUC_KHOE_TABLE && nhanDang?.chieu_cao_m) {
        cloned.chieu_cao = nhanDang.chieu_cao_m;
      }
      
      if (action === 'add' && activeTab === 'bhyt_than_nhan') {
        cloned.dan_toc = 'Kinh';
        cloned.noi_dang_ky_kcb = 'BVQY103';
        if (profile?.so_the_bhyt) {
          cloned.ma_so_bhxh = profile.so_the_bhyt.slice(-10);
        }
      }

      Object.keys(cloned).forEach(c => {
         if (isMonthYearField(c) && typeof cloned[c] === 'string' && /^\d{4}-\d{2}-\d{2}/.test(cloned[c])) {
            const match = cloned[c].match(/^(\d{4})-(\d{2})/);
            if (match) cloned[c] = `${match[2]}/${match[1]}`;
         } else if (isFullDateField(c) && typeof cloned[c] === 'string' && /^\d{4}-\d{2}-\d{2}/.test(cloned[c])) {
            const match = cloned[c].match(/^(\d{4})-(\d{2})-(\d{2})/);
            if (match) cloned[c] = `${match[3]}/${match[2]}/${match[1]}`;
         }
      });
      setInlineFormData(cloned);
    } else {
      setInlineFormData({});
    }
  };

  const saveTableInlineForm = async () => {
    const tableName = activeTab;
    const editableColumns = getEditableColumnsForTable(tableName, tabData);
    const cleanData: any = {};

    editableColumns.forEach(column => {
      if (inlineFormData[column] !== undefined) {
        let val = inlineFormData[column];
        if (isMonthYearField(column) && typeof val === 'string' && /^\d{2}\/\d{4}$/.test(val)) {
          const [mm, yyyy] = val.split('/');
          val = `${yyyy}-${mm}-01`;
        } else if (isFullDateField(column) && typeof val === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(val)) {
          const [dd, mm, yyyy] = val.split('/');
          val = `${yyyy}-${mm}-${dd}`;
        }
        cleanData[column] = val === '' ? null : val;
      }
    });
    cleanData.ma_dinh_danh = id;

    if (activeTab === 'bhyt_than_nhan' && (!cleanData.so_cccd || cleanData.so_cccd.length !== 12)) {
      alert('Vui lòng nhập đủ 12 ký tự cho Số CCCD!');
      return;
    }

    setInlineSaving(true);

    const { error } = selectedRecord?.id
        ? await supabase.from(tableName).update(cleanData).eq('id', selectedRecord.id)
        : await supabase.from(tableName).insert([cleanData]);

    setInlineSaving(false);

    if (error) {
      alert('Lỗi khi lưu: ' + error.message);
      return;
    }

    setModalState(null);
    setSelectedRecord(null);
    setInlineFormData({});

    if (id) fetchTabData(tableName, id);
  };

  const renderTableInlineAction = (row: any) => {
    const isEditing = modalState === 'edit' || modalState === 'add';
    const recordToRender = isEditing ? null : row;
    const forcedColumns = activeTab === DAO_TAO_TABLE ? DAO_TAO_TABLE_COLUMNS : 
                          activeTab === SUC_KHOE_TABLE ? SUC_KHOE_TABLE_COLUMNS :
                          getEditableColumnsForTable(activeTab, tabData);

    return (
      <div style={{ padding: '1.5rem', background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
        <h4 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>
          {modalState === 'add' ? 'Thêm mới bản ghi' : modalState === 'edit' ? 'Sửa bản ghi' : 'Chi tiết bản ghi'}
        </h4>
        
        {renderFieldGrid(recordToRender, activeTab, forcedColumns, isEditing)}

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          <button 
            className="btn btn-outline" 
            onClick={() => handleTableAction(null)} 
            disabled={inlineSaving}
          >
            {isEditing ? 'Hủy' : 'Đóng'}
          </button>
          {isEditing && (
            <button className="btn btn-primary" onClick={saveTableInlineForm} disabled={inlineSaving}>
              <Save size={16} /> {inlineSaving ? 'Đang lưu...' : 'Lưu'}
            </button>
          )}
        </div>
      </div>
    );
  };

  const handleDelete = async (row: any) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bản ghi này?')) {
      const { error } = await supabase.from(activeTab).delete().eq('id', row.id);
      if (!error) {
        if (id) fetchTabData(activeTab, id);
      } else {
        alert('Lỗi khi xóa: ' + error.message);
      }
    }
  };

  const mapDaoTaoDisplayRow = (row: any) => ({
    ...row,
    loai: row.loai ?? row.hinh_thuc_dao_tao ?? '-',
    bac_dao_tao: row.bac_dao_tao ?? row.trinh_do_dao_tao_cao_nhat ?? '-',
    truong: row.truong ?? row.ten_truong ?? '-',
  });
  const renderTabData = () => {
    let tableTitle = `Danh sách ${currentTab.label}`;
    if (activeTab === PARENT_TABLE) {
      return (
        <div className="animate-fade-in">
          {renderFieldGrid(profile, PARENT_TABLE, undefined, inlineEditing)}
        </div>
      );
    }

    if (loadingTab) {
      return (
        <div style={{ padding: '3rem', display: 'flex', justifyContent: 'center' }}>
          <div className="spinner"></div>
        </div>
      );
    }

    // const editableColumns = getEditableColumnsForTable(activeTab, tabData);

    if (INLINE_FORM_TABLES.includes(activeTab)) {
      const record = getInlineRecord();
      return (
        <div className="animate-fade-in">
          {renderFieldGrid(record, activeTab, undefined, inlineEditing)}
        </div>
      );
    }

    if (activeTab === DAO_TAO_TABLE) {
      const summaryRecord = tabData[0] || {};
      const displayData = tabData.map(mapDaoTaoDisplayRow);

      return (
        <div className="animate-fade-in training-tab-content">
          {renderFieldGrid(summaryRecord, DAO_TAO_TABLE, DAO_TAO_SUMMARY_COLUMNS, inlineEditing && !modalState)}

          <DataTable
            title="Danh sách Đào tạo"
            columns={DAO_TAO_TABLE_COLUMNS}
            data={displayData}
            formatLabel={formatFieldLabel}
            onAdd={() => handleTableAction('add')}
            onEdit={(row) => handleTableAction('edit', row)}
            onDelete={(row) => handleDelete(row)}
            onView={(row) => handleTableAction('view', row)}
            actionState={modalState}
            actionRowId={selectedRecord?.id}
            renderInlineAction={renderTableInlineAction}
          />
        </div>
      );
    }
    if (activeTab === SUC_KHOE_TABLE) {
      const summaryRecord = tabData[0] || {};
      const displayData = tabData;

      return (
        <div className="animate-fade-in training-tab-content">
          {renderFieldGrid(summaryRecord, SUC_KHOE_TABLE, SUC_KHOE_SUMMARY_COLUMNS, inlineEditing && !modalState)}

          <DataTable
            title={tableTitle}
            columns={SUC_KHOE_TABLE_COLUMNS}
            data={displayData}
            formatLabel={formatFieldLabel}
            onAdd={() => handleTableAction('add')}
            onEdit={(row) => handleTableAction('edit', row)}
            onDelete={(row) => handleDelete(row)}
            onView={(row) => handleTableAction('view', row)}
            actionState={modalState}
            actionRowId={selectedRecord?.id}
            renderInlineAction={renderTableInlineAction}
          />
        </div>
      );
    }

    let displayColumns = getColumnsForTable(activeTab, tabData).filter(column => column !== 'ma_dinh_danh');
    let displayData = tabData;
    let finalFormatLabel = formatFieldLabel;

    if (activeTab === 'luong') {
      displayColumns = ['moc_thoi_gian', 'nhom', 'bac_hien_thi', 'he_so_quy_doi', 'he_so_bao_luu'];
      displayData = [...tabData]
        .sort((a, b) => {
          const parseDate = (d: any) => {
            if (!d) return 0;
            const str = String(d);
            if (/^\d{4}-\d{2}-\d{2}/.test(str)) return new Date(str).getTime();
            if (/^\d{2}\/\d{4}$/.test(str)) {
              const [mm, yyyy] = str.split('/');
              return new Date(`${yyyy}-${mm}-01`).getTime();
            }
            return 0;
          };
          return parseDate(b.tu_thang_nam) - parseDate(a.tu_thang_nam);
        })
        .map(row => {
          let bacFormat = row.bac || '-';
          if (bacFormat && bacFormat !== '-') {
            const parts = bacFormat.split('_');
            if (parts.length > 0) {
              bacFormat = `Bậc ${parts[parts.length - 1]}`;
            }
          }
          const tuThang = row.tu_thang_nam ? formatDateValue(row.tu_thang_nam) : '-';
          const denThang = row.den_thang_nam ? formatDateValue(row.den_thang_nam) : 'Nay';
          return {
            ...row,
            bac_hien_thi: bacFormat,
            moc_thoi_gian: `${tuThang} - ${denThang}`,
          };
        });
      tableTitle = 'Quá trình lương & phụ cấp theo mốc thời gian';
      finalFormatLabel = (key: string) => {
        if (key === 'moc_thoi_gian') return 'Mốc thời gian';
        if (key === 'bac_hien_thi') return 'Bậc';
        return formatFieldLabel(key);
      };
    } else if (activeTab === 'thong_tin_nhan_than') {
      displayColumns = ['moi_quan_he', 'ho_ten', 'nam_sinh', 'nghe_nghiep', 'trang_thai', 'dia_ban', 'dia_chi_chi_tiet'];
      displayData = tabData.map(row => ({
        ...row,
        dia_ban: [row.xa_phuong, row.tinh_tp].filter(Boolean).join(' - '),
      }));
      finalFormatLabel = (key: string) => {
        if (key === 'dia_ban') return 'Tỉnh TP, Xã phường';
        return formatFieldLabel(key);
      };
    } else if (activeTab === DAO_TAO_TABLE) {
      displayColumns = DAO_TAO_TABLE_COLUMNS;
      tableTitle = 'Quá trình đào tạo';
    } else if (activeTab === 'danh_gia_nhiem_vu') {
      tableTitle = '';
    } else if (activeTab === 'bhyt_than_nhan') {
      displayColumns = [
        'stt', 'ho_ten', 'moi_quan_he', 'ngay_thang_nam_sinh', 
        'gioi_tinh', 'dan_toc', 'ma_so_bhxh', 'so_cccd_noi_cap', 'noi_dang_ky_kcb', 
        'so_dien_thoai', 'que_quan_full', 'thuong_tru_full', 'ghi_chu'
      ];
      displayData = tabData.map((row, idx) => ({
        ...row,
        stt: idx + 1,
        que_quan_full: [row.que_quan_xa, row.que_quan_tinh].filter(Boolean).join(', '),
        thuong_tru_full: [row.thuong_tru_xa, row.thuong_tru_tinh].filter(Boolean).join(', '),
        so_cccd_noi_cap: [row.so_cccd, row.noi_cap_cccd].filter(Boolean).join('\n')
      }));
    }

    return (
      <div className="animate-fade-in">
        <DataTable
          title={tableTitle}
          columns={displayColumns}
          data={displayData}
          formatLabel={finalFormatLabel}
          onAdd={() => handleTableAction('add')}
          onEdit={(row) => handleTableAction('edit', row)}
          onDelete={(row) => handleDelete(row)}
          onView={(row) => handleTableAction('view', row)}
          actionState={modalState}
          actionRowId={selectedRecord?.id}
          renderInlineAction={renderTableInlineAction}
          customHeader={
            activeTab === 'bhyt_than_nhan' ? (
              <>
                <tr>
                  <th style={{ whiteSpace: 'nowrap', textAlign: 'center', borderBottom: '1px solid var(--border)', padding: '0.75rem' }} rowSpan={2}>TT</th>
                  <th style={{ whiteSpace: 'nowrap', textAlign: 'center', borderBottom: '1px solid var(--border)', padding: '0.75rem' }} rowSpan={2}>Họ tên thân nhân</th>
                  <th style={{ whiteSpace: 'normal', minWidth: '75px', textAlign: 'center', borderBottom: '1px solid var(--border)', padding: '0.75rem' }} rowSpan={2}>Mối quan hệ với QN</th>
                  <th style={{ whiteSpace: 'normal', minWidth: '95px', textAlign: 'center', borderBottom: '1px solid var(--border)', padding: '0.75rem' }} rowSpan={2}>Ngày tháng năm sinh thân nhân</th>
                  <th style={{ whiteSpace: 'nowrap', textAlign: 'center', borderBottom: '1px solid var(--border)', padding: '0.75rem' }} rowSpan={2}>Giới tính</th>
                  <th style={{ whiteSpace: 'nowrap', textAlign: 'center', borderBottom: '1px solid var(--border)', padding: '0.75rem' }} rowSpan={2}>Dân tộc</th>
                  <th style={{ whiteSpace: 'nowrap', textAlign: 'center', borderBottom: '1px solid var(--border)', padding: '0.75rem' }} rowSpan={2}>Mã số BHXH<br/>(10 số cuối thẻ BHYT)</th>
                  <th style={{ whiteSpace: 'nowrap', textAlign: 'center', borderBottom: '1px solid var(--border)', padding: '0.75rem' }} rowSpan={2}>Số CC/CCCD<br/>Nơi cấp</th>
                  <th style={{ whiteSpace: 'nowrap', textAlign: 'center', borderBottom: '1px solid var(--border)', padding: '0.75rem' }} rowSpan={2}>Nơi KCB</th>
                  <th style={{ whiteSpace: 'nowrap', textAlign: 'center', borderBottom: '1px solid var(--border)', padding: '0.75rem' }} rowSpan={2}>Số điện thoại</th>
                  <th colSpan={2} style={{ textAlign: 'center', borderBottom: '1px solid var(--border)', padding: '0.75rem' }}>Địa chỉ</th>
                  <th style={{ whiteSpace: 'nowrap', textAlign: 'center', borderBottom: '1px solid var(--border)', padding: '0.75rem' }} rowSpan={2}>Nội dung đề nghị</th>
                  <th rowSpan={2} style={{ textAlign: 'right', width: '120px', borderBottom: '1px solid var(--border)', padding: '0.75rem' }}>Thao tác</th>
                </tr>
                <tr>
                  <th style={{ whiteSpace: 'nowrap', textAlign: 'center', borderBottom: '1px solid var(--border)', padding: '0.75rem' }}>Quê quán</th>
                  <th style={{ whiteSpace: 'nowrap', textAlign: 'center', borderBottom: '1px solid var(--border)', padding: '0.75rem' }}>Thường trú</th>
                </tr>
              </>
            ) : undefined
          }
        />
      </div>
    );
  };

  const shouldShowInlineActions = INLINE_FORM_TABLES.includes(activeTab) || activeTab === DAO_TAO_TABLE || activeTab === SUC_KHOE_TABLE;
  const hasInlineRecord = activeTab === PARENT_TABLE ? Boolean(profile) : tabData.length > 0;

  if (loading) {
    return (
      <div style={{ padding: '3rem', display: 'flex', justifyContent: 'center' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="animate-fade-in text-center">
        <h2>Không tìm thấy hồ sơ!</h2>
        <p style={{ color: 'var(--text-muted)', margin: '0.75rem 0 1.5rem' }}>Chưa có dữ liệu trong bảng cha hoặc bảng thông tin chung.</p>
        <Link to="/quan-nhan" className="btn btn-primary mt-4">Quay lại danh sách</Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <Link to="/quan-nhan" className="btn btn-outline" style={{ marginBottom: '1.5rem', display: 'inline-flex', padding: '0.25rem 0.75rem', border: 'none', color: 'var(--text-muted)' }}>
        <ArrowLeft size={16} /> Quay lại
      </Link>

      <div className="glass-panel profile-header">
        <div className="profile-summary">
          <div className="profile-avatar">
            <UserCircle size={36} style={{ color: 'var(--text-main)' }} />
          </div>
          <div className="profile-titlegroup">
            <h1 style={{ marginBottom: '0.25rem', fontSize: '1.5rem' }}>{profile.ho_va_ten_khai_sinh || 'Chưa cập nhật tên'}</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Mã định danh: <strong>{profile.ma_dinh_danh}</strong> | Cấp bậc: <strong>{profile.cap_bac || 'N/A'}</strong> | Chức vụ: <strong>{profile.chuc_vu || 'N/A'}</strong>
            </p>
          </div>
        </div>
        <div className="subnav-buttons profile-subnav" aria-label="Mục hồ sơ nhân sự">
          {TABLES.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`subnav-button ${activeTab === tab.id ? 'active' : ''}`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="glass-panel content-card">
          <div className="content-header">
            <h2 className="content-heading">
              <ActiveIcon size={24} style={{ color: 'var(--primary)' }} />
              {currentTab.label}
            </h2>
            {shouldShowInlineActions && renderInlineActions(hasInlineRecord)}
          </div>

          {renderTabData()}
      </div>
    </div>
  );
}









