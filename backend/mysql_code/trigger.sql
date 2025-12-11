DELIMITER $$
DROP TRIGGER IF EXISTS trg_detail_ai$$
CREATE TRIGGER trg_detail_ai
AFTER INSERT ON Detail
FOR EACH ROW
BEGIN
    -- Cập nhật tổng số món 
    UPDATE ROrder
    SET Quantity = fn_GetOrderItemCount(NEW.DOrderID)
    WHERE OrderID = NEW.DOrderID;

    -- Trừ 1 
    UPDATE Material m
    JOIN QDMaterial q ON q.QDMaterialID = m.MaterialID
    SET m.Quantity = m.Quantity - (NEW.Quantity * 1)
    WHERE q.QDItemID = NEW.DItemID;
END$$
DELIMITER ;

DELIMITER $$
DROP TRIGGER IF EXISTS trg_detail_au$$
CREATE TRIGGER trg_detail_au
AFTER UPDATE ON Detail
FOR EACH ROW
BEGIN
    IF OLD.DOrderID <> NEW.DOrderID THEN
        UPDATE ROrder
        SET Quantity = fn_GetOrderItemCount(OLD.DOrderID)
        WHERE OrderID = OLD.DOrderID;

        UPDATE ROrder
        SET Quantity = fn_GetOrderItemCount(NEW.DOrderID)
        WHERE OrderID = NEW.DOrderID;
    ELSE
        UPDATE ROrder
        SET Quantity = fn_GetOrderItemCount(NEW.DOrderID)
        WHERE OrderID = NEW.DOrderID;
    END IF;

    IF OLD.DItemID <> NEW.DItemID THEN
        
        UPDATE Material m
        JOIN QDMaterial q ON q.QDMaterialID = m.MaterialID
        SET m.Quantity = m.Quantity + (OLD.Quantity * 1)
        WHERE q.QDItemID = OLD.DItemID;

        UPDATE Material m
        JOIN QDMaterial q ON q.QDMaterialID = m.MaterialID
        SET m.Quantity = m.Quantity - (NEW.Quantity * 1)
        WHERE q.QDItemID = NEW.DItemID;

    ELSE
        UPDATE Material m
        JOIN QDMaterial q ON q.QDMaterialID = m.MaterialID
        SET m.Quantity = m.Quantity - ((NEW.Quantity - OLD.Quantity) * 1)
        WHERE q.QDItemID = NEW.DItemID;
    END IF;

END$$
DELIMITER ;

DELIMITER $$
DROP TRIGGER IF EXISTS trg_detail_ad$$
CREATE TRIGGER trg_detail_ad
AFTER DELETE ON Detail
FOR EACH ROW
BEGIN
    -- Cập nhật quantity
    UPDATE ROrder
    SET Quantity = fn_GetOrderItemCount(OLD.DOrderID)
    WHERE OrderID = OLD.DOrderID;

    -- Trả lại nguyên liệu
    UPDATE Material m
    JOIN QDMaterial q ON q.QDMaterialID = m.MaterialID
    SET m.Quantity = m.Quantity + (OLD.Quantity * 1)
    WHERE q.QDItemID = OLD.DItemID;
END$$
DELIMITER ;

DELIMITER $$
DROP TRIGGER IF EXISTS trg_detail_bi_check_stock$$
CREATE TRIGGER trg_detail_bi_check_stock
BEFORE INSERT ON Detail
FOR EACH ROW
BEGIN
    IF EXISTS (
        SELECT 1
        FROM QDMaterial q
        JOIN Material m ON m.MaterialID = q.QDMaterialID
        WHERE q.QDItemID = NEW.DItemID
          AND m.Quantity < (NEW.Quantity * 1)
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Insufficient material stock for this item';
    END IF;
END$$
DELIMITER ;

DELIMITER $$
DROP TRIGGER IF EXISTS trg_detail_bu_check_stock$$
CREATE TRIGGER trg_detail_bu_check_stock
BEFORE UPDATE ON Detail
FOR EACH ROW
BEGIN
    -- Đổi món 
    IF OLD.DItemID <> NEW.DItemID THEN
        IF EXISTS (
            SELECT 1
            FROM QDMaterial q
            JOIN Material m ON m.MaterialID = q.QDMaterialID
            WHERE q.QDItemID = NEW.DItemID
              AND m.Quantity < (NEW.Quantity * 1)
        ) THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Insufficient stock for new item';
        END IF;

    ELSE
        -- Cùng món nhưng order thêm 
        IF NEW.Quantity > OLD.Quantity THEN
            IF EXISTS (
                SELECT 1
                FROM QDMaterial q
                JOIN Material m ON m.MaterialID = q.QDMaterialID
                WHERE q.QDItemID = NEW.DItemID
                  AND m.Quantity < ((NEW.Quantity - OLD.Quantity) * 1)
            ) THEN
                SIGNAL SQLSTATE '45000'
                    SET MESSAGE_TEXT = 'Insufficient material for quantity increase';
            END IF;
        END IF;
    END IF;

END$$
DELIMITER ;

DELIMITER $$
DROP TRIGGER IF EXISTS trg_order_create_invoice$$

CREATE TRIGGER trg_order_create_invoice
AFTER UPDATE ON ROrder
FOR EACH ROW
BEGIN
    DECLARE v_subtotal DECIMAL(14,2) DEFAULT 0.00;
    DECLARE v_tax DECIMAL(14,2) DEFAULT 0.00;
    DECLARE v_default_customer VARCHAR(10) DEFAULT 'C001';
    DECLARE v_default_cashier VARCHAR(10);
    DECLARE v_invoice_id VARCHAR(10);
    
    -- Chỉ chạy khi Status chuyển từ khác sang 'Paid'
    IF OLD.Status <> 'Paid' AND NEW.Status = 'Paid' THEN
        
        -- Kiểm tra xem Invoice đã tồn tại cho Order này chưa
        IF NOT EXISTS (
            SELECT 1 FROM YPromo WHERE YOrderID = NEW.OrderID
        ) THEN
            
            -- Tính subtotal từ Detail
            SELECT IFNULL(SUM(d.Quantity * i.Price), 0.00)
            INTO v_subtotal
            FROM Detail d
            JOIN Item i ON d.DItemID = i.ItemID
            WHERE d.DOrderID = NEW.OrderID;
            
            -- Tính thuế 10%
            SET v_tax = ROUND(v_subtotal * 0.10, 2);
            
            -- Lấy cashier đầu tiên làm mặc định
            SELECT StaffID INTO v_default_cashier
            FROM Cashier
            LIMIT 1;
            
            -- Nếu không có cashier, dùng staff đầu tiên
            IF v_default_cashier IS NULL THEN
                SELECT s.StaffID INTO v_default_cashier
                FROM Staff s
                LIMIT 1;
            END IF;
            
            -- Generate InvoiceID tự động
            SET v_invoice_id = fn_GenerateInvoiceID();
            
            -- Tạo Invoice mới
            INSERT INTO Invoice (InvoiceID, DateCreated, Tax, IStaffID, CustomerID)
            VALUES (v_invoice_id, NOW(), v_tax, v_default_cashier, v_default_customer);
            
            -- Liên kết Invoice với Order qua YPromo (dùng promotion mặc định P001)
            INSERT INTO YPromo (YPromoID, YInvoiceID, YOrderID)
            VALUES ('P001', v_invoice_id, NEW.OrderID);
            
        END IF;
        
    END IF;
END$$

DELIMITER ;


