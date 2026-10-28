# Salon Manager v0.1.0

Web app quản lý salon tóc ở giai đoạn **nền tảng chạy thử**, dùng **Vercel Hobby (Free)** và **Supabase Free**. Source đã có cấu hình deploy, không cần mua tên miền, không yêu cầu secret key hoặc dịch vụ trả phí.

**Bắt đầu nhanh:** tạo project Supabase → chạy migration → tạo tài khoản chủ → chạy bootstrap mẫu → đưa source lên GitHub → import vào Vercel → khai báo 3 biến môi trường → đăng nhập và kiểm tra.

> ZIP là source triển khai. Để đăng nhập và đọc database thật, cần cấu hình Supabase của Sếp theo các bước dưới đây. Không có tài khoản hoặc mật khẩu dùng chung được cài sẵn. Không cấu hình vẫn xem được `/demo` và `/setup`.

## 1. Bản này có gì

| Chức năng | Trạng thái |
|---|---|
| Giao diện tiếng Việt responsive | Có |
| Đăng nhập, đăng xuất, phiên bằng Supabase Auth | Có, sau khi cấu hình |
| Quên mật khẩu và đặt lại mật khẩu | Có, cần URL/email template hợp lệ; giới hạn email của Supabase áp dụng |
| Chủ salon và thu ngân | Có; RLS kiểm tra quyền tại database |
| Đơn mẫu, khách mẫu, bảng dịch vụ mẫu | Chỉ xem, tìm kiếm, lọc và xem chi tiết |
| Chủ salon sửa tên, điện thoại, địa chỉ salon | Lưu thật vào Supabase |
| Chủ salon xem danh sách thành viên | Có; cấp/tắt quyền qua Supabase Dashboard |
| Xem giao diện trước khi có database | `/demo`, ghi nhãn mẫu, không đăng nhập và không lưu |
| Tạo đơn, thu tiền, in hóa đơn, báo cáo vận hành, cài PWA | Chưa có; phạm vi v1.0.0 |

Dữ liệu demo gồm 6 khách giả lập không có điện thoại thật, 6 dịch vụ giá minh họa, 8 đơn mẫu ngày 28/10/2026. Chỉ số dashboard là số liệu mẫu: 7 lượt không hủy, 2 đơn đang phục vụ, tổng giá trị 5 đơn hoàn tất 2.520.000đ. Chưa có khoản thanh toán hay doanh thu kinh doanh được ghi nhận.

## 2. Công nghệ và yêu cầu máy

- Node.js **24.x**, npm đi kèm. Kiểm tra bằng `node -v` và `npm -v`.
- Next.js **16.4.3**, React/React DOM **19.3.1**, TypeScript **7.0.2**.
- `@supabase/supabase-js` **2.118.0**, `@supabase/ssr` **0.12.7**; khóa phiên bản trong lockfile.
- Supabase PostgreSQL và Auth; server xác thực người dùng bằng `getUser`, truy vấn theo JWT người dùng; không dùng service_role để đọc dữ liệu ứng dụng.
- Vercel preset Next.js, runtime Node 24.x; cấu hình `vercel.json` đã kèm.
- Cài dependency bằng `npm ci`, không cần nâng cấp toàn bộ thư viện.

Kiểm tra phiên bản package thực tế bằng `npm ls --depth=0`. Nếu tên mục trong Dashboard thay đổi, dùng mục chức năng tương đương được mô tả.

## 3. Giới hạn Free cần biết

- Vercel Hobby dành cho **cá nhân phi thương mại**. Bản này dùng để trải nghiệm và kiểm tra; khi vận hành salon thương mại, kiểm tra lại điều khoản và chọn gói phù hợp. Không có thao tác tự nâng cấp hoặc tính phí trong source.
- Supabase Free có hạn mức database, lưu trữ, kết nối, email và lưu lượng. Project có thể tạm dừng khi ít hoạt động trong 7 ngày. Mở project trong Dashboard và chọn **Resume project** nếu bị pause.
- Không dùng tác vụ tạo lưu lượng giả để giữ project luôn bật. Theo dõi usage tại Dashboard.
- Free không có cùng cơ chế backup tự động như Pro; tự xuất dữ liệu nếu cần giữ. Dữ liệu mẫu có thể nạp lại bằng script, còn thông tin salon đã sửa và tài khoản cần được bảo quản riêng.
- Gửi email mặc định có giới hạn người nhận và tần suất. Để thử đăng nhập không cần gửi email: dùng **Create user + Auto Confirm User** theo hướng dẫn bên dưới.

Nguồn chính thức: [Vercel Hobby](https://vercel.com/docs/plans/hobby), [Supabase pricing](https://supabase.com/pricing), [Project pausing](https://supabase.com/docs/guides/platform/free-project-pausing).

## 4. Tạo Supabase Free

1. Mở https://supabase.com/dashboard và đăng nhập.
2. Tạo organization **Free** nếu chưa có. Chọn **New project**.
3. Đặt tên, ví dụ `salon-manager-test`. Dùng **project mới, trống** cho bộ SQL này; không chạy vào database đang có dữ liệu kinh doanh hoặc bảng trùng tên.
4. Đặt mật khẩu database mạnh và lưu riêng. Mật khẩu này **không phải** mật khẩu tài khoản đăng nhập app.
5. Chọn region gần Việt Nam (ví dụ Singapore nếu có), chờ project sẵn sàng.
6. Authentication → **Sign In / Providers** (hoặc phần cấu hình Email): bật đăng nhập Email, tắt **Allow new users to sign up**. Không mở đăng ký công khai.
7. Không cần bật Realtime, Storage, social login hoặc tạo bucket cho v0.1.0.

## 5. Tạo database

Trong Supabase project → **SQL Editor** → **New query**:

1. Mở file `supabase/migrations/202610280001_foundation.sql` trong source.
2. Copy **toàn bộ** nội dung, dán vào SQL Editor và bấm **Run**.
3. Kết quả mong đợi: query thành công; Table Editor có `salons`, `profiles`, `salon_members`, `customers`, `catalog_items`, `orders`. RLS đã bật cho tất cả 6 bảng.

Migration chỉ chạy **một lần** cho project mới. Nếu báo `relation already exists`, kiểm tra Table Editor và lịch sử chạy trước; không xóa bảng hoặc chạy lại tùy tiện. Script có transaction nên nếu lỗi giữa chừng sẽ rollback phần migration đó.

Ứng dụng chỉ có quyền đọc dữ liệu mẫu; chủ salon được cập nhật 3 cột thông tin salon. Trình duyệt không thể ghi trực tiếp role, đơn hoặc khoản thu. Schema `private` chứa helper RLS và không cần thêm vào Exposed schemas của Data API.

## 6. Tạo tài khoản chủ và nạp mẫu

### 6.1 Tạo tài khoản xác nhận trực tiếp

1. Authentication → **Users** → **Add user** → **Create user**.
2. Điền email thật do Sếp quản lý và mật khẩu riêng **ít nhất 12 ký tự**.
3. Bật **Auto Confirm User** hoặc tùy chọn xác nhận email trực tiếp rồi tạo.
4. Có user trong danh sách là đúng. Bước này tạo tài khoản Auth; bước tiếp theo mới cấp quyền chủ salon.

Không cần mời bằng email để thử bản này. Không đưa mật khẩu vào file SQL, GitHub, ZIP hoặc ảnh chụp.

### 6.2 Cấp quyền chủ và tạo dữ liệu mẫu

1. Mở file `supabase/01_bootstrap_demo.sql`.
2. Tìm dòng `owner_email text := 'THAY_EMAIL_CHU_SALON';`.
3. Chỉ thay `THAY_EMAIL_CHU_SALON` bằng email user đã tạo, giữ nguyên dấu nháy đơn. Có thể sửa `owner_name` thành tên hiển thị của Sếp.
4. Copy toàn bộ file đã thay email vào **SQL Editor** → Run.
5. Kết quả mong đợi: salon tên `Mộc Hair Studio`, một thành viên owner active, 6 khách, 6 dịch vụ và 8 đơn mẫu.

Có thể chạy thêm `supabase/03_verify_setup.sql` trong SQL Editor để xem số dòng mẫu, giá trị đơn mẫu, vai trò và trạng thái RLS. Đây là kiểm tra cài đặt bằng tài khoản quản trị, chưa thay cho đăng nhập từng vai trò trên app.

Script có thể chạy lại với **cùng chủ** để thêm dữ liệu mẫu còn thiếu mà không nhân đôi dữ liệu hoặc ghi đè thông tin salon đã sửa. Không dùng bootstrap để đổi chủ hoặc mở lại chủ đã bị tắt quyền. Bản này giới hạn **một salon trên một tài khoản**.

## 7. Lấy đúng Project URL và API key

Trong project, mở nút **Connect** hoặc **Settings → API Keys / Data API**.

| Biến | Lấy ở đâu | Phạm vi |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL dạng `https://...supabase.co` | Thông tin kết nối công khai |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key dạng `sb_publishable_...` | Khóa công khai, quyền dữ liệu do RLS kiểm soát |
| `NEXT_PUBLIC_APP_URL` | URL app local hoặc URL Vercel HTTPS cố định | Tạo đường dẫn khôi phục mật khẩu |

Project cũ có thể dùng **anon key** JWT thay publishable key. Điền vào cùng biến publishable key, hoặc dùng biến tương thích `NEXT_PUBLIC_SUPABASE_ANON_KEY` (chỉ chọn một). URL và key phải từ **cùng project**.

**Không dùng** `sb_secret_...`, key `service_role`, mật khẩu database, connection string PostgreSQL hoặc access token quản trị ở các biến `NEXT_PUBLIC_...`. Ứng dụng không yêu cầu bất cứ secret nào; cấu hình có định dạng khóa đặc quyền sẽ bị từ chối.

## 8. Chạy local trên máy Sếp

### Windows PowerShell

Giải nén ZIP, mở thư mục `SalonManager_v0.1.0`, bấm thanh địa chỉ File Explorer, gõ `powershell` rồi Enter. Chạy tại thư mục có `package.json`:

```powershell
node -v
Copy-Item .env.example .env.local
notepad .env.local
```

Điền URL/key Supabase thật và đặt `NEXT_PUBLIC_APP_URL=http://localhost:3000`, lưu rồi đóng Notepad. Tiếp tục:

```powershell
npm ci
npm run doctor
npm run dev
```

### macOS hoặc Linux

```bash
cd SalonManager_v0.1.0
cp .env.example .env.local
# Sửa .env.local bằng trình soạn thảo, điền URL/key thật
npm ci
npm run doctor
npm run dev
```

Mở http://localhost:3000 → Đăng nhập bằng user chủ đã tạo. `npm run doctor` chỉ kiểm tra định dạng biến, không gọi Supabase và không in giá trị key. Nếu không có `.env.local`, app đưa tới `/setup`; `/demo` vẫn xem được nhưng không kết nối database.

Khi sửa `.env.local`, dừng dev bằng Ctrl+C và chạy lại. Nếu cổng 3000 bận: `npm run dev -- --port 3001`, đồng thời đổi URL app và redirect tương ứng.

### Kiểm tra build như Vercel

```bash
npm run typecheck
npm test
npm run build
npm run start
```

`npm run build` vẫn thành công khi chưa có biến môi trường; kết nối database chỉ thực hiện lúc người dùng đăng nhập. Tests chạy PostgreSQL trong bộ nhớ bằng PGlite, không thay đổi project Supabase của Sếp. Dừng dev trước khi start production trên cùng cổng.

## 9. Đưa source lên GitHub

### Cách giao diện cho repo mới

1. Tạo **private repository** mới trên https://github.com/new, ví dụ `salon-manager`.
2. Vào **Add file → Upload files**. Giải nén ZIP trước; đưa **các nội dung trong thư mục** `SalonManager_v0.1.0` lên repo, không chỉ upload file ZIP.
3. `package.json`, `package-lock.json`, `src`, `scripts`, `supabase` và `vercel.json` phải nằm đúng cùng root repo.
4. Bật hiển thị file ẩn khi cần để giữ `.gitignore`, `.env.example`, `.nvmrc`. Nếu uploader không nhận file ẩn, dùng Git theo cách bên dưới. **Không upload `.env.local`, node_modules, .next, .vercel.**
5. Commit bằng giao diện GitHub.

### Cách Git cho repo mới và trống

Thay URL ví dụ bằng repo thật, chạy trong root source:

```bash
git init
git add .
git commit -m "Salon Manager v0.1.0"
git branch -M main
git remote add origin https://github.com/TEN_TAI_KHOAN/salon-manager.git
git push -u origin main
```

Nếu Git yêu cầu tên/email, cấu hình theo tài khoản của Sếp. Nếu repo mới đã có README, clone repo đó trước rồi copy source vào và commit/push theo hướng dẫn repo có sẵn; không force push.

### Repo có source sẵn hoặc lỗi fetch first

```bash
git clone https://github.com/TEN_TAI_KHOAN/salon-manager.git
cd salon-manager
git fetch origin
```

Đọc source/branch hiện có rồi copy phần thay đổi phù hợp từ ZIP, giữ file ngoài phạm vi và `.git`. Với repo không dành riêng cho app này, dùng thư mục con hoặc branch riêng và đặt Root Directory đúng khi deploy. Commit sau khi tích hợp:

```bash
git add .
git commit -m "Add Salon Manager v0.1.0"
git pull --rebase origin main
git push origin main
```

Nếu xung đột: sửa từng file, `git add`, `git rebase --continue`; nếu cần dừng, `git rebase --abort`. Không dùng `git push --force` để xử lý `fetch first`.

## 10. Deploy Vercel Free bằng GitHub

1. Mở https://vercel.com, đăng nhập tài khoản cá nhân, sử dụng **Hobby**. Không chọn team Pro/trial hoặc add-on trả phí nếu chỉ muốn Free.
2. Chọn **Add New → Project** (hoặc https://vercel.com/new).
3. Kết nối GitHub khi được yêu cầu, chỉ cấp quyền repo app cần deploy; chọn **Import** repo `salon-manager`.
4. Kiểm tra cấu hình:

| Mục | Giá trị |
|---|---|
| Framework Preset | Next.js |
| Root Directory | Thư mục chứa `package.json`; repo chuẩn là `./` |
| Production Branch | `main` hoặc branch Sếp thực sự sử dụng |
| Node.js Version | 24.x |
| Install Command | `npm ci` |
| Build Command | `npm run build` |
| Output Directory | Để mặc định của preset Next.js; không đặt `dist` hay `out` |

5. Mở **Environment Variables**, thêm `NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` đúng project. Nếu đã biết domain cố định, thêm `NEXT_PUBLIC_APP_URL=https://TEN_APP.vercel.app`. Nếu chưa biết, có thể để thiếu biến APP_URL ở lần deploy đầu và điền ngay sau bước 6.
6. Bấm **Deploy**, đợi build thành công và mở URL được Vercel cấp. Dùng domain project cố định kiểu `ten-app.vercel.app`, không dùng link deployment thay đổi mỗi lần làm Site URL.
7. Trong **Settings → Environment Variables**, đặt `NEXT_PUBLIC_APP_URL` bằng URL HTTPS thực tế không có path. Bật phạm vi **Production**. Nếu thử Preview cùng project, chọn phạm vi phù hợp và cấu hình URL chuyển hướng riêng.
8. Sau khi sửa bất cứ biến `NEXT_PUBLIC_...` nào: **Deployments → deployment mới nhất → Redeploy**. Các biến này được đọc vào bundle khi build, đổi dashboard mà không redeploy chưa đủ.
9. Trong Supabase → **Authentication → URL Configuration**:
   - **Site URL** = `https://TEN_APP.vercel.app`.
   - **Redirect URLs** thêm chính xác:
     - `https://TEN_APP.vercel.app/auth/callback`
     - `https://TEN_APP.vercel.app/auth/callback?next=/update-password`
     - `https://TEN_APP.vercel.app/update-password`
     - Nếu chạy local, thêm các đường dẫn tương tự với `http://localhost:3000`.
   - Tránh wildcard rộng cho URL production. Khi dùng Preview, khai báo domain preview cần dùng hoặc thử bằng production test URL cố định. Không trỏ preview vào dữ liệu kinh doanh.
10. Mở `/login`, đăng nhập bằng tài khoản chủ. Kiểm tra nhãn **Đã kết nối Supabase**, các dữ liệu mẫu và lưu thử tên salon.

**Không cần thiết lập database URL hay PostgreSQL password trên Vercel.** Source không lưu tệp bền vững trên filesystem Vercel; dữ liệu nằm ở Supabase.

### Cách deploy không cần GitHub

Trong root source, đã có Node 24:

```bash
npx vercel@latest login
npx vercel@latest
```

Làm theo prompt để tạo/link project cá nhân Hobby, không bật gói trả phí. Mở project Vercel Settings để nhập biến môi trường như trên, sau đó:

```bash
npx vercel@latest --prod
```

Sau deploy vẫn cần đặt Supabase Site URL/Redirect URLs và redeploy nếu đổi biến. Cách CLI **không tự thiết lập auto deploy từ GitHub**; muốn tự deploy sau mỗi push thì connect repo trong Vercel Settings → Git.

### Deploy bản sau

Với GitHub đã kết nối, commit/push lên production branch sẽ tạo deployment mới. Với CLI, deploy lại bằng `npx vercel@latest --prod`. Kiểm tra build log và URL thật sau mỗi lần. Không xóa Supabase project để cập nhật giao diện.

## 11. Cấp tài khoản thu ngân và kiểm tra quyền

1. Authentication → Users → Add user → Create user. Dùng **email khác** với tài khoản chủ, mật khẩu riêng, Auto Confirm User.
2. Mở `supabase/02_add_staff.sql`, thay `THAY_EMAIL_THU_NGAN` bằng email vừa tạo, sửa `staff_name` nếu muốn.
3. Chạy file trong SQL Editor. Script không biến tài khoản owner thành cashier.
4. Trong app, đăng xuất và đăng nhập thu ngân. Kết quả mong đợi: không có mục Đội ngũ, Cài đặt không cho sửa; vẫn đọc dữ liệu mẫu salon.
5. Tắt quyền: Table Editor → `salon_members` → dòng đúng `user_id` → `active=false`. Tải lại app; tài khoản sẽ không được đọc dữ liệu salon nữa ngay cả khi còn phiên Auth. Đừng tắt user chủ duy nhất khi chưa có cách quản trị project.
6. Đổi tên hiển thị bằng `profiles.full_name` trong Table Editor. Cấp/tắt quyền chỉ thao tác bằng tài khoản quản trị Supabase project; không chia sẻ quyền project với thu ngân.

## 12. Cấu hình quên mật khẩu

Đăng nhập trực tiếp bằng user xác nhận tay không phụ thuộc chức năng này. Để kiểm tra luồng email:

1. Hoàn tất Site URL và Redirect URLs ở mục 10. `NEXT_PUBLIC_APP_URL` phải đúng URL app.
2. Trong Supabase **Authentication → Email → Templates → Reset Password**, đổi đường dẫn nút đặt lại thành:

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery">Đặt lại mật khẩu</a>
```

3. Source có `/auth/confirm` chỉ chấp nhận loại `recovery`. Token được xác thực bằng Supabase, rồi chuyển sang `/update-password`. `/auth/callback` cũng có sẵn để xử lý code theo luồng PKCE khi dùng template mặc định; luồng đó có thể cần mở thư trong cùng trình duyệt đã gửi yêu cầu.
4. Nhấn Quên mật khẩu ở `/login`, nhập email được cấp. Mở liên kết email và đặt mật khẩu mới ≥12 ký tự. Link chỉ dùng một lần và có thời hạn.
5. Dịch vụ email mặc định của Supabase có thể chỉ cho gửi tới thành viên team được cho phép và có rate limit. Nếu email user thử nghiệm không được hỗ trợ, thêm người nhận phù hợp theo cấu hình Supabase hoặc cấu hình SMTP riêng mà Sếp lựa chọn. Source không bắt buộc mua SMTP. Xem [giới hạn email](https://supabase.com/docs/guides/auth/auth-smtp).
6. Không thử gửi liên tục khi rate limit; không thay email template của production đang dùng app khác. Với mỗi môi trường, Site URL trỏ đúng app đang thử.

## 13. Checklist dùng thử

- [ ] `/api/health` trả version `0.1.0`; `supabaseConfigured=true` chỉ xác nhận biến hợp lệ, **không** chứng minh database kết nối.
- [ ] Đăng nhập chủ thành công và hiển thị **Đã kết nối Supabase** sau khi đọc dữ liệu.
- [ ] Có 6 khách, 6 dịch vụ, 8 đơn mẫu; xem chi tiết đơn, lọc trạng thái và tìm tên không dấu được.
- [ ] Dashboard hiển thị 2.520.000đ giá trị đơn hoàn tất mẫu; không gọi đó là khoản thu thật.
- [ ] Đổi tên salon tại Cài đặt, lưu rồi tải lại; tên mới vẫn còn và cập nhật ở sidebar.
- [ ] Tài khoản thu ngân không thấy đội ngũ và không lưu được thông tin salon.
- [ ] Tài khoản Auth chưa có membership thấy màn hình chưa được cấp quyền.
- [ ] Đăng xuất; truy cập `/app` phải về đăng nhập.
- [ ] Xem `/demo`: phải có nhãn chưa kết nối database; đổi vai trò ở đó chỉ mô phỏng giao diện.
- [ ] Kiểm tra điện thoại, tablet và máy tính. Bản này là responsive web, chưa có manifest/service worker để cài PWA.

## 14. Lỗi thường gặp

| Hiện tượng | Kiểm tra và cách xử lý |
|---|---|
| App vào trang cài đặt, nút đăng nhập bị khóa | Kiểm tra 2 biến Supabase, URL/key cùng project, key đúng loại; restart local hoặc Redeploy Vercel |
| Đăng nhập không thành công | Email/mật khẩu đúng? User đã Auto Confirm? Supabase có pause? Không dùng mật khẩu database để đăng nhập app |
| Đã xác thực nhưng database chưa sẵn sàng | Đã chạy migration? Bảng đúng public schema? API key có quyền anon/publishable? Không tự tắt RLS để xử lý |
| Tài khoản chưa được cấp quyền | Auth user cần `profiles` và `salon_members.active=true`; chạy bootstrap đúng email chủ hoặc add_staff đúng email |
| Không có dữ liệu mẫu | Kiểm tra bootstrap đã chạy và cùng Supabase project với Vercel; không sửa code để đổi thành dữ liệu local |
| Lưu tên salon không được | Phải là owner active; tên từ 2–100 ký tự; kiểm tra mạng và policy |
| Supabase không phản hồi | Mở Dashboard → Resume project nếu pause; chờ sẵn sàng rồi tải lại |
| Không nhận được thư reset | Kiểm tra spam, hạn mức, quyền người nhận, SMTP, Site URL và template recovery; dùng user tạo confirmed trực tiếp để tiếp tục thử đăng nhập |
| Link reset hết hạn | Gửi lại một lần, dùng link mới nhất; template token_hash tránh phụ thuộc verifier của trình duyệt |
| Vercel build lỗi hoặc 404 | Root Directory phải có package.json; Next.js preset; Node 24; xem build logs; không đặt output thành dist/out |
| `npm ci` báo thiếu lockfile | Dùng đúng thư mục source trong ZIP và giữ package-lock.json. Không chỉ copy src |
| Typecheck báo thiếu .next types sau khi xóa cache | Chạy `npm run build` để Next sinh lại next-env.d.ts/routes types; không lấy .next từ ZIP cũ |
| Port 3000 bận | Dừng server cũ hoặc dùng `npm run dev -- --port 3001` và cập nhật URL tương ứng |
| Git báo fetch first | Fetch/pull và tích hợp thay đổi; không force push ghi đè lịch sử |

## 15. Sao lưu nâng cấp và quay lại

- Trước nâng cấp có đổi schema: xuất schema/data bằng công cụ Supabase phù hợp, giữ bản copy ngoài project; xác nhận cách giữ tài khoản Auth. Không coi seed là backup.
- Supabase Free không bảo đảm đủ để phục hồi dữ liệu kinh doanh; v0.1.0 chỉ dùng mẫu. Nếu reset dữ liệu thử, tạo project thử mới và làm lại; không reset production.
- Tất cả nâng cấp dùng migration mới, giữ nguyên lịch sử migration cũ; không sửa rồi chạy lại file tạo bảng hiện tại trên project đã dùng.
- Rollback Vercel chỉ quay lại code, không tự quay lại database. Nâng cấp schema phải có kế hoạch phục hồi dữ liệu riêng.
- Giữ source ZIP mới nhất. Để xây dựng tiếp, gửi ZIP này và yêu cầu **“Dùng HV-App, xây dựng phiên bản tiếp theo trong ROADMAP.md”**. Không gửi `.env.local`, mật khẩu hoặc dữ liệu khách thật cùng ZIP.

## 16. Cấu trúc source

| Thư mục hoặc file | Vai trò |
|---|---|
| `src/app` | Routes Next.js, server actions, màn hình Auth/app/setup/demo |
| `src/components` | Workspace, biểu mẫu, modal và giao diện responsive |
| `src/lib` | Kết nối Supabase, xác thực cấu hình, truy vấn và dữ liệu mẫu |
| `src/proxy.ts` | Làm mới và kiểm tra phiên với Supabase Auth |
| `supabase/migrations` | Tạo bảng, ràng buộc, quyền và RLS |
| `supabase/01_bootstrap_demo.sql` | Cấp chủ và dữ liệu mẫu có kiểm soát |
| `supabase/02_add_staff.sql` | Cấp thành viên thu ngân từ Auth user đã tạo |
| `supabase/03_verify_setup.sql` | Kiểm tra dữ liệu mẫu, thành viên và RLS sau cài đặt |
| `scripts` | Chạy dev tương thích host/port, kiểm tra cấu hình và sinh seed từ fixture |
| `tests` | Logic, thời gian Việt Nam, redirect an toàn, database và RLS |
| `ROADMAP.md`, `CHANGELOG.md`, `TEST_REPORT.md` | Phạm vi, thay đổi, kiểm tra và giới hạn xác minh |

## 17. Tài liệu chính thức

- [Next.js trên Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs)
- [Deploy từ Git](https://vercel.com/docs/git)
- [Deploy bằng CLI](https://vercel.com/docs/cli/deploy)
- [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Email templates](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)

Giao diện Dashboard và chính sách Free có thể thay đổi; đối chiếu tài liệu chính thức trước vận hành. Phiên bản source và README này: **v0.1.0**.
