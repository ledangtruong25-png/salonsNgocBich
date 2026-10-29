# Kiểm tra v1.2.0

96/96 tests đạt. Bao gồm hồi quy v1.0/v1.1 và kiểm tra migration lịch hẹn, chặn trùng, xác nhận override, chuyển hẹn lặp chỉ sinh một đơn, quyền đổi màu. Kiểm tra SQL trên PostgreSQL WASM PGlite, Auth được mô phỏng trong tests.

Production build Next.js đạt, có routes appointments và reconciliation. Word đã render và kiểm tra 2 trang.

Chưa kiểm thử UI end-to-end, nhiều kết nối hosted đồng thời, Supabase của Sếp, máy in hay cài PWA trên thiết bị thật. Chưa push/deploy. Danh sách lịch 200 dòng và lựa chọn 1000 dòng như hướng dẫn; không có SMS/Zalo/offline sync.
