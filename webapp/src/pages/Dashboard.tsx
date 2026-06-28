import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Search, Plus } from 'lucide-react';
import { PARENT_TABLE, formatFieldLabel, getTableConfig } from '../lib/tableConfig';
import RecordModal from '../components/RecordModal';
const mapLegacyProfile = (item: any) => ({
  ma_dinh_danh: item.ma_dinh_danh,
  ho_va_ten_khai_sinh: item.ho_ten_thuong_dung,
  don_vi: item.khoi_quan,
  dien_bo_tri: item.dien_bo_tri || '-',
  cap_bac: item.cap_bac,
  chuc_vu: item.chuc_vu,
  thang_nam_vao_quan_doi: item.thang_nam_nhap_ngu,
  thang_nam_ve_khoa_cong_tac: item.thang_nam_ve_khoa_cong_tac,
  trang_thai_xuat_ngu: item.trang_thai_xuat_ngu,
  ngay_vao_dang: item.ngay_vao_dang,
  __source: 'legacy',
});

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const isDashboard = location.pathname === '/';
  const isDangVien = location.pathname === '/dang-vien';
  
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [unitFilter, setUnitFilter] = useState('Tất cả');
  const [usingLegacyData, setUsingLegacyData] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const parentConfig = getTableConfig(PARENT_TABLE);
  const parentColumns = parentConfig ? parentConfig.columns.filter(c => !['id', 'created_at', 'updated_at'].includes(c)) : [];
  
  const formatDateVal = (val: any) => {
    if (val === null || val === undefined || val === '') return val;
    const str = String(val);
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
      const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (match) return `${match[3]}/${match[2]}/${match[1]}`;
    } else if (/^\d{4}-\d{2}/.test(str) && str.length === 7) {
      const match = str.match(/^(\d{4})-(\d{2})/);
      if (match) return `${match[2]}/${match[1]}`;
    }
    return val;
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchLegacyData = async () => {
    const { data: legacyResult, error: legacyError } = await supabase
      .from('thong_tin_chung')
      .select('ma_dinh_danh, ho_ten_thuong_dung, khoi_quan, hien_tai_tinh, thang_nam_nhap_ngu, trang_thai_xuat_ngu, ngay_vao_dang')
      .order('ho_ten_thuong_dung', { ascending: true })
      .limit(100);

    if (!legacyError && legacyResult) {
      setData(legacyResult.map(mapLegacyProfile));
    }
    setLoading(false);
  };

  const fetchData = async () => {
    setLoading(true);
    setUsingLegacyData(false);

    const { data: result, error } = await supabase
      .from(PARENT_TABLE)
      .select('ma_dinh_danh, ho_va_ten_khai_sinh, don_vi, dien_bo_tri, cap_bac, chuc_vu, thang_nam_vao_quan_doi, thang_nam_ve_khoa_cong_tac')
      .order('ho_va_ten_khai_sinh', { ascending: true })
      .limit(100);

    if (result && !error && result.length > 0) {
      // Fetch ngay_vao_dang separately to avoid foreign key relationship errors
      const maDinhDanhs = result.map(r => r.ma_dinh_danh);
      const { data: ttcData } = await supabase
        .from('thong_tin_chung')
        .select('ma_dinh_danh, ngay_vao_dang')
        .in('ma_dinh_danh', maDinhDanhs);

      const mappedResult = result.map((item: any) => {
        const ttc = ttcData?.find(t => t.ma_dinh_danh === item.ma_dinh_danh);
        return {
          ...item,
          ngay_vao_dang: ttc?.ngay_vao_dang || null
        };
      });
      setData(mappedResult);
      setLoading(false);
    } else {
      if (error) console.error('Error fetching parent personnel data:', error);
      setUsingLegacyData(true);
      await fetchLegacyData();
    }

    setLoading(false);
  };

  const filteredData = data.filter(person => {
    if (isDangVien && !person.ngay_vao_dang) return false;
    if (unitFilter !== 'Tất cả' && person.don_vi !== unitFilter) return false;
    return (person.ho_va_ten_khai_sinh?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
           (person.ma_dinh_danh?.toLowerCase() || '').includes(searchTerm.toLowerCase());
  });

  const officerCount = filteredData.filter(p => p.chuc_vu && (
    p.chuc_vu.includes('Bác sỹ') || 
    p.chuc_vu.includes('Bác sĩ') || 
    p.chuc_vu.includes('Học viên BSNT') || 
    p.chuc_vu.includes('Học viên BSNY') || 
    p.chuc_vu.toLowerCase().includes('chủ nhiệm khoa')
  )).length;
  const qncnCount = filteredData.filter(p => p.chuc_vu && (p.chuc_vu.includes('Điều dưỡng viên') || p.chuc_vu.includes('Điều dưỡng trưởng')) && p.cap_bac !== 'LĐHĐ').length;
  const ldhdCount = filteredData.filter(p => p.cap_bac === 'LĐHĐ').length;


  const handleCloseModal = () => {
    setShowAddModal(false);
    fetchData(); // Tải lại danh sách sau khi sửa/thêm
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            {isDashboard ? 'Thống kê tổng quan' : (isDangVien ? 'Danh sách đảng viên' : 'Danh sách nhân sự')}
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>
            {usingLegacyData ? 'Đang hiển thị dữ liệu từ bảng thông tin chung. Cần chạy SQL đồng bộ để chuyển sang bảng cha mới.' : (isDashboard ? 'Tổng hợp số liệu nhân sự' : (isDangVien ? 'Danh sách đảng viên từ bảng thông tin nhân sự' : 'Danh sách hồ sơ từ bảng thông tin nhân sự'))}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <select 
            className="form-control" 
            value={unitFilter}
            onChange={(e) => setUnitFilter(e.target.value)}
            style={{ minWidth: '200px' }}
          >
            <option value="Tất cả">Tất cả các đơn vị</option>
            <option value="B11">B11</option>
            <option value="B16">B16</option>
            <option value="A27">A27</option>
          </select>
          {!isDashboard && (
            <>

              <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                <Plus size={18} />
                Thêm mới hồ sơ
              </button>
            </>
          )}
        </div>
      </div>

      {/* Quick Statistics - Only on Dashboard */}
      {isDashboard && (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--primary)' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: 600 }}>TỔNG QUÂN SỐ</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-main)' }}>{filteredData.length}</div>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: 600 }}>SĨ QUAN</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-main)' }}>{officerCount}</div>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: 600 }}>QNCN</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-main)' }}>{qncnCount}</div>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid #6366f1' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: 600 }}>LĐHĐ</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-main)' }}>{ldhdCount}</div>
        </div>
      </div>
      )}

      {!isDashboard && (
        <>
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-control"
              placeholder="Tìm kiếm theo tên hoặc mã định danh..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', paddingLeft: '2.5rem' }}
            />
          </div>
        </div>
      </div>

      <div className="table-container glass-panel animate-fade-in" style={{ animationDelay: '0.1s' }}>
        {loading ? (
          <div style={{ padding: '3rem', display: 'flex', justifyContent: 'center' }}>
            <div className="spinner"></div>
          </div>
        ) : (
          <div className="table-container responsive-data-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ whiteSpace: 'nowrap' }}>Họ tên khai sinh</th>
                  <th style={{ whiteSpace: 'nowrap' }}>Cấp bậc</th>
                  <th style={{ whiteSpace: 'nowrap' }}>Chức vụ</th>
                  <th style={{ whiteSpace: 'nowrap' }}>Đơn vị</th>
                  <th style={{ whiteSpace: 'nowrap' }}>Về khoa công tác</th>
                  {isDangVien && <th style={{ whiteSpace: 'nowrap' }}>Ngày vào Đảng</th>}
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={isDangVien ? 6 : 5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Không tìm thấy hồ sơ nào.</td>
                  </tr>
                ) : (
                  filteredData.map((person: any) => (
                    <tr
                      key={person.ma_dinh_danh}
                      className="data-row"
                      onClick={() => navigate(`/profile/${person.ma_dinh_danh}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td data-label="Họ tên khai sinh" style={{ fontWeight: 600, color: 'var(--primary)' }}>{person.ho_va_ten_khai_sinh || '-'}</td>
                      <td data-label="Cấp bậc">{person.cap_bac || '-'}</td>
                      <td data-label="Chức vụ">{person.chuc_vu || '-'}</td>
                      <td data-label="Đơn vị">{person.don_vi || '-'}</td>
                      <td data-label="Về khoa công tác">{formatDateVal(person.thang_nam_ve_khoa_cong_tac) || '-'}</td>
                      {isDangVien && <td data-label="Ngày vào Đảng">{formatDateVal(person.ngay_vao_dang) || '-'}</td>}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
        </>
      )}

      {showAddModal && (
        <RecordModal
          mode="add"
          tableName={PARENT_TABLE}
          columns={parentColumns}
          formatLabel={formatFieldLabel}
          onClose={handleCloseModal}
          onRefresh={() => {
            setShowAddModal(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
}
