# Kiểm tra v1.3.1

Build production đạt. Ba bài hồi quy mới chạy chính public/drafts.js trong Node VM với DOM và IndexedDB giả lập: hai lần mở app offline không gọi mạng và vẫn có lựa chọn Cắt tóc; sync chỉ gọi endpoint identity không tải lại catalog; lỗi mạng, catalog sai hoặc danh mục trống chưa xác nhận giữ bản cũ.

Đây là kiểm tra mô phỏng vòng đời trang/bộ nhớ, không thay cho thử IndexedDB thật, PWA và thu hồi bộ nhớ trên thiết bị của Sếp. Bộ 129 tests nền tảng v1.3.0 đã đạt ở bản trước; không tuyên bố chạy lại toàn bộ cho patch. Không có migration mới. Word đã render kiểm tra bố cục. Chưa deploy/xác minh trên tài khoản Supabase thật.
