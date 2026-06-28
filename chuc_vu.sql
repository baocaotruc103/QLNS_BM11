-- Tạo bảng chức vụ
CREATE TABLE IF NOT EXISTS public.chuc_vu (
    id SERIAL PRIMARY KEY, -- Tương ứng với cột TT (Thứ tự)
    ten_chuc_vu TEXT NOT NULL UNIQUE -- Tương ứng với cột Chức vụ
);

-- Nếu bạn cần phân quyền (RLS) cho bảng này trên Supabase:
ALTER TABLE public.chuc_vu ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cho phép tất cả người dùng xem chức vụ"
    ON public.chuc_vu FOR SELECT
    USING (true);

-- Dữ liệu mẫu ban đầu (tuỳ chọn, bạn có thể tự thêm trong Supabase)
/*
INSERT INTO public.chuc_vu (ten_chuc_vu) VALUES 
    ('Tiểu đội trưởng'), 
    ('Trung đội trưởng'), 
    ('Đại đội trưởng'),
    ('Chính trị viên');
*/
