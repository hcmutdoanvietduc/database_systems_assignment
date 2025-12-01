# 🍽️ Restaurant Management System (Backend)

Dự án quản lý nhà hàng, sử dụng **Django** kết nối với cơ sở dữ liệu **MySQL**.
Hệ thống hiện tại hỗ trợ cả Django Templates (Demo) và đang trong quá trình chuyển đổi sang **RESTful API** để phục vụ Frontend **ReactJS**.

## 0. Những việc các thành viên còn lại của nhóm cần làm
* Tìm hiểu django coi cách nó thêm db vào code, chạy thử server để coi thử (tự nhờ AI đi)
* Đọc README
* Làm Triggers xong, tự thao tác lại việc thêm db vào django (hỏi AI nhờ nó chỉ cho), tự setup các kiểu
* Muốn code thêm giao diện bằng React cho đẹp thì code lại backend thành các API để trả về, nhớ cấu hình lại settings.py trước để nó nhận host gốc của React, còn lại nếu biết thì làm, tùy. Còn không muốn? thì có thể vẫn code theo kiểu như template (server-side rendering), giao diện muốn đẹp bao nhiêu thì tùy (hiện đang dùng boostrap cho css, có thể đổi sang tailwind nhưng nhớ tự cấu hình, commit code, note trong README)
* Không thay đổi .gitignore, nhớ python -m venv venv để chạy môi trường ảo cho django, muốn thêm thư viện gì cũng phải ghi vào trong requirement.txt
* Làm xong push lên github
* Viết báo cáo (như thầy dặn ha)


---

## 📋 1. Yêu cầu cài đặt (Prerequisites)

* **Python:** 3.12 trở lên.
* **MySQL Server:** 8.0 trở lên.
* **Git**

---

## 🛠️ 2. Hướng dẫn Cài đặt & Chạy Server

### Bước 1: Clone dự án
```bash
git clone <link-repo-cua-ban>
cd restaurantApp
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

Dự án sử dụng `python-dotenv` để bảo mật. Bạn cần tạo file `.env` tại thư mục gốc và điền thông tin MySQL của bạn:

1.  Copy file `.env.example` thành `.env`
2.  Điền thông tin cấu hình:
    ```ini
    # Cấu hình Database
    DB_NAME=RestaurantDatabase
    DB_USER=root
    DB_PASSWORD=YOUR_MYSQL_PASSWORD  <-- Nhập pass MySQL của bạn vào đây
    DB_HOST=localhost
    SECRET_KEY=django-insecure-your-secret-key
    ```

### Bước 5: Nạp dữ liệu Database (Quan trọng)

Vì hệ thống chạy trên CSDL có sẵn, hãy đảm bảo bạn đã chạy 2 script SQL này trong MySQL Workbench hoặc CLI:

1.  `table_and_data.sql`: Tạo bảng và dữ liệu mẫu.
2.  `store_and_funcs.sql`: Nạp các Stored Procedures và Functions.

### Bước 6: Chạy Server

* Tạo tài khoản để truy cập vào admin dashboard nếu cần kiểm tra csdl
```bash
python manage.py createsuperuser
```

```bash
python manage.py runserver
```

  * Server chạy tại: `http://127.0.0.1:8000/`
  * Admin Dashboard: `http://127.0.0.1:8000/admin/`

-----

## 🚀 3. Nếu muốn làm React (Chuyển đổi sang API)

Hiện tại Backend đang render HTML (server-side rendering, MVT). Để Frontend ReactJS làm việc được, chúng ta cần expose các **API Endpoints**.

### Tự cấu hình trong settings.py nhé

  * **CORS:** cấu hình `django-cors-headers` cho phép `localhost:3000` truy cập.
  * **DRF:** cài `djangorestframework`.
  * mấy cái khác nếu cần thiết

### Gợi ý cách phát triển API

1.  Tạo **Serializer** trong `core/serializers.py` để chuyển Model sang JSON.
2.  Viết **API View** trong `core/views.py` trả về `Response(serializer.data)`.
3.  Tất cả API phải có tiền tố `/api/` trong `urls.py`.

-----

## 📡 4. API (tạm thời) đã có và đề xuất các API cần làm

### A. Các API Đã có Logic (Cần chuyển từ View thường sang API)

Dựa trên logic đã viết trong Django Views, các chức năng này đã hoạt động và cần được wrap lại thành API trả về JSON:

| Chức năng | Method | URL Gợi ý | Mô tả Logic (Backend) |
| :--- | :--- | :--- | :--- |
| **Lấy Menu** | `GET` | `/api/menu/` | Query bảng `Item`. **Lưu ý:** Phải filter `status='Available'` và `superitemid__isnull=False` (để loại bỏ danh mục giá 0đ). |
| **Sơ đồ bàn** | `GET` | `/api/tables/` | Query bảng `RTable`. Trả về danh sách bàn và trạng thái (`Available`/`Occupied`) để React vẽ sơ đồ màu. |
| **Chi tiết bàn** | `GET` | `/api/tables/{id}/` | Lấy thông tin bàn + Kiểm tra bảng `ROrder` xem có đơn hàng nào đang `Serving` không. Trả về chi tiết các món (`Detail`) đã gọi. |
| **Gọi món** | `POST` | `/api/orders/add/` | **Logic phức tạp:** <br>1. Check xem bàn có đơn `Serving` chưa? Nếu chưa -\> Tạo `ROrder` mới (dùng hàm `generate_id`). <br>2. Cập nhật trạng thái bàn -\> `Occupied`. <br>3. Thêm/Cập nhật vào bảng `Detail`. |

### B. Các API Đề xuất (Dựa trên Stored Procedures & Đặc tả)

Các chức năng này cần được phát triển thêm, tận dụng sức mạnh của SQL Procedures đã nạp:

| Chức năng | Method | URL Gợi ý | Hướng dẫn Implement (Backend) |
| :--- | :--- | :--- | :--- |
| **Tìm kiếm món** | `GET` | `/api/items/search/` | Gọi SP: `sp_GetItems(SortBy, SortOrder, Keyword)`. |
| **Chi tiết hóa đơn** | `GET` | `/api/orders/{id}/bill/` | Gọi SP: `sp_GetOrderDetails(OrderID)`. Dùng để in tạm tính. |
| **Thanh toán** | `POST` | `/api/invoices/create/` | Gọi SP: `sp_CreateInvoice(...)`. <br>**Lưu ý:** SP này sẽ tự động tính thuế, trừ khuyến mãi, tạo Invoice và cập nhật trạng thái đơn hàng thành `Paid`. |
| **Lịch sử khách** | `GET` | `/api/customers/{id}/stats/` | Gọi Function: `fn_CustomerTotalSpent(CustomerID, Date)`. Dùng để hiển thị tổng tiền khách đã tiêu. |
| **Đăng nhập** | `POST` | `/api/login/` | Kiểm tra username/password trong bảng `Account` (cần tạo thêm) hoặc đối chiếu với bảng `Staff/Admin`. Trả về Token. |
| **Danh sách KM** | `GET` | `/api/promotions/` | Lấy danh sách từ bảng `Promotion` để khách chọn mã giảm giá lúc thanh toán. |

-----

## ⚠️ 5. Lưu ý quan trọng

1.  **Cấu trúc Database:** Không được sửa cấu trúc bảng (Table Schema) thông qua Django Migrations vì `models.py` đang để `managed = False`. Nếu cần sửa DB, hãy dùng câu lệnh SQL trực tiếp.
2.  **ID Generator:** Vì ID trong DB là `VARCHAR` (không tự tăng), khi tạo mới `Order` hay `Invoice`, hãy dùng hàm `utils.generate_id()` đã viết sẵn trong `core/utils.py` để tránh trùng lặp.
3.  **Git:** Tuyệt đối không commit file `.env` lên Github.


