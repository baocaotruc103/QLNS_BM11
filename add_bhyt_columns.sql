-- Chạy đoạn mã này trong Supabase SQL Editor để thêm các cột BHYT vào bảng thong_tin_quan_nhan
alter table public.thong_tin_quan_nhan
add column if not exists so_the_bhyt text,
add column if not exists so_so_bhyt text,
add column if not exists noi_dang_ky_kcb text,
add column if not exists ghi_chu_bhyt text;
