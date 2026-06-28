import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { SettingsTabs } from './UsersSetting';
import { Save } from 'lucide-react';
import { TABLES } from '../../lib/tableConfig';

export default function PermissionsSetting() {
  const [activeRole, setActiveRole] = useState('user');
  const [permissions, setPermissions] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPermissions();
  }, [activeRole]);

  const fetchPermissions = async () => {
    setLoading(true);
    const { data } = await supabase.from('sys_permissions').select('*').eq('role_name', activeRole);

    const newPerms: Record<string, any> = {};
    TABLES.forEach(table => {
      const existing = data?.find(permission => permission.table_name === table.id);
      newPerms[table.id] = existing || {
        can_view: true,
        can_insert: false,
        can_update: false,
        can_delete: false,
      };
    });
    setPermissions(newPerms);
    setLoading(false);
  };

  const handleToggle = (tableId: string, field: string) => {
    setPermissions(prev => ({
      ...prev,
      [tableId]: {
        ...prev[tableId],
        [field]: !prev[tableId][field],
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    const upsertData = Object.keys(permissions).map(tableId => ({
      role_name: activeRole,
      table_name: tableId,
      can_view: permissions[tableId].can_view,
      can_insert: permissions[tableId].can_insert,
      can_update: permissions[tableId].can_update,
      can_delete: permissions[tableId].can_delete,
    }));

    const { error } = await supabase.from('sys_permissions').upsert(upsertData, { onConflict: 'role_name,table_name' });
    setSaving(false);

    if (!error) {
      alert('Lưu phân quyền thành công!');
    } else {
      alert('Lỗi: ' + error.message);
    }
  };

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
        <div className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <h2 style={{ margin: 0 }}>Phân quyền:</h2>
            <select
              className="form-control"
              value={activeRole}
              onChange={event => setActiveRole(event.target.value)}
              style={{ width: '200px', fontSize: '1rem' }}
            >
              <option value="user">User (Người dùng)</option>
              <option value="admin">Admin (Quản trị viên)</option>
              <option value="manager">Manager (Quản lý)</option>
            </select>
          </div>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            <Save size={18} /> {saving ? 'Đang lưu...' : 'Lưu phân quyền'}
          </button>
        </div>

        {loading ? (
          <div className="spinner" style={{ margin: '3rem auto' }}></div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Bảng dữ liệu</th>
                  <th style={{ textAlign: 'center' }}>Xem (View)</th>
                  <th style={{ textAlign: 'center' }}>Thêm (Add)</th>
                  <th style={{ textAlign: 'center' }}>Sửa (Edit)</th>
                  <th style={{ textAlign: 'center' }}>Xóa (Delete)</th>
                </tr>
              </thead>
              <tbody>
                {TABLES.map(table => {
                  const permission = permissions[table.id] || {};
                  return (
                    <tr key={table.id}>
                      <td style={{ fontWeight: 500 }}>{table.label} <small style={{ display: 'block', color: 'var(--text-muted)', fontWeight: 400 }}>{table.id}</small></td>
                      <td style={{ textAlign: 'center' }}>
                        <input type="checkbox" checked={permission.can_view} onChange={() => handleToggle(table.id, 'can_view')} style={{ transform: 'scale(1.2)' }} />
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <input type="checkbox" checked={permission.can_insert} onChange={() => handleToggle(table.id, 'can_insert')} style={{ transform: 'scale(1.2)' }} />
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <input type="checkbox" checked={permission.can_update} onChange={() => handleToggle(table.id, 'can_update')} style={{ transform: 'scale(1.2)' }} />
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <input type="checkbox" checked={permission.can_delete} onChange={() => handleToggle(table.id, 'can_delete')} style={{ transform: 'scale(1.2)' }} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

