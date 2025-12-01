# Hướng dẫn Trang Thống kê Admin

## 📊 Tổng quan

Trang thống kê admin cung cấp báo cáo toàn diện về hoạt động của nền tảng học trực tuyến, bao gồm:

- **Doanh thu**: Theo thời gian, danh mục, cấp độ khóa học
- **Học viên**: Số lượng, tăng trưởng, tỷ lệ hoàn thành
- **Giảng viên**: Top performers, đánh giá, doanh thu
- **Khóa học**: Phổ biến, đánh giá, số lượng đăng ký

## 🚀 Các trang hiện có

### 1. Trang Thống kê Chính

**URL**: `/admin/statistics`

Kết nối trực tiếp với API backend để hiển thị dữ liệu thực tế.

**Tính năng**:

- Tổng quan 4 chỉ số chính
- Biểu đồ doanh thu theo thời gian
- Phân bố theo danh mục và cấp độ
- Top courses và instructors
- Bộ lọc thời gian linh hoạt

### 2. Trang Demo

**URL**: `/admin/statistics/demo`

Sử dụng dữ liệu mẫu để demo giao diện và chức năng.

**Mục đích**: Test UI/UX mà không cần backend

## 📋 Cấu trúc Files

```
src/
├── actions/
│   └── statisticsActions.ts          # API calls cho statistics
├── app/(sidebar-layout)/(admin)/admin/
│   └── statistics/
│       ├── page.tsx                  # Trang thống kê chính
│       └── demo/
│           └── page.tsx              # Trang demo với mock data
├── components/
│   └── chart/                        # Chart components
│       ├── bar-chart.tsx
│       ├── line-chart.tsx
│       ├── pie-chart.tsx
│       └── chart-layout.tsx
└── docs/
    └── STATISTICS_API_DOCUMENTATION.md  # API documentation
```

## 🔧 Setup và Cài đặt

### 1. Dependencies

Trang statistics sử dụng:

- **Recharts**: Thư viện biểu đồ
- **Shadcn/ui**: UI components
- **Lucide React**: Icons
- **Sonner**: Toast notifications

### 2. Environment Variables

Cần thiết lập:

```env
NEXT_PUBLIC_API_URL=your_backend_api_url
```

### 3. API Endpoints

Backend cần implement các endpoints:

- `GET /statistics/dashboard`
- `GET /statistics/revenue-summary`
- `GET /statistics/instructors-summary`
- `GET /statistics/students-summary`

## 📊 Các biểu đồ hiện có

### 1. Bar Chart - Doanh thu theo thời gian

```tsx
<BarChart
  data={revenueChartData}
  index="name"
  categories={["Doanh thu"]}
  valueFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
/>
```

### 2. Pie Chart - Phân bố theo danh mục

```tsx
<PieChart
  data={categoryChartData}
  index="name"
  category="value"
  valueFormatter={formatCurrency}
/>
```

### 3. Line Chart - Xu hướng tăng trưởng

```tsx
<LineChart
  data={trendData}
  index="month"
  categories={["revenue", "students"]}
  valueFormatter={formatNumber}
/>
```

## 🎨 UI Components

### Overview Cards

Hiển thị các chỉ số quan trọng với:

- Icon đại diện
- Giá trị chính
- Tỷ lệ tăng trưởng (với màu sắc phân biệt)
- Trend arrow (up/down)

### Filter Controls

- **Period Selector**: Ngày/Tuần/Tháng/Quý/Năm
- **Date Range**: Input từ ngày - đến ngày
- **Export Button**: Xuất dữ liệu (TODO)

### Data Tables

- Top Courses với instructor info
- Top Instructors với ratings và stats
- Responsive design cho mobile

## 🔐 Bảo mật

### Authentication

```typescript
// Kiểm tra quyền admin trong API actions
const session = await auth();
if (session.user?.role !== "ADMIN") {
  return { success: false, error: "Unauthorized", status: 403 };
}
```

### API Security

- JWT Bearer token validation
- Role-based access control
- Rate limiting (khuyến nghị)

## 📱 Responsive Design

Trang được tối ưu cho:

- **Desktop**: Full layout với 4 cột overview
- **Tablet**: 2-3 cột, charts responsive
- **Mobile**: 1 cột, touch-friendly controls

## 🚧 Tính năng đang phát triển

### Hiện tại hoàn thành:

- ✅ Overview cards với growth indicators
- ✅ Multiple chart types (Bar, Pie, Line)
- ✅ Responsive layout
- ✅ Filter controls
- ✅ Mock data demo
- ✅ API integration structure

### Đang phát triển:

- 🔲 Export functionality
- 🔲 Advanced filters
- 🔲 Real-time updates
- 🔲 Email reports
- 🔲 Comparison periods

## 📈 Cách mở rộng

### Thêm biểu đồ mới:

1. Tạo component trong `/components/chart/`
2. Import và sử dụng trong statistics page
3. Thêm data transformation logic

### Thêm API endpoint:

1. Thêm function trong `statisticsActions.ts`
2. Update interface types
3. Integrate vào UI components

### Customization:

- Chart colors: Update trong chart components
- Layout: Modify grid classes
- Filters: Add new filter options

## 🐛 Troubleshooting

### Lỗi thường gặp:

1. **API Connection Error**

   - Kiểm tra NEXT_PUBLIC_API_URL
   - Verify JWT token
   - Check user role permissions

2. **Chart không hiển thị**

   - Kiểm tra data format
   - Verify chart props
   - Console.log data transformation

3. **Mobile layout issues**
   - Test responsive classes
   - Check container widths
   - Verify touch interactions

## 📞 Liên hệ

Nếu có vấn đề hoặc cần hỗ trợ:

- Check documentation trong `/docs/`
- Review existing components
- Test với demo page trước

---

**Lưu ý**: Trang demo (`/admin/statistics/demo`) luôn hoạt động với mock data, rất hữu ích để test UI mà không cần backend hoàn chỉnh.
