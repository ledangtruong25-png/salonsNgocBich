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
