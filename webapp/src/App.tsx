import { useEffect, useState, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { LogOut, Menu, ChevronLeft, ChevronRight, User, Key } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import ProfileDetail from './pages/ProfileDetail';
import UsersSetting from './pages/settings/UsersSetting';
import DisplaySetting from './pages/settings/DisplaySetting';
import PermissionsSetting from './pages/settings/PermissionsSetting';
import PositionsSetting from './pages/settings/PositionsSetting';
import Login from './pages/Login';
import { MENU_CONFIG_TABLE, MENU_CONFIG_UPDATED_EVENT, MENU_ITEMS } from './lib/menuConfig';
import { supabase } from './lib/supabaseClient';
import './index.css';

type SidebarProps = {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
  isMobileOpen: boolean;
  onLogout: () => void;
};

const Sidebar = ({ isCollapsed, setIsCollapsed, isMobileOpen, onLogout }: SidebarProps) => {
  const [visibleMenus, setVisibleMenus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchMenuConfig = async () => {
      const { data } = await supabase
        .from('sys_display_config')
        .select('column_name,is_visible')
        .eq('table_name', MENU_CONFIG_TABLE);

      const nextConfig: Record<string, boolean> = {};
      MENU_ITEMS.flatMap(section => section.items).forEach(item => {
        const existing = data?.find(config => config.column_name === item.id);
        nextConfig[item.id] = existing ? existing.is_visible : true;
      });

      setVisibleMenus(nextConfig);
    };

    fetchMenuConfig();
    window.addEventListener(MENU_CONFIG_UPDATED_EVENT, fetchMenuConfig);

    return () => window.removeEventListener(MENU_CONFIG_UPDATED_EVENT, fetchMenuConfig);
  }, []);

  return (
    <aside className={`sidebar glass-panel ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`} style={{ borderRadius: 0, borderTop: 'none', borderBottom: 'none', borderLeft: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div className="sidebar-brand" style={{ marginBottom: 0 }}>
          <img src="https://i.postimg.cc/kGcDh50v/screenshot-1782573313.png" alt="Logo" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', objectPosition: 'center top', flexShrink: 0 }} />
          <span>Quản lý nhân sự</span>
        </div>
        {/* Desktop collapse toggle */}
        <button
          className="btn btn-outline"
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={{ padding: '0.25rem', border: 'none', background: 'transparent', display: isMobileOpen ? 'none' : 'block' }}
          title={isCollapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {MENU_ITEMS.map(section => {
          const sectionItems = section.items.filter(item => visibleMenus[item.id] !== false);
          if (sectionItems.length === 0) return null;

          return (
            <div key={section.section}>
              <div className="nav-section-title">{section.section}</div>
              {sectionItems.map(item => {
                const Icon = item.icon;
                return (
                  <NavLink key={item.id} to={item.path} className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'} title={item.label}>
                    <Icon size={20} style={{ flexShrink: 0 }} />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          );
        })}
      </nav>

      <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
        <button className="nav-item" style={{ width: '100%', background: 'transparent', textAlign: 'left', border: 'none', cursor: 'pointer' }} title="Đăng xuất" onClick={onLogout}>
          <LogOut size={20} style={{ flexShrink: 0 }} />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('auth_user') !== null;
  });
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const user = JSON.parse(localStorage.getItem('auth_user') || '{}');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogin = (user: any) => {
    localStorage.setItem('auth_user', JSON.stringify(user));
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_user');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Router>
      <div className="app-container">
        {/* Mobile Overlay */}
        <div
          className={`mobile-overlay ${isMobileOpen ? 'mobile-open' : ''}`}
          onClick={() => setIsMobileOpen(false)}
        />

        <Sidebar 
          isCollapsed={isCollapsed} 
          setIsCollapsed={setIsCollapsed} 
          isMobileOpen={isMobileOpen} 
          onLogout={handleLogout}
        />

        <main className="main-content" style={{ padding: 0 }}>
          {/* Mobile Header */}
          <header className="mobile-header">
            <button className="btn btn-outline" style={{ border: 'none', padding: '0.5rem' }} onClick={() => setIsMobileOpen(true)}>
              <Menu size={24} />
            </button>
            <div style={{ fontWeight: 600, color: 'var(--primary)' }}>Quản lý nhân sự</div>
            <button className="btn btn-outline" style={{ border: 'none', padding: '0.5rem' }} onClick={handleLogout}>
              <LogOut size={20} />
            </button>
          </header>

          {/* Desktop Header */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            alignItems: 'center', 
            padding: '1rem 2rem', 
            background: 'var(--bg-surface)', 
            borderBottom: '1px solid var(--border)' 
          }}>
            <div style={{ position: 'relative' }} ref={menuRef}>
              <button 
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem', 
                  cursor: 'pointer',
                  fontWeight: 500,
                  color: 'var(--text-main)'
                }}
              >
                <div style={{ 
                  width: '32px', height: '32px', 
                  borderRadius: '50%', 
                  background: 'var(--primary-soft)', 
                  color: 'var(--primary)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center' 
                }}>
                  <User size={18} />
                </div>
                <span>Xin chào, {user.ho_va_ten || user.ten_dang_nhap}</span>
              </button>

              {isUserMenuOpen && (
                <div style={{ 
                  position: 'absolute', 
                  top: '100%', 
                  right: 0, 
                  marginTop: '0.5rem',
                  background: 'var(--bg-surface)', 
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  minWidth: '200px',
                  zIndex: 50
                }}>
                  <div style={{ padding: '0.5rem' }}>
                    <button 
                      className="nav-item" 
                      style={{ width: '100%', background: 'transparent', textAlign: 'left', border: 'none', cursor: 'pointer', padding: '0.5rem 1rem' }}
                      onClick={() => { alert('Chức năng Xem thông tin tài khoản đang được phát triển'); setIsUserMenuOpen(false); }}
                    >
                      <User size={16} style={{ marginRight: '0.5rem' }} /> Xem thông tin tài khoản
                    </button>
                    <button 
                      className="nav-item" 
                      style={{ width: '100%', background: 'transparent', textAlign: 'left', border: 'none', cursor: 'pointer', padding: '0.5rem 1rem' }}
                      onClick={() => { alert('Chức năng Đổi mật khẩu đang được phát triển'); setIsUserMenuOpen(false); }}
                    >
                      <Key size={16} style={{ marginRight: '0.5rem' }} /> Đổi mật khẩu
                    </button>
                    <div style={{ height: '1px', background: 'var(--border)', margin: '0.5rem 0' }}></div>
                    <button 
                      className="nav-item" 
                      style={{ width: '100%', background: 'transparent', textAlign: 'left', border: 'none', cursor: 'pointer', padding: '0.5rem 1rem', color: 'var(--danger)' }}
                      onClick={handleLogout}
                    >
                      <LogOut size={16} style={{ marginRight: '0.5rem' }} /> Đăng xuất
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="app-page">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/quan-nhan" element={<Dashboard />} />
              <Route path="/dang-vien" element={<Dashboard />} />
              <Route path="/profile/:id" element={<ProfileDetail />} />

              {/* Settings Routes */}
              <Route path="/settings/users" element={<UsersSetting />} />
              <Route path="/settings/display" element={<DisplaySetting />} />
              <Route path="/settings/permissions" element={<PermissionsSetting />} />
              <Route path="/settings/positions" element={<PositionsSetting />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App;


