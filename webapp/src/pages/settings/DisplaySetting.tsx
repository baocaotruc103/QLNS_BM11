import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { MENU_CONFIG_TABLE, MENU_CONFIG_UPDATED_EVENT, MENU_ITEMS } from '../../lib/menuConfig';
import { TABLES, formatFieldLabel, getTableConfig } from '../../lib/tableConfig';
import { SettingsTabs } from './UsersSetting';
import { Save } from 'lucide-react';

const CONFIG_TARGETS = [
  { id: MENU_CONFIG_TABLE, label: 'Menu' },
  ...TABLES.map(table => ({ id: table.id, label: table.label })),
];

const MENU_COLUMNS = MENU_ITEMS.flatMap(section => section.items.map(item => item.id));
const MENU_LABELS = MENU_ITEMS.flatMap(section => section.items).reduce<Record<string, string>>((labels, item) => {
  labels[item.id] = item.label;
  return labels;
}, {});

export default function DisplaySetting() {
  const [activeTarget, setActiveTarget] = useState(MENU_CONFIG_TABLE);
  const [columns, setColumns] = useState<string[]>([]);
  const [config, setConfig] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const isMenuConfig = activeTarget === MENU_CONFIG_TABLE;
  const pageTitle = isMenuConfig ? 'Cấu hình hiển thị menu' : 'Cấu hình hiển thị cột';

  const targetLabels = useMemo(() => {
    const labels: Record<string, string> = { ...MENU_LABELS };
    TABLES.forEach(table => {
      labels[table.id] = table.label;
    });
    return labels;
  }, []);

  useEffect(() => {
    fetchTargetConfig(activeTarget);
  }, [activeTarget]);

  const fetchTargetConfig = async (targetName: string) => {
    setLoading(true);

    let targetCols: string[] = [];
    if (targetName === MENU_CONFIG_TABLE) {
      targetCols = MENU_COLUMNS;
    } else {
      const { data: rowData } = await supabase.from(targetName).select('*').limit(1);

      if (rowData && rowData.length > 0) {
        targetCols = Object.keys(rowData[0]).filter(k => k !== 'id' && k !== 'created_at' && k !== 'updated_at');
      } else {
        targetCols = getTableConfig(targetName)?.columns || ['ma_dinh_danh'];
      }
    }

    setColumns(targetCols);

    const { data: confData } = await supabase
      .from('sys_display_config')
      .select('*')
      .eq('table_name', targetName);

    const newConfig: Record<string, boolean> = {};
    targetCols.forEach(col => {
      const existing = confData?.find(c => c.column_name === col);
      newConfig[col] = existing ? existing.is_visible : true;
    });

    setConfig(newConfig);
    setLoading(false);
  };

  const handleToggle = (col: string) => {
    setConfig(prev => ({ ...prev, [col]: !prev[col] }));
  };

  const handleSave = async () => {
    setSaving(true);
    const upsertData = Object.entries(config).map(([col, is_visible]) => ({
      table_name: activeTarget,
      column_name: col,
      is_visible,
    }));

    const { error } = await supabase
      .from('sys_display_config')
      .upsert(upsertData, { onConflict: 'table_name,column_name' });

    setSaving(false);
    if (!error) {
      window.dispatchEvent(new Event(MENU_CONFIG_UPDATED_EVENT));
      alert('Đã lưu cấu hình thành công!');
    } else {
      alert('Lỗi: ' + error.message);
    }
  };

  const formatLabel = (key: string) => targetLabels[key] || formatFieldLabel(key);

  return (
    <div className="animate-fade-in">
      <div className="page-titlebar">
        <div>
          <h1 style={{ marginBottom: '0.5rem' }}>Hệ thống</h1>
          <p>Cấu hình, quản lý người dùng và phân quyền</p>
        </div>
        <SettingsTabs />
      </div>

      <div className="glass-panel content-card">
        <div className="content-header">
          <div>
            <h2 style={{ margin: 0 }}>{pageTitle}</h2>
          </div>
          <div className="subnav-buttons" aria-label="Chọn cấu hình hiển thị">
            {CONFIG_TARGETS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTarget(tab.id)}
                className={`subnav-button ${activeTarget === tab.id ? 'active' : ''}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            <Save size={18} /> {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>

        {loading ? (
          <div className="spinner" style={{ margin: '3rem auto' }}></div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            {columns.map(col => (
              <div key={col} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '1rem', background: 'var(--bg-muted)', borderRadius: '8px',
                border: '1px solid var(--border)', gap: '1rem'
              }}>
                <span style={{ fontWeight: 500, whiteSpace: 'normal' }}>{formatLabel(col)}</span>

                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', flexShrink: 0 }}>
                  <input
                    type="checkbox"
                    checked={config[col] || false}
                    onChange={() => handleToggle(col)}
                    style={{ display: 'none' }}
                  />
                  <div style={{
                    width: '40px', height: '24px',
                    background: config[col] ? 'var(--primary)' : 'var(--bg-surface-hover)',
                    borderRadius: '12px',
                    position: 'relative',
                    transition: 'background 0.3s'
                  }}>
                    <div style={{
                      width: '18px', height: '18px',
                      background: 'white', borderRadius: '50%',
                      position: 'absolute', top: '3px',
                      left: config[col] ? '19px' : '3px',
                      transition: 'left 0.3s',
                      boxShadow: '0 2px 6px rgba(15, 23, 42, 0.18)'
                    }} />
                  </div>
                </label>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
