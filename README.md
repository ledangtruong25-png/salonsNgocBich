# Salon Manager v1.2.0

## Nâng cấp từ v1.1.0

Sao lưu database. Chạy một lần `supabase/migrations/202610290004_appointments.sql`. Giữ Auth users và biến môi trường, deploy source mới. Không reset database. Đọc `HUONG_DAN_SU_DUNG.docx` trước khi sử dụng.

## Chức năng mới

Lịch hẹn, phân thợ, sửa/hủy/xác nhận/không đến, chuyển hẹn thành một đơn duy nhất, hoàn thành sau thanh toán. Trùng giờ cùng thợ mặc định bị chặn; chỉ cho phép khi tích xác nhận và nhập lý do. Chủ salon có thể đổi màu chủ đạo dùng chung, tự chọn màu chữ trên nút cho dễ đọc.

UI lịch hiển thị 200 bản ghi gần nhất; chọn khách/dịch vụ tối đa 1000 dòng. Các tính năng ca, hoàn tiền, in và báo cáo v1.1.0 vẫn giữ nguyên. Chưa có kéo thả lịch tháng, nhắc SMS/Zalo hoặc đồng bộ offline.

## Cài mới và tài liệu nền tảng

Chạy bốn migrations theo thứ tự foundation, counter, reconciliation, appointments. Tài liệu nền tảng dưới đây vẫn dùng cho cấu hình Supabase, Auth, Vercel; phần nâng cấp v1.2.0 ở đầu file là chỉ dẫn hiện tại.

# Salon Manager v1.1.0

Hướng dẫn sử dụng và nâng cấp: HUONG_DAN_SU_DUNG.docx.

Nâng cấp v1.0.0: sao lưu, chạy duy nhất supabase/migrations/202610290003_reconciliation.sql, deploy source mới. Mở ca trước khi thanh toán. Giao dịch cũ giữ nguyên, session_id null.

# Salon Manager v1.0.0 — Vận hành salon tại quầy

Nâng cấp từ source v0.1.0 Sếp gửi. Giao diện tiếng Việt cho máy tính/điện thoại, Supabase Auth + PostgreSQL, deploy Next.js trên Vercel. Bản ZIP gồm source đầy đủ, lockfile, migrations và hướng dẫn.

## 1. Chức năng và trạng thái bàn giao

- Đăng nhập, đăng xuất, khôi phục mật khẩu; chủ salon / thu ngân. Giữ tài khoản v0.1.0.
- Khách hàng: thêm/sửa, tìm toàn bộ theo tên/điện thoại, phân trang và xem lịch sử đơn. Số điện thoại chuẩn hóa, không trùng trong cùng salon (được phép bỏ trống).
- Dịch vụ: chủ salon thêm/sửa tên, nhóm, gói/độ dài tóc, giá VND, thời lượng và ngừng bán. Thu ngân chỉ xem bảng giá.
- Tạo/sửa đơn đang phục vụ: khách, giờ vào/ra, nhiều dịch vụ, số lượng, giảm số tiền hoặc phần trăm, ghi chú. Đơn cũ giữ đơn giá đã chốt; đổi bảng giá áp dụng cho dịch vụ mới thêm/đơn mới.
- Thanh toán tiền mặt/chuyển khoản thủ công: nhập giờ ra, tiền khách đưa, tính tiền trả; xác nhận đã nhận tiền; xử lý trong một transaction và khóa đơn sau thu. Không kết nối ngân hàng.
- Hủy đơn chưa thanh toán có lý do. Chưa hoàn tiền, sửa hoặc hủy đơn đã thanh toán.
- Phiếu thanh toán K80/A4, in lại từ đơn đã thu, có lưu thông tin salon/khách/dịch vụ tại giao dịch. Đây là phiếu nội bộ, không phải hóa đơn điện tử thuế.
- Thống kê giờ/ngày/tuần/tháng/năm, số đơn, tiền mặt/chuyển khoản, giảm giá, giá trị dịch vụ trước giảm; xuất CSV chuỗi thời gian.
- PWA cài lên màn hình chính. Giao dịch cần mạng; trang mất kết nối hướng dẫn kiểm tra lại trạng thái.
- Dữ liệu mẫu v0.1.0 được giữ nguyên trong DB nhưng loại khỏi giao dịch thật, bảng giá và báo cáo. `/demo` chỉ xem, không lưu.

**Kiểm tra đã thực hiện và giới hạn:** xem `TEST_REPORT.md`. Chưa push GitHub, chưa deploy Vercel, chưa đăng nhập/kết nối trên project Supabase của Sếp; chưa thử máy in vật lý. Sếp cấu hình theo các bước bên dưới. Source không chứa tài khoản đăng nhập mặc định hoặc khóa riêng.

## 2. Yêu cầu và công nghệ

| Thành phần | Phiên bản / lựa chọn |
|---|---|
| Node.js | 24.x (dùng bản vá mới của dòng 24; `.nvmrc` = 24) |
| Next.js / React | 16.4.3 / 19.3.1, giữ dependency tương thích từ bản Sếp gửi |
| TypeScript | 7.0.2 |
| Supabase SSR / JS | 0.12.7 / 2.118.0 |
| Database | PostgreSQL của Supabase, RLS và RPC transaction |
| Kiểm thử database | PGlite 0.5.12, chạy migration/SQL thật trong PostgreSQL WASM |
| Hosting cấu hình sẵn | Vercel, preset Next.js, Node 24, vùng sin1 |

Không cần Redis, Edge Functions, cron, Realtime hoặc khóa service_role. Lockfile khóa phiên bản để dựng lại; không tự cập nhật tất cả package khi nâng phiên bản nghiệp vụ.

### Gói Free

Source chạy được trong cấu hình Vercel Hobby và Supabase Free, không tự kích hoạt trả phí. **Vercel Hobby giới hạn mục đích cá nhân phi thương mại**; dùng app để vận hành salon kinh doanh cần chọn hosting/gói phù hợp điều khoản. Đây là giới hạn dịch vụ, không phải giới hạn chức năng trong source. Tham khảo https://vercel.com/docs/plans/hobby và https://vercel.com/docs/limits/fair-use-guidelines (đối chiếu 28/10/2026).

Supabase Free có hạn mức database/egress và có thể tạm dừng do ít hoạt động trong 7 ngày. Theo dõi Usage, giữ backup bên ngoài project; không coi Free là hệ thống có SLA/backup tự động đáp ứng mọi sự cố. Tham khảo https://supabase.com/docs/guides/platform/free-project-pausing và https://supabase.com/pricing. Không cần nâng gói để cài và kiểm tra chức năng source.

## 3. Bắt đầu nhanh — đang có v0.1.0

1. Giữ ZIP và bản deploy v0.1.0 để đối chiếu. Sao lưu database + tài khoản Auth theo mục 12.
2. Supabase SQL Editor → New query → mở và chạy **toàn bộ** `supabase/migrations/202610280002_counter.sql` trên cùng project đang dùng. Chạy một lần; không chạy lại foundation/seed để nâng cấp.
3. Chạy `supabase/04_verify_v1.sql`. Kết quả có version `1.0.0`, RLS bật trên các bảng. Kiểm tra user/role cũ vẫn còn.
4. Thay source trong repo bằng nội dung ZIP mới; giữ `.env.local` ở máy riêng và biến Vercel cũ. Giữ `.git`, đọc thay đổi remote trước khi copy, không ghi đè công việc ngoài app.
5. `npm ci` → `npm run check`. Commit/push hoặc deploy CLI theo mục 7–8. Đừng copy node_modules hoặc .next từ bản cũ.
6. Đăng nhập tài khoản chủ hiện tại. Danh sách giao dịch thật sẽ rỗng vì dữ liệu cũ là mẫu: **đây là hành vi đúng**. Vào Dịch vụ để khai báo bảng giá thật, Khách hàng để tạo hồ sơ thật.
7. Tạo một đơn kiểm tra có quy ước rõ ràng trên project thử trước khi đưa vào vận hành. Khi đã thu trên DB thật, bản này không có thao tác xóa/hoàn tiền; không thử thanh toán giả trên dữ liệu kinh doanh.

Migration chỉ thêm cột/bảng/chức năng và bỏ check `is_demo=true`; không xóa dữ liệu, không thay Auth users, không chuyển mẫu thành tiền thu. Nếu lỗi, transaction rollback; đọc lỗi và trạng thái trước khi chạy lại. Nếu version đã là 1.0.0, không chạy migration lần hai.

## 4. Cài mới Supabase Free

1. Mở https://supabase.com/dashboard, chọn/tạo organization Free, New project. Đặt tên, tạo mật khẩu database mạnh và giữ riêng; chọn vùng gần Việt Nam. Không cần nhập mật khẩu database vào app.
2. Đợi project Ready. SQL Editor → New query → chạy toàn bộ `supabase/migrations/202610280001_foundation.sql`.
3. Authentication → Users → Add user → Create user. Tạo email chủ salon, mật khẩu riêng ≥12 ký tự, Auto Confirm User (hoặc xác nhận email trực tiếp).
4. Mở `supabase/01_bootstrap_demo.sql`, thay `THAY_EMAIL_CHU_SALON` bằng email vừa tạo. Sửa `owner_name` nếu muốn, giữ dấu nháy SQL. Chạy trong SQL Editor. File cấp owner và nạp mẫu cũ để tương thích; mẫu không tham gia giao dịch thật.
5. Chạy `supabase/migrations/202610280002_counter.sql` một lần, sau đó `supabase/04_verify_v1.sql`.
6. RLS phải bật; schema `private` không cần thêm vào Exposed schemas. Public RPC chỉ cho authenticated; mỗi hàm xác minh membership và role từ Auth. Không tắt RLS để xử lý lỗi.
7. Không có tài khoản mặc định. Email/mật khẩu ở bước 3 là thông tin đăng nhập app, khác mật khẩu database.

## 5. Biến môi trường

Lấy Project URL và publishable key trong Supabase Connect hoặc Settings → API Keys / Data API. URL và key phải cùng project.

| Biến | Giá trị | Nơi sử dụng |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://PROJECT_REF.supabase.co` | Kết nối public API |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_...` | Public key, dữ liệu bảo vệ bằng Auth/RLS |
| `NEXT_PUBLIC_APP_URL` | Local `http://localhost:3000`, deploy `https://TEN_APP.vercel.app` | Link khôi phục mật khẩu |

Project cũ có thể dùng anon JWT ở biến publishable key hoặc biến tương thích `NEXT_PUBLIC_SUPABASE_ANON_KEY`, chỉ chọn một. **Không nhập secret key, service_role, access token, PostgreSQL URL hoặc database password vào biến NEXT_PUBLIC.** Source chỉ cần public key; định dạng khóa đặc quyền bị từ chối.

## 6. Chạy local, kiểm tra, build

Giải nén, mở đúng thư mục `SalonManager_v1.0.0` chứa `package.json`.

Windows PowerShell:

```powershell
node -v
Copy-Item .env.example .env.local
notepad .env.local
npm ci
npm run doctor
npm run dev
```

macOS/Linux:

```bash
cd SalonManager_v1.0.0
cp .env.example .env.local
# Sửa .env.local: URL/key thật, APP_URL=http://localhost:3000
npm ci
npm run doctor
npm run dev
```

Mở http://localhost:3000. Doctor kiểm tra định dạng, không chứng minh kết nối database. Không cấu hình thì app đưa tới `/setup`; `/demo` xem được với dữ liệu mẫu nhưng không lưu.

```bash
npm run typecheck
npm test
npm run build
npm run start
# Hoặc chạy 3 kiểm tra đầu trong một lệnh:
npm run check
```

Test không dùng dữ liệu Supabase của Sếp. Build không cần secret hoặc gọi Supabase. Dừng dev trước start production trên cùng port. Đổi `.env.local` phải restart; Vercel đổi biến phải redeploy. Port bận: `npm run dev -- --port 3001` và đổi APP_URL/Auth redirect tương ứng.

## 7. Đưa source lên GitHub

Repo mới và trống, chạy trong thư mục có package.json; thay URL mẫu bằng repo thật:

```bash
git init
git add .
git commit -m "Salon Manager v1.0.0"
git branch -M main
git remote add origin https://github.com/TEN_TAI_KHOAN/salon-manager.git
git push -u origin main
```

Hoặc tạo private repo tại https://github.com/new, Add file → Upload files → tải **nội dung đã giải nén** lên, không tải mỗi ZIP. Root repo phải có package.json và lockfile; bật hiển thị file ẩn để giữ `.gitignore`, `.env.example`, `.nvmrc`. Không tải `.env.local`, `.next`, `.vercel` hay node_modules.

Repo đã có source/README:

```bash
git clone https://github.com/TEN_TAI_KHOAN/salon-manager.git
cd salon-manager
git fetch origin
# Đọc nhánh hiện tại, tích hợp source v1.0.0, giữ .git và file ngoài phạm vi.
git add .
git commit -m "Upgrade Salon Manager to v1.0.0"
git pull --rebase origin main
git push origin main
```

Nếu xung đột: sửa từng file, git add, `git rebase --continue`; muốn dừng dùng `git rebase --abort`. Không force push để giải quyết fetch first. Với monorepo đặt app trong thư mục riêng và chọn đúng Root Directory khi deploy.

## 8. Deploy Vercel bằng GitHub hoặc CLI

1. https://vercel.com/new → Import repo. Chọn workspace/project đúng, không tự kích hoạt Pro/trial nếu chỉ đang kiểm tra trên Free; đọc giới hạn sử dụng mục 2.
2. Cấu hình:

| Mục | Giá trị |
|---|---|
| Framework | Next.js |
| Root Directory | Thư mục chứa package.json; thường `./` |
| Production Branch | main hoặc branch Sếp dùng |
| Node | 24.x |
| Install Command | npm ci |
| Build Command | npm run build |
| Output | Mặc định của Next.js, không đặt dist/out |

3. Environment Variables → điền 3 biến ở mục 5, chọn Production. Chưa biết domain có thể deploy lần đầu rồi đặt APP_URL bằng domain cố định của project và Redeploy.
4. Deploy → xem build logs → mở URL HTTPS. Sau mọi thay đổi NEXT_PUBLIC env, Redeploy.
5. Supabase → Authentication → URL Configuration:
   - Site URL = `https://TEN_APP.vercel.app`.
   - Redirect URLs: `https://TEN_APP.vercel.app/auth/callback`, `https://TEN_APP.vercel.app/auth/callback?next=/update-password`, `https://TEN_APP.vercel.app/update-password`.
   - Nếu cần local, thêm các đường dẫn tương tự với `http://localhost:3000`.
   - Dùng domain project cố định; không dùng deployment URL đổi mỗi commit làm Site URL. Không dùng wildcard rộng cho production. Preview dùng DB thử riêng khi có thể.
6. Đăng nhập, kiểm tra nhãn Supabase, khai báo bảng giá, tạo khách, lưu đơn; làm nghiệm thu mục 13.
7. Lần sau push lên production branch tự tạo deploy. Migration database chạy trước code tương ứng; deploy không tự chạy SQL.

Nếu dùng CLI, chạy từ root source:

```bash
npx vercel@latest login
npx vercel@latest
# Đặt biến môi trường trong Project Settings, rồi:
npx vercel@latest --prod
```

CLI không tự tạo kết nối GitHub; cần Settings → Git nếu muốn auto deploy. Không cần filesystem bền vững trên Vercel; toàn bộ dữ liệu kinh doanh lưu Supabase.

## 9. Thu ngân và khôi phục mật khẩu

Tạo Auth user riêng như tài khoản chủ, email khác, xác nhận email. Mở `supabase/02_add_staff.sql`, thay `THAY_EMAIL_THU_NGAN`, sửa tên rồi chạy SQL Editor. Thu ngân tạo/sửa khách, đơn chưa thanh toán, thu tiền, in và xem báo cáo; không sửa bảng giá/thông tin salon, không xem đội ngũ hoặc tự nâng quyền. Cấp/tắt quyền do quản trị project thực hiện; tắt bằng `salon_members.active=false`. Không tắt chủ duy nhất nếu chưa có cách phục hồi.

Email reset: Supabase Auth → Email → Templates → Reset Password, dùng link:

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery">Đặt lại mật khẩu</a>
```

`/auth/confirm` chỉ chấp nhận recovery, verify token rồi chuyển `/update-password`. Source cũng giữ callback PKCE `/auth/callback`. Điền đúng APP_URL, Site URL/Redirect URLs. Dịch vụ email mặc định có giới hạn người nhận/rate limit; kiểm tra https://supabase.com/docs/guides/auth/auth-smtp hoặc cấu hình SMTP do Sếp chọn. Không cần gửi email để đăng nhập user confirmed tạo thủ công. Không ghi mật khẩu/token vào SQL, source hoặc ZIP.

## 10. Luồng vận hành và cách tính tiền

1. Chủ vào Cài đặt khai báo salon, vào Dịch vụ thêm bảng giá. Mỗi biến thể tạo một dòng, ví dụ Nhuộm / Tóc ngắn / 600.000 và Nhuộm / Tóc dài / 900.000. Danh mục không chứa hàng tồn kho trong bản này.
2. Khách hàng → tìm tên/SĐT. Khách mới → Thêm khách. Xem Lịch sử đơn từ hồ sơ.
3. Tạo đơn → tìm/chọn khách (tìm toàn database, 25 kết quả mỗi tìm kiếm), giờ vào theo Việt Nam, thêm dịch vụ và số lượng; giảm tiền hoặc %. Lưu trước thanh toán. Có thể đóng form, mở lại đơn để sửa/thêm dịch vụ.
4. Đang phục vụ → Thanh toán → nhập giờ ra, tiền khách đưa hoặc chọn chuyển khoản → kiểm tra đã nhận đủ tiền và tick xác nhận. Chuyển khoản chỉ ghi nhận thủ công.
5. Đã thanh toán → In K80/A4. Đơn khóa; không tự sửa số tiền sau thu. Nếu bấm/đứt mạng, mở lại đơn kiểm tra trước khi thử lại; retry cùng request không thêm payment.
6. Chỉ đơn serving được hủy; nhập lý do. Đơn cancelled không tính doanh thu. Chưa có hoàn tiền trong v1.0.0.

Tiền là số nguyên VND. Tạm tính = tổng số lượng × đơn giá. Giảm % làm tròn đến đồng, giảm tiền không vượt tạm tính. Tổng thu = tạm tính − giảm. Không tự cộng thuế/phụ thu. Giá và tổng được tính lại trong DB từ danh mục/giá snapshot, không tin tổng tiền client gửi. Số lượng 1–99, 1–50 dịch vụ khác nhau, giá mỗi dịch vụ tối đa 100 triệu, tổng đơn tối đa 1 tỷ VND.

Mã đơn dùng UUID đầy đủ để tránh trùng giữa nhiều máy; danh sách hiển thị rút gọn, chi tiết/phiếu hiển thị toàn mã. Mỗi order có revision chống ghi đè từ máy khác; khi báo dữ liệu thay đổi, đóng và mở lại để xử lý bản mới. Giao dịch pay khóa dòng order và payment có unique(order_id), không thể thu hai lần. Quyền membership kiểm tra trong từng RPC, không chỉ tại giao diện.

## 11. Báo cáo, in và PWA

Báo cáo dùng `paid_at` do server ghi lúc xác nhận nhận tiền, không dùng giờ vào/giờ ra. Múi giờ cố định Asia/Ho_Chi_Minh (UTC+7). Theo giờ/ngày: 0h–24h, chi tiết từng giờ; tuần: thứ Hai 0h đến trước thứ Hai kế tiếp; tháng và năm là lịch. Chọn ngày bất kỳ trong kỳ rồi Xem báo cáo. Khoảng đầu bao gồm/cuối loại trừ. Doanh thu tiền mặt là tiền bán dịch vụ sau giảm, không phải toàn bộ khách đưa. Dịch vụ hiển thị giá trị **trước giảm cấp đơn**, không dùng cộng thành doanh thu ròng. SQL tổng hợp toàn kỳ, không bị giới hạn trang danh sách 25 dòng. CSV chứa chuỗi thời gian đúng báo cáo đang hiển thị, có BOM cho Excel.

**In:** chi tiết đơn đã thu → In K80/A4 → In/Lưu PDF. Chọn driver và khổ đúng (K80 là 80 mm), Scale 100%, tắt headers/footers, đặt lề phù hợp máy in. Có thể in lại. Trình duyệt/driver quyết định chiều dài giấy và lề; cần kiểm tra máy in thực tế, không hỗ trợ in im lặng, USB trực tiếp, mở két tiền hay hóa đơn điện tử thuế. Phiếu giữ snapshot salon khi thanh toán; đổi tên/SĐT salon không sửa phiếu cũ.

**PWA:** Chrome/Edge desktop/Android mở HTTPS và dùng Cài app/menu Install app. iOS Safari → Chia sẻ → Thêm vào màn hình chính → bật Mở như ứng dụng web nếu có. Trình duyệt quyết định hiện prompt; có thể phải truy cập lại. Manifest có icon 192/512 và maskable. Service worker chỉ cache icon và trang offline công khai; không cache dữ liệu khách, Auth, RSC/API hay phiếu. Đơn/thanh toán vẫn cần mạng. Không có đồng bộ/thu tiền offline.

## 12. Sao lưu, nâng cấp và quay lại

- Trước chạy migration, xuất schema/data và giữ bên ngoài project theo https://supabase.com/docs/guides/platform/backups. Với CLI: `supabase db dump --db-url "$SALON_DB_URL" -f schema.sql` và `supabase db dump --db-url "$SALON_DB_URL" --data-only --use-copy -f data.sql` (cần CLI/Docker, dùng connection string phù hợp; giữ URL/password riêng). Không nhầm dump public với bản sao Auth/Storage hoàn chỉnh; kiểm tra scope và cách phục hồi Auth riêng theo tài liệu Supabase. CSV từng bảng không thay thế backup đầy đủ.
- Thử khôi phục vào project thử riêng trước khi xem backup là dùng được. Không đưa backup hoặc secret vào ZIP nguồn/GitHub.
- Nâng cấp v0.1.0 chỉ chạy counter migration. Migration trong transaction; lỗi trước commit không áp dụng một phần. Chạy SQL verify sau khi hoàn tất.
- Rollback Vercel về code cũ không rollback DB. Schema mới giữ các cột cũ tương thích đọc v0.1.0, nhưng UI cũ không xử lý giao dịch mới và có thể gắn nhãn mẫu sai. Khi cần quay code cũ, dừng nhận giao dịch, hạn chế truy cập và đối chiếu, không tiếp tục dùng màn hình cũ như quầy bán hàng.
- Không drop bảng/cột để quay lại khi đã phát sinh tiền thu. Giữ ledger, xuất đối soát, sửa bằng migration tiến tới hoặc khôi phục bản backup đã thử trên project riêng. Không chạy lại foundation, không reset project đang dùng để sửa lỗi deploy.

## 13. Nghiệm thu trên tài khoản và thiết bị của Sếp

- [ ] `/api/health` trả version 1.0.0. supabaseConfigured chỉ kiểm tra biến, không xác minh kết nối.
- [ ] Login owner cũ thành công; dữ liệu mẫu không xuất hiện trong giao dịch/báo cáo thật; đổi thông tin salon lưu được.
- [ ] Chủ thêm Cắt / Tóc ngắn / 150.000, Nhuộm / Tóc dài / 900.000, ngừng bán một dịch vụ và kiểm tra không chọn được cho đơn mới.
- [ ] Thu ngân không sửa giá hoặc cài đặt, không xem đội ngũ; vẫn tạo khách/đơn và xem báo cáo.
- [ ] Tạo khách mới, tìm bằng SĐT; SĐT trùng được báo; xem lịch sử đơn.
- [ ] Tạo đơn 2 × 150.000 + 900.000, giảm 10% → 1.080.000. Sửa trước thu; thay giá danh mục không đổi đơn giá đã chốt.
- [ ] Mở cùng đơn trên 2 trình duyệt: sau một bên sửa, bên kia dùng revision cũ phải bị chặn.
- [ ] Tiền mặt: khách đưa 1.100.000 → trả 20.000. Xác nhận, tải lại có một payment, đơn khóa; không cho sửa/hủy sau thu.
- [ ] Thử chuyển khoản trên DB thử: thu ngân phải tick đã nhận tiền. Hủy đơn chưa thu có lý do, không tính doanh thu.
- [ ] In K80/A4, kiểm tra dấu tiếng Việt, xuống dòng và số tiền trên máy in thực tế. Đổi tên salon, in lại phiếu cũ vẫn giữ snapshot.
- [ ] Báo cáo giờ/ngày/tuần/tháng/năm khớp tổng payment; số liệu tiền mặt + chuyển khoản = doanh thu. Xuất CSV mở Excel.
- [ ] Cài PWA desktop/Android/iOS, mất mạng không lưu/thu tiền; khôi phục mạng mở đơn kiểm tra trước khi bấm lại.
- [ ] Đăng xuất rồi vào /app hoặc URL phiếu phải về login; tắt membership phải mất quyền.

## 14. Lỗi thường gặp

| Hiện tượng | Xử lý |
|---|---|
| Login được nhưng database chưa sẵn sàng | Kiểm tra migration counter đã chạy, đúng project URL/key và trạng thái Supabase; không tắt RLS |
| Danh sách trống sau nâng cấp | Đúng nếu chỉ có mẫu cũ. Chủ thêm bảng giá thật, sau đó tạo khách/đơn thật |
| Already exists khi chạy migration | Chạy verify xem version; đừng chạy lại hoặc drop bảng. Kiểm tra query đã commit chưa |
| Không lưu được khách | Tên 2–100 ký tự, điện thoại 8–15 số sau chuẩn hóa; tìm SĐT đã có |
| Đơn đổi trên máy khác | Đóng/mở lại đơn, kiểm tra dòng dịch vụ và tổng, thao tác trên revision mới |
| Mất mạng sau thanh toán | Kết nối lại, tải đơn xem completed/payment; không thu tiền lần hai |
| Dịch vụ đã ngừng bán | Bỏ dịch vụ khỏi đơn chưa thu hoặc nhờ chủ mở lại đúng bảng giá; không sửa giá trực tiếp DB |
| Không in được K80 | Cài driver đúng, chọn 80 mm trong system print dialog, scale 100%, tắt header/footer; thử Lưu PDF để phân biệt lỗi driver |
| Không thấy Cài app | Dùng HTTPS/localhost và trình duyệt hỗ trợ; kiểm tra menu Install hoặc Safari Add to Home Screen |
| Supabase pause | Dashboard → Resume project → đợi Ready; kiểm tra Usage/giới hạn |
| Env đã đổi nhưng app vẫn báo cũ | Redeploy Vercel hoặc restart local; biến NEXT_PUBLIC được chốt lúc build |
| Reset email không đến | Kiểm tra spam, hạn mức SMTP/người nhận, Site URL/template; confirmed user vẫn login được |
| Vercel 404/build lỗi | Đúng root package.json, Node 24, Next.js preset, output mặc định; xem logs |
| Git fetch first | Fetch/pull rebase và tích hợp, không force push |

## 15. Cấu trúc và bản tiếp theo

`src/app` routes/Auth/actions/receipt; `src/components` UI/forms/PWA; `src/lib` types/logic/Supabase; `public` icon/SW/offline; `supabase/migrations` schema từng phiên bản; `tests` regression/RLS/transaction/report; `ROADMAP.md`, `CHANGELOG.md`, `TEST_REPORT.md` phạm vi và bằng chứng kiểm tra.

Bản kế tiếp **v1.1.0 — đối soát**: hoàn tiền có quyền, mở/đóng ca, tiền thu ròng và truy vết; chưa triển khai trong ZIP này. Gửi ZIP v1.0.0 mới nhất và yêu cầu “Dùng HV-App, xây dựng phiên bản tiếp theo”. Không gửi mật khẩu, .env.local hay dữ liệu khách thật.

Tài liệu kỹ thuật: [Supabase functions](https://supabase.com/docs/guides/database/functions), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client), [Next PWA](https://nextjs.org/docs/app/guides/progressive-web-apps), [Vercel Next](https://vercel.com/docs/frameworks/full-stack/nextjs), [Vercel Git](https://vercel.com/docs/git).
