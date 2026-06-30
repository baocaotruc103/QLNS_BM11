import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { getCurrentUser, isManager } from '../lib/auth';
import { Shield, Search, Download } from 'lucide-react';
import { exportToKhaiCaNhan, exportToKhaiThanNhan, exportBaoCaoCaNhan, exportBaoCaoThanNhan } from '../lib/wordExport';

export default function BhytReports() {
  const user = getCurrentUser();
  const [activeTab, setActiveTab] = useState('tokhai-canhan');
  const [usersList, setUsersList] = useState<any[]>([]);
  const [selectedMaDinhDanh, setSelectedMaDinhDanh] = useState('');
  const [selectedDienQuanLy, setSelectedDienQuanLy] = useState('Sĩ quan');
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const dienQuanLyOptions = [
    'Sĩ quan', 'Quân nhân chuyên nghiệp', 'Công nhân quốc phòng', 
    'Viên chức quốc phòng', 'Hạ sĩ quan, Binh sĩ', 'Lao động hợp đồng'
  ];

  useEffect(() => {
    const fetchUsers = async () => {
      let query = supabase.from('thong_tin_quan_nhan').select('ma_dinh_danh, ho_va_ten_khai_sinh, don_vi, cap_bac').order('ho_va_ten_khai_sinh');
      if (user?.vai_tro === 'user') {
        query = query.eq('ma_dinh_danh', user.ma_dinh_danh);
      } else if (user?.vai_tro === 'admin') {
        query = query.eq('don_vi', user.khoa);
      }
      const { data } = await query;
      if (data) {
        setUsersList(data);
        if (data.length > 0) setSelectedMaDinhDanh(data[0].ma_dinh_danh);
      }
    };
    fetchUsers();
  }, [user]);

  const handleExportToKhaiCaNhan = async () => {
    if (!selectedMaDinhDanh) return alert('Vui lòng chọn cá nhân');
    setIsLoading(true);
    try {
      const { data: record, error } = await supabase.from('thong_tin_quan_nhan').select('*').eq('ma_dinh_danh', selectedMaDinhDanh).single();
      if (error) throw error;
      await exportToKhaiCaNhan(record);
    } catch (e: any) {
      alert('Lỗi xuất báo cáo: ' + e.message);
    }
    setIsLoading(false);
  };

  const handleExportToKhaiThanNhan = async () => {
    if (!selectedMaDinhDanh) return alert('Vui lòng chọn cá nhân');
    setIsLoading(true);
    try {
      const { data: record, error } = await supabase.from('thong_tin_quan_nhan').select('*, bhyt_than_nhan(*)').eq('ma_dinh_danh', selectedMaDinhDanh).single();
      if (error) throw error;
      await exportToKhaiThanNhan(record);
    } catch (e: any) {
      alert('Lỗi xuất báo cáo: ' + e.message);
    }
    setIsLoading(false);
  };

  const handleExportBaoCaoCaNhan = async () => {
    setIsLoading(true);
    try {
      let query = supabase.from('thong_tin_quan_nhan').select('*').eq('dien_bo_tri', selectedDienQuanLy);
      if (user?.vai_tro === 'admin') query = query.eq('don_vi', user.khoa);
      const { data, error } = await query;
      if (error) throw error;
      await exportBaoCaoCaNhan(data, selectedDienQuanLy);
    } catch (e: any) {
      alert('Lỗi xuất báo cáo: ' + e.message);
    }
    setIsLoading(false);
  };

  const handleExportBaoCaoThanNhan = async () => {
    setIsLoading(true);
    try {
      let query = supabase.from('thong_tin_quan_nhan').select('*, bhyt_than_nhan(*)').eq('dien_bo_tri', selectedDienQuanLy);
      if (user?.vai_tro === 'admin') query = query.eq('don_vi', user.khoa);
      const { data, error } = await query;
      if (error) throw error;
      await exportBaoCaoThanNhan(data, selectedDienQuanLy);
    } catch (e: any) {
      alert('Lỗi xuất báo cáo: ' + e.message);
    }
    setIsLoading(false);
  };

  const tabs = [
    { id: 'tokhai-canhan', label: 'Tờ khai BHYT cá nhân' },
    { id: 'tokhai-thannhan', label: 'Tờ khai BHYT thân nhân' },
  ];

  if (isManager() || user?.vai_tro === 'admin') {
    tabs.push({ id: 'baocao-canhan', label: 'Báo cáo đề nghị cá nhân' });
    tabs.push({ id: 'baocao-thannhan', label: 'Báo cáo đề nghị thân nhân' });
  }

  const filteredUsers = usersList.filter(u => 
    u.ho_va_ten_khai_sinh?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.ma_dinh_danh?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="animate-fade-in" style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ width: 48, height: 48, borderRadius: '12px', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Shield size={24} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>Bảo hiểm y tế</h1>
          <p style={{ color: 'var(--text-muted)' }}>Quản lý xuất tờ khai và báo cáo BHYT</p>
        </div>
      </div>

      <div className="glass-panel">
        <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.5rem', overflowX: 'auto' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '0.5rem 1rem',
                border: 'none',
                background: activeTab === tab.id ? 'var(--primary-soft)' : 'transparent',
                color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-main)',
                fontWeight: activeTab === tab.id ? 600 : 400,
                borderRadius: '8px',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ padding: '1rem' }}>
          {activeTab.startsWith('tokhai') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label className="form-label">Tìm kiếm nhân sự</label>
                <div style={{ position: 'relative', maxWidth: 400 }}>
                  <Search size={18} style={{ position: 'absolute', left: 12, top: 10, color: 'var(--text-muted)' }} />
                  <input 
                    type="text" 
                    className="form-control" 
                    style={{ paddingLeft: 40 }}
                    placeholder="Nhập tên hoặc mã định danh..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <label className="form-label">Chọn nhân sự để xuất tờ khai</label>
                <select className="form-control" style={{ maxWidth: 400 }} value={selectedMaDinhDanh} onChange={e => setSelectedMaDinhDanh(e.target.value)}>
                  {filteredUsers.map(u => (
                    <option key={u.ma_dinh_danh} value={u.ma_dinh_danh}>
                      {u.ho_va_ten_khai_sinh} ({u.ma_dinh_danh}) - {u.don_vi || 'Chưa rõ ĐV'}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginTop: '1rem' }}>
                <button 
                  className="btn btn-primary" 
                  onClick={activeTab === 'tokhai-canhan' ? handleExportToKhaiCaNhan : handleExportToKhaiThanNhan}
                  disabled={isLoading || !selectedMaDinhDanh}
                >
                  <Download size={18} />
                  {isLoading ? 'Đang xuất...' : `Xuất ${activeTab === 'tokhai-canhan' ? 'Tờ khai cá nhân' : 'Tờ khai thân nhân'} (Word)`}
                </button>
              </div>
            </div>
          )}

          {activeTab.startsWith('baocao') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label className="form-label">Lọc theo Diện quản lý</label>
                <select className="form-control" style={{ maxWidth: 400 }} value={selectedDienQuanLy} onChange={e => setSelectedDienQuanLy(e.target.value)}>
                  {dienQuanLyOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginTop: '1rem' }}>
                <button 
                  className="btn btn-primary" 
                  onClick={activeTab === 'baocao-canhan' ? handleExportBaoCaoCaNhan : handleExportBaoCaoThanNhan}
                  disabled={isLoading}
                >
                  <Download size={18} />
                  {isLoading ? 'Đang xuất...' : `Xuất ${activeTab === 'baocao-canhan' ? 'Báo cáo đề nghị cá nhân' : 'Báo cáo đề nghị thân nhân'} (Word)`}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
