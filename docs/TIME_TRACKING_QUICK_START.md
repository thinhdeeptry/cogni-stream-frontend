# Time Tracking System - Quick Start Guide

## 🚀 Quick Implementation

### 1. Basic Usage

```typescript
import { useTimeTracking } from '@/hooks/useTimeTracking';

const MyLearningComponent = () => {
  const timeTracking = useTimeTracking({
    itemId: 'lesson-123',
    requiredMinutes: 30,
    onTimeComplete: () => console.log('Time completed!')
  });

  return (
    <div>
      {/* Time Display */}
      <div className="p-4 bg-blue-50 rounded-lg">
        <p>Time: {formatTime(timeTracking.elapsedSeconds)} / {requiredMinutes} min</p>
        <Progress value={timeTracking.progress} />

        {timeTracking.isActive ? (
          <Button onClick={timeTracking.pause}>Pause</Button>
        ) : (
          <Button onClick={timeTracking.resume}>Resume</Button>
        )}
      </div>

      {/* Completion Button */}
      <Button
        disabled={!timeTracking.isTimeComplete}
        onClick={handleComplete}
      >
        {timeTracking.isTimeComplete ? 'Continue' : 'Complete (Time Required)'}
      </Button>
    </div>
  );
};
```

### 2. Auto-start Logic

```typescript
// Start tracking when component loads
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

### 3. Page Visibility Handling

```typescript
// Auto pause/resume on tab switch
useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.hidden) {
      timeTracking.pause();
    } else if (lesson && isEnrolled) {
      timeTracking.resume();
    }
  };

  document.addEventListener("visibilitychange", handleVisibilityChange);
  return () =>
    document.removeEventListener("visibilitychange", handleVisibilityChange);
}, [timeTracking.isActive, lesson, isEnrolled]);
```

## 📦 Available Components

### TimeTrackingDisplay

Pre-built component với full UI:

```typescript
import { TimeTrackingDisplay } from '@/components/time-tracking/TimeTrackingDisplay';

<TimeTrackingDisplay
  elapsedSeconds={timeTracking.elapsedSeconds}
  requiredMinutes={30}
  progress={timeTracking.progress}
  remainingMinutes={timeTracking.remainingMinutes}
  isTimeComplete={timeTracking.isTimeComplete}
  isActive={timeTracking.isActive}
  onPause={timeTracking.pause}
  onResume={timeTracking.resume}
  variant="lesson" // or "session"
/>
```

## 🎯 Implementation Patterns

### Pattern 1: Lesson Page

- **Required Time Source:** `lesson.estimatedDurationMinutes`
- **Color Scheme:** Blue
- **Auto-start:** On lesson load (if enrolled)

### Pattern 2: Class Page - Lesson Item

- **Required Time Source:** `currentItem.lesson.estimatedDurationMinutes`
- **Color Scheme:** Blue
- **Auto-start:** On item change

### Pattern 3: Class Page - Live Session Item

- **Required Time Source:** `currentItem.classSession.durationMinutes`
- **Color Scheme:** Orange
- **Auto-start:** On item change

## 🔧 Utility Functions

```typescript
import { formatTime, formatTimeMinutes } from "@/hooks/useTimeTracking";

formatTime(3661); // "1:01:01"
formatTime(125); // "2:05"
formatTimeMinutes(125); // "2 phút 5 giây"
```

## ⚠️ Important Notes

1. **Enrollment Check:** Chỉ track time cho enrolled users
2. **Free Preview:** Không track time cho free preview lessons
3. **Persistence:** Time data được lưu trong localStorage
4. **Auto-cleanup:** Data được xóa khi gọi `reset()`
5. **Performance:** Timer chỉ chạy khi page active

## 🐛 Common Gotchas

```typescript
// ❌ Wrong: Using before params is available
const timeTracking = useTimeTracking({
  itemId: `lesson-${params.lessonId}`, // params might be undefined
  requiredMinutes: 30
});

// ✅ Correct: Check params first or use conditional
const timeTracking = useTimeTracking({
  itemId: params.lessonId ? `lesson-${params.lessonId}` : 'temp',
  requiredMinutes: lesson?.estimatedDurationMinutes || 5
});
```

```typescript
// ❌ Wrong: Not handling enrollment
timeTracking.start(); // Always starts

// ✅ Correct: Check enrollment first
if (isEnrolled && !lesson.isFreePreview) {
  timeTracking.start();
}
```

## 📚 See Also

- [Full Documentation](./TIME_TRACKING.md) - Comprehensive guide
- [API Reference](./TIME_TRACKING.md#api-reference) - Complete API docs
- [Testing Guide](./TIME_TRACKING.md#testing-guidelines) - Testing strategies
