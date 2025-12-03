# 🚀 HƯỚNG DẪN CHẠY REACT FRONTEND

## 📋 Các file đã tạo:

```
restaurant-frontend/
├── package.json                    (Khai báo dependencies)
├── public/
│   └── index.html                  (HTML chính)
└── src/
    ├── index.js                    (Entry point)
    ├── App.jsx                     (Component chính)
    ├── App.css                     (CSS chung)
    ├── api.js                      (Gọi API Backend)
    └── components/
        ├── CustomerView.jsx        (View 1: Khách hàng gọi món)
        ├── CustomerView.css
        ├── StaffView.jsx           (View 2: Nhân viên quản lý)
        ├── StaffView.css
        ├── AdminView.jsx           (View 3: Admin thống kê)
        └── AdminView.css
```

---

## ✅ BƯỚC 1: Cài đặt Node.js

**Nếu chưa cài:**
1. Download từ: https://nodejs.org/ (LTS version)
2. Cài đặt bình thường
3. Kiểm tra: Mở PowerShell và gõ:
```powershell
node --version
npm --version
```

---

## ✅ BƯỚC 2: Cài đặt Dependencies

Mở PowerShell, di chuyển đến folder `restaurant-frontend`:

```powershell
cd c:\Users\ADMIN\Desktop\database_systems_assignment\restaurant-frontend
npm install
```

**Đợi vài phút để npm cài đặt tất cả packages:**
- react
- react-dom
- axios (để gọi API)

---

## ✅ BƯỚC 3: Chạy React Development Server

```powershell
npm start
```

**Kết quả:**
- React sẽ tự mở browser ở `http://localhost:3000`
- Nếu không mở tự động, hãy mở browser và gõ: `http://localhost:3000`

---

## 🎯 KIỂM TRA 3 VIEWS

### **View 1: Customer View (Khách hàng gọi món)**
- **URL:** `http://localhost:3000` → Click "👤 Customer View"
- **Chức năng:**
  - Chọn bàn → Tạo order
  - Chọn món ăn → Thêm vào order
  - Xem danh sách món đã gọi
  - Hiển thị tổng tiền

### **View 2: Staff View (Nhân viên)**
- **URL:** Click "👨‍💼 Staff View"
- **Chức năng:**
  - Xem dashboard: Bàn đang phục vụ, bàn trống
  - Xem chi tiết từng đơn hàng
  - Xem danh sách bàn trống
  - Click "✓ Thanh Toán Xong" để hoàn thành đơn

### **View 3: Admin View (Quản lý)**
- **URL:** Click "📊 Admin View"
- **Chức năng:**
  - Xem KPI: Bàn, đơn hàng, doanh thu
  - Xem thống kê bàn theo tỷ lệ phần trăm
  - Xem danh sách hóa đơn
  - Xem danh sách đơn hàng
  - Xem phân bố bàn theo khu vực (Area)

---

## 🔗 LIÊN KẾT GIỮA REACT & DJANGO

**Tệp `api.js` chứa tất cả các function gọi API:**

```javascript
// Ví dụ: Lấy danh sách món có sẵn
export const getAvailableItems = () => {
  return api.get('/items/available/');
};

// Gọi từ React Component:
import { getAvailableItems } from '../api';

useEffect(() => {
  getAvailableItems()
    .then(res => setItems(res.data))
    .catch(err => console.error(err));
}, []);
```

---

## ⚡ FLOW HOÀN CHỈNH

```
1️⃣ Backend (Django) chạy ở: http://127.0.0.1:8000
   - API endpoints: /api/items/, /api/tables/, /api/orders/, ...

2️⃣ Frontend (React) chạy ở: http://localhost:3000
   - 3 Views: Customer, Staff, Admin

3️⃣ React gọi API qua axios:
   GET/POST http://127.0.0.1:8000/api/...

4️⃣ Django trả về JSON, React render UI
```

---

## 🛠️ TROUBLESHOOT

### **Lỗi: "npm is not recognized"**
- Cần cài Node.js
- Khởi động lại PowerShell sau khi cài

### **Lỗi: "Cannot GET /api/items/"**
- Django server chưa chạy
- Chạy: `python manage.py runserver` (terminal khác)

### **React không gọi được API**
- Kiểm tra CORS config trong Django settings.py
- Kiểm tra URL trong `api.js` đúng không

### **Port 3000 đang bị chiếm**
- Đóng các React app cũ
- Hoặc chạy: `npm start -- --port 3001`

---

## 📝 GIẢI THÍCH CẤU TRÚC

**App.jsx (Component chính):**
- Navbar với 3 nút: Customer, Staff, Admin
- State `currentView` theo dõi view hiện tại
- Render component tương ứng

**CustomerView.jsx:**
- `useState` để lưu: tables, items, selectedTable, currentOrder
- `useEffect` để load dữ liệu từ API khi mount
- Event handlers: `handleTableSelect`, `handleAddItem`

**StaffView.jsx:**
- Load dữ liệu tables từ API
- Auto-refresh mỗi 5 giây
- Hiển thị bàn đang phục vụ
- Nút "✓ Thanh Toán Xong" gọi `/api/orders/{id}/complete/`

**AdminView.jsx:**
- Tính toán KPI: occupied count, revenue, etc.
- Hiển thị bảng hóa đơn, đơn hàng
- Thống kê bàn theo khu vực (area)

---

## ✅ HOÀN THIỆN!

React UI đã sẵn sàng!

🎉 **Tóm lại:**
- ✅ Backend API (Django) - XONG
- ✅ Frontend UI (React) - XONG
- ✅ 3 Views: Customer, Staff, Admin - XONG

**Bước tiếp theo:** 
- Test 2 server cùng chạy
- Deploy để presentation
