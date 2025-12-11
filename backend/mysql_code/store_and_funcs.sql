USE RestaurantDatabase;

DROP FUNCTION IF EXISTS fn_OrderSubtotal;
DELIMITER $$

CREATE FUNCTION fn_OrderSubtotal(pOrderID VARCHAR(10))
RETURNS DECIMAL(14,2)
DETERMINISTIC
BEGIN
    DECLARE v_subtotal DECIMAL(14,2);

    IF pOrderID IS NULL OR pOrderID = '' THEN
        RETURN 0.00;
    END IF;

    SELECT IFNULL(SUM(d.Quantity * i.Price), 0.00)
    INTO v_subtotal
    FROM Detail d
    JOIN Item i ON d.DItemID = i.ItemID
    WHERE d.DOrderID = pOrderID;

    RETURN v_subtotal;
END$$

DELIMITER ;

DROP FUNCTION IF EXISTS fn_GetOrderItemCount;
DELIMITER $$

CREATE FUNCTION fn_GetOrderItemCount(pOrderID VARCHAR(10))
RETURNS INT
DETERMINISTIC
BEGIN
    DECLARE v_count INT DEFAULT 0;

    IF pOrderID IS NULL OR pOrderID = '' THEN
        RETURN 0;
    END IF;

    SELECT IFNULL(SUM(Quantity), 0)
    INTO v_count
    FROM Detail
    WHERE DOrderID = pOrderID;

    RETURN v_count;
END$$

DELIMITER ;

DROP FUNCTION IF EXISTS fn_GenerateInvoiceID;
DELIMITER $$

CREATE FUNCTION fn_GenerateInvoiceID()
RETURNS VARCHAR(10)
DETERMINISTIC
BEGIN
    DECLARE v_max_num INT DEFAULT 0;
    DECLARE v_new_id VARCHAR(10);
    
    -- Lấy số lớn nhất từ InvoiceID có format INVxxx
    SELECT IFNULL(MAX(CAST(SUBSTRING(InvoiceID, 4) AS UNSIGNED)), 0)
    INTO v_max_num
    FROM Invoice
    WHERE InvoiceID LIKE 'INV%' 
      AND LENGTH(InvoiceID) <= 10
      AND SUBSTRING(InvoiceID, 4) REGEXP '^[0-9]+$';
    
    -- Tăng lên 1 và format INV + pad 0
    SET v_new_id = CONCAT('INV', LPAD(v_max_num + 1, 4, '0'));
    
    RETURN v_new_id;
END$$

DELIMITER ;

DROP FUNCTION IF EXISTS fn_CustomerTotalSpent;
DELIMITER $$

CREATE FUNCTION fn_CustomerTotalSpent(
    pCustomerID VARCHAR(10),
    pSince DATE
)
RETURNS DECIMAL(14,2)
DETERMINISTIC
BEGIN
    DECLARE v_total DECIMAL(14,2) DEFAULT 0.00;

    IF pCustomerID IS NULL OR pCustomerID = '' THEN
        RETURN 0.00;
    END IF;

    IF pSince IS NULL THEN
        SET pSince = '1900-01-01';
    END IF;
    SELECT IFNULL(
        SUM(
            sub.Subtotal - COALESCE(promo.TotalDiscount, 0)
        ),
        0.00
    )
    INTO v_total
    FROM (
        SELECT 
            inv.InvoiceID,
            y.YOrderID AS OrderID,
            fn_OrderSubtotal(y.YOrderID) AS Subtotal
        FROM Invoice inv
        JOIN YPromo y ON y.YInvoiceID = inv.InvoiceID
        WHERE inv.CustomerID = pCustomerID
          AND inv.DateCreated >= pSince
    ) AS sub
    LEFT JOIN (
        SELECT 
            y.YInvoiceID,
            SUM(
                CASE
                    WHEN promo.ExpireDate >= CURDATE()
                         AND fn_OrderSubtotal(y.YOrderID) >= promo.MinValue
                    THEN ROUND(fn_OrderSubtotal(y.YOrderID) * promo.DiscountPercent / 100, 2)
                    ELSE 0
                END
            ) AS TotalDiscount
        FROM YPromo y
        JOIN Promotion promo ON promo.PromoID = y.YPromoID
        GROUP BY y.YInvoiceID
    ) AS promo
        ON promo.YInvoiceID = sub.InvoiceID;

    RETURN v_total;
END$$

DELIMITER ;



DROP PROCEDURE IF EXISTS sp_GetItems;
DELIMITER $$

CREATE PROCEDURE sp_GetItems(
    IN pSortBy VARCHAR(20),
    IN pSortOrder VARCHAR(5),
    IN pKeyword VARCHAR(100)
)
BEGIN
    IF pSortBy IS NULL OR pSortBy NOT IN ('Name','Price','Status') THEN
        SET pSortBy = 'Name';
    END IF;

    IF pSortOrder IS NULL OR pSortOrder NOT IN ('ASC','DESC') THEN
        SET pSortOrder = 'ASC';
    END IF;

    IF pKeyword IS NULL THEN
        SET pKeyword = '';
    END IF;

    SET @sql = CONCAT(
        'SELECT ItemID, Name, Price, Status, SuperItemID
         FROM Item
         WHERE Name LIKE ''%', pKeyword, '%''
         ORDER BY ', pSortBy, ' ', pSortOrder
    );

    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_AddOrderItem;
DELIMITER $$

CREATE PROCEDURE sp_AddOrderItem(
    IN pOrderID VARCHAR(10),
    IN pItemID  VARCHAR(10),
    IN pQuantity INT,
    IN pStaffID VARCHAR(10)    -- thêm tham số cho đầu bếp / người nấu
)
BEGIN
    DECLARE v_exists INT DEFAULT 0;

    IF pOrderID IS NULL OR pOrderID = '' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'OrderID is required';
    END IF;
    IF pItemID IS NULL OR pItemID = '' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'ItemID is required';
    END IF;
    IF pQuantity IS NULL OR pQuantity < 1 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Quantity must be >= 1';
    END IF;
    IF pStaffID IS NULL OR pStaffID = '' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'DStaffID (chef) is required';
    END IF;

    SELECT COUNT(*) INTO v_exists
    FROM Detail
    WHERE DOrderID = pOrderID
      AND DItemID = pItemID
      AND DStaffID = pStaffID;

    START TRANSACTION;

    IF v_exists = 0 THEN
        INSERT INTO Detail (DOrderID, DItemID, DStaffID, Quantity)
        VALUES (pOrderID, pItemID, pStaffID, pQuantity);
    ELSE
        UPDATE Detail
        SET Quantity = Quantity + pQuantity
        WHERE DOrderID = pOrderID
          AND DItemID = pItemID
          AND DStaffID = pStaffID;
    END IF;

    COMMIT;
END$$

DELIMITER ;

DROP PROCEDURE IF EXISTS sp_GetOrderDetails;
DELIMITER $$

CREATE PROCEDURE sp_GetOrderDetails(
    IN pOrderID VARCHAR(10)
)
BEGIN
    IF pOrderID IS NULL OR pOrderID = '' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'OrderID is required';
    END IF;

    SELECT 
        d.DetailID,
        d.DItemID AS ItemID,
        i.Name AS ItemName,
        i.Price,
        d.Quantity,
        (d.Quantity * i.Price) AS TotalItemPrice
    FROM Detail d
    JOIN Item i ON d.DItemID = i.ItemID
    WHERE d.DOrderID = pOrderID
    ORDER BY i.Name;
END$$

DELIMITER ;

DROP PROCEDURE IF EXISTS sp_CreateInvoice;
DELIMITER $$

CREATE PROCEDURE sp_CreateInvoice(
    IN pInvoiceID   VARCHAR(10),
    IN pOrderID     VARCHAR(10),
    IN pCustomerID  VARCHAR(10),
    IN pStaffID     VARCHAR(10),
    IN pTaxRate     DECIMAL(10,2),
    IN pPromoID     VARCHAR(10),  
    OUT pTotal      DECIMAL(14,2)
)
BEGIN
    DECLARE v_subtotal DECIMAL(14,2) DEFAULT 0.00;
    DECLARE v_discount DECIMAL(14,2) DEFAULT 0.00;
    DECLARE v_tax      DECIMAL(14,2) DEFAULT 0.00;
    DECLARE v_final    DECIMAL(14,2) DEFAULT 0.00;

    SET v_subtotal = fn_OrderSubtotal(pOrderID);

    IF pPromoID IS NOT NULL AND pPromoID != '' THEN
        SELECT IFNULL(
            CASE
                WHEN ExpireDate >= CURDATE() AND v_subtotal >= MinValue
                THEN ROUND(v_subtotal * DiscountPercent / 100, 2)
                ELSE 0
            END, 0)
        INTO v_discount
        FROM Promotion
        WHERE PromoID = pPromoID;
    END IF;

    SET v_tax = ROUND((v_subtotal - v_discount) * (pTaxRate / 100), 2);
    SET v_final = v_subtotal - v_discount + v_tax;

    START TRANSACTION;

    INSERT INTO Invoice (InvoiceID, DateCreated, Tax, IStaffID, CustomerID) 
    VALUES (pInvoiceID, NOW(), v_tax, pStaffID, pCustomerID);

    IF pPromoID IS NOT NULL AND pPromoID != '' AND v_discount > 0 THEN
        INSERT INTO YPromo (YPromoID, YInvoiceID, YOrderID)
        VALUES (pPromoID, pInvoiceID, pOrderID);
    END IF;
    
    UPDATE ROrder SET Status = 'Paid' WHERE OrderID = pOrderID;

    COMMIT;

    SET pTotal = v_final;

END$$

DELIMITER ;

DROP PROCEDURE IF EXISTS sp_DeleteOrder;
DELIMITER $$

CREATE PROCEDURE sp_DeleteOrder(
    IN pOrderID VARCHAR(10)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Lỗi khi xóa đơn hàng!';
    END;

    START TRANSACTION;

    -- Xóa YPromo (liên kết Invoice-Order-Promo) nếu có
    DELETE FROM YPromo 
    WHERE YOrderID = pOrderID;

    -- Xóa Invoice liên quan
    DELETE FROM Invoice 
    WHERE InvoiceID IN (
        SELECT YInvoiceID FROM YPromo WHERE YOrderID = pOrderID
    );

    -- Xóa Detail (chi tiết món ăn trong đơn)
    DELETE FROM Detail 
    WHERE DOrderID = pOrderID;

    -- Xóa đơn hàng
    DELETE FROM ROrder 
    WHERE OrderID = pOrderID;

    COMMIT;

END$$

DELIMITER ;

DROP PROCEDURE IF EXISTS sp_AddStaff;
DELIMITER $$

CREATE PROCEDURE sp_AddStaff(
    INOUT pStaffID VARCHAR(10),
    IN pName VARCHAR(100),
    IN pPhone VARCHAR(15),
    IN pManagerID VARCHAR(10),
    IN pRole VARCHAR(20),
    IN pRoleDetail VARCHAR(255)
)
BEGIN
    DECLARE v_max_num INT DEFAULT 0;
    DECLARE v_experience INT DEFAULT 0;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Lỗi khi thêm nhân viên!';
    END;

    START TRANSACTION;

    -- Tự sinh StaffID nếu không có
    IF pStaffID IS NULL OR pStaffID = '' THEN
        SELECT IFNULL(MAX(CAST(SUBSTRING(StaffID, 3) AS UNSIGNED)), 0)
        INTO v_max_num
        FROM Staff
        WHERE StaffID LIKE 'ST%';
        
        SET pStaffID = CONCAT('ST', LPAD(v_max_num + 1, 2, '0'));
    END IF;

    -- Thêm vào bảng Staff (FullName, Phone, Status, SManagerID)
    INSERT INTO Staff (StaffID, FullName, Phone, Status, SManagerID)
    VALUES (pStaffID, pName, pPhone, 'Working', pManagerID);

    -- Thêm vào bảng chuyên môn tương ứng
    CASE pRole
        WHEN 'Chef' THEN
            -- Chuyển đổi pRoleDetail thành INT cho Experience
            SET v_experience = CAST(IFNULL(pRoleDetail, '0') AS UNSIGNED);
            INSERT INTO Chef (StaffID, Experience)
            VALUES (pStaffID, v_experience);
            
        WHEN 'Cashier' THEN
            INSERT INTO Cashier (StaffID, Education)
            VALUES (pStaffID, pRoleDetail);
            
        WHEN 'Waiter' THEN
            INSERT INTO Waiter (StaffID, Fluency)
            VALUES (pStaffID, pRoleDetail);
            
        ELSE
            SIGNAL SQLSTATE '45000' 
            SET MESSAGE_TEXT = 'Vai trò không hợp lệ! Chỉ chấp nhận: Chef, Cashier, Waiter';
    END CASE;

    COMMIT;

END$$

DELIMITER ;

DROP PROCEDURE IF EXISTS sp_UpdateStaff;
DELIMITER $$

CREATE PROCEDURE sp_UpdateStaff(
    IN pStaffID VARCHAR(10),
    IN pName VARCHAR(100),
    IN pPhone VARCHAR(15),
    IN pStatus VARCHAR(20),
    IN pRoleDetail VARCHAR(255)
)
BEGIN
    DECLARE v_experience INT DEFAULT 0;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Lỗi khi cập nhật nhân viên!';
    END;

    START TRANSACTION;

    -- Cập nhật bảng Staff (FullName, Phone, Status)
    UPDATE Staff 
    SET FullName = pName,
        Phone = pPhone,
        Status = pStatus
    WHERE StaffID = pStaffID;

    -- Xác định vai trò và cập nhật chi tiết
    IF EXISTS (SELECT 1 FROM Chef WHERE StaffID = pStaffID) THEN
        -- Cập nhật Experience cho Chef
        SET v_experience = CAST(IFNULL(pRoleDetail, '0') AS UNSIGNED);
        UPDATE Chef 
        SET Experience = v_experience
        WHERE StaffID = pStaffID;
        
    ELSEIF EXISTS (SELECT 1 FROM Cashier WHERE StaffID = pStaffID) THEN
        -- Cập nhật Education cho Cashier
        UPDATE Cashier 
        SET Education = pRoleDetail
        WHERE StaffID = pStaffID;
        
    ELSEIF EXISTS (SELECT 1 FROM Waiter WHERE StaffID = pStaffID) THEN
        -- Cập nhật Fluency cho Waiter
        UPDATE Waiter 
        SET Fluency = pRoleDetail
        WHERE StaffID = pStaffID;
    END IF;

    COMMIT;

END$$

DELIMITER ;

DROP PROCEDURE IF EXISTS sp_DeleteStaff;
DELIMITER $$

CREATE PROCEDURE sp_DeleteStaff(
    IN pStaffID VARCHAR(10)
)
BEGIN
    DECLARE v_count INT DEFAULT 0;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Lỗi khi xóa nhân viên!';
    END;

    START TRANSACTION;

    -- Kiểm tra xem nhân viên có liên quan đến đơn hàng không
    SELECT COUNT(*) INTO v_count
    FROM PTOrder
    WHERE PTStaffID = pStaffID;
    
    IF v_count > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Không thể xóa nhân viên đã tham gia xử lý đơn hàng!';
    END IF;
    
    -- Kiểm tra xem nhân viên có liên quan đến Detail không (Chef)
    SELECT COUNT(*) INTO v_count
    FROM Detail
    WHERE DStaffID = pStaffID;
    
    IF v_count > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Không thể xóa đầu bếp đã tham gia chế biến món ăn!';
    END IF;
    
    -- Kiểm tra xem nhân viên có liên quan đến Invoice không (Cashier)
    SELECT COUNT(*) INTO v_count
    FROM Invoice
    WHERE IStaffID = pStaffID;
    
    IF v_count > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Không thể xóa thu ngân đã tạo hóa đơn!';
    END IF;
    
    -- Kiểm tra xem nhân viên có liên quan đến Payment không (Cashier)
    SELECT COUNT(*) INTO v_count
    FROM Payment
    WHERE PStaffID = pStaffID;
    
    IF v_count > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Không thể xóa thu ngân đã xử lý thanh toán!';
    END IF;

    -- Xóa từ bảng Supervision (nếu là cấp trên hoặc cấp dưới)
    DELETE FROM Supervision 
    WHERE minor_StaffID = pStaffID OR major_StaffID = pStaffID;

    -- Xóa từ bảng con tương ứng
    DELETE FROM Chef WHERE StaffID = pStaffID;
    DELETE FROM Cashier WHERE StaffID = pStaffID;
    DELETE FROM Waiter WHERE StaffID = pStaffID;

    -- Xóa từ bảng Staff
    DELETE FROM Staff WHERE StaffID = pStaffID;

    COMMIT;

END$$

DELIMITER ;

DROP PROCEDURE IF EXISTS sp_GetOrCreateCustomer;
DELIMITER $$

CREATE PROCEDURE sp_GetOrCreateCustomer(
    IN pPhone VARCHAR(15),
    IN pName VARCHAR(100)
)
BEGIN
    DECLARE v_existingID VARCHAR(10);
    DECLARE v_maxNum INT DEFAULT 0;
    
    -- Kiểm tra xem số điện thoại đã tồn tại chưa
    SELECT CustomerID INTO v_existingID
    FROM Customer
    WHERE Phone = pPhone
    LIMIT 1;
    
    IF v_existingID IS NOT NULL THEN
        -- Đã tồn tại, cập nhật tên nếu khác
        UPDATE Customer
        SET FullName = pName
        WHERE CustomerID = v_existingID AND FullName != pName;
        
        -- Trả về CustomerID cũ
        SELECT v_existingID AS CustomerID;
    ELSE
        -- Chưa tồn tại, tạo CustomerID mới
        -- Lấy số lớn nhất từ CustomerID hiện có (C001 -> 1, C002 -> 2)
        SELECT IFNULL(MAX(CAST(SUBSTRING(CustomerID, 2) AS UNSIGNED)), 0)
        INTO v_maxNum
        FROM Customer
        WHERE CustomerID REGEXP '^C[0-9]+$';
        
        -- Tạo CustomerID mới: C001, C002, C003, ...
        SET v_maxNum = v_maxNum + 1;
        SET v_existingID = CONCAT('C', LPAD(v_maxNum, 3, '0'));
        
        -- Insert khách hàng mới
        INSERT INTO Customer (CustomerID, FullName, Phone)
        VALUES (v_existingID, pName, pPhone);
        
        -- Trả về CustomerID mới
        SELECT v_existingID AS CustomerID;
    END IF;
    
END$$

DELIMITER ;