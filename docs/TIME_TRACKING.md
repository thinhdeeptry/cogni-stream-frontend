# Time Tracking System Documentation

## 📖 Tổng quan

Hệ thống Time Tracking được thiết kế để theo dõi thời gian học tập của học viên trên nền tảng CogniStream. Hệ thống đảm bảo học viên phải học đủ thời gian tối thiểu trước khi có thể hoàn thành bài học hoặc buổi học.

## 🎯 Mục tiêu

- **Đảm bảo chất lượng học tập**: Yêu cầu học viên dành đủ thời gian cho mỗi bài học
- **Theo dõi tiến độ**: Cung cấp thông tin chi tiết về thời gian học tập
- **Ngăn chặn gian lận**: Không cho phép "nhảy cóc" hoặc hoàn thành quá nhanh
- **Cải thiện trải nghiệm**: UI trực quan với feedback real-time

## 🏗️ Kiến trúc hệ thống

### 1. Core Hook: `useTimeTracking`

```typescript
// Location: /src/hooks/useTimeTracking.ts
const timeTracking = useTimeTracking({
  itemId: "lesson-123", // Unique identifier
  requiredMinutes: 30, // Thời gian yêu cầu (phút)
  onTimeComplete: () => console.log("Completed!"),
});
```

**Tính năng chính:**

- ⏱️ Real-time timer với độ chính xác 1 giây
- 💾 Persistence với localStorage (survive page refresh)
- ⏸️ Auto pause/resume khi user switch tab
- 📊 Progress calculation và remaining time
- 🔄 Reset functionality cho item mới

### 2. UI Components

#### TimeTrackingDisplay Component

```typescript
// Location: /src/components/time-tracking/TimeTrackingDisplay.tsx
<TimeTrackingDisplay
  elapsedSeconds={timeTracking.elapsedSeconds}
  requiredMinutes={30}
  progress={timeTracking.progress}
  isActive={timeTracking.isActive}
  variant="lesson" // hoặc "session"
  onPause={timeTracking.pause}
  onResume={timeTracking.resume}
/>
```

## 📱 Triển khai

### 1. Lesson Page (`/course/[courseId]/lesson/[lessonId]`)

**Thời gian yêu cầu:** `lesson.estimatedDurationMinutes`

```typescript
// Auto-start tracking khi lesson load
useEffect(() => {
  if (lesson && isEnrolled && !lesson.isFreePreview) {
    timeTracking.start();
  }
  return () => {
    if (timeTracking.isActive) {
      timeTracking.pause();
    }
  };
}, [lesson, isEnrolled]);
```

**UI Elements:**

- 🟦 Blue color scheme cho lessons
- 📊 Progress bar với elapsed time / required time
- ⏯️ Pause/Resume controls
- 🚫 Disabled completion button until time complete

### 2. Class Page (`/course/[courseId]/class/[classId]`)

**Thời gian yêu cầu:**

- **LESSON items:** `currentItem.lesson.estimatedDurationMinutes`
- **LIVE_SESSION items:** `currentItem.classSession.durationMinutes`

```typescript
// Reset và start lại khi switch syllabus items
useEffect(() => {
  if (currentItem && isEnrolled) {
    timeTracking.reset();
    timeTracking.start();
  }
}, [currentItem?.id, isEnrolled]);
```

**UI Elements:**

- 🟦 Blue cho lesson items
- 🟧 Orange cho live session items
- 🔄 Auto-reset khi chuyển items
- 📝 Different labels cho lesson vs session

## 🔧 API Reference

### useTimeTracking Hook

```typescript
interface TimeTrackingOptions {
  itemId: string; // Unique identifier
  requiredMinutes: number; // Thời gian yêu cầu (phút)
  onTimeComplete?: () => void; // Callback khi hoàn thành
}

interface TimeTrackingState {
  elapsedSeconds: number; // Thời gian đã học (giây)
  isActive: boolean; // Đang tracking không
  isTimeComplete: boolean; // Đã học đủ thời gian chưa
  progress: number; // % hoàn thành (0-100)
  remainingMinutes: number; // Số phút còn lại
}

// Methods
const {
  // State
  elapsedSeconds,
  isActive,
  isTimeComplete,
  progress,
  remainingMinutes,

  // Controls
  start, // Bắt đầu tracking
  pause, // Tạm dừng
  resume, // Tiếp tục
  reset, // Reset về 0
} = useTimeTracking(options);
```

### Utility Functions

```typescript
// Format seconds thành MM:SS hoặc HH:MM:SS
formatTime(3661); // "1:01:01"
formatTime(125); // "2:05"

// Format thành readable text
formatTimeMinutes(185); // "3 phút 5 giây"
```

## 💾 Data Persistence

### localStorage Schema

```typescript
// Key format: "time-tracking-{itemId}"
// Value: elapsed seconds as string

localStorage.setItem("time-tracking-lesson-123", "1800"); // 30 phút
localStorage.setItem("time-tracking-syllabus-456", "900"); // 15 phút
```

**Auto cleanup:** Data được xóa khi gọi `reset()`

## 🔒 Business Logic

### 1. Enrollment Checks

```typescript
// Chỉ track time cho enrolled users
if (isEnrolled && !lesson.isFreePreview) {
  timeTracking.start();
}
```

### 2. Completion Button Logic

```typescript
// Button disabled until time complete
<Button
  disabled={isEnrolled && !lesson.isFreePreview && !timeTracking.isTimeComplete}
  className={timeTracking.isTimeComplete ? 'enabled' : 'disabled'}
>
  {timeTracking.isTimeComplete ? 'Học tiếp' : 'Chưa đủ thời gian'}
</Button>
```

### 3. Page Visibility Handling

```typescript
// Auto pause/resume khi user switch tab
useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.hidden) {
      timeTracking.pause();
    } else {
      timeTracking.resume();
    }
  };

  document.addEventListener("visibilitychange", handleVisibilityChange);
  return () =>
    document.removeEventListener("visibilitychange", handleVisibilityChange);
}, []);
```

## 🎨 UI/UX Design

### Color Schemes

| Type    | Background     | Border              | Text              | Progress        |
| ------- | -------------- | ------------------- | ----------------- | --------------- |
| Lesson  | `bg-blue-50`   | `border-blue-200`   | `text-blue-800`   | `bg-blue-200`   |
| Session | `bg-orange-50` | `border-orange-200` | `text-orange-800` | `bg-orange-200` |

### States

#### 1. Active State

```
🟢 [Timer] Thời gian học tập
   Thời gian đã học: 15:30  |  Yêu cầu: 30 phút
   ████████████░░░░░░░░░░░ 52%
   Còn lại: 15 phút để hoàn thành bài học
   [⏸️ Tạm dừng]
```

#### 2. Paused State

```
⏸️ [Timer] Thời gian học tập
   Thời gian đã học: 15:30  |  Yêu cầu: 30 phút
   ████████████░░░░░░░░░░░ 52%
   Còn lại: 15 phút để hoàn thành bài học
   [▶️ Tiếp tục]
```

#### 3. Completed State

```
✅ [Timer] Thời gian học tập
   Thời gian đã học: 30:00  |  Yêu cầu: 30 phút
   ████████████████████████ 100%
   ✅ Đã học đủ thời gian yêu cầu
   [⏸️ Tạm dừng]
```

## 🚨 Edge Cases & Error Handling

### 1. Missing Required Time

```typescript
// Fallback to 5 minutes if no required time
requiredMinutes: lesson?.estimatedDurationMinutes || 5;
```

### 2. Invalid itemId

```typescript
// Skip localStorage operations if no itemId
const storageKey = itemId ? `time-tracking-${itemId}` : null;
if (!storageKey) return;
```

### 3. localStorage Errors

```typescript
try {
  localStorage.setItem(storageKey, elapsedSeconds.toString());
} catch (error) {
  console.warn("Failed to save time tracking data:", error);
}
```

### 4. Component Unmount

```typescript
// Cleanup interval on unmount
useEffect(() => {
  return () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };
}, []);
```

## 📊 Performance Considerations

### 1. Timer Accuracy

- **Interval:** 1000ms (1 giây)
- **Precision:** Millisecond-accurate với `Date.now()`
- **Memory:** Minimal - chỉ track start time và paused duration

### 2. localStorage Usage

- **Write frequency:** Mỗi giây (khi active)
- **Data size:** < 10 bytes per item
- **Cleanup:** Auto-cleanup khi reset

### 3. Re-renders

- **Optimized:** UseCallback cho control functions
- **Minimal:** Chỉ update khi cần thiết
- **Efficient:** Separate timer logic khỏi UI logic

## 🔍 Testing Guidelines

### 1. Unit Tests

```typescript
// Test time progression
test("should increment elapsed time when active", async () => {
  const { result } = renderHook(() =>
    useTimeTracking({
      itemId: "test",
      requiredMinutes: 5,
    }),
  );

  act(() => result.current.start());

  await waitFor(() => {
    expect(result.current.elapsedSeconds).toBeGreaterThan(0);
  });
});

// Test completion logic
test("should mark as complete when time reached", () => {
  // Mock elapsed time >= required time
  // Assert isTimeComplete === true
});
```

### 2. Integration Tests

```typescript
// Test với lesson page
test('should disable completion button until time complete', () => {
  render(<LessonPage />);

  const button = screen.getByText('Học tiếp');
  expect(button).toBeDisabled();

  // Fast-forward time
  act(() => jest.advanceTimersByTime(30 * 60 * 1000));

  expect(button).toBeEnabled();
});
```

### 3. E2E Tests

```typescript
// Test persistence
test("should restore time after page refresh", () => {
  // Start lesson, wait some time
  // Refresh page
  // Verify time is restored
});

// Test tab switching
test("should pause when tab inactive", () => {
  // Start lesson
  // Switch tab (make document.hidden = true)
  // Verify timer paused
  // Switch back
  // Verify timer resumed
});
```

## 🚀 Deployment & Monitoring

### 1. Feature Flags

```typescript
// Environment-based configuration
const TIME_TRACKING_ENABLED = process.env.NEXT_PUBLIC_TIME_TRACKING === "true";

if (TIME_TRACKING_ENABLED && isEnrolled) {
  timeTracking.start();
}
```

### 2. Analytics Events

```typescript
// Track completion rates
analytics.track("time_tracking_completed", {
  itemId,
  requiredMinutes,
  actualMinutes: Math.ceil(elapsedSeconds / 60),
  efficiency: elapsedSeconds / (requiredMinutes * 60),
});
```

### 3. Error Monitoring

```typescript
// Sentry error tracking
try {
  timeTracking.start();
} catch (error) {
  Sentry.captureException(error, {
    tags: { feature: "time_tracking" },
    extra: { itemId, requiredMinutes },
  });
}
```

## 📈 Future Enhancements

### 1. Advanced Analytics

- Heat maps của thời gian học tập
- Completion rate theo course/instructor
- Average time vs required time analysis

### 2. Adaptive Time Requirements

- AI-powered thời gian tối ưu dựa trên user behavior
- Dynamic adjustment theo difficulty level
- Personalized requirements

### 3. Gamification

- Badges cho consistent learning
- Streaks cho daily learning time
- Leaderboards cho learning time

### 4. Advanced Controls

- Customizable break intervals
- Study session reminders
- Focus mode với Pomodoro technique

## 🔧 Troubleshooting

### Common Issues

#### 1. Timer không start

**Nguyên nhân:** User chưa enrolled hoặc đang xem free preview
**Giải pháp:** Check enrollment status và isFreePreview flag

#### 2. Time không persist sau refresh

**Nguyên nhân:** localStorage disabled hoặc storage quota exceeded
**Giải pháp:** Add error handling và fallback storage

#### 3. Button vẫn disabled dù đã đủ thời gian

**Nguyên nhân:** Logic condition không đúng hoặc state không sync
**Giải pháp:** Debug timeTracking.isTimeComplete value

#### 4. Timer chạy khi tab không active

**Nguyên nhân:** Visibility change event không fire
**Giải pháp:** Add backup với window focus/blur events

## 📝 Changelog

### Version 1.0.0 (Initial Release)

- ✅ Basic time tracking với localStorage persistence
- ✅ Lesson page integration
- ✅ Class page integration với syllabus items
- ✅ UI components với progress indicators
- ✅ Auto pause/resume trên tab switching

### Future Versions

- 🔄 Advanced analytics và reporting
- 🔄 Mobile app integration
- 🔄 Offline support với sync
- 🔄 Multi-device session management

---

**Tác giả:** CogniStream Development Team  
**Cập nhật lần cuối:** September 22, 2025  
**Version:** 1.0.0
