# Time Tracking Examples

## 📝 Use Cases & Examples

### 1. Basic Lesson Time Tracking

```typescript
// /src/pages/lesson/[id].tsx
import { useTimeTracking, formatTime } from '@/hooks/useTimeTracking';

const LessonPage = () => {
  const { lesson, isEnrolled } = useLessonData();

  const timeTracking = useTimeTracking({
    itemId: `lesson-${lesson.id}`,
    requiredMinutes: lesson.estimatedDurationMinutes || 10,
    onTimeComplete: () => {
      toast.success('Bạn đã học đủ thời gian yêu cầu!');
    }
  });

  // Auto-start khi load lesson
  useEffect(() => {
    if (lesson && isEnrolled && !lesson.isFreePreview) {
      timeTracking.start();
    }
    return () => timeTracking.pause();
  }, [lesson, isEnrolled]);

  return (
    <div>
      <LessonContent />

      {/* Time Tracking UI */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3>⏱️ Thời gian học tập</h3>
        <p>Đã học: {formatTime(timeTracking.elapsedSeconds)}</p>
        <p>Yêu cầu: {lesson.estimatedDurationMinutes} phút</p>
        <Progress value={timeTracking.progress} />

        {!timeTracking.isTimeComplete && (
          <p className="text-sm text-blue-600">
            Còn {timeTracking.remainingMinutes} phút để hoàn thành
          </p>
        )}
      </div>

      {/* Completion Button */}
      <Button
        disabled={!timeTracking.isTimeComplete}
        onClick={handleComplete}
        className={`mt-4 ${
          timeTracking.isTimeComplete
            ? 'bg-green-500'
            : 'bg-gray-300 cursor-not-allowed'
        }`}
      >
        {timeTracking.isTimeComplete ? '✅ Hoàn thành bài học' : '⏳ Cần học thêm'}
      </Button>
    </div>
  );
};
```

### 2. Class Syllabus with Multiple Items

```typescript
// /src/pages/class/[id].tsx
const ClassPage = () => {
  const { currentItem, allItems } = useSyllabusData();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Dynamic required time based on item type
  const getRequiredMinutes = () => {
    if (currentItem.itemType === 'LESSON') {
      return currentItem.lesson?.estimatedDurationMinutes || 10;
    } else if (currentItem.itemType === 'LIVE_SESSION') {
      return currentItem.classSession?.durationMinutes || 60;
    }
    return 5; // fallback
  };

  const timeTracking = useTimeTracking({
    itemId: `syllabus-${currentItem.id}`,
    requiredMinutes: getRequiredMinutes(),
    onTimeComplete: () => {
      console.log(`Completed ${currentItem.itemType}: ${currentItem.id}`);
    }
  });

  // Reset timer khi chuyển item
  useEffect(() => {
    if (currentItem) {
      timeTracking.reset();
      timeTracking.start();
    }
  }, [currentItem.id]);

  const handleNext = () => {
    if (timeTracking.isTimeComplete && currentIndex < allItems.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  return (
    <div>
      <SyllabusItemContent item={currentItem} />

      {/* Different UI for different item types */}
      {currentItem.itemType === 'LESSON' && (
        <TimeTrackingDisplay
          {...timeTracking}
          variant="lesson"
          requiredMinutes={getRequiredMinutes()}
        />
      )}

      {currentItem.itemType === 'LIVE_SESSION' && (
        <TimeTrackingDisplay
          {...timeTracking}
          variant="session"
          requiredMinutes={getRequiredMinutes()}
        />
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button onClick={() => setCurrentIndex(prev => prev - 1)}>
          ← Trước
        </Button>

        <Button
          onClick={handleNext}
          disabled={!timeTracking.isTimeComplete}
        >
          {timeTracking.isTimeComplete ? 'Tiếp theo →' : 'Hoàn thành để tiếp tục'}
        </Button>
      </div>
    </div>
  );
};
```

### 3. Advanced Time Tracking with Analytics

```typescript
const AdvancedTimeTracking = () => {
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [totalActiveTime, setTotalActiveTime] = useState(0);

  const timeTracking = useTimeTracking({
    itemId: 'advanced-lesson',
    requiredMinutes: 30,
    onTimeComplete: () => {
      // Analytics event
      analytics.track('lesson_time_completed', {
        lessonId: 'advanced-lesson',
        requiredMinutes: 30,
        actualMinutes: Math.ceil(timeTracking.elapsedSeconds / 60),
        efficiency: timeTracking.elapsedSeconds / (30 * 60),
        sessionDuration: sessionStartTime ?
          (Date.now() - sessionStartTime.getTime()) / 1000 : 0
      });
    }
  });

  // Track session start
  useEffect(() => {
    setSessionStartTime(new Date());
  }, []);

  // Track active time vs total session time
  useEffect(() => {
    if (timeTracking.isActive) {
      const interval = setInterval(() => {
        setTotalActiveTime(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timeTracking.isActive]);

  // Advanced metrics
  const focusRate = sessionStartTime ?
    (totalActiveTime / ((Date.now() - sessionStartTime.getTime()) / 1000)) * 100 : 0;

  return (
    <div>
      <LessonContent />

      {/* Enhanced time tracking */}
      <Card className="mt-6 p-4">
        <h3>📊 Thống kê học tập</h3>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <p className="text-sm text-gray-600">Thời gian học</p>
            <p className="text-xl font-bold">{formatTime(timeTracking.elapsedSeconds)}</p>
          </div>

          <div>
            <p className="text-sm text-gray-600">Tỷ lệ tập trung</p>
            <p className="text-xl font-bold">{Math.round(focusRate)}%</p>
          </div>

          <div>
            <p className="text-sm text-gray-600">Tiến độ</p>
            <Progress value={timeTracking.progress} />
          </div>

          <div>
            <p className="text-sm text-gray-600">Còn lại</p>
            <p className="text-lg">{timeTracking.remainingMinutes} phút</p>
          </div>
        </div>

        {/* Achievement badges */}
        {focusRate > 80 && (
          <Badge className="mt-2 bg-green-100 text-green-800">
            🎯 Tập trung cao
          </Badge>
        )}

        {timeTracking.isTimeComplete && (
          <Badge className="mt-2 bg-blue-100 text-blue-800">
            ✅ Hoàn thành thời gian
          </Badge>
        )}
      </Card>
    </div>
  );
};
```

### 4. Mobile-Responsive Time Tracking

```typescript
const MobileTimeTracking = () => {
  const [isMobile, setIsMobile] = useState(false);

  const timeTracking = useTimeTracking({
    itemId: 'mobile-lesson',
    requiredMinutes: 20
  });

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (isMobile) {
    // Compact mobile UI
    return (
      <div className="fixed bottom-4 left-4 right-4 bg-white shadow-lg rounded-lg p-3 border">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium">
              {formatTime(timeTracking.elapsedSeconds)} / 20 phút
            </p>
            <Progress value={timeTracking.progress} className="mt-1 h-2" />
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={timeTracking.isActive ? timeTracking.pause : timeTracking.resume}
          >
            {timeTracking.isActive ? '⏸️' : '▶️'}
          </Button>
        </div>

        {timeTracking.isTimeComplete && (
          <p className="text-xs text-green-600 mt-1">✅ Đã đủ thời gian</p>
        )}
      </div>
    );
  }

  // Desktop UI
  return (
    <div className="bg-blue-50 p-6 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">⏱️ Thời gian học tập</h3>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <p className="text-2xl font-bold">{formatTime(timeTracking.elapsedSeconds)}</p>
          <p className="text-sm text-gray-600">Đã học</p>
        </div>

        <div className="text-center">
          <p className="text-2xl font-bold">20</p>
          <p className="text-sm text-gray-600">Phút yêu cầu</p>
        </div>

        <div className="text-center">
          <p className="text-2xl font-bold">{timeTracking.remainingMinutes}</p>
          <p className="text-sm text-gray-600">Còn lại</p>
        </div>
      </div>

      <Progress value={timeTracking.progress} className="mb-4" />

      <div className="flex gap-2">
        <Button
          onClick={timeTracking.isActive ? timeTracking.pause : timeTracking.resume}
          variant="outline"
        >
          {timeTracking.isActive ? '⏸️ Tạm dừng' : '▶️ Tiếp tục'}
        </Button>

        <Button onClick={timeTracking.reset} variant="outline">
          🔄 Reset
        </Button>
      </div>
    </div>
  );
};
```

### 5. Time Tracking with Break Intervals

```typescript
const PomodoreTimeTracking = () => {
  const [breakMode, setBreakMode] = useState(false);
  const [pomodoroCount, setPomodoroCount] = useState(0);

  const studyTracking = useTimeTracking({
    itemId: 'pomodoro-study',
    requiredMinutes: 25, // 25 min study session
    onTimeComplete: () => {
      setBreakMode(true);
      setPomodoroCount(prev => prev + 1);
      breakTracking.reset();
      breakTracking.start();
    }
  });

  const breakTracking = useTimeTracking({
    itemId: 'pomodoro-break',
    requiredMinutes: 5, // 5 min break
    onTimeComplete: () => {
      setBreakMode(false);
      studyTracking.reset();
      studyTracking.start();
    }
  });

  const currentTracking = breakMode ? breakTracking : studyTracking;

  return (
    <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg">
      <h2 className="text-2xl font-bold mb-2">
        🍅 Pomodoro Study Session
      </h2>

      <p className="text-lg mb-4">
        {breakMode ? '☕ Break Time' : '📚 Study Time'}
      </p>

      <div className="text-6xl font-mono mb-4">
        {formatTime(currentTracking.elapsedSeconds)}
      </div>

      <Progress
        value={currentTracking.progress}
        className="mb-4 h-3"
      />

      <p className="text-sm text-gray-600 mb-4">
        Pomodoro hoàn thành: {pomodoroCount} 🍅
      </p>

      <div className="flex justify-center gap-2">
        <Button
          onClick={currentTracking.isActive ? currentTracking.pause : currentTracking.resume}
          size="lg"
        >
          {currentTracking.isActive ? '⏸️ Pause' : '▶️ Start'}
        </Button>

        <Button
          onClick={() => {
            studyTracking.reset();
            breakTracking.reset();
            setBreakMode(false);
            setPomodoroCount(0);
          }}
          variant="outline"
          size="lg"
        >
          🔄 Reset Session
        </Button>
      </div>
    </div>
  );
};
```

### 6. Multi-Device Sync (Concept)

```typescript
// Concept for future implementation
const SyncedTimeTracking = () => {
  const [syncStatus, setSyncStatus] = useState<'synced' | 'pending' | 'error'>('synced');

  const timeTracking = useTimeTracking({
    itemId: 'synced-lesson',
    requiredMinutes: 30,
    onTimeComplete: () => {
      // Sync completion status across devices
      syncCompletionStatus();
    }
  });

  // Sync với server mỗi 30 giây
  useEffect(() => {
    const syncInterval = setInterval(async () => {
      try {
        setSyncStatus('pending');
        await syncTimeWithServer({
          itemId: 'synced-lesson',
          elapsedSeconds: timeTracking.elapsedSeconds,
          timestamp: Date.now()
        });
        setSyncStatus('synced');
      } catch (error) {
        setSyncStatus('error');
        console.error('Sync failed:', error);
      }
    }, 30000);

    return () => clearInterval(syncInterval);
  }, [timeTracking.elapsedSeconds]);

  // Load synced time khi mount
  useEffect(() => {
    loadSyncedTime('synced-lesson').then(savedTime => {
      if (savedTime > timeTracking.elapsedSeconds) {
        // Update local time with server time
        timeTracking.reset();
        // Set elapsed seconds to saved time
      }
    });
  }, []);

  return (
    <div>
      <TimeTrackingDisplay {...timeTracking} />

      {/* Sync status indicator */}
      <div className="flex items-center gap-2 mt-2">
        {syncStatus === 'synced' && (
          <span className="text-green-600 text-sm">✅ Đồng bộ</span>
        )}
        {syncStatus === 'pending' && (
          <span className="text-yellow-600 text-sm">🔄 Đang đồng bộ...</span>
        )}
        {syncStatus === 'error' && (
          <span className="text-red-600 text-sm">❌ Lỗi đồng bộ</span>
        )}
      </div>
    </div>
  );
};

// Helper functions (to be implemented)
async function syncTimeWithServer(data: any) {
  // API call to sync time data
}

async function loadSyncedTime(itemId: string) {
  // API call to load synced time
  return 0;
}

async function syncCompletionStatus() {
  // API call to sync completion
}
```

### 7. Custom Hook với Multiple Items

```typescript
// Custom hook for managing multiple time tracking sessions
const useMultipleTimeTracking = (items: Array<{id: string, requiredMinutes: number}>) => {
  const [trackingSessions, setTrackingSessions] = useState<Map<string, any>>(new Map());

  const createSession = useCallback((itemId: string, requiredMinutes: number) => {
    const session = useTimeTracking({
      itemId,
      requiredMinutes,
      onTimeComplete: () => {
        console.log(`Item ${itemId} completed`);
      }
    });

    setTrackingSessions(prev => new Map(prev.set(itemId, session)));
    return session;
  }, []);

  const getSession = useCallback((itemId: string) => {
    return trackingSessions.get(itemId);
  }, [trackingSessions]);

  const getTotalProgress = useCallback(() => {
    const sessions = Array.from(trackingSessions.values());
    const totalRequired = sessions.reduce((sum, session) => sum + session.requiredMinutes, 0);
    const totalElapsed = sessions.reduce((sum, session) => sum + session.elapsedSeconds / 60, 0);

    return totalRequired > 0 ? (totalElapsed / totalRequired) * 100 : 0;
  }, [trackingSessions]);

  return {
    createSession,
    getSession,
    getTotalProgress,
    allSessions: trackingSessions
  };
};

// Usage
const CourseProgressPage = () => {
  const { lessons } = useCourseData();
  const multiTracking = useMultipleTimeTracking(
    lessons.map(l => ({ id: l.id, requiredMinutes: l.estimatedDurationMinutes }))
  );

  return (
    <div>
      <h2>📊 Course Progress Overview</h2>

      <div className="mb-6">
        <p>Overall Progress: {Math.round(multiTracking.getTotalProgress())}%</p>
        <Progress value={multiTracking.getTotalProgress()} />
      </div>

      {lessons.map(lesson => {
        const session = multiTracking.getSession(lesson.id) ||
                      multiTracking.createSession(lesson.id, lesson.estimatedDurationMinutes);

        return (
          <div key={lesson.id} className="mb-4 p-4 border rounded">
            <h3>{lesson.title}</h3>
            <TimeTrackingDisplay {...session} />
          </div>
        );
      })}
    </div>
  );
};
```

## 🎨 Styling Examples

### Custom Progress Bar

```typescript
const CustomProgressBar = ({ value }: { value: number }) => (
  <div className="relative w-full h-4 bg-gray-200 rounded-full overflow-hidden">
    <div
      className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-300 ease-out"
      style={{ width: `${value}%` }}
    />
    <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
      {Math.round(value)}%
    </div>
  </div>
);
```

### Animated Timer Display

```typescript
const AnimatedTimer = ({ seconds }: { seconds: number }) => {
  const [displaySeconds, setDisplaySeconds] = useState(seconds);

  useEffect(() => {
    setDisplaySeconds(seconds);
  }, [seconds]);

  return (
    <div className="font-mono text-4xl font-bold tracking-wider">
      {formatTime(displaySeconds).split('').map((char, index) => (
        <span
          key={index}
          className="inline-block transition-transform duration-200 hover:scale-110"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          {char}
        </span>
      ))}
    </div>
  );
};
```

Những examples này bao gồm các use cases thực tế mà developers có thể gặp phải khi implement time tracking system! 🚀
