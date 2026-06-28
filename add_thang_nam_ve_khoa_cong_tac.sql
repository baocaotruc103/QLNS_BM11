-- Them cot thang_nam_ve_khoa_cong_tac vao bang thong_tin_quan_nhan.
-- Chay file nay neu bang thong_tin_quan_nhan da duoc tao truoc do.

alter table public.thong_tin_quan_nhan
add column if not exists thang_nam_ve_khoa_cong_tac date;
