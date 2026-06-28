UPDATE public.users u
SET ma_dinh_danh = t.ma_dinh_danh
FROM public.thong_tin_quan_nhan t
WHERE u.ho_va_ten = t.ho_va_ten_khai_sinh
  AND (u.ma_dinh_danh IS NULL OR u.ma_dinh_danh = '');
