# Kiểm tra Salon Manager v1.5.0

- Node 24.22.1. `npm run check` đã qua kiểm tra kiểu, 140/140 bài test và build Next.js production.
- Bộ test hoa hồng chạy đủ tám migration trong PGlite. Các trường hợp kiểm tra gồm gán thợ từng dòng, kế thừa thợ lịch hẹn, giảm giá và làm tròn, thanh toán thất bại, gửi lại thanh toán, hoàn nhiều lần, tổng hợp kỳ, lưu tỷ lệ lịch sử và cách ly quyền truy cập.
- Kiểm tra thanh toán đồng thời ghi tiêu hao vật tư trong cùng giao dịch. Bộ kiểm thử kho, đối soát thu ngân, lịch hẹn và nháp offline cũng đạt.
- Đã render và kiểm tra hai trang hướng dẫn Word. ZIP đã kiểm tra tính toàn vẹn.
- Chưa triển khai trên GitHub, Vercel hoặc Supabase của salon. Chưa đo độ trễ hay kiểm tra giao diện đăng nhập với hệ thống thật.
