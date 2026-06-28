-- Dong bo users.ma_dinh_danh va ten_dang_nhap tu bang thong_tin_chung.
-- Chay file nay trong Supabase SQL Editor sau khi da them cot users.ma_dinh_danh.

create or replace function public.hsqn_normalize_vietnamese(input_text text)
returns text
language sql
immutable
as $$
  select trim(regexp_replace(
    translate(
      lower(coalesce(input_text, '')),
      'áàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ',
      'aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyd'
    ),
    '[^a-z0-9]+',
    ' ',
    'g'
  ));
$$;

create or replace function public.hsqn_generate_username(full_name text)
returns text
language plpgsql
immutable
as $$
declare
  clean_name text;
  parts text[];
  result text := '';
  i integer;
begin
  clean_name := public.hsqn_normalize_vietnamese(full_name);
  parts := regexp_split_to_array(clean_name, '\s+');

  if clean_name = '' or array_length(parts, 1) is null then
    return '';
  end if;

  if array_length(parts, 1) = 1 then
    return parts[1];
  end if;

  for i in 1..array_length(parts, 1) - 1 loop
    result := result || left(parts[i], 1);
  end loop;

  return result || parts[array_length(parts, 1)];
end;
$$;

-- Xem truoc cac ban ghi co the dong bo duy nhat theo ho ten.
-- Neu muon xem truoc, chay rieng cau select nay truoc phan update ben duoi.
with matched_people as (
  select
    public.hsqn_normalize_vietnamese(ho_ten_thuong_dung) as normalized_name,
    min(ma_dinh_danh) as ma_dinh_danh,
    min(ho_ten_thuong_dung) as ho_ten_thuong_dung,
    min(khoi_quan) as khoi_quan,
    count(*) as match_count
  from public.thong_tin_chung
  where coalesce(ho_ten_thuong_dung, '') <> ''
  group by public.hsqn_normalize_vietnamese(ho_ten_thuong_dung)
)
select
  u.id,
  u.ho_va_ten as user_ho_va_ten,
  m.ma_dinh_danh as new_ma_dinh_danh,
  public.hsqn_generate_username(m.ho_ten_thuong_dung) as new_ten_dang_nhap,
  m.ho_ten_thuong_dung as new_ho_va_ten,
  m.khoi_quan as new_khoa
from public.users u
join matched_people m
  on public.hsqn_normalize_vietnamese(u.ho_va_ten) = m.normalized_name
where m.match_count = 1;

-- Dong bo du lieu.
with matched_people as (
  select
    public.hsqn_normalize_vietnamese(ho_ten_thuong_dung) as normalized_name,
    min(ma_dinh_danh) as ma_dinh_danh,
    min(ho_ten_thuong_dung) as ho_ten_thuong_dung,
    min(khoi_quan) as khoi_quan,
    count(*) as match_count
  from public.thong_tin_chung
  where coalesce(ho_ten_thuong_dung, '') <> ''
  group by public.hsqn_normalize_vietnamese(ho_ten_thuong_dung)
)
update public.users u
set
  ma_dinh_danh = m.ma_dinh_danh,
  ten_dang_nhap = public.hsqn_generate_username(m.ho_ten_thuong_dung),
  mat_khau = case when coalesce(u.mat_khau, '') = '' then '123' else u.mat_khau end,
  ho_va_ten = m.ho_ten_thuong_dung,
  khoa = m.khoi_quan
from matched_people m
where public.hsqn_normalize_vietnamese(u.ho_va_ten) = m.normalized_name
  and m.match_count = 1;

-- Cap nhat lai ten dang nhap cho cac user da co ma_dinh_danh lien ket tu truoc.
update public.users u
set
  ten_dang_nhap = public.hsqn_generate_username(t.ho_ten_thuong_dung),
  mat_khau = case when coalesce(u.mat_khau, '') = '' then '123' else u.mat_khau end,
  ho_va_ten = t.ho_ten_thuong_dung,
  khoa = t.khoi_quan
from public.thong_tin_chung t
where u.ma_dinh_danh = t.ma_dinh_danh;

-- Kiem tra cac user chua dong bo duoc do khong khop ho ten hoac bi trung ten trong thong_tin_chung.
select
  u.id,
  u.ho_va_ten,
  u.ten_dang_nhap,
  u.ma_dinh_danh
from public.users u
where u.ma_dinh_danh is null
   or u.ma_dinh_danh = '';
