# Football Career Manager & Forum

Đây là một dự án web full-stack cho phép người dùng quản lý đội hình bóng đá của họ qua các mùa giải, phân tích dữ liệu cầu thủ, và chia sẻ câu chuyện sự nghiệp của mình với một cộng đồng những người cùng đam mê.

## ✨ Tính năng chính

* **Quản lý Tài khoản:** Đăng ký, đăng nhập an toàn sử dụng JWT (JSON Web Tokens).
* **Quản lý Mùa giải:** Tạo và quản lý nhiều mùa giải khác nhau, mỗi mùa giải có một đội hình riêng.
* **Quản lý Đội hình:**
    * Tải lên dữ liệu đội hình từ file HTML.
    * Xem danh sách cầu thủ chi tiết với các chỉ số quan trọng.
    * Sắp xếp và lọc cầu thủ một cách linh hoạt.
    * Xóa dữ liệu đội hình của một mùa giải.
* **Diễn đàn Sự nghiệp:**
    * Viết và lưu lại câu chuyện, tổng kết cho từng mùa giải của bạn.
    * Chủ bài viết có thể chỉnh sửa lại câu chuyện của mình.
    * Xem các bài viết được chia sẻ bởi những người dùng khác.
* **Tương tác Cộng đồng:**
    * Đọc và xem đội hình chi tiết được đính kèm trong bài viết của người khác.
    * Để lại bình luận dưới mỗi bài viết.

## 🛠️ Công nghệ sử dụng

* **Frontend:** HTML5, CSS3, JavaScript (ES6+), Bootstrap 5
* **Backend:** Node.js, Express.js
* **Database:** PostgreSQL (Host trên Supabase)
* **ORM:** Prisma
* **Authentication:** JSON Web Tokens (JWT), bcrypt.js
* **Deployment:** Render.com (cho cả Backend và Frontend)

## 🚀 Cài đặt và Chạy thử tại local

Để chạy dự án này trên máy tính của bạn, hãy làm theo các bước sau.

### Yêu cầu
* [Node.js](https://nodejs.org/) (phiên bản 16 trở lên)
* [PostgreSQL](https://www.postgresql.org/download/)
* [Git](https://git-scm.com/)

### Cài đặt
1.  **Clone repository về máy:**
    ```bash
    git clone [https://github.com/TEN_USER_CUA_BAN/TEN_REPO_CUA_BAN.git](https://github.com/TEN_USER_CUA_BAN/TEN_REPO_CUA_BAN.git)
    cd TEN_REPO_CUA_BAN
    ```
    *(Nhớ thay `TEN_USER_CUA_BAN` và `TEN_REPO_CUA_BAN` bằng tên thật của bạn)*

2.  **Cài đặt Backend:**
    ```bash
    cd backend
    npm install
    ```
    * Tạo một file `.env` trong thư mục `backend` và sao chép nội dung từ file `.env.example` (nếu có) hoặc tự điền các biến sau:
        ```env
        DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
        JWT_SECRET="MOT_CHUOI_BI_MAT_CUA_BAN"
        ```
    * Chạy migration để tạo các bảng trong database:
        ```bash
        npx prisma migrate dev
        ```
    * Khởi động server backend:
        ```bash
        npm start
        ```
    Server sẽ chạy tại `http://localhost:3001`.

3.  **Cài đặt Frontend:**
    * Mở một cửa sổ terminal mới.
    * Di chuyển vào thư mục frontend:
        ```bash
        cd frontend
        ```
    * Mở file `script.js` và đảm bảo biến `API_URL` được đặt thành địa chỉ local:
        ```javascript
        const API_URL = 'http://localhost:3001/api';
        ```
    * Mở file `index.html` bằng trình duyệt (sử dụng extension Live Server của VS Code là tốt nhất).

##  Giấy phép

Dự án này được cấp phép dưới Giấy phép MIT.