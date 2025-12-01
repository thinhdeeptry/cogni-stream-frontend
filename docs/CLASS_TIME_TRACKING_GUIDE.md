# Time Tracking Implementation Guide for Class Page

## Overview

This guide explains how time tracking has been implemented for the class page (`/course/[courseId]/class/[classId]/page.tsx`) to ensure students spend the required time on lessons before proceeding to the next item.

## Features Implemented

### 1. Time Tracking for Lesson Types

- **Video Lessons**: Requires students to spend the estimated duration watching/studying
- **Blog/Reading Lessons**: Requires students to spend the estimated duration reading
- **Quiz Lessons**: **SKIPPED** - No time tracking, completion based on quiz submission
- **Live Sessions**: **SKIPPED** - Uses attendance system instead of time tracking

### 2. Navigation Control

Students cannot proceed to the next lesson until they have:

- Completed the required time for video/blog lessons
- Submitted the quiz for quiz lessons
- Completed attendance for live sessions

### 3. Time Tracking UI Components

#### TimeTrackingCard

- Shows current progress with a progress bar
- Displays elapsed time vs required time
- Allows manual pause/resume of tracking
- Shows completion status with checkmark

#### Navigation Footer

- "Tiếp theo" button is disabled until time requirements are met
- Shows helpful tooltip indicating remaining time needed
- Different messages for different lesson types

## Implementation Details

### State Management

```tsx
// Track which items have completed their time requirements
const [currentItemTimeTracked, setCurrentItemTimeTracked] = useState<
  Set<string>
>(new Set());

// Track time completion notification to prevent duplicate calls
const [timeCompleteNotified, setTimeCompleteNotified] = useState(false);
```

### Time Tracking Hook Usage

```tsx
const timeTracking = useTimeTracking({
  itemId: currentItem?.id || "",
  requiredMinutes: getCurrentItemRequiredMinutes(),
  onTimeComplete: () => {
    // Mark item as time-completed and save to localStorage
    if (currentItem?.id && !timeCompleteNotified) {
      setTimeCompleteNotified(true);
      setCurrentItemTimeTracked((prev) => new Set(prev).add(currentItem.id));

      // Auto-create syllabus progress when time requirement is met
      if (enrollmentId && !isInstructorOrAdmin) {
        createSyllabusProgress(currentItem.id).catch(console.error);
      }
    }
  },
});
```

### Navigation Logic

```tsx
const isCurrentItemTimeComplete = () => {
  if (!currentItem || isInstructorOrAdmin) return true;

  // Skip time tracking for quiz lessons and live sessions
  if (
    currentItem.itemType === SyllabusItemType.LESSON &&
    currentItem.lesson?.type === LessonType.QUIZ
  ) {
    return true;
  }
  if (currentItem.itemType === SyllabusItemType.LIVE_SESSION) {
    return true; // Live sessions use attendance instead
  }

  // Check if already completed or time tracking completed
  return (
    isItemCompleted(currentItem) ||
    timeTracking.isTimeComplete ||
    currentItemTimeTracked.has(currentItem.id)
  );
};
```

### Disabled Reasons

The navigation footer shows specific messages when the "Tiếp theo" button is disabled:

- Quiz lessons: "Cần hoàn thành quiz để tiếp tục"
- Video/Blog lessons: "Cần học thêm X phút để tiếp tục"
- Live sessions: "Cần hoàn thành điểm danh để tiếp tục"

## Data Persistence

### Local Storage

- Time tracking data is saved to localStorage per class: `time-tracked-${classId}`
- Automatically restored when user returns to the page
- Individual lesson time progress is also saved per lesson via the `useTimeTracking` hook

### Database Integration

- When time requirement is completed, automatically creates syllabus progress via `createSyllabusProgress()`
- This updates the user's learning progress in the backend
- Does not mark lesson as "completed" - that requires explicit lesson completion action

## User Experience Flow

1. **Student enters lesson**: Time tracking starts automatically for video/blog lessons
2. **Time progresses**: UI shows real-time progress with TimeTrackingCard
3. **Page visibility**: Tracking pauses when user switches tabs, resumes when returning
4. **Time complete**: Green checkmark appears, "Tiếp theo" button becomes enabled
5. **Navigation**: Student can now proceed to next lesson

## Instructor/Admin Experience

- **Preview Mode**: All time tracking is bypassed for instructors and admins
- **No Restrictions**: Can navigate freely between lessons without time requirements
- **Time Tracking UI**: Hidden for instructor/admin users

## Testing

### Manual Testing Checklist

1. **Video Lesson Time Tracking**:

   - [ ] Time tracking starts automatically when entering video lesson
   - [ ] Progress bar updates every second
   - [ ] Pause/Resume buttons work correctly
   - [ ] "Tiếp theo" button disabled until time complete
   - [ ] Time persists when switching between lessons

2. **Blog Lesson Time Tracking**:

   - [ ] Same behavior as video lessons
   - [ ] Time requirement matches `estimatedDurationMinutes`

3. **Quiz Lessons**:

   - [ ] No time tracking card shown
   - [ ] Navigation depends on quiz completion, not time

4. **Live Sessions**:

   - [ ] No time tracking card shown
   - [ ] Navigation depends on attendance completion

5. **Page Visibility**:

   - [ ] Time pauses when switching tabs
   - [ ] Time resumes when returning to tab
   - [ ] Progress is maintained across tab switches

6. **Local Storage Persistence**:
   - [ ] Time progress saved and restored on page refresh
   - [ ] Completed time requirements persist across sessions

## Technical Notes

### Performance Considerations

- Time tracking uses efficient localStorage for persistence
- State updates are batched to prevent unnecessary re-renders
- Progress calculations are memoized where possible

### Browser Compatibility

- Uses standard localStorage and visibility API
- Compatible with modern browsers supporting React hooks
- Graceful fallback for localStorage failures

### Future Enhancements

- Add time tracking analytics and reporting
- Implement adaptive time requirements based on reading speed
- Add break reminders for long lessons
- Support for offline time tracking with sync when online

## Troubleshooting

### Common Issues

1. **Time not starting**: Check if user is enrolled and not an instructor
2. **Time not persisting**: Verify localStorage is available and not blocked
3. **Navigation still blocked**: Ensure time completion callback is firing
4. **UI not updating**: Check React key props and state dependencies

### Debug Tools

Enable development logging to see detailed time tracking information:

```tsx
// In useTimeTracking.ts
if (process.env.NODE_ENV === "development") {
  console.log("Time tracking state:", {
    itemId,
    requiredMinutes,
    elapsedSeconds,
    isTimeComplete,
    progress,
  });
}
```
