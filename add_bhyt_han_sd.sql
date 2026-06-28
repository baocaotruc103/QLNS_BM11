-- Thêm 2 cột hạn sử dụng BHYT vào bảng thong_tin_quan_nhan
ALTER TABLE public.thong_tin_quan_nhan
ADD COLUMN IF NOT EXISTS ngay_han_sd_bhyt_tu date,
ADD COLUMN IF NOT EXISTS ngay_han_sd_bhyt_den date;

-- Đăng ký hiển thị vào sys_display_config nếu bạn dùng bảng này để quản lý tuỳ chọn hiển thị
-- Bước này chỉ cần thiết nếu ứng dụng yêu cầu các cột phải có trong sys_display_config
INSERT INTO public.sys_display_config (table_name, column_name, is_visible)
VALUES 
    ('thong_tin_quan_nhan', 'ngay_han_sd_bhyt_tu', true),
    ('thong_tin_quan_nhan', 'ngay_han_sd_bhyt_den', true)
ON CONFLICT (table_name, column_name) DO NOTHING;
