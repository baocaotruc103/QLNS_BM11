import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Link, useLocation } from 'react-router-dom';
import { Save, Users, Eye, Shield } from 'lucide-react';
import DataTable from '../../components/DataTable';

type UserRecord = {
  id?: string;
  ma_dinh_danh?: string;
  ten_dang_nhap?: string;
  mat_khau?: string;
  ho_va_ten?: string;
  khoa?: string;
  vai_tro?: string;
};

type PersonnelRecord = {
  ma_dinh_danh: string;
  ho_va_ten_khai_sinh: string;
  don_vi?: string;
};

export const SettingsTabs = () => {
  const location = useLocation();
  const tabs = [
    { id: 'users', label: 'Quản lý người dùng', path: '/settings/users', icon: Users },
    { id: 'display', label: 'Cấu hình hiển thị', path: '/settings/display', icon: Eye },
    { id: 'permissions', label: 'Phân quyền', path: '/settings/permissions', icon: Shield },
  ];

  return (
    <div className="subnav-buttons" aria-label="Menu hệ thống">
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = location.pathname === tab.path;
        return (
          <Link
            key={tab.id}
            to={tab.path}
            className={`subnav-button ${isActive ? 'active' : ''}`}
          >
            <Icon size={18} />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
};

const normalizeVietnamese = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/g, 'd')
  .replace(/Đ/g, 'D');

const generateUsername = (fullName: string) => {
  const words = normalizeVietnamese(fullName)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return '';
  if (words.length === 1) return words[0];

  const initials = words.slice(0, -1).map(word => word[0]).join('');
  return `${initials}${words[words.length - 1]}`;
};

const UserInlineForm = ({ mode, record, personnel, onClose, onRefresh }: {
  mode: 'view' | 'edit' | 'add';
  record: UserRecord | null;
  personnel: PersonnelRecord[];
  onClose: () => void;
  onRefresh: () => void;
}) => {
  const [formData, setFormData] = useState<UserRecord>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (mode === 'add') {
      const firstPersonnel = personnel[0];
      setFormData(firstPersonnel ? buildUserFromPersonnel(firstPersonnel, 'user') : { mat_khau: '123', vai_tro: 'user' });
    } else {
      setFormData(record || {});
    }
  }, [mode, record, personnel]);

  const buildUserFromPersonnel = (item: PersonnelRecord, role = formData.vai_tro || 'user'): UserRecord => ({
    ma_dinh_danh: item.ma_dinh_danh,
    ten_dang_nhap: generateUsername(item.ho_va_ten_khai_sinh || ''),
    mat_khau: mode === 'add' ? '123' : formData.mat_khau || '123',
    ho_va_ten: item.ho_va_ten_khai_sinh || '',
    khoa: item.don_vi || '',
    vai_tro: role,
  });

  const handlePersonnelChange = (maDinhDanh: string) => {
    const selected = personnel.find(item => item.ma_dinh_danh === maDinhDanh);
    if (!selected) return;
    setFormData(prev => ({ ...prev, ...buildUserFromPersonnel(selected, prev.vai_tro || 'user') }));
  };

  const handleSave = async () => {
    if (!formData.ma_dinh_danh) {
      alert('Vui lòng chọn mã định danh.');
      return;
    }

    setSaving(true);
    const cleanData = {
      ma_dinh_danh: formData.ma_dinh_danh,
      ten_dang_nhap: formData.ten_dang_nhap || generateUsername(formData.ho_va_ten || ''),
      mat_khau: formData.mat_khau || '123',
      ho_va_ten: formData.ho_va_ten || '',
      khoa: formData.khoa || '',
      vai_tro: formData.vai_tro || 'user',
    };

    const { error } = mode === 'edit'
      ? await supabase.from('users').update(cleanData).eq('id', record?.id)
      : await supabase.from('users').insert([cleanData]);

    setSaving(false);
    if (!error) {
      onRefresh();
      onClose();
    } else {
      alert('Lỗi khi lưu: ' + error.message);
    }
  };

  const isView = mode === 'view';

  return (
    <div style={{ padding: '1.5rem', background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h4 style={{ margin: 0, color: 'var(--primary)' }}>
          {mode === 'view' ? 'Chi tiết tài khoản' : mode === 'edit' ? 'Chỉnh sửa tài khoản' : 'Thêm tài khoản mới'}
        </h4>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Mã định danh</label>
          {isView ? (
            <div className="form-control field-readonly" style={{ minHeight: '36px' }}>{formData.ma_dinh_danh || '-'}</div>
          ) : (
            <select className="form-control" value={formData.ma_dinh_danh || ''} onChange={e => handlePersonnelChange(e.target.value)}>
              <option value="">Chọn nhân sự...</option>
              {personnel.map(item => (
                <option key={item.ma_dinh_danh} value={item.ma_dinh_danh}>
                  {item.ma_dinh_danh} - {item.ho_va_ten_khai_sinh}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Tên đăng nhập</label>
          <div className="form-control field-readonly" style={{ minHeight: '36px' }}>{formData.ten_dang_nhap || '-'}</div>
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Mật khẩu</label>
          {isView ? (
            <div className="form-control field-readonly" style={{ minHeight: '36px' }}>{formData.mat_khau || '-'}</div>
          ) : (
            <input className="form-control" value={formData.mat_khau || ''} onChange={e => setFormData(prev => ({ ...prev, mat_khau: e.target.value }))} />
          )}
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Họ và tên</label>
          <div className="form-control field-readonly" style={{ minHeight: '36px' }}>{formData.ho_va_ten || '-'}</div>
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Khoa/Đơn vị</label>
          <div className="form-control field-readonly" style={{ minHeight: '36px' }}>{formData.khoa || '-'}</div>
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Vai trò</label>
          {isView ? (
            <div className="form-control field-readonly" style={{ minHeight: '36px' }}>{formData.vai_tro || '-'}</div>
          ) : (
            <select className="form-control" value={formData.vai_tro || 'user'} onChange={e => setFormData(prev => ({ ...prev, vai_tro: e.target.value }))}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
            </select>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
        <button className="btn btn-outline" onClick={onClose} disabled={saving}>{isView ? 'Đóng' : 'Hủy'}</button>
        {!isView && (
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            <Save size={18} /> {saving ? 'Đang lưu...' : 'Lưu lại'}
          </button>
        )}
      </div>
    </div>
  );
};

export default function UsersSetting() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [personnel, setPersonnel] = useState<PersonnelRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalState, setModalState] = useState<'view' | 'edit' | 'add' | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<UserRecord | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    await Promise.all([fetchUsers(), fetchPersonnel()]);
    setLoading(false);
  };

  const fetchUsers = async () => {
    const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
    if (!error) setUsers(data || []);
  };

  const fetchPersonnel = async () => {
    const { data, error } = await supabase
      .from('thong_tin_quan_nhan')
      .select('ma_dinh_danh, ho_va_ten_khai_sinh, don_vi')
      .order('ho_va_ten_khai_sinh', { ascending: true });

    if (!error) setPersonnel(data || []);
  };

  const handleDelete = async (row: UserRecord) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa tài khoản này?')) {
      const { error } = await supabase.from('users').delete().eq('id', row.id);
      if (!error) fetchUsers();
      else alert('Lỗi khi xóa: ' + error.message);
    }
  };

  const formatLabel = (key: string) => {
    const labels: Record<string, string> = {
      ma_dinh_danh: 'Mã định danh',
      ten_dang_nhap: 'Tên đăng nhập',
      mat_khau: 'Mật khẩu',
      ho_va_ten: 'Họ và tên',
      khoa: 'Khoa/Đơn vị',
      vai_tro: 'Vai trò'
    };
    return labels[key] || key;
  };

  const displayColumns = ['ma_dinh_danh', 'ten_dang_nhap', 'ho_va_ten', 'khoa', 'vai_tro'];

  const personnelById = useMemo(() => new Map(personnel.map(item => [item.ma_dinh_danh, item])), [personnel]);

  const displayData = users.map(user => {
    const linkedPersonnel = user.ma_dinh_danh ? personnelById.get(user.ma_dinh_danh) : null;
    return {
      ...user,
      ho_va_ten: linkedPersonnel?.ho_va_ten_khai_sinh || user.ho_va_ten,
      khoa: linkedPersonnel?.don_vi || user.khoa,
      vai_tro: (
        <span style={{
          padding: '0.25rem 0.5rem',
          background: user.vai_tro === 'admin' ? 'var(--danger-soft)' : 'var(--primary-soft)',
          color: user.vai_tro === 'admin' ? 'var(--danger)' : 'var(--primary)',
          borderRadius: '4px',
          fontSize: '0.75rem',
          fontWeight: 600,
          textTransform: 'uppercase'
        }}>
          {user.vai_tro}
        </span>
      )
    };
  });

  return (
    <div className="animate-fade-in">
      <div className="page-titlebar">
        <div>
          <h1 style={{ marginBottom: '0.5rem' }}>Hệ thống</h1>
          <p>Cấu hình, quản lý người dùng và phân quyền</p>
        </div>
        <SettingsTabs />
      </div>

      <div className="glass-panel" style={{ padding: '2rem' }}>
        {loading ? (
           <div className="spinner" style={{ margin: '3rem auto' }}></div>
        ) : (
          <DataTable
            title="Danh sách tài khoản"
            columns={displayColumns}
            data={displayData}
            formatLabel={formatLabel}
            onAdd={() => setModalState('add')}
            onEdit={(row) => { setSelectedRecord(users.find(user => user.id === row.id) || null); setModalState('edit'); }}
            onDelete={handleDelete}
            onView={(row) => { setSelectedRecord(users.find(user => user.id === row.id) || null); setModalState('view'); }}
            actionState={modalState}
            actionRowId={selectedRecord?.id}
            renderInlineAction={() => modalState ? (
              <UserInlineForm
                mode={modalState}
                record={selectedRecord}
                personnel={personnel}
                onClose={() => { setModalState(null); setSelectedRecord(null); }}
                onRefresh={fetchUsers}
              />
            ) : null}
          />
        )}
      </div>
    </div>
  );
}




