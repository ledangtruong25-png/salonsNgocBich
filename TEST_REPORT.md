# Kiểm tra Salon Manager v1.4.0

- Node 24.22.1. `npm run check` đã qua kiểm tra kiểu, 136/136 bài test và build Next.js production.
- PGlite chạy đủ bảy migration theo thứ tự trên dữ liệu mẫu. Kiểm tra kho qua RPC thật trong PostgreSQL, gồm nhập, kiểm kê cũ, gửi lại phiếu, RLS, phân quyền, thanh toán lỗi, trừ gộp nhiều dịch vụ, gửi lại thanh toán và hoàn tiền.
- Nháp offline tạo đơn đúng một lần và chỉ phát sinh tiêu hao khi thanh toán. Bộ kiểm thử cache danh mục và các nghiệp vụ trước đó cũng đạt.
- Hướng dẫn Word đã render và kiểm tra đủ hai trang.
- Trang kho lấy tối đa 31 dòng mỗi truy vấn danh sách. Màn quầy không tải dữ liệu kho và thanh toán vẫn dùng RPC hiện có. Chưa đo độ trễ trên Supabase/Vercel thật, chưa nghiệm thu giao diện đăng nhập trên dữ liệu của salon.
- Chưa push GitHub, deploy Vercel hoặc chạy migration trên Supabase của salon.
