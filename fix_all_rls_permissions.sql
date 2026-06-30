-- Script: Tắt RLS (Row-Level Security) cho tất cả các bảng dữ liệu
-- Sử dụng khi ứng dụng tự quản lý phân quyền (như trong trường hợp dùng mã định danh ở frontend)

ALTER TABLE IF EXISTS public.thong_tin_quan_nhan DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.thong_tin_chung DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.nhan_dang DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.thong_tin_dao_tao DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.thong_tin_nhan_than DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.khen_thuong DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ky_luat DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.luong DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.suc_khoe DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.bhyt_than_nhan DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.chuc_vu DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.danh_muc_cap_bac DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sys_display_config DISABLE ROW LEVEL SECURITY;

-- Nếu bạn BẮT BUỘC muốn bật RLS mà vẫn cho phép frontend (không dùng Supabase Auth) cập nhật dữ liệu,
-- hãy chạy các lệnh dưới đây thay vì DISABLE ROW LEVEL SECURITY ở trên:

/*
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('DROP POLICY IF EXISTS "Cho phép mọi thao tác" ON public.%I;', t);
    EXECUTE format('CREATE POLICY "Cho phép mọi thao tác" ON public.%I AS PERMISSIVE FOR ALL USING (true) WITH CHECK (true);', t);
  END LOOP;
END $$;
*/
