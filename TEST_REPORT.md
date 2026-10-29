# Kiểm tra Salon Manager v1.2.1

98/98 tests đạt: hồi quy ca/đơn/lịch, migration appearance, quyền owner, chặn mã màu hoặc kiểu JSON không hợp lệ, chặn ghi trực tiếp appearance qua API, biến màu toàn hệ thống và tương phản chữ.

Production build đạt. Tài liệu Word được render và kiểm tra 2 trang. ZIP không gồm secrets, node_modules hoặc build cache.

Browser preview tải dashboard nhưng chưa xác minh phản hồi tương tác khi bấm Cài đặt; không coi là end-to-end UI đã đạt. Chưa nghiệm thu lưu màu, tải lại hoặc tài khoản khác trên Supabase hosted của Sếp. Chưa push/deploy. Checklist UI thực tế trong hướng dẫn Word.

Giao diện chung áp dụng sau đăng nhập; không đổi phiếu in, login/setup/demo. Giữ giới hạn danh sách 200 lịch và 1000 khách/dịch vụ của v1.2.0. Gradient nên dùng hai màu có độ sáng tương tự.
