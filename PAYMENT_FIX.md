# Bản sửa thanh toán v1.2.2

Thông báo cũ che mất lỗi OPEN_SESSION_REQUIRED. Từ v1.1.0 mỗi người thu cần mở ca bằng chính tài khoản của mình. Bản sửa hiển thị nguyên nhân và nút mở ca trong cửa sổ mới; không đổi số tiền hoặc bỏ yêu cầu ca.

Kiểm tra đơn trước khi thao tác lại. Nếu chưa thanh toán: mở ca của tài khoản thu ngân, quay lại mở lại đơn rồi thu tiền. Nếu đã completed: không thu lại, in lại phiếu.

Source không thay database. Nâng từ v1.2.1 chỉ deploy code mới, không chạy lại SQL. Project cũ hơn vẫn cần đủ migrations theo hướng dẫn Word. Nếu lỗi còn tiếp tục, gửi nội dung lỗi mới; chưa có log Supabase thực tế để khẳng định nguyên nhân duy nhất.
