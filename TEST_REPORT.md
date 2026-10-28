# Kiểm tra Salon Manager v0.1.0

Ngày kiểm tra: 28/10/2026. Đây là kết quả trên source bàn giao, không phải xác nhận triển khai vào tài khoản Vercel hoặc Supabase của Sếp.

## Kiểm tra đã chạy

- `npm run typecheck`: TypeScript không có lỗi.
- `npm test`: 15 bài kiểm tra tự động qua.
- `npm run build`: build production Next.js thành công, không cần chèn API key để build.
- Mở `/setup` và `/demo` trên preview trình duyệt, xem bố cục desktop và nhãn dữ liệu mẫu.
- SQL migration và seed chạy trên PostgreSQL trong bộ nhớ (PGlite), sử dụng các role `anon`/`authenticated` và hàm `auth.uid()` tương đương cho kiểm tra phân quyền.

## Các tình huống tự động

1. Migration bật RLS cho cả sáu bảng.
2. Bootstrap lặp lại không nhân đôi mẫu và không ghi đè tên salon đã đổi.
3. Chủ salon chỉ đọc dữ liệu salon của mình; tổng giá trị mẫu đúng 2.520.000đ.
4. Thu ngân chỉ đọc membership và profile của chính mình; được đọc đơn mẫu salon.
5. Chủ được sửa thông tin salon, thu ngân không sửa được; cột timezone không được sửa từ client.
6. Không thể tự nâng quyền hoặc ghi đơn qua role authenticated.
7. Tài khoản không phải thành viên hoặc ở salon khác không đọc được dữ liệu salon này.
8. Role anon không có quyền đọc dữ liệu nghiệp vụ.
9. Thành viên bị tắt active không tiếp tục đọc dữ liệu dù còn danh tính Auth.
10. Key dạng secret/service_role không được chấp nhận là cấu hình public.
11. Callback không chuyển hướng ra domain bên ngoài qua tham số next.
12. Thời gian UTC được hiển thị đúng qua nửa đêm theo giờ Việt Nam.
13. Chỉ cộng giá trị đơn mẫu hoàn tất; đơn hủy/đang phục vụ không cộng; tập rỗng an toàn.
14. Thông tin salon được kiểm tra độ dài, định dạng và khoảng trắng.
15. Email và giới hạn độ dài mật khẩu mới được kiểm tra.

## Phần cần kiểm tra sau khi cấu hình

- Chưa có project/API key/tài khoản Supabase của Sếp: chưa kiểm tra đăng nhập, refresh phiên, gửi mail reset, đọc/lưu qua Supabase thực tế.
- Chưa tạo repo GitHub hoặc deploy lên Vercel tài khoản Sếp. ZIP có cấu hình và README để thực hiện.
- Preview cho phép xem trang nhưng chặn tải một tài nguyên JavaScript trong trình duyệt kiểm tra; tương tác frontend chưa được xác minh end to end tại preview đó. Cần chạy checklist mục 13 của README trên bản Vercel đã cấu hình.
- Chưa kiểm tra trên thiết bị điện thoại thật. Source có breakpoint responsive; cần review theo thiết bị salon sử dụng.
- Tests PGlite kiểm tra SQL và RLS, không mô phỏng hệ thống gửi email, gateway Data API hoặc toàn bộ Supabase Auth.

Không có thao tác tạo đơn thật, thu tiền, in hoặc PWA trong v0.1.0. Không mô tả dữ liệu local/demo là database đã kết nối.
