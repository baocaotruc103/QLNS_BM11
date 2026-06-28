-- Dong bo ma_dinh_danh va ho_ten_thuong_dung tu thong_tin_chung sang thong_tin_quan_nhan.
-- Chay trong Supabase SQL Editor sau khi da tao bang thong_tin_quan_nhan.

insert into public.thong_tin_quan_nhan (
  ma_dinh_danh,
  ho_va_ten_khai_sinh
)
select
  ma_dinh_danh,
  ho_ten_thuong_dung
from public.thong_tin_chung
where ma_dinh_danh is not null
  and ma_dinh_danh <> ''
on conflict (ma_dinh_danh) do update
set ho_va_ten_khai_sinh = excluded.ho_va_ten_khai_sinh
where excluded.ho_va_ten_khai_sinh is not null
  and excluded.ho_va_ten_khai_sinh <> '';

-- Kiem tra ket qua dong bo.
select
  qn.ma_dinh_danh,
  qn.ho_va_ten_khai_sinh,
  tc.ho_ten_thuong_dung
from public.thong_tin_quan_nhan qn
left join public.thong_tin_chung tc
  on tc.ma_dinh_danh = qn.ma_dinh_danh
order by qn.ho_va_ten_khai_sinh nulls last;
