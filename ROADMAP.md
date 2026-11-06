# Roadmap Salon Manager

Phiên bản hiện tại **v1.5.0**.

| Phiên bản | Mục tiêu | Chức năng và kỹ thuật | Điều kiện kiểm tra | Trạng thái |
|---|---|---|---|---|
| v1.0.0 | Vận hành quầy | Đơn, thu tiền, in, báo cáo, Auth/RLS | Luồng bán hàng online | Đã kế thừa |
| v1.1.0 | Đối soát | Ca, hoàn tiền, thu ròng | Tổng tiền đúng và phân quyền | Đã kế thừa |
| v1.2.0–v1.2.2 | Lịch và giao diện | Phân thợ, trùng có xác nhận, bộ màu tại Cài đặt, thông báo thiếu ca | Giữ dữ liệu cũ, quyền và chống trùng | Đã kế thừa |
| v1.3.0 | Nháp offline | IndexedDB, cache shell công khai, RPC sync có operation ID, kiểm tra giá/quyền | Nháp khôi phục, sync lại không thêm đơn; xử lý giá đổi | Source/build/tests hoàn thành; thiết bị/Supabase hosted cần nghiệm thu |
| v1.3.1 | Sửa cache danh mục | Không tự tải lại, giữ cache qua offline/reopen, xác nhận danh mục trống | 3 regression tests mới đạt | Hoàn thành source |
| v1.4.0 | Kho vật tư | Nhập, kiểm kê, định mức, tiêu hao khi thu tiền, cảnh báo tồn | Phân quyền, chống trừ lặp, giữ luồng offline | Hoàn thành source |
| v1.5.0 | Hoa hồng thợ | Tỷ lệ theo dịch vụ, gán thợ theo dòng, điều chỉnh khi hoàn tiền, đối soát theo kỳ | Tính đúng sau giảm giá, chống ghi lặp và phân quyền | Hoàn thành source |
| v1.6.0 | Chốt và chi hoa hồng | Khóa kỳ, ghi khoản đã trả và theo dõi số còn lại | Chốt quy tắc mở lại kỳ và điều chỉnh sau chốt | Đề xuất |
| v2.0.0 | Mở rộng chi nhánh | Phân quyền và báo cáo theo chi nhánh | Chốt nghiệp vụ vận hành nhiều cơ sở | Đề xuất |

Không đồng bộ nền khi app đóng, không thu tiền offline. Gửi ZIP mới nhất để tiếp tục. v2.0.0 là đề xuất từ roadmap trước; cần Sếp chốt phạm vi, không tự coi là cam kết triển khai tất cả.
