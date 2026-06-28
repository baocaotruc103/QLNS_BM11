import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { SettingsTabs } from './UsersSetting';
import { Plus, Edit2, Trash2 } from 'lucide-react';

export default function PositionsSetting() {
  const [positions, setPositions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // States for adding / editing
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  
  const [newValue, setNewValue] = useState('');

  useEffect(() => {
    fetchPositions();
  }, []);

  const fetchPositions = async () => {
    setLoading(true);
    const { data } = await supabase.from('chuc_vu').select('*').order('id', { ascending: true });
    setPositions(data || []);
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!newValue.trim()) return;
    setSaving(true);
    const { error } = await supabase.from('chuc_vu').insert([{ ten_chuc_vu: newValue.trim() }]);
    setSaving(false);
    
    if (error) {
      alert('Lỗi khi thêm: ' + error.message);
    } else {
      setNewValue('');
      fetchPositions();
    }
  };

  const handleSaveEdit = async (id: number) => {
    if (!editValue.trim()) return;
    setSaving(true);
    const { error } = await supabase.from('chuc_vu').update({ ten_chuc_vu: editValue.trim() }).eq('id', id);
    setSaving(false);
    
    if (error) {
      alert('Lỗi khi cập nhật: ' + error.message);
    } else {
      setEditingId(null);
      fetchPositions();
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa chức vụ này?')) return;
    
    setSaving(true);
    const { error } = await supabase.from('chuc_vu').delete().eq('id', id);
    setSaving(false);
    
    if (error) {
      alert('Lỗi khi xóa: ' + error.message);
    } else {
      fetchPositions();
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Danh mục chức vụ</h2>
        <p style={{ color: 'var(--text-muted)' }}>Quản lý các chức vụ trong hệ thống</p>
      </div>

      <SettingsTabs />

      <div className="glass-panel" style={{ padding: '2rem', marginTop: '1.5rem' }}>
        
        {/* Add new position */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', alignItems: 'center' }}>
          <input 
            type="text" 
            className="form-control" 
            placeholder="Nhập tên chức vụ mới..." 
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            style={{ maxWidth: '400px', margin: 0 }}
          />
          <button className="btn btn-primary" onClick={handleAdd} disabled={saving || !newValue.trim()}>
            <Plus size={18} />
            Thêm mới
          </button>
        </div>

        {/* List positions */}
        {loading ? (
          <p>Đang tải dữ liệu...</p>
        ) : (
          <div className="table-responsive">
            <table className="table" style={{ minWidth: '600px' }}>
              <thead>
                <tr>
                  <th style={{ width: '80px', textAlign: 'center' }}>TT</th>
                  <th>Chức vụ</th>
                  <th style={{ width: '150px', textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {positions.map((pos, index) => (
                  <tr key={pos.id}>
                    <td style={{ textAlign: 'center' }}>{index + 1}</td>
                    <td>
                      {editingId === pos.id ? (
                        <input 
                          type="text" 
                          className="form-control" 
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          autoFocus
                          style={{ margin: 0 }}
                        />
                      ) : (
                        pos.ten_chuc_vu
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {editingId === pos.id ? (
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button className="btn btn-primary" style={{ padding: '0.25rem 0.5rem' }} onClick={() => handleSaveEdit(pos.id)} disabled={saving}>
                            Lưu
                          </button>
                          <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem' }} onClick={() => setEditingId(null)} disabled={saving}>
                            Hủy
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button 
                            className="btn btn-outline" 
                            style={{ padding: '0.25rem', border: 'none' }}
                            onClick={() => {
                              setEditingId(pos.id);
                              setEditValue(pos.ten_chuc_vu);
                            }}
                            title="Sửa"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            className="btn btn-outline" 
                            style={{ padding: '0.25rem', border: 'none', color: 'var(--danger)' }}
                            onClick={() => handleDelete(pos.id)}
                            title="Xóa"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {positions.length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', padding: '2rem' }}>Chưa có dữ liệu chức vụ</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
