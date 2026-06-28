-- Bổ sung các cột thông tin 1 lần vào bảng thong_tin_quan_nhan
ALTER TABLE public.thong_tin_quan_nhan
ADD COLUMN IF NOT EXISTS thang_nam_bat_dau_nhan_luong VARCHAR(50),
ADD COLUMN IF NOT EXISTS thang_nam_tham_gia_bhxh VARCHAR(50),
ADD COLUMN IF NOT EXISTS so_so_bhxh VARCHAR(50),
ADD COLUMN IF NOT EXISTS che_do_luong VARCHAR(100);

-- Bổ sung các cột mới vào bảng luong
ALTER TABLE public.luong
ADD COLUMN IF NOT EXISTS tinh_tham_nien VARCHAR(50),
ADD COLUMN IF NOT EXISTS tinh_huong_tro_cap VARCHAR(50),
ADD COLUMN IF NOT EXISTS pc_tham_nien_vk VARCHAR(50),
ADD COLUMN IF NOT EXISTS he_so_bao_luu NUMERIC,
ADD COLUMN IF NOT EXISTS pc_chuc_vu NUMERIC,
ADD COLUMN IF NOT EXISTS pc_tham_nien_nghe NUMERIC,
ADD COLUMN IF NOT EXISTS tinh_dong_bhxh VARCHAR(50);
