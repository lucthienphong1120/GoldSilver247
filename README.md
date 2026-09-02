# GoldSilver247 🪙

**GoldSilver247** là nền tảng theo dõi và cập nhật giá Vàng, giá Bạc trực tuyến tại Việt Nam và Thế giới một cách nhanh chóng, trực quan và chuyên nghiệp.

## ✨ Tính Năng Nổi Bật

- **Realtime Data:** Cập nhật liên tục giá Vàng SJC, Vàng Nhẫn, Vàng Trang Sức, và Giá Bạc.
- **Biểu Đồ Thông Minh:**
  - So sánh giá trong nước và thế giới trên cùng một trục thời gian.
  - Hỗ trợ đa dạng khung thời gian: `6H`, `1D`, `7D`, `1M`, `3M`, `6M`, `1Y`, `3Y`.
  - Tự động luân chuyển luồng dữ liệu (Data Fallback) giữa các mốc thời gian ngắn (có dữ liệu từng giờ) và dài (chốt phiên theo ngày).
- **Phân Tích Sâu:** Tùy chọn xem biểu đồ theo dạng **Giá tiền (VND)** hoặc **Biến động phần trăm (%)**.
- **Chỉ Số Tổng Quan:** Cung cấp thông tin tăng/giảm trong 24 giờ qua một cách chuẩn xác, kèm mức giá gốc USD trên sàn thế giới.
- **Giao Diện Đột Phá:** Chế độ Dark Mode hiện đại, tối giản cùng trải nghiệm Tooltip (bảng giá hover) mượt mà chạy dọc theo con trỏ chuột.

## 🛠 Công Nghệ Sử Dụng

Dự án được xây dựng hoàn toàn không cần server (Serverless), phù hợp để host trực tiếp trên Github Pages:
- **HTML5 / CSS3:** Giao diện mượt mà, responsive, không phụ thuộc vào framework nặng.
- **JavaScript (Vanilla JS):** Xử lý logic lấy dữ liệu đa luồng, đồng bộ tọa độ thời gian `timestamp`.
- **Chart.js:** Render biểu đồ tài chính với hiệu ứng và mốc thời gian động (Time Scale).
- **API Nguồn:** Tích hợp song song `HanaGold` và `Vang.Today` để đảm bảo độ bao phủ dữ liệu từ khung ngắn đến dài.

## 🚀 Cài Đặt & Chạy Cục Bộ

1. Clone repository về máy:
   ```bash
   git clone https://github.com/lucthienphong1120/GoldSilver247.git
   ```
2. Không cần cài đặt bất kỳ dependency nào (như `npm install`).
3. Khởi chạy file `index.html` bằng Live Server trên VS Code hoặc bất kỳ Web Server tĩnh nào.

## 👨‍💻 Tác Giả & Đơn Vị Phát Triển
- **Developed by:** [LTP (Lục Thiên Phong)](https://github.com/lucthienphong1120/)
- **Powered by:** [CRF Network](https://www.crfnetwork.com/)

---
*© 2026 GoldSilver247. All rights reserved.*
