import { LayoutDashboard, Settings, Users } from 'lucide-react';

export const MENU_CONFIG_TABLE = '__menu__';
export const MENU_CONFIG_UPDATED_EVENT = 'menu-config-updated';

export const MENU_ITEMS = [
  {
    section: '',
    items: [
      { id: 'dashboard', label: 'Dashboard', path: '/', icon: LayoutDashboard },
      { id: 'quan-nhan', label: 'Nhân sự', path: '/quan-nhan', icon: Users },
      { id: 'dang-vien', label: 'Đảng viên', path: '/dang-vien', icon: Users },
    ],
  },
  {
    section: 'Hệ thống',
    items: [
      { id: 'settings', label: 'Cấu hình', path: '/settings/users', icon: Settings },
    ],
  },
];

