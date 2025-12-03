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






