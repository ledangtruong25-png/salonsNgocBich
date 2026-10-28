# Changelog

## 0.1.0 — 2026-10-28

- Khởi tạo Next.js 16.4.3, React 19.3.1, TypeScript và runtime Node 24.
- Giao diện tiếng Việt responsive cho desktop/tablet/điện thoại.
- Đăng nhập, đăng xuất và làm mới phiên bằng Supabase SSR/Auth; trang reset và cập nhật mật khẩu.
- Mô hình một salon, hai vai trò chủ/thu ngân; sáu bảng bật RLS, cấm tự sửa quyền và ghi đơn từ client.
- Đọc khách, dịch vụ, đơn mẫu; tìm kiếm không dấu, lọc nhóm/trạng thái, modal chi tiết.
- Chủ salon xem đội ngũ, sửa thông tin chung; thu ngân chỉ đọc.
- `/demo` công khai chỉ có dữ liệu giả lập; `/setup` hướng dẫn cài đặt; `/api/health` kiểm tra trạng thái cấu hình không lộ key.
- SQL migration, bootstrap chủ + mẫu, cấp thu ngân; tests chạy database PostgreSQL trong bộ nhớ.
- Cấu hình Vercel Hobby, `.env.example`, lockfile, README cấu hình Free chi tiết và roadmap.
- Chưa có đơn thật, thanh toán, in, báo cáo vận hành hoặc PWA; các phần này thuộc v1.0.0.

Source đã build/kiểm tra trong môi trường phát triển. Không có URL GitHub hoặc deployment Vercel trên tài khoản Sếp ở bản bàn giao ZIP; Supabase của Sếp cần được cấu hình theo README trước khi xác minh kết nối thật.
