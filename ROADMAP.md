# Roadmap Salon Manager

Phiên bản source hiện tại: **v1.1.0**. Giữ cấu hình tương thích Supabase Free và Vercel; lưu ý Hobby chỉ dành cho mục đích cá nhân phi thương mại. Không tự mở gói trả phí.

| Phiên bản | Mục tiêu | Chức năng chính | Kỹ thuật và dữ liệu | Điều kiện hoàn thành | Phụ thuộc và thứ tự | Trạng thái |
|---|---|---|---|---|---|---|
| v0.1.0 | Nền tảng chạy thử | Đăng nhập/đăng xuất/reset, chủ/thu ngân, đọc dữ liệu mẫu, sửa thông tin salon | Supabase Auth/SSR, RLS, migrations, bootstrap, cấu hình Vercel, tests | Source build; tests qua; sau cấu hình thực tế đăng nhập/đọc/lưu được | Project Supabase Free trống, tài khoản xác nhận, Vercel Hobby | Source hoàn thành; cấu hình và xác minh trên tài khoản Sếp chưa thực hiện |
| v1.0.0 | Vận hành tại quầy | Bảng giá thật, khách, tạo/sửa đơn, giờ vào/ra, thanh toán, in K80/A4; báo cáo giờ/ngày/tuần/tháng/năm; cài PWA | Bổ sung order_items, payments, audit, transaction chống trùng, SQL báo cáo, manifest/service worker, migration từ dữ liệu mẫu | Luồng đơn thật đến in/báo cáo khớp; RLS; backup/khôi phục; thiết bị thật | v0.1.0 đã cấu hình; chốt bảng giá, máy in, quyền; kiểm tra gói hosting phù hợp khi dùng thương mại | Source hoàn thành; build/tests tại TEST_REPORT; nghiệm thu Supabase/hosting/máy in thật còn chờ cấu hình của Sếp |
| v1.1.0 | Đối soát | Hoàn tiền có quyền, mở/đóng ca, tiền thu ròng | Refunds, cash_sessions, giao dịch bất biến và báo cáo liên kỳ | Hoàn không vượt tiền thu; ca ra chênh lệch; truy ngược được | v1.0.0 và quy tắc hoàn/ca | Source hoàn thành; chưa nghiệm thu hosted |
| v1.2.0 | Lịch hẹn và hồ sơ | Lịch hẹn, người thực hiện, lịch sử dịch vụ, nhắc trong app | Appointments, staff, chống trùng lịch/chuyển hẹn thành đơn | Một lịch hẹn không sinh hai đơn; phân thợ và thời gian đúng | v1.1.0 và quy tắc xếp lịch | Dự kiến |
| v1.3.0 | Nháp offline | Tạo nháp khi mất mạng, hàng đợi, xử lý xung đột; không thu tiền offline | IndexedDB giới hạn dữ liệu, sync_operations, idempotency | Mất/kết nối lại không trùng đơn; báo chưa đồng bộ; xử lý hết phiên | v1.2.0; chốt lưu dữ liệu trên thiết bị | Dự kiến |
| v2.0.0 | Mở rộng theo nhu cầu | Nhiều chi nhánh, kho bán lẻ, hoa hồng | Tách module, migrations tăng dần, sổ kho, quy tắc hoa hồng | Kiểm tra phân quyền/tồn kho/hoa hồng và nâng cấp an toàn | Chốt riêng từng module; không tự triển khai toàn bộ | Đề xuất |

## Phạm vi v1.0.0

Đã có bảng giá/gói thật, khách và lịch sử, đơn nhiều dịch vụ, giảm giá, giờ vào/ra, thu tiền thủ công chống trùng, in K80/A4, báo cáo đủ 5 kỳ, CSV, PWA online. Mẫu cũ được bảo toàn và loại khỏi vận hành thật.

Chưa có hoàn tiền, ca thu ngân, lịch hẹn, offline sync, kho, hoa hồng, nhiều chi nhánh, tự đối soát ngân hàng, hóa đơn thuế hoặc quản lý Auth qua UI.

## Bản kế tiếp v1.2.0 lịch hẹn và phân thợ

## Lịch sử kế hoạch

**v1.1.0 — Đối soát:** hoàn tiền theo quyền, mở/đóng ca, tiền thu ròng, lịch sử thao tác; cần chốt quy tắc hoàn và bàn giao ca. Gửi ZIP source mới nhất để xây dựng tiếp.
