-- 3. Tạo tài khoản cho những nhân sự chưa có
INSERT INTO public.users (ho_va_ten, ten_dang_nhap, mat_khau, ma_dinh_danh, khoa, vai_tro)
SELECT 
    t.ho_va_ten_khai_sinh, 
    public.fn_generate_username(t.ho_va_ten_khai_sinh), 
    '123', -- Mật khẩu mặc định
    t.ma_dinh_danh, 
    t.don_vi, 
    'user'
FROM public.thong_tin_quan_nhan t
LEFT JOIN public.users u ON t.ma_dinh_danh = u.ma_dinh_danh
WHERE u.ma_dinh_danh IS NULL
  AND t.ho_va_ten_khai_sinh IS NOT NULL
  AND t.ho_va_ten_khai_sinh <> '';
