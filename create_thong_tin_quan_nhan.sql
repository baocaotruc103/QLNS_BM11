-- Tao bang thong_tin_quan_nhan.
-- Chay file nay trong Supabase SQL Editor.

create table if not exists public.thong_tin_quan_nhan (
  ma_dinh_danh text primary key,
  ho_va_ten_khai_sinh text,
  ngay_thang_nam_sinh date,
  don_vi text not null default 'Khoa Hồi sức ngoại, Bộ môn - Trung tâm Hồi sức cấp cứu chống độc',
  dien_bo_tri text not null default 'Quân lực',
  gioi_tinh text,
  thang_nam_vao_quan_doi date,
  thang_nam_ve_khoa_cong_tac date,
  so_cmtqd text,
  ngay_cap_cmtqd date,
  noi_cap_cmtqd text default 'Học viện Quân y',
  cap_bac text,
  chuc_vu text,
  dan_toc text,
  ton_giao text default 'Không',
  que_quan text,
  que_quan_chi_tiet text,
  nhom_mau text,
  so_cccd text,
  ngay_cap_cccd date,
  noi_cap_cccd text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint thong_tin_quan_nhan_dien_bo_tri_check
    check (dien_bo_tri in ('Quân lực', 'Cán bộ')),
  constraint thong_tin_quan_nhan_gioi_tinh_check
    check (gioi_tinh is null or gioi_tinh in ('Nam', 'Nữ'))
);

create index if not exists idx_thong_tin_quan_nhan_ho_va_ten_khai_sinh
on public.thong_tin_quan_nhan (ho_va_ten_khai_sinh);

create index if not exists idx_thong_tin_quan_nhan_so_cccd
on public.thong_tin_quan_nhan (so_cccd);

create index if not exists idx_thong_tin_quan_nhan_so_cmtqd
on public.thong_tin_quan_nhan (so_cmtqd);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_thong_tin_quan_nhan_updated_at on public.thong_tin_quan_nhan;

create trigger trg_thong_tin_quan_nhan_updated_at
before update on public.thong_tin_quan_nhan
for each row
execute function public.set_updated_at();

-- Neu muon lien ket ma_dinh_danh voi bang thong_tin_chung, bo comment khoi lenh ben duoi
-- sau khi thong_tin_chung.ma_dinh_danh da la primary key hoac unique.
-- alter table public.thong_tin_quan_nhan
-- add constraint thong_tin_quan_nhan_ma_dinh_danh_fkey
-- foreign key (ma_dinh_danh)
-- references public.thong_tin_chung (ma_dinh_danh)
-- on update cascade
-- on delete cascade;

