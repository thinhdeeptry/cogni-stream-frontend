# YouTube Transcript/Subtitle Fetching System

## Overview

Hệ thống này được thiết kế để lấy transcript hoặc subtitle từ video YouTube với khả năng fallback thông minh khi không có transcript sẵn có.

## Cách thức hoạt động

### 1. Thứ tự ưu tiên ngôn ngữ

System sẽ thử lấy transcript/subtitle theo thứ tự:

1. **Tiếng Việt ('vi')** - Ưu tiên cao nhất
2. **Tiếng Anh ('en')** - Transcript chính thức
3. **Tiếng Anh US ('en-US')** - Subtitle cụ thể
4. **Tiếng Anh UK ('en-GB')** - Subtitle cụ thể
5. **Auto-detect ('auto')** - Tự động phát hiện ngôn ngữ có sẵn

### 2. Loại nội dung có thể lấy được

- **Manual Transcripts**: Transcript do người tạo video upload
- **Auto-generated Captions**: Phụ đề tự động do YouTube AI tạo
- **Community Subtitles**: Phụ đề do cộng đồng đóng góp (nếu có)

### 3. Cấu trúc dữ liệu trả về

```typescript
interface TranscriptResponse {
  transcript: string; // Text đầy đủ
  timestampedTranscript: TimestampedTranscriptItem[];
  videoId: string;
  source: "transcript" | "subtitles" | "captions";
}

interface TimestampedTranscriptItem {
  text: string; // Nội dung text
  timestamp: string; // Định dạng MM:SS hoặc HH:MM:SS
  offset: number; // Thời gian bắt đầu (milliseconds)
  duration: number; // Độ dài (milliseconds)
}
```

## Cách sử dụng

### Trong Server Action

```typescript
import { getYoutubeTranscript } from "@/actions/youtubeTranscript.action";

const result = await getYoutubeTranscript(videoUrl);
if ("error" in result) {
  // Xử lý lỗi
  console.log(result.error, result.details);
} else {
  // Sử dụng transcript/subtitle
  const { transcript, timestampedTranscript, source } = result;
}
```

### Trong Component

```typescript
const [timestampedTranscript, setTimestampedTranscript] = useState<
  TranscriptItem[]
>([]);

// Fetch transcript khi load lesson
useEffect(() => {
  if (lesson?.videoUrl) {
    getYoutubeTranscript(lesson.videoUrl).then((result) => {
      if ("error" in result) {
        setTimestampedTranscript([]);
      } else {
        setTimestampedTranscript(result.timestampedTranscript);
      }
    });
  }
}, [lesson?.videoUrl]);
```

## Xử lý lỗi

### Các loại lỗi thường gặp:

1. **"No transcript or subtitles available"**: Video không có transcript/subtitle
2. **"Invalid YouTube URL format"**: URL không đúng định dạng
3. **"Network error while fetching transcript"**: Lỗi kết nối mạng
4. **"Transcript is not available for this video"**: Chủ video đã tắt tính năng transcript

### Fallback strategies:

1. Thử nhiều ngôn ngữ khác nhau
2. Thử cả transcript và auto-generated captions
3. Hiển thị thông báo thân thiện khi không có nội dung

## Tích hợp với AI Chatbot

Khi có transcript/subtitle, AI chatbot sẽ:

- Tham chiếu đến timestamp cụ thể
- Trả lời câu hỏi dựa trên nội dung video
- Giải thích khái niệm được đề cập trong video

Khi không có transcript/subtitle:

- Thông báo rõ ràng về việc không thể phân tích video
- Hướng dẫn dựa trên tiêu đề bài học
- Yêu cầu học sinh mô tả nội dung cần hỗ trợ

## Cải tiến trong tương lai

### 1. Hỗ trợ thêm định dạng

- VTT (WebVTT) parsing
- SRT subtitle parsing
- Tự động detect định dạng subtitle

### 2. Caching

- Cache transcript đã fetch thành công
- Giảm số lần gọi API không cần thiết

### 3. Manual fallback

- Upload subtitle thủ công khi YouTube không có
- Hỗ trợ nhiều ngôn ngữ hơn

## Troubleshooting

### Vấn đề thường gặp:

**Q: Tại sao không lấy được transcript cho video này?**
A: Có thể do:

- Chủ video đã tắt tính năng transcript
- Video quá mới, YouTube chưa tạo auto-captions
- Video ở ngôn ngữ không được hỗ trợ

**Q: Làm sao để cải thiện tỷ lệ thành công?**
A:

- Thêm nhiều ngôn ngữ vào danh sách thử
- Implement thêm phương thức fallback
- Sử dụng YouTube Data API để check available captions trước

**Q: Có thể tự upload subtitle không?**
A: Hiện tại chưa hỗ trợ, nhưng có thể implement trong tương lai bằng cách:

- Tạo field upload subtitle trong lesson
- Parse file SRT/VTT đã upload
- Fallback sang file upload khi không có transcript online
