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
  return user?.vai_tro === 'manager';
};

export const canEditRecord = (recordMaDinhDanh: string, recordDonVi?: string): boolean => {
  const user = getCurrentUser();
  if (!user) return false;
  
  if (user.vai_tro === 'manager') return true;
  if (user.vai_tro === 'admin') return user.khoa === recordDonVi;
  if (user.vai_tro === 'user') return user.ma_dinh_danh === recordMaDinhDanh;
  
  return false;
};

export const canAddRecord = (): boolean => {
  const user = getCurrentUser();
  if (!user) return false;
  // user cannot add, admin can add (usually restricted to their department elsewhere, or allowed generally on dashboard), manager can add
  return user.vai_tro === 'manager' || user.vai_tro === 'admin';
};
