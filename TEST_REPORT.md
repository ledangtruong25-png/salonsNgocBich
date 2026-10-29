# Kiểm tra Salon Manager v1.0.0

Ngày: 28/10/2026. Môi trường Node 24.22.1, npm lockfile trong gói; Next.js 16.4.3; PGlite 0.5.12.

## Kết quả tự động

- `npm ci`: cài dependency từ lockfile thành công.
- `npm run typecheck`: đạt.
- `npm test`: **43/43 bài kiểm tra đạt** (9 nền tảng SQL/RLS, 6 logic nền tảng, 25 SQL nghiệp vụ v1.0, 3 logic tiền/thời gian/CSV).
- `npm run build`: production build thành công, gồm Auth/app, manifest và route in phiếu động.
- `npm run check`: tổng hợp typecheck + tests + build.
- Giải nén ZIP sang thư mục sạch, `npm ci` và `npm run check`: đạt; không cần node_modules hoặc build cache của thư mục phát triển.

## Đã xác minh trong PostgreSQL WASM bằng migration thật

- Cài nền tảng → bootstrap chủ/mẫu → cấp thu ngân → nâng cấp v1.0, dữ liệu mẫu và membership còn nguyên.
- RLS bật, anon không đọc/gọi RPC; khách chưa cấp quyền, inactive và tenant khác bị chặn. Owner không được ghi trực tiếp total/payment qua quyền API; cashier không sửa bảng giá.
- Khách thật, chuẩn hóa SĐT và trùng SĐT; giá theo biến thể; đơn nhiều số lượng, làm tròn % VND.
- Đổi bảng giá giữ đơn giá đã chốt; chống retry tạo đơn và revision cũ.
- Thanh toán nguyên tử, tiền trả đúng; retry cùng request chỉ có một payment/visit, request khác không thu lần hai.
- Thiếu tiền rollback, transfer đúng tổng, snapshot khách/salon giữ nguyên sau thay đổi hồ sơ/cài đặt.
- Đơn đã thanh toán chặn sửa/hủy. Hủy đơn chưa thu giữ lý do và không tính doanh thu.
- Input sai, thiếu dịch vụ, số lượng sai/trùng, giảm quá giới hạn, ngừng bán, khách mẫu và giờ ra trước giờ vào bị chặn.
- Báo cáo đủ 5 kỳ, ranh giới 23:59:59/00:00 Việt Nam, tuần thứ Hai, tháng/năm, ngày trống. Fixture 28 đơn chứng minh báo cáo không bị cắt theo 25 dòng của UI; mẫu cũ không cộng doanh thu.
- Logic timezone input không phụ thuộc múi giờ thiết bị, CSV BOM và dữ liệu chính xác.

Tests sử dụng cơ chế xác thực/roles mô phỏng trên PostgreSQL WASM, không dùng Supabase Auth thực tế hoặc Supabase hosted gateway. Kiểm tra retry và revision mô phỏng tuần tự; chưa thực hiện thử tải đồng thời trên nhiều kết nối hosted thật.

## Kiểm tra giao diện và giới hạn

- Đã mở và quan sát dashboard `/demo` trong trình duyệt preview: bố cục desktop, chỉ số, bảng đơn và nhãn dữ liệu mẫu hiển thị.
- Preview chưa xác minh được phản hồi tương tác khi bấm nút; khi mở tài nguyên JavaScript của trang, trình duyệt trả net::ERR_BLOCKED_BY_CLIENT. Dừng kiểm tra UI tại giới hạn này; không coi đây là end-to-end UI đã đạt. Typecheck/build và các luồng SQL đã đạt không thay thế kiểm tra UI với project Supabase thật.
- Chưa đăng nhập trên tài khoản Supabase của Sếp, chưa chạy migration trên dữ liệu thật, chưa kiểm tra email reset gửi thực tế.
- Chưa xác minh giao dịch từ UI tới Supabase hosted, hai trình duyệt thu đồng thời, trình điều khiển/máy in K80 hoặc A4 thật, cài PWA/offline trên thiết bị iOS/Android.
- Chưa push GitHub hoặc deploy Vercel. Gói có cấu hình và hướng dẫn chi tiết để Sếp deploy.

Dùng checklist trong README mục 13 để nghiệm thu trên project thử và thiết bị của Sếp trước khi tiếp nhận thanh toán kinh doanh. Các chức năng hoàn tiền/ca/offline đồng bộ chưa thuộc v1.0.0.
