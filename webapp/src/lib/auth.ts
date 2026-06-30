export type UserRole = 'user' | 'admin' | 'manager';

export interface AuthUser {
  id: string;
  ho_va_ten: string;
  ten_dang_nhap: string;
  ma_dinh_danh: string;
  khoa: string;
  vai_tro: UserRole;
}

export const getCurrentUser = (): AuthUser | null => {
  try {
    const userStr = localStorage.getItem('auth_user');
    if (!userStr) return null;
    return JSON.parse(userStr) as AuthUser;
  } catch (e) {
    return null;
  }
};

export const isManager = (): boolean => {
  const user = getCurrentUser();
  return user?.vai_tro ? String(user.vai_tro).toLowerCase() === 'manager' : false;
};

export const canEditRecord = (recordMaDinhDanh: string, recordDonVi?: string): boolean => {
  const user = getCurrentUser();
  if (!user) return false;
  
  const vaiTro = user.vai_tro ? String(user.vai_tro).toLowerCase() : '';

  if (vaiTro === 'manager') return true;
  if (vaiTro === 'admin') return user.khoa === recordDonVi;
  if (vaiTro === 'user') {
    console.log('Checking edit permission:', { userMaDinhDanh: user.ma_dinh_danh, recordMaDinhDanh });
    return String(user.ma_dinh_danh).trim() === String(recordMaDinhDanh).trim();
  }
  
  return false;
};

export const canAddRecord = (): boolean => {
  const user = getCurrentUser();
  if (!user) return false;
  const vaiTro = user.vai_tro ? String(user.vai_tro).toLowerCase() : '';
  return vaiTro === 'manager' || vaiTro === 'admin';
};
