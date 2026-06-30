-- Script: Thêm các cột còn thiếu cho bảng suc_khoe
-- Chạy script này trong Supabase SQL Editor để vá lỗi không lưu được thông tin sức khỏe

ALTER TABLE public.suc_khoe ADD COLUMN IF NOT EXISTS thoi_gian TEXT;
ALTER TABLE public.suc_khoe ADD COLUMN IF NOT EXISTS phan_loai_suc_khoe TEXT;
ALTER TABLE public.suc_khoe ADD COLUMN IF NOT EXISTS chieu_cao TEXT;
ALTER TABLE public.suc_khoe ADD COLUMN IF NOT EXISTS can_nang TEXT;
ALTER TABLE public.suc_khoe ADD COLUMN IF NOT EXISTS benh_ly TEXT;
