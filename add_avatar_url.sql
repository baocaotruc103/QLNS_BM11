-- 1. Thêm cột avatar_url vào bảng thong_tin_quan_nhan
ALTER TABLE public.thong_tin_quan_nhan ADD COLUMN IF NOT EXISTS avatar_url text;

-- 2. Đảm bảo bucket 'Files' tồn tại (Bạn có thể bỏ qua nếu đã tạo thủ công trên Supabase Dashboard)
insert into storage.buckets (id, name, public)
select 'Files', 'Files', true
where not exists (
    select 1 from storage.buckets where id = 'Files'
);

-- 3. Cấu hình RLS Policies cho bucket 'Files'
-- Cho phép mọi người (public) xem/tải ảnh
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'Files' );

-- Cho phép upload ảnh (nếu ứng dụng dùng tài khoản anon/authenticated)
create policy "Allow Upload"
on storage.objects for insert
with check ( bucket_id = 'Files' );

-- Cho phép cập nhật ảnh (nếu ứng dụng dùng tài khoản anon/authenticated)
create policy "Allow Update"
on storage.objects for update
using ( bucket_id = 'Files' );

-- Cho phép xóa ảnh
create policy "Allow Delete"
on storage.objects for delete
using ( bucket_id = 'Files' );
