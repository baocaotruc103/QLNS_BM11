-- Script khắc phục lỗi Row-Level Security (RLS) cho bảng thong_tin_quan_nhan
-- Bạn hãy copy đoạn mã này và chạy trong Supabase SQL Editor

-- Cách 1: Tắt hoàn toàn RLS cho bảng thong_tin_quan_nhan (Khuyên dùng nếu ứng dụng dùng nội bộ và chưa cần phân quyền phức tạp)
ALTER TABLE public.thong_tin_quan_nhan DISABLE ROW LEVEL SECURITY;

-- Cách 2: (Tùy chọn) Nếu bạn BẮT BUỘC phải bật RLS, hãy bỏ comment các dòng dưới đây để cấp quyền cho phép Thêm/Sửa/Xóa dữ liệu:
-- ALTER TABLE public.thong_tin_quan_nhan ENABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS "Cho phép tất cả thao tác" ON public.thong_tin_quan_nhan;
-- CREATE POLICY "Cho phép tất cả thao tác" ON public.thong_tin_quan_nhan
-- AS PERMISSIVE FOR ALL 
-- USING (true) 
-- WITH CHECK (true);
