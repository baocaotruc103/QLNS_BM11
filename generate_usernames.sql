-- 1. Hàm loại bỏ dấu tiếng Việt và chuyển thành chữ thường
CREATE OR REPLACE FUNCTION public.fn_unaccent_vn(text) RETURNS text AS $$
DECLARE
    str text := $1;
BEGIN
    str := lower(str);
    str := regexp_replace(str, '[áàãạảăắằẵặẳâấầẫậẩ]', 'a', 'g');
    str := regexp_replace(str, '[đ]', 'd', 'g');
    str := regexp_replace(str, '[éèẽẹẻêếềễệể]', 'e', 'g');
    str := regexp_replace(str, '[íìĩịỉ]', 'i', 'g');
    str := regexp_replace(str, '[óòõọỏôốồỗộổơớờỡợở]', 'o', 'g');
    str := regexp_replace(str, '[úùũụủưứừữựử]', 'u', 'g');
    str := regexp_replace(str, '[ýỳỹỵỷ]', 'y', 'g');
    RETURN str;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 2. Hàm tạo tên đăng nhập từ họ và tên
CREATE OR REPLACE FUNCTION public.fn_generate_username(full_name text) RETURNS text AS $$
DECLARE
    clean_name text;
    words text[];
    username text := '';
    i integer;
BEGIN
    IF full_name IS NULL OR trim(full_name) = '' THEN
        RETURN NULL;
    END IF;

    clean_name := public.fn_unaccent_vn(trim(full_name));
    
    words := string_to_array(regexp_replace(clean_name, '\s+', ' ', 'g'), ' ');
    
    IF array_length(words, 1) = 1 THEN
        RETURN words[1];
    END IF;
    
    FOR i IN 1 .. array_length(words, 1) - 1 LOOP
        username := username || substr(words[i], 1, 1);
    END LOOP;
    
    username := username || words[array_length(words, 1)];
    
    RETURN username;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3. Xóa khóa ngoại cũ bị lỗi (do hiện tại bảng cha là thong_tin_quan_nhan)
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_ten_dang_nhap_fkey;

-- 4. Cập nhật tên đăng nhập cho tất cả bản ghi (ghi đè dữ liệu cũ)
UPDATE public.users
SET ten_dang_nhap = public.fn_generate_username(ho_va_ten)
WHERE ho_va_ten IS NOT NULL;
