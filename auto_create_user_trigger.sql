-- Hàm tự động tạo tài khoản người dùng khi có nhân sự mới được thêm vào
CREATE OR REPLACE FUNCTION public.trg_auto_create_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Kiểm tra xem đã tồn tại user với mã định danh này chưa
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE ma_dinh_danh = NEW.ma_dinh_danh) THEN
    INSERT INTO public.users (ho_va_ten, ten_dang_nhap, mat_khau, ma_dinh_danh, khoa, vai_tro)
    VALUES (
      NEW.ho_va_ten_khai_sinh,
      public.fn_generate_username(NEW.ho_va_ten_khai_sinh), -- Tên đăng nhập là viết tắt họ tên
      NEW.ma_dinh_danh, -- Mật khẩu mặc định lấy theo mã định danh
      NEW.ma_dinh_danh,
      NEW.don_vi,
      'user' -- Quyền hạn mặc định (lưu vào cột vai_tro)
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Xóa trigger cũ nếu có
DROP TRIGGER IF EXISTS trg_auto_create_user_after_insert ON public.thong_tin_quan_nhan;

-- Tạo trigger chạy sau khi thêm mới vào bảng thong_tin_quan_nhan
CREATE TRIGGER trg_auto_create_user_after_insert
AFTER INSERT ON public.thong_tin_quan_nhan
FOR EACH ROW
EXECUTE FUNCTION public.trg_auto_create_user();
