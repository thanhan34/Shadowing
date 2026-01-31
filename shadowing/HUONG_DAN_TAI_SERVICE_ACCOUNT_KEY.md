# Hướng Dẫn Tải Service Account Key Từ Firebase Console

## Các Bước Chi Tiết:

### Bước 1: Truy Cập Firebase Console
1. Mở trình duyệt và truy cập: https://console.firebase.google.com/
2. Đăng nhập bằng tài khoản Google của bạn (nếu chưa đăng nhập)

### Bước 2: Chọn Project
1. Chọn project **pteshadowing** từ danh sách projects

### Bước 3: Vào Project Settings
1. Click vào biểu tượng **bánh răng ⚙️** (Settings) ở góc trên bên trái
2. Chọn **Project settings** từ menu dropdown

### Bước 4: Vào Service Accounts
1. Trong trang Project Settings, click vào tab **Service accounts** ở phía trên
2. Bạn sẽ thấy phần "Firebase Admin SDK"

### Bước 5: Generate Private Key
1. Scroll xuống phần "Firebase Admin SDK"
2. Đảm bảo ngôn ngữ được chọn là **Node.js**
3. Click vào nút **"Generate new private key"** (màu xanh)
4. Một popup xác nhận sẽ xuất hiện

### Bước 6: Xác Nhận và Tải Xuống
1. Trong popup xác nhận, đọc cảnh báo về bảo mật
2. Click nút **"Generate key"** để xác nhận
3. File JSON sẽ tự động được tải xuống máy tính của bạn
4. File này thường có tên dạng: `pteshadowing-firebase-adminsdk-xxxxx-xxxxxxxxxx.json`

### Bước 7: Đổi Tên và Di Chuyển File
1. Tìm file JSON vừa tải xuống (thường ở thư mục Downloads)
2. **Đổi tên file** thành: `serviceAccountKey.json`
3. **Copy/Di chuyển** file này vào thư mục gốc của project:
   ```
   c:/Users/dtan4/OneDrive/Documents/Next JS Project/Shadowing/shadowing/
   ```
4. File phải nằm cùng cấp với `package.json`, `firebase.js`, `updateWriteFromDictationID.js`

### Bước 8: Bảo Mật File
**⚠️ QUAN TRỌNG:**
- File này chứa thông tin xác thực quan trọng
- **KHÔNG BAO GIỜ** commit file này lên Git/GitHub
- Thêm `serviceAccountKey.json` vào file `.gitignore` nếu chưa có

Kiểm tra file `.gitignore` đã có dòng này chưa:
```
serviceAccountKey.json
```

## Cấu Trúc File ServiceAccountKey.json

File sẽ có cấu trúc như sau:
```json
{
  "type": "service_account",
  "project_id": "pteshadowing",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-...@pteshadowing.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "..."
}
```

## Kiểm Tra File Đã Đúng Chưa

Sau khi đặt file vào đúng vị trí, kiểm tra:

1. Mở Command Prompt/Terminal trong thư mục project
2. Chạy lệnh:
   ```bash
   dir serviceAccountKey.json
   ```
   (hoặc `ls serviceAccountKey.json` nếu dùng PowerShell/Git Bash)
3. Nếu thấy file hiển thị = thành công!

## Bước Tiếp Theo

Sau khi có file `serviceAccountKey.json`, bạn có thể chạy script:

```bash
node updateWriteFromDictationID.js
```

## Xử Lý Lỗi Thường Gặp

**Lỗi: "Cannot find module './serviceAccountKey.json'"**
- File chưa được đặt đúng vị trí
- Kiểm tra lại đường dẫn và tên file

**Lỗi: "Error parsing serviceAccountKey.json"**
- File JSON bị lỗi format
- Tải lại file từ Firebase Console

**Lỗi: "Permission denied" hoặc "Insufficient permissions"**
- Service Account không có quyền truy cập Firestore
- Vào Firebase Console > IAM & Admin để kiểm tra quyền
