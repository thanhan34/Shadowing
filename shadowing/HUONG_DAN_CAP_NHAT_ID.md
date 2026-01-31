# Hướng Dẫn Cập Nhật Trường ID Cho Collection WritefromDictation

## Bước 1: Chuẩn Bị Service Account Key

Bạn cần tải file `serviceAccountKey.json` từ Firebase Console:

1. Truy cập [Firebase Console](https://console.firebase.google.com/)
2. Chọn project của bạn (pteshadowing)
3. Vào **Project Settings** (biểu tượng bánh răng) > **Service Accounts**
4. Click vào **Generate new private key**
5. Tải file JSON xuống và đặt tên là `serviceAccountKey.json`
6. Copy file này vào thư mục gốc của project (cùng cấp với package.json)

**LƯU Ý QUAN TRỌNG**: File `serviceAccountKey.json` chứa thông tin bảo mật, KHÔNG được commit lên Git!

## Bước 2: Cài Đặt Dependencies

Package `csv-parser` đã được cài đặt tự động. Nếu cần cài lại:

```bash
npm install csv-parser
```

## Bước 3: Chạy Script Cập Nhật

Chạy lệnh sau để cập nhật collection:

```bash
node updateWriteFromDictationID.js
```

## Cách Hoạt Động

Script sẽ:

1. ✅ Đọc file `data/questions.csv` chứa QuestionNo và Content
2. ✅ Tạo một Map để tra cứu nhanh QuestionNo dựa trên Content
3. ✅ Lấy tất cả documents từ collection `writefromdictation`
4. ✅ So sánh trường `text` của mỗi document với Content trong CSV
5. ✅ Nếu khớp, cập nhật trường `ID` = QuestionNo
6. ✅ Xử lý theo batch (500 documents/batch) để tối ưu hiệu suất
7. ✅ Hiển thị báo cáo chi tiết:
   - Số documents đã cập nhật
   - Số documents không tìm thấy trong CSV
   - Danh sách các text không khớp

## Kết Quả Mong Đợi

Sau khi chạy script, bạn sẽ thấy:

```
Reading CSV file...
CSV file successfully processed. Found 618 questions.
Fetching documents from writefromdictation collection...
Found XXX documents in writefromdictation collection.
✓ Matched: "The artists and conservative politicians..." -> #1 WFD
✓ Matched: "Please confirm that you have received..." -> #2 WFD
...

=== Update Summary ===
Total documents processed: XXX
Documents updated with ID: XXX
Documents not found in CSV: XXX

✅ Update process completed successfully!
```

## Xử Lý Lỗi

Nếu gặp lỗi:

1. **Error: Cannot find module './serviceAccountKey.json'**
   - Bạn chưa có file serviceAccountKey.json
   - Làm theo Bước 1 để tải file từ Firebase Console

2. **Error: ENOENT: no such file or directory 'data/questions.csv'**
   - File CSV không tồn tại hoặc sai đường dẫn
   - Kiểm tra file có tồn tại tại `data/questions.csv`

3. **Permission denied**
   - Không có quyền truy cập Firestore
   - Kiểm tra lại Service Account Key có đúng project không

## Kiểm Tra Kết Quả

Sau khi chạy xong, bạn có thể kiểm tra bằng cách:

1. Vào Firebase Console > Firestore Database
2. Mở collection `writefromdictation`
3. Kiểm tra các documents đã có trường `ID` chưa
4. Hoặc chạy query trong code để kiểm tra

## Rollback (Nếu Cần)

Nếu muốn xóa trường ID đã thêm, bạn có thể sử dụng script tương tự với:

```javascript
batch.update(doc.ref, { ID: admin.firestore.FieldValue.delete() });
```

## Lưu Ý

- Script sử dụng so sánh text chính xác (case-sensitive) sau khi trim
- Batch size mặc định là 500 documents
- Script sẽ in ra các text không tìm thấy để bạn kiểm tra
- Nếu có nhiều documents không khớp, có thể do:
  - Content trong CSV khác với text trong Firestore (dấu câu, khoảng trắng)
  - Documents mới chưa có trong CSV
  - Lỗi encoding hoặc special characters
