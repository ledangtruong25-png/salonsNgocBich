# Roadmap Salon Manager

Phiên bản hiện tại **v1.3.0**.

| Phiên bản | Mục tiêu | Chức năng và kỹ thuật | Điều kiện kiểm tra | Trạng thái |
|---|---|---|---|---|
| v1.0.0 | Vận hành quầy | Đơn, thu tiền, in, báo cáo, Auth/RLS | Luồng bán hàng online | Đã kế thừa |
| v1.1.0 | Đối soát | Ca, hoàn tiền, thu ròng | Tổng tiền đúng và phân quyền | Đã kế thừa |
| v1.2.0–v1.2.2 | Lịch và giao diện | Phân thợ, trùng có xác nhận, bộ màu tại Cài đặt, thông báo thiếu ca | Giữ dữ liệu cũ, quyền và chống trùng | Đã kế thừa |
| v1.3.0 | Nháp offline | IndexedDB, cache shell công khai, RPC sync có operation ID, kiểm tra giá/quyền | Nháp khôi phục, sync lại không thêm đơn; xử lý giá đổi | Source/build/tests hoàn thành; thiết bị/Supabase hosted cần nghiệm thu |
| v2.0.0 | Mở rộng theo nhu cầu | Chi nhánh, kho, hoa hồng; migration riêng theo module | Chốt module và nghiệp vụ trước | Đề xuất, chưa triển khai |

Không đồng bộ nền khi app đóng, không thu tiền offline. Gửi ZIP mới nhất để tiếp tục. v2.0.0 là đề xuất từ roadmap trước; cần Sếp chốt phạm vi, không tự coi là cam kết triển khai tất cả.
