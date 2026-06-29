import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { SettingsTabs } from './UsersSetting';
import { Plus, Edit2, Trash2 } from 'lucide-react';

export default function RanksSetting() {
  const [ranks, setRanks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // States for adding / editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDienBoTri, setEditDienBoTri] = useState('');
  const [editCapBac, setEditCapBac] = useState('');
  
  const [newDienBoTri, setNewDienBoTri] = useState('Sĩ quan');
  const [newCapBac, setNewCapBac] = useState('');

  useEffect(() => {
    fetchRanks();
  }, []);

  const fetchRanks = async () => {
    setLoading(true);
    const { data } = await supabase.from('danh_muc_cap_bac').select('*').order('dien_bo_tri', { ascending: true }).order('cap_bac', { ascending: true });
    setRanks(data || []);
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!newCapBac.trim() || !newDienBoTri.trim()) return;
    setSaving(true);
    const { error } = await supabase.from('danh_muc_cap_bac').insert([{ dien_bo_tri: newDienBoTri.trim(), cap_bac: newCapBac.trim() }]);
    setSaving(false);
    
    if (error) {
      alert('Lỗi khi thêm: ' + error.message);
    } else {
      setNewCapBac('');
      fetchRanks();
    }
  };

  const handleSaveEdit = async (id: string) => {
    if (!editCapBac.trim() || !editDienBoTri.trim()) return;
    setSaving(true);
    const { error } = await supabase.from('danh_muc_cap_bac').update({ dien_bo_tri: editDienBoTri.trim(), cap_bac: editCapBac.trim() }).eq('id', id);
    setSaving(false);
    
    if (error) {
      alert('Lỗi khi cập nhật: ' + error.message);
    } else {
      setEditingId(null);
      fetchRanks();
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa cấp bậc này?')) return;
    
    setSaving(true);
    const { error } = await supabase.from('danh_muc_cap_bac').delete().eq('id', id);
    setSaving(false);
    
    if (error) {
      alert('Lỗi khi xóa: ' + error.message);
    } else {
      fetchRanks();
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Danh mục cấp bậc</h2>
        <p style={{ color: 'var(--text-muted)' }}>Quản lý các cấp bậc trong hệ thống</p>
      </div>

      <SettingsTabs />

      <div className="glass-panel" style={{ padding: '2rem', marginTop: '1.5rem' }}>
        
        {/* Add new rank */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', alignItems: 'center' }}>
          <select 
            className="form-control" 
            value={newDienBoTri}
            onChange={(e) => setNewDienBoTri(e.target.value)}
            style={{ maxWidth: '200px', margin: 0 }}
          >
            <option value="Sĩ quan">Sĩ quan</option>
            <option value="QNCN">QNCN</option>
            <option value="LĐHĐ">LĐHĐ</option>
          </select>
          <input 
            type="text" 
            className="form-control" 
            placeholder="Nhập tên cấp bậc mới..." 
            value={newCapBac}
            onChange={(e) => setNewCapBac(e.target.value)}
            style={{ maxWidth: '400px', margin: 0 }}
          />
          <button className="btn btn-primary" onClick={handleAdd} disabled={saving || !newCapBac.trim()}>
            <Plus size={18} />
            Thêm mới
          </button>
        </div>

        {/* List ranks */}
        {loading ? (
          <p>Đang tải dữ liệu...</p>
        ) : (
          <div className="table-responsive">
            <table className="table" style={{ minWidth: '600px' }}>
              <thead>
                <tr>
                  <th style={{ width: '80px', textAlign: 'center' }}>TT</th>
                  <th style={{ width: '200px' }}>Diện bố trí</th>
                  <th>Cấp bậc</th>
                  <th style={{ width: '150px', textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {ranks.map((rank, index) => (
                  <tr key={rank.id}>
                    <td style={{ textAlign: 'center' }}>{index + 1}</td>
                    <td>
                      {editingId === rank.id ? (
                        <select 
                          className="form-control" 
                          value={editDienBoTri}
                          onChange={(e) => setEditDienBoTri(e.target.value)}
                          style={{ margin: 0 }}
                        >
                          <option value="Sĩ quan">Sĩ quan</option>
                          <option value="QNCN">QNCN</option>
                          <option value="LĐHĐ">LĐHĐ</option>
                        </select>
                      ) : (
                        rank.dien_bo_tri
                      )}
                    </td>
                    <td>
                      {editingId === rank.id ? (
                        <input 
                          type="text" 
                          className="form-control" 
                          value={editCapBac}
                          onChange={(e) => setEditCapBac(e.target.value)}
                          autoFocus
                          style={{ margin: 0 }}
                        />
                      ) : (
                        rank.cap_bac
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {editingId === rank.id ? (
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button className="btn btn-primary" style={{ padding: '0.25rem 0.5rem' }} onClick={() => handleSaveEdit(rank.id)} disabled={saving}>
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
                              setEditingId(rank.id);
                              setEditDienBoTri(rank.dien_bo_tri);
                              setEditCapBac(rank.cap_bac);
                            }}
                            title="Sửa"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            className="btn btn-outline" 
                            style={{ padding: '0.25rem', border: 'none', color: 'var(--danger)' }}
                            onClick={() => handleDelete(rank.id)}
                            title="Xóa"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {ranks.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>Chưa có dữ liệu cấp bậc</td>
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
