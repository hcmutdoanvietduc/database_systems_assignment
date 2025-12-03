DROP DATABASE IF EXISTS RestaurantDatabase;
CREATE DATABASE IF NOT EXISTS RestaurantDatabase CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE RestaurantDatabase;
CREATE TABLE Admin (
    AdminID      VARCHAR(10) PRIMARY KEY,
    FullName     VARCHAR(100) NOT NULL,
    Phone        VARCHAR(15)  UNIQUE,
    Email        VARCHAR(100) UNIQUE,
    Permission   VARCHAR(50)  NOT NULL
);
CREATE TABLE Manager (
    ManagerID    VARCHAR(10) PRIMARY KEY,
    FullName     VARCHAR(100) NOT NULL,
    Phone        VARCHAR(15) UNIQUE,
    Email        VARCHAR(100) UNIQUE,
    MAdminID     VARCHAR(10) NOT NULL,
    Permission   VARCHAR(50) NOT NULL,
    FOREIGN KEY (MAdminID) REFERENCES Admin(AdminID)
);
CREATE TABLE Staff (
    StaffID        VARCHAR(10) PRIMARY KEY,
    FullName       VARCHAR(100) NOT NULL,
    Phone          VARCHAR(15) UNIQUE,
    Status         ENUM('Working','Retired','On Leave') DEFAULT 'Working',
    SManagerID     VARCHAR(10) NOT NULL,
    FOREIGN KEY (SManagerID) REFERENCES Manager(ManagerID)
);
CREATE TABLE Chef (
    StaffID       VARCHAR(10) PRIMARY KEY,
    Experience    INT CHECK (Experience >= 0),
    FOREIGN KEY (StaffID) REFERENCES Staff(StaffID)
);
CREATE TABLE Cashier (
    StaffID       VARCHAR(10) PRIMARY KEY,
    Education     VARCHAR(50),
    FOREIGN KEY (StaffID) REFERENCES Staff(StaffID)
);
CREATE TABLE Waiter (
    StaffID       VARCHAR(10) PRIMARY KEY,
    Fluency       VARCHAR(50), 
    FOREIGN KEY (StaffID) REFERENCES Staff(StaffID)
);
CREATE TABLE Customer (
    CustomerID   VARCHAR(10) PRIMARY KEY,
    FullName     VARCHAR(100) NOT NULL,
    Phone        VARCHAR(15) UNIQUE
);
CREATE TABLE RTable (
    TableID      INT PRIMARY KEY,
    TableNumber  INT NOT NULL,
    Area         VARCHAR(50),
    Status       ENUM('Available','Reserved','Occupied') DEFAULT 'Available'
);
CREATE TABLE ROrder (
    OrderID     VARCHAR(10) PRIMARY KEY,
    CreatedAt   DATETIME DEFAULT CURRENT_TIMESTAMP,
    Status      ENUM('Serving', 'Paid', 'Cancelled') DEFAULT 'Serving',    -- thêm 
    Quantity    INT CHECK (Quantity >= 0),
    OTableID    INT NOT NULL,
    FOREIGN KEY (OTableID) REFERENCES RTable(TableID)
);
CREATE TABLE Item (
    ItemID       VARCHAR(10) PRIMARY KEY,
    Name         VARCHAR(100) NOT NULL,
    Price        DECIMAL(10,2) CHECK (Price >= 0),  -- price = 0 -> loại thức ăn
    Status       ENUM('Available','Unavailable') DEFAULT 'Available',
    SuperItemID  VARCHAR(10),
    FOREIGN KEY (SuperItemID) REFERENCES Item(ItemID)
);
CREATE TABLE Material (
    MaterialID   VARCHAR(10) PRIMARY KEY,
    Quantity     INT CHECK (Quantity >= 0)
);
CREATE TABLE Promotion (
    PromoID      VARCHAR(10) PRIMARY KEY,
    Description  VARCHAR(255),
    MinValue     DECIMAL(10,2) CHECK (MinValue >= 0),
    ExpireDate   DATE
);
CREATE TABLE Invoice (
    InvoiceID    VARCHAR(10) PRIMARY KEY,
    DateCreated  DATETIME DEFAULT CURRENT_TIMESTAMP,
    Tax          DECIMAL(10,2),
    IStaffID     VARCHAR(10) NOT NULL,
    FOREIGN KEY (IStaffID) REFERENCES Cashier(StaffID)
);
CREATE TABLE Payment (
    PaymentID     VARCHAR(10) PRIMARY KEY,
    Amount        DECIMAL(10,2) CHECK (Amount >= 0),
    PayDate       DATETIME DEFAULT CURRENT_TIMESTAMP,
    Method        ENUM('Cash','Card','E-Wallet'),
    Status        ENUM('Success','Failed','Pending') DEFAULT 'Pending',
    PInvoiceID    VARCHAR(10) UNIQUE,   -- thêm unique vì 1 hóa đơn 1 thanh toán
    PStaffID      VARCHAR(10) NOT NULL, -- thêm, vì cũng là thu ngân mà
    FOREIGN KEY (PInvoiceID) REFERENCES Invoice(InvoiceID),
    FOREIGN KEY (PStaffID) REFERENCES Cashier(StaffID)
);
CREATE TABLE Detail (
    DetailID    INT AUTO_INCREMENT,
    DOrderID    VARCHAR(10) NOT NULL,
    DItemID     VARCHAR(10) NOT NULL,
    DStaffID    VARCHAR(10) NOT NULL,
    Quantity    INT CHECK (Quantity > 0),
    PRIMARY KEY (DetailID, DOrderID, DItemID, DStaffID),
    FOREIGN KEY (DOrderID) REFERENCES ROrder(OrderID),
    FOREIGN KEY (DItemID) REFERENCES Item(ItemID),
    FOREIGN KEY (DStaffID) REFERENCES Chef(StaffID)
);
CREATE TABLE Supervision (
    minor_StaffID  VARCHAR(10),
    major_StaffID  VARCHAR(10),
    PRIMARY KEY (minor_StaffID, major_StaffID),
    FOREIGN KEY (minor_StaffID) REFERENCES Staff(StaffID),
    FOREIGN KEY (major_StaffID) REFERENCES Staff(StaffID)
);
CREATE TABLE CustomerBill (
    CustomerBillID  INT AUTO_INCREMENT,
    HCustomerID     VARCHAR(10),
    PRIMARY KEY (CustomerBillID, HCustomerID),   -- bổ sung khóa
    FOREIGN KEY (HCustomerID) REFERENCES Customer(CustomerID)
);
CREATE TABLE PTOrder (
    PTOrderID      VARCHAR(10) PRIMARY KEY,  -- đổi từ int increment sang varchar vì để đồng nhất kiểu dữ liệu
    PTStaffID      VARCHAR(10) NOT NULL,
    PTCustomerID   VARCHAR(10) NOT NULL,
    FOREIGN KEY (PTOrderID) REFERENCES ROrder(OrderID),
    FOREIGN KEY (PTStaffID) REFERENCES Staff(StaffID),
    FOREIGN KEY (PTCustomerID) REFERENCES Customer(CustomerID) -- thiếu cái này
);
CREATE TABLE QDMaterial (
    QDMaterialID  VARCHAR(10),  -- đổi từ int increment sang varchar vì để đồng nhất kiểu dữ liệu
    QDItemID      VARCHAR(10),
    QDManagerID   VARCHAR(10) NOT NULL,
    PRIMARY KEY (QDMaterialID, QDItemID),    -- xem lại schema, thiếu khóa QDItemID
    FOREIGN KEY (QDItemID) REFERENCES Item(ItemID),
    FOREIGN KEY (QDManagerID) REFERENCES Manager(ManagerID),
    FOREIGN KEY (QDMaterialID) REFERENCES Material(MaterialID)  -- thiếu
);
CREATE TABLE YPromo (
    YPromoID    VARCHAR(10) NOT NULL,  -- đổi từ int increment sang varchar vì để đồng nhất kiểu dữ liệu
    YInvoiceID  VARCHAR(10) NOT NULL,
    YOrderID    VARCHAR(10) NOT NULL,
    PRIMARY KEY (YPromoID, YInvoiceID), -- invoiceID phải là pk
    FOREIGN KEY (YInvoiceID) REFERENCES Invoice(InvoiceID),
    FOREIGN KEY (YOrderID) REFERENCES ROrder(OrderID),
    FOREIGN KEY (YPromoID) REFERENCES Promotion(PromoID) 
);
ALTER TABLE Invoice
ADD COLUMN CustomerID VARCHAR(10) NOT NULL,
ADD CONSTRAINT FK_Invoice_Customer
    FOREIGN KEY (CustomerID) REFERENCES Customer(CustomerID);
ALTER TABLE Promotion 
ADD DiscountPercent DECIMAL(5,2) DEFAULT 0;

-- =============================================
-- 1. ADMIN & MANAGER
-- =============================================
INSERT INTO Admin (AdminID, FullName, Phone, Email, Permission) VALUES
('AD01', 'Nguyễn Văn An', '0909001001', 'an.admin@sys.com', 'SuperAdmin'),
('AD02', 'Trần Thị Bình', '0909001002', 'binh.admin@sys.com', 'SystemMonitor'),
('AD03', 'Lê Văn Cao', '0909001003', 'cao.admin@sys.com', 'ContentAdmin'),
('AD04', 'Phạm Thị Dung', '0909001004', 'dung.admin@sys.com', 'Viewer');

INSERT INTO Manager (ManagerID, FullName, Phone, Email, MAdminID, Permission) VALUES
('MGR01', 'Hoàng Văn Hùng', '0912002001', 'hung.mgr@rest.com', 'AD01', 'BranchManager_A'),
('MGR02', 'Đỗ Thị Mai', '0912002002', 'mai.mgr@rest.com', 'AD01', 'BranchManager_B'),
('MGR03', 'Ngô Văn Nam', '0912002003', 'nam.mgr@rest.com', 'AD02', 'ShiftManager_Morning'),
('MGR04', 'Bùi Thị Lan', '0912002004', 'lan.mgr@rest.com', 'AD02', 'ShiftManager_Evening'),
('MGR05', 'Vũ Văn Khôi', '0912002005', 'khoi.mgr@rest.com', 'AD03', 'KitchenManager');

-- =============================================
-- 2. STAFF SYSTEM (Staff, Chef, Cashier, Waiter, Supervision)
-- =============================================
INSERT INTO Staff (StaffID, FullName, Phone, Status, SManagerID) VALUES
-- Chefs
('ST01', 'Gordon Ramsay Fake', '0988003001', 'Working', 'MGR05'),
('ST02', 'Yan Can Cook', '0988003002', 'Working', 'MGR05'),
('ST03', 'Phụ Bếp Tí', '0988003003', 'Working', 'MGR03'),
('ST04', 'Phụ Bếp Tèo', '0988003004', 'On Leave', 'MGR04'),
-- Cashiers
('ST05', 'Lý Thu Ngân', '0988003005', 'Working', 'MGR01'),
('ST06', 'Trần Tính Toán', '0988003006', 'Working', 'MGR02'),
('ST07', 'Lê Doanh Thu', '0988003007', 'Retired', 'MGR01'),
('ST08', 'Phạm Kế Toán', '0988003008', 'Working', 'MGR02'),
-- Waiters
('ST09', 'Nguyễn Nhanh Nhẹn', '0988003009', 'Working', 'MGR03'),
('ST10', 'Trần Vui Vẻ', '0988003010', 'Working', 'MGR03'),
('ST11', 'Lê Chu Đáo', '0988003011', 'Working', 'MGR04'),
('ST12', 'Phạm Nhiệt Tình', '0988003012', 'Working', 'MGR04'),
('ST13', 'Hoàng Chạy Bàn', '0988003013', 'Working', 'MGR03');

INSERT INTO Chef (StaffID, Experience) VALUES
('ST01', 20), ('ST02', 15), ('ST03', 2), ('ST04', 1);

INSERT INTO Cashier (StaffID, Education) VALUES
('ST05', 'Đại học Kinh Tế'), ('ST06', 'Cao đẳng Tài Chính'), 
('ST07', 'Trung cấp Kế Toán'), ('ST08', 'Đại học Ngân Hàng');

INSERT INTO Waiter (StaffID, Fluency) VALUES
('ST09', 'Tiếng Anh'), ('ST10', 'Tiếng Việt'), 
('ST11', 'Tiếng Trung'), ('ST12', 'Tiếng Hàn'), ('ST13', 'Tiếng Nhật');

INSERT INTO Supervision (minor_StaffID, major_StaffID) VALUES
('ST03', 'ST01'), -- Phụ bếp Tí bị Chef Gordon giám sát
('ST04', 'ST02'), -- Phụ bếp Tèo bị Chef Yan giám sát
('ST10', 'ST09'), -- ST10 bị ST09 giám sát
('ST13', 'ST09'),
('ST12', 'ST11');

-- =============================================
-- 3. CUSTOMER & TABLE
-- =============================================
INSERT INTO Customer (CustomerID, FullName, Phone) VALUES
('C001', 'Nguyễn Văn Khách', '0901001001'),
('C002', 'Trần Thị Mua', '0901001002'),
('C003', 'Lê Văn Ăn', '0901001003'),
('C004', 'Phạm Thị Uống', '0901001004'),
('C005', 'Hoàng Văn Vip', '0901001005'),
('C006', 'Vũ Thị Quen', '0901001006'),
('C007', 'Đặng Văn Lạ', '0901001007');

INSERT INTO RTable (TableID, TableNumber, Area, Status) VALUES
(101, 101, 'Tầng 1 - Sảnh', 'Occupied'),
(102, 102, 'Tầng 1 - Sảnh', 'Available'),
(103, 103, 'Tầng 1 - Góc', 'Reserved'),
(104, 104, 'Tầng 1 - Góc', 'Occupied'),
(201, 201, 'Tầng 2 - VIP', 'Occupied'),
(202, 202, 'Tầng 2 - VIP', 'Available'),
(301, 301, 'Sân thượng', 'Available'),
(302, 302, 'Sân thượng', 'Available');

-- =============================================
-- 4. MENU (ITEMS) & MATERIALS
-- =============================================
INSERT INTO Item (ItemID, Name, Price, Status, SuperItemID) VALUES
('CAT1', 'Bún Phở Mì', 0, 'Available', NULL),
('CAT2', 'Cơm', 0, 'Available', NULL),
('CAT3', 'Tráng Miệng', 0, 'Available', NULL),
('CAT4', 'Đồ Uống', 0, 'Available', NULL);

INSERT INTO Item (ItemID, Name, Price, Status, SuperItemID) VALUES
('F001', 'Phở Bò Wagyu', 150000, 'Available', 'CAT1'),
('F002', 'Cơm Tấm Sườn', 65000, 'Available', 'CAT2'),
('F003', 'Bún Chả Obama', 70000, 'Available', 'CAT1'),
('F004', 'Mì Ý Sốt Kem', 120000, 'Unavailable', 'CAT1'),
('D001', 'Cafe Sữa Đá', 35000, 'Available', 'CAT4'),
('D002', 'Trà Đào Cam Sả', 45000, 'Available', 'CAT4'),
('D003', 'Sinh Tố Bơ', 50000, 'Available', 'CAT4'),
('D004', 'Bánh Flan', 20000, 'Available', 'CAT3');

INSERT INTO Material (MaterialID, Quantity) VALUES
('M001', 50), -- Thịt bò (kg)
('M002', 100), -- Gạo (kg)
('M003', 30), -- Sườn heo (kg)
('M004', 20), -- Cafe hạt (kg)
('M005', 50), -- Sữa đặc (lon)
('M006', 10), -- Bơ (kg)
('M007', 500); -- Trứng gà (quả)

-- =============================================
-- 5. QDMaterial (Manager quyết định công thức)
-- =============================================
-- Khóa chính là (QDMaterialID, QDItemID) -> Một món dùng 1 nguyên liệu 1 lần
INSERT INTO QDMaterial (QDMaterialID, QDItemID, QDManagerID) VALUES
('M001', 'F001', 'MGR05'), -- Phở bò dùng Thịt bò
('M002', 'F002', 'MGR05'), -- Cơm tấm dùng Gạo
('M003', 'F002', 'MGR05'), -- Cơm tấm dùng Sườn heo
('M004', 'D001', 'MGR05'), -- Cafe dùng Hạt cafe
('M005', 'D001', 'MGR05'), -- Cafe dùng Sữa đặc
('M007', 'D004', 'MGR05'), -- Bánh Flan dùng Trứng
('M005', 'D004', 'MGR05'); -- Bánh Flan dùng Sữa đặc

-- =============================================
-- 6. PROMOTION (Khuyến mãi)
-- =============================================
INSERT INTO Promotion (PromoID, Description, MinValue, ExpireDate, DiscountPercent) VALUES
('P001', 'Grand Opening', 0, '2025-12-31', 20.00),
('P002', 'VIP Customer', 1000000, '2026-01-01', 15.00),
('P003', 'Summer Sale', 200000, '2024-08-30', 10.00),
('P004', 'Happy Hour', 50000, '2024-12-31', 5.00),
('P005', 'Expired Voucher', 0, '2020-01-01', 50.00);

-- =============================================
-- 7. ORDER & INVOICE PROCESS
-- =============================================

-- BƯỚC 1: Tạo Đơn hàng (ROrder)
-- Lưu ý: OTableID NOT NULL (phải có bàn)
INSERT INTO ROrder (OrderID, CreatedAt, Status, Quantity, OTableID) VALUES
('ORD01', '2023-11-26 08:00:00', 'Paid', 2, 101),
('ORD02', '2023-11-26 09:30:00', 'Paid', 3, 201),
('ORD03', '2023-11-26 10:15:00', 'Serving', 1, 104),
('ORD04', '2023-11-26 11:00:00', 'Cancelled', 0, 103),
('ORD05', '2023-11-26 12:00:00', 'Paid', 4, 101), -- Khách bàn 101 quay lại ăn trưa
('ORD06', '2023-11-26 12:30:00', 'Serving', 2, 104);

-- BƯỚC 2: PTOrder (Phân công Waiter phụ trách Order & Customer)
-- Lưu ý: PTStaffID, PTCustomerID NOT NULL
INSERT INTO PTOrder (PTOrderID, PTStaffID, PTCustomerID) VALUES
('ORD01', 'ST09', 'C001'),
('ORD02', 'ST11', 'C005'), -- Khách VIP C005
('ORD03', 'ST10', 'C002'),
('ORD04', 'ST13', 'C003'),
('ORD05', 'ST09', 'C001'), -- Khách C001 quay lại
('ORD06', 'ST12', 'C004');

-- BƯỚC 3: Detail (Chi tiết món ăn - Chef nấu)
-- Lưu ý: DOrderID, DItemID, DStaffID NOT NULL
INSERT INTO Detail (DOrderID, DItemID, DStaffID, Quantity) VALUES
-- Order 1: 1 Phở, 1 Cafe
('ORD01', 'F001', 'ST01', 1),
('ORD01', 'D001', 'ST03', 1),
-- Order 2: 2 Cơm tấm, 1 Trà đào
('ORD02', 'F002', 'ST02', 2),
('ORD02', 'D002', 'ST03', 1),
-- Order 3: 1 Sinh tố
('ORD03', 'D003', 'ST04', 1),
-- Order 5: 4 Bánh Flan
('ORD05', 'D004', 'ST03', 4),
-- Order 6: 2 Phở
('ORD06', 'F001', 'ST01', 2);

-- BƯỚC 4: Invoice (Xuất hóa đơn)
-- Lưu ý: CustomerID NOT NULL (theo lệnh Alter của bạn)
INSERT INTO Invoice (InvoiceID, DateCreated, Tax, IStaffID, CustomerID) VALUES
('INV01', '2023-11-26 09:00:00', 15000, 'ST05', 'C001'), -- Cho ORD01
('INV02', '2023-11-26 10:30:00', 17500, 'ST06', 'C005'), -- Cho ORD02
('INV03', '2023-11-26 13:00:00', 8000, 'ST05', 'C001'),  -- Cho ORD05
('INV04', '2023-11-26 12:10:00', 25000, 'ST05', 'C001'),  -- lại cho ORD05
('INV05', '2023-11-26 18:00:00', 10000, 'ST06', 'C007'); 

-- BƯỚC 5: YPromo (Áp mã khuyến mãi vào Hóa đơn & Đơn hàng)
-- Lưu ý: YPromoID là PK (mỗi mã promo chỉ xuất hiện 1 lần ở bảng này theo schema hiện tại)
-- Lưu ý 2: Các cột đều NOT NULL
INSERT INTO YPromo (YPromoID, YInvoiceID, YOrderID) VALUES
('P001', 'INV01', 'ORD01'), -- HĐ 1 dùng mã Khai trương
('P002', 'INV02', 'ORD02'), -- HĐ 2 dùng mã VIP
('P004', 'INV03', 'ORD05'), -- HĐ 3 dùng mã Happy Hour
('P003', 'INV04', 'ORD05'),
('P005', 'INV05', 'ORD01'); -- Giả sử áp dụng thêm mã giảm giá cũ cho đơn cũ (dữ liệu test)

-- BƯỚC 6: Payment (Thanh toán)
-- Lưu ý: PStaffID NOT NULL (phải có thu ngân)
INSERT INTO Payment (PaymentID, Amount, PayDate, Method, Status, PInvoiceID, PStaffID) VALUES
('PAY01', 165000, '2023-11-26 09:05:00', 'Cash', 'Success', 'INV01', 'ST05'),
('PAY02', 192500, '2023-11-26 10:35:00', 'Card', 'Success', 'INV02', 'ST06'),
('PAY03', 88000,  '2023-11-26 13:05:00', 'E-Wallet', 'Success', 'INV03', 'ST05'),
('PAY04', 275000, '2023-11-26 12:15:00', 'Cash', 'Success', 'INV04', 'ST05'),
('PAY05', 110000, '2023-11-26 18:05:00', 'E-Wallet', 'Success', 'INV05', 'ST06');

-- =============================================
-- 8. CustomerBill (Lịch sử mua hàng - Log)
-- =============================================
INSERT INTO CustomerBill (HCustomerID) VALUES
('C001'),
('C005'),
('C001'), -- Mua lần 2
('C002');



