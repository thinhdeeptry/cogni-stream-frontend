# Hướng dẫn Tính năng Tự động áp dụng Commission

## Tổng quan

Tính năng tự động áp dụng commission sẽ tự động tìm và áp dụng commission rate phù hợp nhất khi tạo hoặc chỉnh sửa khóa học, giúp đảm bảo mọi khóa học đều có commission rate được thiết lập đúng cách.

## Cách hoạt động

### 🎯 Khi tạo khóa học mới

Hệ thống sẽ tự động tìm commission theo thứ tự ưu tiên:

1. **Ưu tiên 1**: Commission riêng cho khóa học cụ thể (nếu có)
2. **Ưu tiên 2**: Commission theo danh mục đã chọn
3. **Ưu tiên 3**: Commission chung của hệ thống

### 🔄 Khi chỉnh sửa khóa học

- Chỉ kích hoạt khi **thay đổi danh mục** khóa học
- Tự động tìm commission phù hợp cho danh mục mới
- Thông báo rõ ràng về commission rate được áp dụng

## Quy tắc chọn Commission

### Điều kiện Commission hợp lệ:

- ✅ `isActive = true`
- ✅ Commission detail thuộc header đang hoạt động
- ✅ Trong thời gian hiệu lực (nếu có)

### Thứ tự ưu tiên:

1. **Course-specific** (`courseId` match)
2. **Category-specific** (`categoryId` match)
3. **General** (không có `courseId` và `categoryId`)

### Sắp xếp trong cùng nhóm:

- Theo `priority` từ cao xuống thấp
- Chọn commission có priority cao nhất

## Thông báo người dùng

### ✅ Thành công:

```
"Tạo khóa học thành công! Đã tự động áp dụng commission: X% cho giảng viên, Y% cho nền tảng"
```

### ⚠️ Không tìm thấy:

```
"Tạo khóa học thành công! Không tìm thấy commission phù hợp, vui lòng thiết lập commission sau."
```

### ❌ Lỗi:

```
"Tạo khóa học thành công! Lỗi khi tự động áp dụng commission, vui lòng thiết lập commission sau."
```

## Code Implementation

### Files modified:

- `src/app/(admin)/admin/courses/create/page.tsx`
- `src/app/(admin)/admin/courses/[courseId]/edit/page.tsx`

### Key functions:

- `findBestCommission(courseId, categoryId)`
- `getActiveCommissionForProduct("COURSE", courseId)`
- `getCommissionDetailsByCategory(categoryId)`

## Giao diện người dùng

### Info Box trong Create Course:

```
🎯 Tự động áp dụng Commission
Hệ thống sẽ tự động tìm và áp dụng commission phù hợp nhất khi tạo khóa học:
• Ưu tiên 1: Commission riêng cho khóa học (nếu có)
• Ưu tiên 2: Commission theo danh mục đã chọn
• Ưu tiên 3: Commission chung của hệ thống
• Tự động chọn commission có độ ưu tiên cao nhất và đang hoạt động
```

### Info Box trong Edit Course:

```
🔄 Tự động cập nhật Commission
Khi thay đổi danh mục khóa học, hệ thống sẽ tự động tìm và áp dụng commission phù hợp nhất cho danh mục mới.
• Commission riêng cho khóa học (độ ưu tiên cao nhất)
• Commission theo danh mục mới
• Commission chung của hệ thống
```

## Backend Requirements

Cần đảm bảo các API sau hoạt động:

- `GET /commission/active/COURSE/:courseId`
- `GET /commission/details/category/:categoryId`
- `GET /commission/details` (với filter)

## Best Practices

### Thiết lập Commission:

1. **Tạo commission chung** với priority thấp làm fallback
2. **Tạo commission theo category** với priority trung bình
3. **Tạo commission riêng** cho course đặc biệt với priority cao
4. **Kiểm tra thời gian** hiệu lực của commission headers

### Monitoring:

- Theo dõi log console để debug commission selection
- Kiểm tra thông báo toast để xác nhận hoạt động
- Verify commission rate trong database sau khi tạo course

## Troubleshooting

### Không tìm thấy commission:

- Kiểm tra có commission nào `isActive = true`
- Verify commission header status
- Đảm bảo thời gian hiệu lực đúng

### Commission không đúng:

- Kiểm tra priority setting
- Verify course/category mapping
- Check filter logic trong code

### API errors:

- Kiểm tra backend commission endpoints
- Verify API permissions
- Check network connectivity
