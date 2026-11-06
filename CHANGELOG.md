## v1.4.0 — Kho vật tư và định mức dịch vụ

- Trang kho riêng cho chủ salon, có phân trang, nhập kho, kiểm kê, lịch sử và cảnh báo tồn thấp hoặc âm.
- Định mức theo dịch vụ và vật tư. Tiêu hao gắn với thanh toán trong cùng giao dịch SQL.
- Migration bổ sung `202611060007_inventory.sql`. Giữ dữ liệu và danh mục offline của các phiên bản trước.

# v1.3.1

Tách kiểm tra identity khỏi tải danh mục, cache lưu lâu dài theo user/salon, xác nhận danh mục rỗng, giữ cache khi mạng lỗi hoặc phiên hết hạn. Service worker mới v131 cập nhật HTML/JS. Không đổi database.

# v1.3.0

Nháp IndexedDB, public offline shell, hàng đợi có chủ động xác nhận, tự gửi khi mạng trở lại trong trang mở. Mã operation cố định chống trùng, sync khách/đơn nguyên tử; giá/dịch vụ/quyền kiểm tra lại, chặn sai tài khoản. Không thu tiền offline. Word/roadmap cập nhật, dependency runtime giữ nguyên theo lockfile nền tảng.

# v1.2.2

Hiển thị lỗi chưa mở ca, quyền và migration thay thông báo chung. Thêm đường dẫn mở ca, giữ kiểm tra giao dịch nguyên tử và chống trùng.

# v1.2.1

Chuyển cấu hình giao diện vào Cài đặt, thay màu accent đơn lẻ bằng bộ màu toàn ứng dụng. Thêm sidebar/gradient/nền trang/nền thẻ/nút, mẫu màu và HEX, xem trước và hủy. RPC xác minh owner, validates colors và ghi nhật ký. Migration giữ màu cũ, không sửa giao dịch. Hướng dẫn Word cập nhật.

# v1.2.0

Lịch hẹn và danh mục thợ. RPC kiểm tra trùng tại database với khóa theo salon, override cần lý do. Chuyển hẹn thành đơn idempotent; kiểm tra trạng thái thanh toán trước hoàn thành. Màu chủ đạo lưu theo salon, chỉ owner thay đổi; chữ nút tương phản. Migration tăng dần bảo toàn dữ liệu. Hướng dẫn Word cập nhật.

# v1.1.0

Mở/đóng ca, gắn khoản thu với ca, hoàn tiền từng phần chỉ owner, báo cáo thu ròng, nhật ký. Giữ dữ liệu cũ và phiếu thu. Hướng dẫn Word, bỏ HTML hướng dẫn.

# Changelog

## 1.0.0 — 28/10/2026

- Nâng cấp trực tiếp từ gói 7z v0.1.0 do Sếp cung cấp; giữ stack, Auth, RLS và quyền owner/cashier.
- Quản lý khách thật, SĐT không trùng; dịch vụ/gói/độ dài tóc, giá, thời lượng và ngừng bán.
- Đơn nhiều dịch vụ, giờ vào/ra, số lượng, giảm tiền/%, ghi chú; revision chống ghi đè.
- SQL RPC tính lại tổng; thanh toán nguyên tử, payment unique theo order, retry idempotent; hủy đơn chưa thu có lý do.
- Snapshot đơn giá, khách và thông tin salon; in lại phiếu K80/A4; không hỗ trợ hóa đơn điện tử thuế.
- SQL báo cáo giờ/ngày/tuần/tháng/năm theo paid_at tại Việt Nam; CSV; không giới hạn theo trang UI.
- PWA manifest/icon, service worker chỉ cache tài nguyên công khai và trang offline. Giao dịch cần mạng.
- Migration tăng dần giữ dữ liệu mẫu/role cũ, không yêu cầu reset. Mẫu không đi vào vận hành thật.
- Chuẩn hóa các chỗ email/tên cá nhân trong script cài đặt về placeholder; tài khoản Auth thực tế trong DB không thay đổi.
- README/hướng dẫn HTML/roadmap và bộ kiểm tra hồi quy cập nhật. Chưa deploy hoặc nghiệm thu trên dịch vụ/tài khoản/máy in của Sếp.

## 0.1.0

Nền tảng chạy thử: Supabase Auth/SSR, owner/cashier, RLS, dữ liệu mẫu và cập nhật thông tin salon. Giữ migration nền tảng và scripts bootstrap để cài mới; không chạy lại foundation khi nâng cấp.
