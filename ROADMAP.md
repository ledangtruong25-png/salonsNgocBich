# Roadmap Salon Manager

Phiên bản source hiện tại: **v0.1.0**. Lựa chọn của Sếp cho nền tảng chạy thử: **Vercel Hobby và Supabase Free**. Chưa có thao tác nâng gói trả phí.

| Phiên bản | Mục tiêu | Chức năng chính | Kỹ thuật và dữ liệu | Điều kiện hoàn thành | Phụ thuộc và thứ tự | Trạng thái |
|---|---|---|---|---|---|---|
| v0.1.0 | Nền tảng chạy thử | Đăng nhập/đăng xuất/reset, chủ/thu ngân, đọc dữ liệu mẫu, sửa thông tin salon | Supabase Auth/SSR, RLS, migrations, bootstrap, cấu hình Vercel, tests | Source build; tests qua; sau cấu hình thực tế đăng nhập/đọc/lưu được | Project Supabase Free trống, tài khoản xác nhận, Vercel Hobby | Source hoàn thành; cấu hình và xác minh trên tài khoản Sếp chưa thực hiện |
| v1.0.0 | Vận hành tại quầy | Bảng giá thật, khách, tạo/sửa đơn, giờ vào/ra, thanh toán, in K80/A4; báo cáo giờ/ngày/tuần/tháng/năm; cài PWA | Bổ sung order_items, payments, audit, transaction chống trùng, SQL báo cáo, manifest/service worker, migration từ dữ liệu mẫu | Luồng đơn thật đến in/báo cáo khớp; RLS; backup/khôi phục; thiết bị thật | v0.1.0 đã cấu hình; chốt bảng giá, máy in, quyền; kiểm tra gói hosting phù hợp khi dùng thương mại | Dự kiến |
| v1.1.0 | Đối soát | Hoàn tiền có quyền, mở/đóng ca, tiền thu ròng | Refunds, cash_sessions, giao dịch bất biến và báo cáo liên kỳ | Hoàn không vượt tiền thu; ca ra chênh lệch; truy ngược được | v1.0.0 và quy tắc hoàn/ca | Dự kiến |
| v1.2.0 | Lịch hẹn và hồ sơ | Lịch hẹn, người thực hiện, lịch sử dịch vụ, nhắc trong app | Appointments, staff, chống trùng lịch/chuyển hẹn thành đơn | Một lịch hẹn không sinh hai đơn; phân thợ và thời gian đúng | v1.1.0 và quy tắc xếp lịch | Dự kiến |
| v1.3.0 | Nháp offline | Tạo nháp khi mất mạng, hàng đợi, xử lý xung đột; không thu tiền offline | IndexedDB giới hạn dữ liệu, sync_operations, idempotency | Mất/kết nối lại không trùng đơn; báo chưa đồng bộ; xử lý hết phiên | v1.2.0; chốt lưu dữ liệu trên thiết bị | Dự kiến |
| v2.0.0 | Mở rộng theo nhu cầu | Nhiều chi nhánh, kho bán lẻ, hoa hồng | Tách module, migrations tăng dần, sổ kho, quy tắc hoa hồng | Kiểm tra phân quyền/tồn kho/hoa hồng và nâng cấp an toàn | Chốt riêng từng module; không tự triển khai toàn bộ | Đề xuất |

## Phạm vi chưa triển khai ở v0.1.0

Tạo và thu tiền đơn thật, in hóa đơn, báo cáo vận hành, offline, PWA cài đặt, quản lý tài khoản qua giao diện, tự đối soát chuyển khoản, hóa đơn điện tử thuế, kho và hoa hồng. Giá trị dashboard là mẫu, không phải khoản thu.

## Bản kế tiếp đề xuất

**v1.0.0**: hoàn thành một luồng nhận khách → chọn dịch vụ/giá → ghi giờ ra → thanh toán chống trùng → in → báo cáo, bổ sung PWA. Không bắt đầu code bản này trong gói v0.1.0.

Trước khi lên v1.0.0, cần chuyển mẫu ra khỏi luồng thật bằng migration có kế hoạch, giữ nhãn is_demo và loại mẫu khỏi báo cáo. Không đổi bản 0.1.0 chỉ để mở ghi payment lên các bảng mẫu hiện tại.
