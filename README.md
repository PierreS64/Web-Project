# 🏠 Nhà Xanh - Nền Tảng Cho Thuê Phòng Trọ

Ứng dụng web cho thuê phòng trọ, nhà nguyên căn, căn hộ, ký túc xá với giao diện tiếng Việt hiện đại và thân thiện.

## 📋 Mục Lục
- [Tính năng chính](#tính-năng-chính)
- [Công nghệ sử dụng](#công-nghệ-sử-dụng)
- [Cấu trúc dự án](#cấu-trúc-dự-án)
- [Cài đặt & Chạy](#cài-đặt--chạy)
- [Hướng dẫn sử dụng](#hướng-dẫn-sử-dụng)
- [Tính năng nâng cao](#tính-năng-nâng-cao)

## ✨ Tính Năng Chính

### Cho Khách Hàng (Người Tìm Phòng)
- 🔍 **Tìm kiếm & Lọc** - Lọc theo giá, diện tích, tiện nghi, địa điểm
- ❤️ **Danh sách yêu thích** - Trang quản lý riêng các phòng đã lưu (localStorage qua `yeu-thich.html`)
- 📄 **Chi tiết phòng** - Xem thông tin đầy đủ, hình ảnh, đánh giá và tiện ích nổi bật của nhà/phòng
- 📌 **4 loại hình cho thuê**:
  - Nhà trọ, phòng trọ
  - Nhà nguyên căn
  - Căn hộ
  - Ký túc xá
- 👤 **Quản lý hồ sơ** - Thông tin cá nhân và lịch sử thuê nhà
- 📱 **Giao diện responsive** - Tương thích mọi thiết bị

### Cho Chủ Trọ (Người Cho Thuê)
- ➕ **Đăng tin** - Tạo, sửa, xóa tin đăng
- 📊 **Quản lý phòng** - Theo dõi trạng thái phòng (còn trống/đã thuê)
- 🧾 **Quản lý hóa đơn** - Tạo, gửi hóa đơn cho khách
- 💰 **Theo dõi thanh toán** - Quản lý các khoản thanh toán
- 📞 **Liên hệ khách hàng** - Gửi thông báo cho khách

## 🛠 Công Nghệ Sử Dụng

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **UI Framework**: Bootstrap 5.3.0
- **Icons**: Font Awesome 6.4.0
- **Storage**: localStorage (client-side)
- **Language**: Tiếng Việt (UTF-8)

## 📁 Cấu Trúc Dự Án

```
Bài tập lớn Web/
├── README.md                          # Tài liệu dự án
├── index.html                         # Trang chủ
├── chi-tiet.html                      # Chi tiết phòng
├── ho-so.html                         # Hồ sơ cá nhân
├── chu-tro.html                       # Quản lý chủ trọ
├── khach-hang.html                    # Quản lý khách hàng
├── phong-tro.html                     # Nhà trọ
├── nha-nguyen-can.html                # Nhà nguyên căn
├── can-ho.html                        # Căn hộ
├── ky-tuc-xa.html                     # Ký túc xá
├── tat-ca-tin-dang.html               # Tất cả tin đăng
├── yeu-thich.html                     # Trang danh sách yêu thích
└── assets/
    ├── css/
    │   └── styles.css                 # Stylesheet chính
    ├── js/
    │   ├── config.js                  # Hằng số & cấu hình
    │   ├── validators.js              # Validation logic
    │   ├── utils.js                   # Utility functions
    │   ├── storage.js                 # localStorage API
    │   ├── navbar.js                  # Navigation logic
    │   ├── event-handlers.js          # Event delegation
    │   ├── favorites.js               # Yêu thích system
    │   ├── main.js                    # Trang chủ logic
    │   ├── details.js                 # Logic trang chi tiết phòng
    │   ├── owner.js                   # Quản lý chủ trọ
    │   ├── customer.js                # Quản lý khách hàng
    │   └── category-listing.js        # Logic danh mục
    └── img/                           # Hình ảnh assets
```

### ⭐ Tệp Cơ Sở (Foundation Layer)
Các tệp này được tạo trong quá trình refactoring để tập trung hóa logic:
- **config.js** - Hằng số, khoảng giá, điều kiện lọc
- **validators.js** - Tất cả logic xác thực biểu mẫu
- **utils.js** - Hàm tiện ích (format tiền, hiển thị thông báo, etc)
- **event-handlers.js** - Tập trung hóa các listener sự kiện
- **favorites.js** - Hệ thống lưu phòng yêu thích

## 🚀 Cài đặt & Chạy

### Yêu cầu
- Trình duyệt web hiện đại (Chrome, Firefox, Safari, Edge)
- Server web cục bộ (để tránh CORS issues)

### Hướng dẫn

1. **Clone hoặc tải dự án**
   ```bash
   git clone <repository>
   cd "Bài tập lớn Web"
   ```

2. **Chạy local server**
   ```bash
   # Với Python 3
   python -m http.server 8000
   
   # Hoặc với Node.js
   npx http-server
   ```

3. **Mở trình duyệt**
   ```
   http://localhost:8000/
   ```

## 📖 Hướng Dẫn Sử Dụng

### Đăng Nhập / Đăng Ký
1. Click nút "Đăng nhập" hoặc "Đăng ký" ở góc trên phải
2. Nhập email, mật khẩu, số điện thoại
3. Chọn lựa chọn (Chủ trọ/Khách hàng)

### Tìm Kiếm Phòng
1. Chọn loại hình cho thuê từ tab
2. Sử dụng bộ lọc: Khoảng giá, diện tích, tiện nghi
3. Nhập từ khóa tìm kiếm
4. Click "Tìm kiếm"

### Lưu Phòng Yêu Thích
- Click biểu tượng ❤️ trên thẻ phòng
- Danh sách yêu thích được lưu tự động trên thiết bị

### Đăng Phòng (Chủ Trọ)
1. Đăng nhập với tài khoản chủ trọ
2. Click "Đăng tin mới"
3. Điền đầy đủ thông tin (tiêu đề, giá, diện tích, ảnh, etc)
4. Click "Thêm phòng" hoặc "Cập nhật"

### Quản Lý Hóa Đơn
1. Vào **Quản lý** (cho chủ trọ) hoặc **Hồ sơ** (cho khách hàng)
2. Chọn phòng, tạo hóa đơn
3. Gửi hóa đơn cho khách (tạo QR code thanh toán)

## 🎯 Tính Năng Nâng Cao

### Lọc & Sắp Xếp
- **Khoảng giá**: Dưới 3M, 3-5M, 5-10M, Trên 10M
- **Diện tích**: Dưới 20m², 20-40m², 40-60m², 60-80m², Trên 80m²
- **Tiện nghi**: Wifi, máy lạnh, bếp, bãi giữ xe, máy giặt, etc
- **Đối tượng**: Tất cả, Sinh viên, Chuyên gia làm việc, Gia đình
- **Sắp xếp**: Mới nhất, Giá (tăng/giảm), Diện tích (lớn nhất)

### Thông Báo & Liên Hệ
- Thông báo khi có khách mới đăng ký
- Thông báo thanh toán hóa đơn
- Liên hệ trực tiếp qua điện thoại hoặc Zalo

### Quản Lý Giá Dịch Vụ
- Tiền nhà (chính)
- Tiền điện (VND/kWh)
- Tiền nước (VND/tháng)
- Tiền wifi (VND/tháng)
- Dịch vụ khác (VND/tháng)

## 🧹 Cải Thiện Mã (Clean Code Refactoring)

Dự án đã được refactor theo các nguyên tắc Clean Code:

### ✅ Hoàn Thành
- **Tập trung hóa hằng số** → `config.js`
- **Tập trung hóa validation** → `validators.js`
- **Tập trung hóa utilities** → `utils.js`
- **Event delegation** → `event-handlers.js`
- **Yêu thích system** → `favorites.js`
- **Xóa onclick inline** → Sử dụng event listeners
- **Format tiền** → Sử dụng `Utils.formatCurrency()`
- **Thay thế alert()** → Sử dụng `Utils.showError()` / `Utils.showSuccess()`

### Cấu trúc Tệp Ứng Dụng (Load Order)
```html
<!-- Foundation (Phải load trước) -->
<script src="assets/js/config.js"></script>
<script src="assets/js/validators.js"></script>
<script src="assets/js/utils.js"></script>

<!-- Core -->
<script src="assets/js/storage.js"></script>
<script src="assets/js/navbar.js"></script>
<script src="assets/js/event-handlers.js"></script>

<!-- Features -->
<script src="assets/js/favorites.js"></script>

<!-- Main Logic -->
<script src="assets/js/main.js"></script>
```

## 🐛 Gỡ Lỗi

### Thông báo không hiển thị
- Kiểm tra console (F12 → Console)
- Đảm bảo `Utils.js` được load trước

### Dữ liệu bị mất sau làm mới trang
- Kiểm tra localStorage trong DevTools (F12 → Application)
- Xác nhân không bị xóa dữ liệu

### Phòng không hiển thị
- Kiểm tra danh sách phòng trong Storage: `Storage.getRooms()`
- Kiểm tra bộ lọc không quá hạn chế

## 📝 Lưu Ý An Toàn

⚠️ **Cảnh báo**: Dự án này sử dụng **localStorage** để lưu dữ liệu, **KHÔNG phải database thực tế**:
- Dữ liệu chỉ lưu trên trình duyệt người dùng
- Dữ liệu mất nếu xóa cache/cookie
- Không phù hợp cho môi trường sản xuất
- Cần kết nối backend để lưu xuống server

## 👥 Vai Trò

### Khách Hàng (Người Tìm Phòng)
- `role: "customer"`
- Quyền: Xem, tìm kiếm, lọc, yêu thích, thuê phòng, quản lý hóa đơn

### Chủ Trọ (Người Cho Thuê)
- `role: "owner"`
- Quyền: Đăng phòng, sửa, xóa, tạo hóa đơn, quản lý khách, gửi thông báo

## 📞 Hỗ Trợ

Cần hỗ trợ? Kiểm tra:
1. Console DevTools (F12) để xem lỗi
2. Thử clear localStorage (`localStorage.clear()` trong console)

## 📄 Giấy Phép

Dự án này được tạo cho mục đích học tập.

---

**Cập nhật cuối**: Tháng 3 năm 2026  
**Version**: 1.0
