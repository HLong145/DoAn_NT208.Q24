# Tổng Hợp Chức Năng Của Web

Tài liệu này tóm tắt các chức năng chính của web, các loại file đang dùng trong dự án, và mỗi chức năng đang nằm ở những file nào.

## 1. Dự án đang dùng những loại file nào

### File cấu hình và nền tảng
- `.html`: điểm vào của ứng dụng web.
- `.json`: cấu hình dự án, metadata và TypeScript.
- `.ts`: file cấu hình và logic dạng TypeScript nếu có.
- `.tsx`: file React component/page chính.
- `.css`: toàn bộ style và theme.
- `.md`: tài liệu mô tả, hướng dẫn và tổng kết.
- `.env.example`: mẫu biến môi trường.

### Các file chính trong app hiện tại
- `index.html`
- `package.json`
- `tsconfig.json`
- `vite.config.ts`
- `README.md`
- `src/main.tsx`
- `src/App.tsx`
- `src/index.css`
- `src/contexts/ThemeContext.tsx`
- `src/components/*.tsx`
- `src/pages/*.tsx`

## 2. Kiến trúc theo nhóm chức năng

### A. Khởi tạo ứng dụng và điều hướng
**Mục đích:** Khởi động app, bọc context, khai báo route, và gắn layout chung.

**File liên quan:**
- [src/main.tsx](src/main.tsx)
- [src/App.tsx](src/App.tsx)
- [src/components/Layout.tsx](src/components/Layout.tsx)
- [src/index.css](src/index.css)
- [src/contexts/ThemeContext.tsx](src/contexts/ThemeContext.tsx)

**Vai trò:**
- `main.tsx` mount React vào DOM.
- `App.tsx` khai báo toàn bộ route.
- `Layout.tsx` giữ sidebar trái, nav mobile, menu tài khoản, menu More, và `Outlet` cho nội dung trang.
- `ThemeContext.tsx` quản lý theme và font size toàn cục.
- `index.css` định nghĩa màu, biến CSS và style nền tảng.

### B. Trang Home / Feed
**Mục đích:** Hiển thị bảng tin chính, composer và danh sách bài viết.

**File liên quan:**
- [src/pages/Home.tsx](src/pages/Home.tsx)
- [src/components/Tweet.tsx](src/components/Tweet.tsx)
- [src/components/TrendingSidebar.tsx](src/components/TrendingSidebar.tsx)

**Vai trò:**
- `Home.tsx` chứa feed, tab For you / Following, ô soạn bài và dữ liệu mock bài viết.
- `Tweet.tsx` render từng bài đăng.
- `TrendingSidebar.tsx` hiển thị search, trending và gợi ý người dùng.

### C. Trang Explore / Search
**Mục đích:** Tìm kiếm nội dung, xem trending và tab lọc.

**File liên quan:**
- [src/pages/Explore.tsx](src/pages/Explore.tsx)
- [src/components/Tweet.tsx](src/components/Tweet.tsx)
- [src/components/TrendingSidebar.tsx](src/components/TrendingSidebar.tsx)

**Vai trò:**
- `Explore.tsx` xử lý query search, autocomplete, tab Top / Latest / People / Media.
- `Tweet.tsx` dùng để hiển thị kết quả bài viết.
- `TrendingSidebar.tsx` hỗ trợ tìm kiếm và trending bên phải.

### D. Trang Notifications
**Mục đích:** Xem thông báo tương tác như like, follow, reply, mention.

**File liên quan:**
- [src/pages/Notifications.tsx](src/pages/Notifications.tsx)
- [src/components/TrendingSidebar.tsx](src/components/TrendingSidebar.tsx)

**Vai trò:**
- `Notifications.tsx` render danh sách thông báo, chức năng mark all as read, và điều hướng sang profile/tweet.
- Nút setting trong Notifications điều hướng sang [src/pages/Settings.tsx](src/pages/Settings.tsx) với tab Notifications được mở sẵn.
- `TrendingSidebar.tsx` giữ cột phụ giống các trang social khác.

### E. Trang Follow
**Mục đích:** Gợi ý người dùng để follow.

**File liên quan:**
- [src/pages/Follow.tsx](src/pages/Follow.tsx)
- [src/components/TrendingSidebar.tsx](src/components/TrendingSidebar.tsx)

**Vai trò:**
- `Follow.tsx` hiển thị danh sách tài khoản gợi ý, tab Who to follow / Creators for you.

### F. Trang Chat / Messages
**Mục đích:** Quản lý hội thoại, lọc chat, mở cuộc trò chuyện và soạn tin nhắn.

**File liên quan:**
- [src/pages/Messages.tsx](src/pages/Messages.tsx)
- [src/components/Layout.tsx](src/components/Layout.tsx)
- [src/contexts/ThemeContext.tsx](src/contexts/ThemeContext.tsx)

**Vai trò:**
- `Messages.tsx` là khung chat chính.
- `Layout.tsx` tự nhận route `/messages` để chuyển sidebar sang compact mode.
- `ThemeContext.tsx` cung cấp `chatTheme` và `nickname` cho phần chat.

### G. Trang Bookmarks
**Mục đích:** Lưu bài viết để đọc sau.

**File liên quan:**
- [src/pages/Bookmarks.tsx](src/pages/Bookmarks.tsx)
- [src/components/TrendingSidebar.tsx](src/components/TrendingSidebar.tsx)

**Vai trò:**
- `Bookmarks.tsx` hiển thị empty state khi chưa có bài đã lưu.

### H. Trang Profile
**Mục đích:** Xem trang cá nhân, follow/unfollow và chỉnh profile.

**File liên quan:**
- [src/pages/Profile.tsx](src/pages/Profile.tsx)
- [src/components/Tweet.tsx](src/components/Tweet.tsx)
- [src/components/TrendingSidebar.tsx](src/components/TrendingSidebar.tsx)

**Vai trò:**
- `Profile.tsx` hiển thị thông tin user, tab Posts / Replies / Media / Likes, modal chỉnh sửa profile.
- `Tweet.tsx` dùng để render danh sách bài đăng trên profile.

### I. Trang chi tiết bài đăng
**Mục đích:** Xem một bài đăng đầy đủ và phần replies.

**File liên quan:**
- [src/pages/TweetDetail.tsx](src/pages/TweetDetail.tsx)
- [src/components/Tweet.tsx](src/components/Tweet.tsx)
- [src/components/TrendingSidebar.tsx](src/components/TrendingSidebar.tsx)

**Vai trò:**
- `TweetDetail.tsx` hiển thị bài chính, số liệu, box reply và danh sách phản hồi.

### J. Nhóm Settings
**Mục đích:** Cấu hình tài khoản, riêng tư, thông báo và bảo mật.

**File liên quan:**
- [src/pages/Settings.tsx](src/pages/Settings.tsx)
- [src/pages/AccountInformation.tsx](src/pages/AccountInformation.tsx)
- [src/pages/ChangePassword.tsx](src/pages/ChangePassword.tsx)
- [src/pages/DeactivateAccount.tsx](src/pages/DeactivateAccount.tsx)
- [src/pages/DirectMessages.tsx](src/pages/DirectMessages.tsx)
- [src/pages/PushNotifications.tsx](src/pages/PushNotifications.tsx)
- [src/pages/EmailNotifications.tsx](src/pages/EmailNotifications.tsx)

**Vai trò:**
- `Settings.tsx` là trang tổng.
- Các file con là các trang chi tiết từng nhóm cấu hình.

### K. Nhóm tài khoản phụ / hành động account
**Mục đích:** Xử lý các hành động từ menu dấu ba chấm.

**File liên quan:**
- [src/pages/AddAccount.tsx](src/pages/AddAccount.tsx)
- [src/pages/Logout.tsx](src/pages/Logout.tsx)
- [src/components/Layout.tsx](src/components/Layout.tsx)
- [src/App.tsx](src/App.tsx)

**Vai trò:**
- `AddAccount.tsx` là form thêm tài khoản hiện có.
- `Logout.tsx` là màn hình xác nhận đăng xuất.
- `Layout.tsx` mở menu và điều hướng tới 2 route này.
- `App.tsx` khai báo route `/add-account` và `/logout`.

### L. Trang tạo bài viết
**Mục đích:** Soạn bài mới ở một trang riêng.

**File liên quan:**
- [src/pages/Post.tsx](src/pages/Post.tsx)
- [src/components/Layout.tsx](src/components/Layout.tsx)
- [src/App.tsx](src/App.tsx)

**Vai trò:**
- `Post.tsx` là trang composer đầy đủ.
- Nút Post ở sidebar trong `Layout.tsx` điều hướng sang route `/post`.
- `App.tsx` khai báo route `/post`.

### M. Trang đăng nhập / đăng ký / quên mật khẩu
**Mục đích:** Xác thực người dùng.

**File liên quan:**
- [src/pages/Login.tsx](src/pages/Login.tsx)
- [src/pages/Register.tsx](src/pages/Register.tsx)
- [src/pages/ForgotPassword.tsx](src/pages/ForgotPassword.tsx)

**Vai trò:**
- `Login.tsx` là form đăng nhập.
- `Register.tsx` là form tạo tài khoản.
- `ForgotPassword.tsx` xử lý yêu cầu đặt lại mật khẩu.

## 3. Tóm tắt file theo nhóm kỹ thuật

### Nhóm cấu hình
- `index.html`
- `package.json`
- `tsconfig.json`
- `vite.config.ts`
- `README.md`
- `.env.example`

### Nhóm khởi động ứng dụng
- `src/main.tsx`
- `src/App.tsx`

### Nhóm giao diện dùng chung
- `src/components/Layout.tsx`
- `src/components/Tweet.tsx`
- `src/components/TrendingSidebar.tsx`

### Nhóm trạng thái và theme
- `src/contexts/ThemeContext.tsx`
- `src/index.css`

### Nhóm trang theo chức năng
- `src/pages/Home.tsx`
- `src/pages/Explore.tsx`
- `src/pages/Notifications.tsx`
- `src/pages/Follow.tsx`
- `src/pages/Messages.tsx`
- `src/pages/Bookmarks.tsx`
- `src/pages/Profile.tsx`
- `src/pages/TweetDetail.tsx`
- `src/pages/Settings.tsx`
- `src/pages/AccountInformation.tsx`
- `src/pages/ChangePassword.tsx`
- `src/pages/DeactivateAccount.tsx`
- `src/pages/DirectMessages.tsx`
- `src/pages/PushNotifications.tsx`
- `src/pages/EmailNotifications.tsx`
- `src/pages/Login.tsx`
- `src/pages/Register.tsx`
- `src/pages/ForgotPassword.tsx`
- `src/pages/AddAccount.tsx`
- `src/pages/Logout.tsx`
- `src/pages/Post.tsx`

## 4. Những chức năng nổi bật của web
- Sidebar điều hướng cố định.
- Bấm icon E sẽ quay về Home.
- Trang Home hiển thị feed và composer.
- Trang Explore hỗ trợ search và trending.
- Trang Notifications hiển thị thông báo tương tác.
- Trang Messages có layout chat 2 cột.
- Trang Profile có edit modal và dữ liệu mock theo handle.
- Trang Settings chia thành nhiều màn cấu hình con.
- Menu dấu ba chấm có Add account và Logout.
- Trang Post riêng để tạo bài mới.
- Display settings điều khiển theme, màu, font size và chat theme.

## 5. Kết luận
Dự án đang được tổ chức theo mô hình React + Router + component hóa rõ ràng. Mỗi chức năng chính đều có một hoặc nhiều file TSX riêng, còn theme và style dùng chung được gom về `ThemeContext.tsx` và `index.css`.

Nếu sau này cần mở rộng, nên tách thêm:
- lớp data/API riêng
- lớp types dùng chung
- auth state thật
- test cho từng chức năng
