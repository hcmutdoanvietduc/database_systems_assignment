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

