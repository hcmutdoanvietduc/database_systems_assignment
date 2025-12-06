-- trg_detail_ai
INSERT INTO Detail (DOrderID, DItemID, DStaffID, Quantity)
VALUES ('ORD02', 'F002', 'ST02', 1);

SELECT Quantity FROM ROrder WHERE OrderID = 'ORD01';
SELECT Quantity FROM Material;
-- trg_detail_au
UPDATE Detail
SET Quantity = Quantity + 2
WHERE DetailID = 1;

SELECT Quantity FROM ROrder WHERE OrderID = (SELECT DOrderID FROM Detail WHERE DetailID = 1);
SELECT Quantity FROM Material;
-- trg_detail_ad
DELETE FROM Detail WHERE DetailID = 2;

SELECT Quantity FROM ROrder WHERE OrderID = 'ORD01';
SELECT Quantity FROM Material;
-- trg_detail_bi_check_stock
INSERT INTO Detail (DOrderID, DItemID, DStaffID, Quantity)
VALUES ('ORD01', 'F001', 'ST01', 9999);
-- trg_detail_bu_check_stock
UPDATE Detail
SET Quantity = Quantity + 9999
WHERE DetailID = 3;

