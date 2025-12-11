USE RestaurantDatabase;

-- =====================================================
-- BÚN PHỞ MÌ
-- =====================================================

-- Phở Bò Wagyu
UPDATE Item 
SET ImageURL = 'https://raw.githubusercontent.com/hcmutdoanvietduc/database_systems_assignment/refs/heads/DO_NOT_DELETE_Upload_image_url/pho_bo_wagyu.png'
WHERE ItemID = 'F001';

-- Bún Chả Obama
UPDATE Item 
SET ImageURL = 'https://raw.githubusercontent.com/hcmutdoanvietduc/database_systems_assignment/refs/heads/DO_NOT_DELETE_Upload_image_url/bun_cha_obama.jpg'
WHERE ItemID = 'F003';

-- Mì Ý Sốt Kem
UPDATE Item 
SET ImageURL = 'https://raw.githubusercontent.com/hcmutdoanvietduc/database_systems_assignment/refs/heads/DO_NOT_DELETE_Upload_image_url/mi_y_sot_kem.jpg'
WHERE ItemID = 'F004';

-- =====================================================
-- CƠM
-- =====================================================

-- Cơm Tấm Sườn
UPDATE Item 
SET ImageURL = 'https://raw.githubusercontent.com/hcmutdoanvietduc/database_systems_assignment/refs/heads/DO_NOT_DELETE_Upload_image_url/com_tam_suon.jpg'
WHERE ItemID = 'F002';

-- =====================================================
-- ĐỒ UỐNG
-- =====================================================

-- Cafe Sữa Đá
UPDATE Item 
SET ImageURL = 'https://raw.githubusercontent.com/hcmutdoanvietduc/database_systems_assignment/refs/heads/DO_NOT_DELETE_Upload_image_url/ca_phe_sua_da.jpg'
WHERE ItemID = 'D001';

-- Trà Đào Cam Sả
UPDATE Item 
SET ImageURL = 'https://raw.githubusercontent.com/hcmutdoanvietduc/database_systems_assignment/refs/heads/DO_NOT_DELETE_Upload_image_url/tra_dao_cam_xa.jpg'
WHERE ItemID = 'D002';

-- Sinh Tố Bơ
UPDATE Item 
SET ImageURL = 'https://raw.githubusercontent.com/hcmutdoanvietduc/database_systems_assignment/refs/heads/DO_NOT_DELETE_Upload_image_url/sinh_to_bo.jpeg'
WHERE ItemID = 'D003';

-- =====================================================
-- TRÁNG MIỆNG
-- =====================================================

-- Bánh Flan
UPDATE Item 
SET ImageURL = 'https://raw.githubusercontent.com/hcmutdoanvietduc/database_systems_assignment/refs/heads/DO_NOT_DELETE_Upload_image_url/banh_flan.jpg'
WHERE ItemID = 'D004';