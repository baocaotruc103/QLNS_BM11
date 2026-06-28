-- Sap xep lai mo hinh du lieu:
-- thong_tin_quan_nhan la bang cha, cac bang khac lien ket bang ma_dinh_danh.
-- Chay file nay trong Supabase SQL Editor sau khi da tao bang thong_tin_quan_nhan.

-- 1) Dong bo du lieu cha tu thong_tin_chung neu dang co du lieu cu.
insert into public.thong_tin_quan_nhan (
  ma_dinh_danh,
  ho_va_ten_khai_sinh,
  don_vi,
  thang_nam_vao_quan_doi
)
select
  ma_dinh_danh,
  coalesce(nullif(ho_ten_thuong_dung, ''), ma_dinh_danh) as ho_va_ten_khai_sinh,
  coalesce(nullif(khoi_quan, ''), 'Khoa Hồi sức ngoại, Bộ môn - Trung tâm Hồi sức cấp cứu chống độc') as don_vi,
  case
    when thang_nam_nhap_ngu::text ~ '^\\d{4}-\\d{2}-\\d{2}
from public.thong_tin_chung
where ma_dinh_danh is not null
  and ma_dinh_danh <> ''
on conflict (ma_dinh_danh) do update
set
  ho_va_ten_khai_sinh = coalesce(excluded.ho_va_ten_khai_sinh, public.thong_tin_quan_nhan.ho_va_ten_khai_sinh),
  don_vi = coalesce(excluded.don_vi, public.thong_tin_quan_nhan.don_vi),
  thang_nam_vao_quan_doi = coalesce(excluded.thang_nam_vao_quan_doi, public.thong_tin_quan_nhan.thang_nam_vao_quan_doi);

-- 2) Tao index va khoa ngoai cho cac bang con neu bang/cot ton tai va khong co ma_dinh_danh mo coi.
do $$
declare
  child_table text;
  orphan_count integer;
  constraint_name text;
begin
  foreach child_table in array array[
    'thong_tin_chung',
    'thong_tin_dao_tao',
    'thong_tin_nhan_than',
    'khen_thuong',
    'ky_luat',
    'luong',
    'suc_khoe',
    'users'
  ] loop
    if to_regclass('public.' || child_table) is null then
      continue;
    end if;

    if not exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = child_table
        and column_name = 'ma_dinh_danh'
    ) then
      continue;
    end if;

    execute format('create index if not exists %I on public.%I (ma_dinh_danh)', 'idx_' || child_table || '_ma_dinh_danh', child_table);

    execute format(
      'select count(*) from public.%I c left join public.thong_tin_quan_nhan p on p.ma_dinh_danh = c.ma_dinh_danh where c.ma_dinh_danh is not null and c.ma_dinh_danh <> '''' and p.ma_dinh_danh is null',
      child_table
    ) into orphan_count;

    constraint_name := child_table || '_ma_dinh_danh_fkey';

    if orphan_count = 0 and not exists (
      select 1
      from pg_constraint
      where conname = constraint_name
        and conrelid = ('public.' || child_table)::regclass
    ) then
      execute format(
        'alter table public.%I add constraint %I foreign key (ma_dinh_danh) references public.thong_tin_quan_nhan (ma_dinh_danh) on update cascade on delete cascade',
        child_table,
        constraint_name
      );
    end if;
  end loop;
end $$;

-- 3) Kiem tra cac ban ghi con chua co cha tuong ung.
do $$
declare
  child_table text;
  orphan_count integer;
begin
  foreach child_table in array array[
    'thong_tin_chung',
    'thong_tin_dao_tao',
    'thong_tin_nhan_than',
    'khen_thuong',
    'ky_luat',
    'luong',
    'suc_khoe',
    'users'
  ] loop
    if to_regclass('public.' || child_table) is null then
      continue;
    end if;

    if not exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = child_table
        and column_name = 'ma_dinh_danh'
    ) then
      continue;
    end if;

    execute format(
      'select count(*) from public.%I c left join public.thong_tin_quan_nhan p on p.ma_dinh_danh = c.ma_dinh_danh where c.ma_dinh_danh is not null and c.ma_dinh_danh <> '''' and p.ma_dinh_danh is null',
      child_table
    ) into orphan_count;

    if orphan_count > 0 then
      raise notice 'Bang % co % ban ghi chua co cha trong thong_tin_quan_nhan. Can bo sung truoc khi tao foreign key.', child_table, orphan_count;
    end if;
  end loop;
end $$;
 then thang_nam_nhap_ngu::date
    when thang_nam_nhap_ngu::text ~ '^\\d{4}-\\d{2}
from public.thong_tin_chung
where ma_dinh_danh is not null
  and ma_dinh_danh <> ''
on conflict (ma_dinh_danh) do update
set
  ho_va_ten_khai_sinh = coalesce(excluded.ho_va_ten_khai_sinh, public.thong_tin_quan_nhan.ho_va_ten_khai_sinh),
  don_vi = coalesce(excluded.don_vi, public.thong_tin_quan_nhan.don_vi),
  thang_nam_vao_quan_doi = coalesce(excluded.thang_nam_vao_quan_doi, public.thong_tin_quan_nhan.thang_nam_vao_quan_doi);

-- 2) Tao index va khoa ngoai cho cac bang con neu bang/cot ton tai va khong co ma_dinh_danh mo coi.
do $$
declare
  child_table text;
  orphan_count integer;
  constraint_name text;
begin
  foreach child_table in array array[
    'thong_tin_chung',
    'thong_tin_dao_tao',
    'thong_tin_nhan_than',
    'khen_thuong',
    'ky_luat',
    'luong',
    'suc_khoe',
    'users'
  ] loop
    if to_regclass('public.' || child_table) is null then
      continue;
    end if;

    if not exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = child_table
        and column_name = 'ma_dinh_danh'
    ) then
      continue;
    end if;

    execute format('create index if not exists %I on public.%I (ma_dinh_danh)', 'idx_' || child_table || '_ma_dinh_danh', child_table);

    execute format(
      'select count(*) from public.%I c left join public.thong_tin_quan_nhan p on p.ma_dinh_danh = c.ma_dinh_danh where c.ma_dinh_danh is not null and c.ma_dinh_danh <> '''' and p.ma_dinh_danh is null',
      child_table
    ) into orphan_count;

    constraint_name := child_table || '_ma_dinh_danh_fkey';

    if orphan_count = 0 and not exists (
      select 1
      from pg_constraint
      where conname = constraint_name
        and conrelid = ('public.' || child_table)::regclass
    ) then
      execute format(
        'alter table public.%I add constraint %I foreign key (ma_dinh_danh) references public.thong_tin_quan_nhan (ma_dinh_danh) on update cascade on delete cascade',
        child_table,
        constraint_name
      );
    end if;
  end loop;
end $$;

-- 3) Kiem tra cac ban ghi con chua co cha tuong ung.
do $$
declare
  child_table text;
  orphan_count integer;
begin
  foreach child_table in array array[
    'thong_tin_chung',
    'thong_tin_dao_tao',
    'thong_tin_nhan_than',
    'khen_thuong',
    'ky_luat',
    'luong',
    'suc_khoe',
    'users'
  ] loop
    if to_regclass('public.' || child_table) is null then
      continue;
    end if;

    if not exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = child_table
        and column_name = 'ma_dinh_danh'
    ) then
      continue;
    end if;

    execute format(
      'select count(*) from public.%I c left join public.thong_tin_quan_nhan p on p.ma_dinh_danh = c.ma_dinh_danh where c.ma_dinh_danh is not null and c.ma_dinh_danh <> '''' and p.ma_dinh_danh is null',
      child_table
    ) into orphan_count;

    if orphan_count > 0 then
      raise notice 'Bang % co % ban ghi chua co cha trong thong_tin_quan_nhan. Can bo sung truoc khi tao foreign key.', child_table, orphan_count;
    end if;
  end loop;
end $$;
 then (thang_nam_nhap_ngu::text || '-01')::date
    when thang_nam_nhap_ngu::text ~ '^\\d{4}
from public.thong_tin_chung
where ma_dinh_danh is not null
  and ma_dinh_danh <> ''
on conflict (ma_dinh_danh) do update
set
  ho_va_ten_khai_sinh = coalesce(excluded.ho_va_ten_khai_sinh, public.thong_tin_quan_nhan.ho_va_ten_khai_sinh),
  don_vi = coalesce(excluded.don_vi, public.thong_tin_quan_nhan.don_vi),
  thang_nam_vao_quan_doi = coalesce(excluded.thang_nam_vao_quan_doi, public.thong_tin_quan_nhan.thang_nam_vao_quan_doi);

-- 2) Tao index va khoa ngoai cho cac bang con neu bang/cot ton tai va khong co ma_dinh_danh mo coi.
do $$
declare
  child_table text;
  orphan_count integer;
  constraint_name text;
begin
  foreach child_table in array array[
    'thong_tin_chung',
    'thong_tin_dao_tao',
    'thong_tin_nhan_than',
    'khen_thuong',
    'ky_luat',
    'luong',
    'suc_khoe',
    'users'
  ] loop
    if to_regclass('public.' || child_table) is null then
      continue;
    end if;

    if not exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = child_table
        and column_name = 'ma_dinh_danh'
    ) then
      continue;
    end if;

    execute format('create index if not exists %I on public.%I (ma_dinh_danh)', 'idx_' || child_table || '_ma_dinh_danh', child_table);

    execute format(
      'select count(*) from public.%I c left join public.thong_tin_quan_nhan p on p.ma_dinh_danh = c.ma_dinh_danh where c.ma_dinh_danh is not null and c.ma_dinh_danh <> '''' and p.ma_dinh_danh is null',
      child_table
    ) into orphan_count;

    constraint_name := child_table || '_ma_dinh_danh_fkey';

    if orphan_count = 0 and not exists (
      select 1
      from pg_constraint
      where conname = constraint_name
        and conrelid = ('public.' || child_table)::regclass
    ) then
      execute format(
        'alter table public.%I add constraint %I foreign key (ma_dinh_danh) references public.thong_tin_quan_nhan (ma_dinh_danh) on update cascade on delete cascade',
        child_table,
        constraint_name
      );
    end if;
  end loop;
end $$;

-- 3) Kiem tra cac ban ghi con chua co cha tuong ung.
do $$
declare
  child_table text;
  orphan_count integer;
begin
  foreach child_table in array array[
    'thong_tin_chung',
    'thong_tin_dao_tao',
    'thong_tin_nhan_than',
    'khen_thuong',
    'ky_luat',
    'luong',
    'suc_khoe',
    'users'
  ] loop
    if to_regclass('public.' || child_table) is null then
      continue;
    end if;

    if not exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = child_table
        and column_name = 'ma_dinh_danh'
    ) then
      continue;
    end if;

    execute format(
      'select count(*) from public.%I c left join public.thong_tin_quan_nhan p on p.ma_dinh_danh = c.ma_dinh_danh where c.ma_dinh_danh is not null and c.ma_dinh_danh <> '''' and p.ma_dinh_danh is null',
      child_table
    ) into orphan_count;

    if orphan_count > 0 then
      raise notice 'Bang % co % ban ghi chua co cha trong thong_tin_quan_nhan. Can bo sung truoc khi tao foreign key.', child_table, orphan_count;
    end if;
  end loop;
end $$;
 then (thang_nam_nhap_ngu::text || '-01-01')::date
    else null
  end as thang_nam_vao_quan_doi
from public.thong_tin_chung
where ma_dinh_danh is not null
  and ma_dinh_danh <> ''
on conflict (ma_dinh_danh) do update
set
  ho_va_ten_khai_sinh = coalesce(excluded.ho_va_ten_khai_sinh, public.thong_tin_quan_nhan.ho_va_ten_khai_sinh),
  don_vi = coalesce(excluded.don_vi, public.thong_tin_quan_nhan.don_vi),
  thang_nam_vao_quan_doi = coalesce(excluded.thang_nam_vao_quan_doi, public.thong_tin_quan_nhan.thang_nam_vao_quan_doi);

-- 2) Tao index va khoa ngoai cho cac bang con neu bang/cot ton tai va khong co ma_dinh_danh mo coi.
do $$
declare
  child_table text;
  orphan_count integer;
  constraint_name text;
begin
  foreach child_table in array array[
    'thong_tin_chung',
    'thong_tin_dao_tao',
    'thong_tin_nhan_than',
    'khen_thuong',
    'ky_luat',
    'luong',
    'suc_khoe',
    'users'
  ] loop
    if to_regclass('public.' || child_table) is null then
      continue;
    end if;

    if not exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = child_table
        and column_name = 'ma_dinh_danh'
    ) then
      continue;
    end if;

    execute format('create index if not exists %I on public.%I (ma_dinh_danh)', 'idx_' || child_table || '_ma_dinh_danh', child_table);

    execute format(
      'select count(*) from public.%I c left join public.thong_tin_quan_nhan p on p.ma_dinh_danh = c.ma_dinh_danh where c.ma_dinh_danh is not null and c.ma_dinh_danh <> '''' and p.ma_dinh_danh is null',
      child_table
    ) into orphan_count;

    constraint_name := child_table || '_ma_dinh_danh_fkey';

    if orphan_count = 0 and not exists (
      select 1
      from pg_constraint
      where conname = constraint_name
        and conrelid = ('public.' || child_table)::regclass
    ) then
      execute format(
        'alter table public.%I add constraint %I foreign key (ma_dinh_danh) references public.thong_tin_quan_nhan (ma_dinh_danh) on update cascade on delete cascade',
        child_table,
        constraint_name
      );
    end if;
  end loop;
end $$;

-- 3) Kiem tra cac ban ghi con chua co cha tuong ung.
do $$
declare
  child_table text;
  orphan_count integer;
begin
  foreach child_table in array array[
    'thong_tin_chung',
    'thong_tin_dao_tao',
    'thong_tin_nhan_than',
    'khen_thuong',
    'ky_luat',
    'luong',
    'suc_khoe',
    'users'
  ] loop
    if to_regclass('public.' || child_table) is null then
      continue;
    end if;

    if not exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = child_table
        and column_name = 'ma_dinh_danh'
    ) then
      continue;
    end if;

    execute format(
      'select count(*) from public.%I c left join public.thong_tin_quan_nhan p on p.ma_dinh_danh = c.ma_dinh_danh where c.ma_dinh_danh is not null and c.ma_dinh_danh <> '''' and p.ma_dinh_danh is null',
      child_table
    ) into orphan_count;

    if orphan_count > 0 then
      raise notice 'Bang % co % ban ghi chua co cha trong thong_tin_quan_nhan. Can bo sung truoc khi tao foreign key.', child_table, orphan_count;
    end if;
  end loop;
end $$;

