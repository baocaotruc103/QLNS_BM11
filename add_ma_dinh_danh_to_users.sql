-- Them cot ma_dinh_danh cho bang users de lien ket voi thong_tin_chung.
-- Chay file nay trong Supabase SQL Editor.

alter table public.users
add column if not exists ma_dinh_danh text;

create index if not exists idx_users_ma_dinh_danh
on public.users (ma_dinh_danh);

-- Chi them khoa ngoai khi thong_tin_chung.ma_dinh_danh da la primary key/unique.
-- Neu chua co unique constraint, phan them cot va index o tren van chay binh thuong.
do $$
declare
  has_reference_key boolean;
begin
  select exists (
    select 1
    from pg_constraint c
    join pg_attribute a
      on a.attrelid = c.conrelid
     and a.attnum = any(c.conkey)
    where c.conrelid = 'public.thong_tin_chung'::regclass
      and c.contype in ('p', 'u')
      and a.attname = 'ma_dinh_danh'
  ) into has_reference_key;

  if has_reference_key and not exists (
    select 1
    from pg_constraint
    where conname = 'users_ma_dinh_danh_fkey'
      and conrelid = 'public.users'::regclass
  ) then
    alter table public.users
    add constraint users_ma_dinh_danh_fkey
    foreign key (ma_dinh_danh)
    references public.thong_tin_chung (ma_dinh_danh)
    on update cascade
    on delete set null;
  end if;
end $$;
