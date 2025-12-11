-- ============================================================
-- TEST: Kiểm tra Invoice tự động tạo
-- ============================================================
USE RestaurantDatabase;

-- 1. Kiểm tra trước khi test
SELECT '=== BEFORE TEST ===' AS Step;
SELECT COUNT(*) AS TotalInvoices FROM Invoice;
SELECT COUNT(*) AS TotalYPromo FROM YPromo;

-- 2. Tạo order test mới
INSERT INTO ROrder (OrderID, CreatedAt, Status, Quantity, OTableID)
VALUES ('TEST01', NOW(), 'Serving', 0, 101);

-- 3. Thêm món vào order test
-- Giả sử có Chef với StaffID = 'S001'
INSERT INTO Detail (DOrderID, DItemID, DStaffID, Quantity)
VALUES ('TEST01', 'F001', 'S001', 2);

-- 4. Cập nhật Order thành Paid (trigger sẽ chạy)
SELECT '=== UPDATING ORDER TO PAID ===' AS Step;
UPDATE ROrder SET Status = 'Paid' WHERE OrderID = 'TEST01';

-- 5. Kiểm tra sau khi test
SELECT '=== AFTER TEST ===' AS Step;
SELECT COUNT(*) AS TotalInvoices FROM Invoice;
SELECT * FROM Invoice WHERE InvoiceID LIKE 'INV%' ORDER BY DateCreated DESC LIMIT 5;

SELECT '=== CHECK YPROMO ===' AS Step;
SELECT * FROM YPromo WHERE YOrderID = 'TEST01';

SELECT '=== CALCULATE TOTAL ===' AS Step;
SELECT 
    i.InvoiceID,
    i.DateCreated,
    i.Tax,
    SUM(d.Quantity * it.Price) AS Subtotal,
    SUM(d.Quantity * it.Price) + i.Tax AS Total
FROM Invoice i
JOIN YPromo y ON y.YInvoiceID = i.InvoiceID
JOIN Detail d ON d.DOrderID = y.YOrderID
JOIN Item it ON it.ItemID = d.DItemID
WHERE y.YOrderID = 'TEST01'
GROUP BY i.InvoiceID, i.DateCreated, i.Tax;

-- 6. Cleanup (tùy chọn - comment out nếu muốn giữ data test)
-- DELETE FROM Detail WHERE DOrderID = 'TEST01';
-- DELETE FROM YPromo WHERE YOrderID = 'TEST01';
-- DELETE FROM Invoice WHERE InvoiceID IN (SELECT YInvoiceID FROM YPromo WHERE YOrderID = 'TEST01');
-- DELETE FROM ROrder WHERE OrderID = 'TEST01';
