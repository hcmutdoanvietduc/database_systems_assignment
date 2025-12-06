# 🍽️ Restaurant Management System

## 📋 1. Yêu cầu cài đặt (Prerequisites)

* **Python:** 3.12 trở lên.
* **MySQL Server:** 8.0 trở lên.
* **Git**

---

## 🛠️ 2. Hướng dẫn Cài đặt & Chạy Server

### Bước 1: Clone dự án
```bash
git clone <link-repo-cua-ban>
cd database_systems_assignment
````

### Bước 2: Thiết lập môi trường ảo

Khuyên dùng môi trường ảo để tránh xung đột thư viện.

```bash
# Tạo môi trường ảo
python -m venv venv

# Kích hoạt (Windows):
venv\Scripts\activate

# Kích hoạt (Mac/Linux):
source venv/bin/activate
```

### Bước 3: Cài đặt thư viện

```bash
pip install -r requirements.txt
```

*(Nếu chưa có file requirements.txt, chạy lệnh cài thủ công: `pip install django mysqlclient python-dotenv djangorestframework django-cors-headers`)*

### Bước 4: Cấu hình biến môi trường (.env)

Không cần thiết vì sẽ có bước 5 (đã tạo sManager là tài khoản được cấp toàn quyền vào DB)

### Bước 5: Nạp dữ liệu Database (Quan trọng)

**Chú ý**: Folder mysql_code chỉ là nơi lưu trữ code MySql

Vì hệ thống chạy trên CSDL có sẵn, hãy đảm bảo đã chạy các script SQL này **trong MySQL Workbench** hoặc CLI:
(Sử dụng các file .sql trong backend/mysql_code vì chúng mới nhất)

1.  `table_and_data.sql`
2.  `store_and_funcs.sql`
3.  `trigger.sql`

### Bước 6: Chạy Server

#### Backend
Chạy lần lượt các lệnh sau:

```bash
python manage.py migrate
```

```bash
python manage.py init_auth
```

```bash
python manage.py runserver
```

  * Server chạy tại: `http://127.0.0.1:8000/`
  * Admin Dashboard: `http://127.0.0.1:8000/admin/`

-----
#### Frontend
Không tắt terminal ở bước Backend, tạo một terminal mới, nếu còn trong máy ảo, chạy lệnh để thoát máy ảo ở terminal đó
```bash
deactivate
```
Di chuyển tới thư mục frontend
```bash
cd frontend
```
Cài đặt thư viện (chỉ một lần làm)
```bash
npm install
```
Khởi chạy frontend:
```bash
npm start
```

  * Server chạy tại: `http://localhost:3000`



