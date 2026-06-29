-- Bảng danh mục Cấp bậc theo diện bố trí
CREATE TABLE IF NOT EXISTS public.danh_muc_cap_bac (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    dien_bo_tri text NOT NULL,
    cap_bac text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Tạo trigger để tự động cập nhật thời gian sửa (nếu bạn đã có sẵn hàm set_updated_at)
DROP TRIGGER IF EXISTS trg_danh_muc_cap_bac_updated_at ON public.danh_muc_cap_bac;
CREATE TRIGGER trg_danh_muc_cap_bac_updated_at
BEFORE UPDATE ON public.danh_muc_cap_bac
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Thêm sẵn một số dữ liệu mẫu phổ biến (Tùy chọn)
INSERT INTO public.danh_muc_cap_bac (dien_bo_tri, cap_bac)
VALUES 
  ('Sĩ quan', 'Thiếu úy'),
  ('Sĩ quan', 'Trung úy'),
  ('Sĩ quan', 'Thượng úy'),
  ('Sĩ quan', 'Đại úy'),
  ('Sĩ quan', 'Thiếu tá'),
  ('Sĩ quan', 'Trung tá'),
  ('Sĩ quan', 'Thượng tá'),
  ('Sĩ quan', 'Đại tá'),
  ('QNCN', 'Thiếu úy QNCN'),
  ('QNCN', 'Trung úy QNCN'),
  ('QNCN', 'Thượng úy QNCN'),
  ('QNCN', 'Đại úy QNCN'),
  ('QNCN', 'Thiếu tá QNCN'),
  ('QNCN', 'Trung tá QNCN'),
  ('QNCN', 'Thượng tá QNCN')
;
