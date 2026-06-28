ALTER TABLE public.thong_tin_nhan_than
ADD COLUMN IF NOT EXISTS tinh_tp text,
ADD COLUMN IF NOT EXISTS xa_phuong text,
ADD COLUMN IF NOT EXISTS dia_chi_chi_tiet text;

INSERT INTO public.sys_display_config (table_name, column_name, is_visible)
VALUES 
    ('thong_tin_nhan_than', 'tinh_tp', true),
    ('thong_tin_nhan_than', 'xa_phuong', true),
    ('thong_tin_nhan_than', 'dia_chi_chi_tiet', true)
ON CONFLICT (table_name, column_name) DO NOTHING;
