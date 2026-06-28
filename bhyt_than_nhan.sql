CREATE TABLE IF NOT EXISTS public.bhyt_than_nhan (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ma_dinh_danh TEXT REFERENCES public.thong_tin_quan_nhan(ma_dinh_danh) ON DELETE CASCADE,
  ho_ten TEXT,
  moi_quan_he TEXT,
  ngay_thang_nam_sinh DATE,
  gioi_tinh TEXT,
  dan_toc TEXT DEFAULT 'Kinh',
  ma_so_bhxh TEXT,
  noi_dang_ky_kcb TEXT DEFAULT 'BVQY103',
  so_dien_thoai TEXT,
  que_quan_tinh TEXT,
  que_quan_xa TEXT,
  thuong_tru_tinh TEXT,
  thuong_tru_xa TEXT,
  ghi_chu TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.bhyt_than_nhan ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to do everything
CREATE POLICY "Allow authenticated users full access" ON public.bhyt_than_nhan 
FOR ALL USING (auth.role() = 'authenticated');
