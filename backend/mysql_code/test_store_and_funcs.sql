-- STORE PROCEDURES - TESTCASES

-- sp_GetItems
CALL sp_GetItems('Price', 'DESC', 'Phở');
-- sp_AddOrderItem
CALL sp_AddOrderItem('ORD03', 'F001', 2, 'ST01');
SELECT * FROM Detail WHERE DOrderID = 'ORD03' AND DItemID = 'F001' AND DStaffID = 'ST01';
-- sp_GetOrderDetails
CALL sp_GetOrderDetails('ORD01');
-- sp_CreateInvoice
SET @total = 0;

CALL sp_CreateInvoice(
    'INVTEST',
    'ORD03',
    'C002',
    'ST05',
    10,
    'P001',
    @total
);

SELECT @total AS FinalAmount;

SELECT * FROM Invoice WHERE InvoiceID = 'INVTEST';
SELECT * FROM YPromo WHERE YInvoiceID = 'INVTEST';

-- FUNCTIONS - TESTCASES

-- fn_OrderSubtotal
SELECT fn_OrderSubtotal('ORD01') AS Subtotal;
-- fn_GetOrderItemCount
SELECT fn_GetOrderItemCount('ORD05') AS TotalItems;
-- fn_CustomerTotalSpent
SELECT fn_CustomerTotalSpent('C001', '2023-01-01') AS TotalSpent;

