-- Tắt RLS nếu bạn không cần bảo mật mức dòng cho bảng này (cách nhanh nhất để hết lỗi)
ALTER TABLE public.chuc_vu DISABLE ROW LEVEL SECURITY;

-- HOẶC nếu bạn muốn BẬT RLS thì cần chạy các lệnh sau để cấp đủ quyền Thêm/Sửa/Xóa:
/*
ALTER TABLE public.chuc_vu ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cho phép tất cả người dùng thêm chức vụ"
    ON public.chuc_vu FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Cho phép tất cả người dùng sửa chức vụ"
    ON public.chuc_vu FOR UPDATE
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Cho phép tất cả người dùng xóa chức vụ"
    ON public.chuc_vu FOR DELETE
    USING (true);
*/
