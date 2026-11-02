# Kiểm tra Salon Manager v1.3.0

npm ci từ lockfile đạt. Production build đạt. 129 tests đạt theo Node test runner chạy tuần tự để giới hạn bộ nhớ PGlite. Có hồi quy Auth/RLS/đơn/ca/lịch/theme và kiểm tra sync offline: một mã gửi hai lần chỉ một order/operation, dùng khách đúng SĐT, giá thay đổi rollback, xác nhận giá mới, chặn actor khác.

node --check public/drafts.js đạt. Word render kiểm tra bố cục. Không thay hoặc bỏ test nghiệp vụ cũ; bộ test offline chạy thêm migration mới trên database thử trong bộ nhớ.

Giới hạn: chưa kiểm tra IndexedDB/service worker/online event trên thiết bị thực tế; chưa UI end-to-end hoặc nhiều kết nối đồng thời trên Supabase hosted. Chưa deploy hoặc push. Kiểm tra mất mạng/đóng mở/giá thay đổi/tài khoản khác theo Word trước khi dùng kinh doanh. Giao dịch tiền vẫn online.
