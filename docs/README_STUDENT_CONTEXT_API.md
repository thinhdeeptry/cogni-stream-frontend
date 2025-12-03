# Student Lesson Context API - README

## 📚 Tổng Quan

API **Student Lesson Context** được thiết kế để cung cấp thông tin toàn diện về ngữ cảnh học tập của học viên cho một bài học cụ thể. API này đặc biệt hữu ích cho việc làm giàu ngữ cảnh (context enrichment) khi sử dụng Gemini AI để hỗ trợ học viên.

## 🎯 Tính Năng Chính

### 1. Quiz Information (Thông tin Quiz)

- ✅ Điểm cao nhất, số lần làm, trạng thái đạt/chưa đạt
- ✅ Số lần làm còn lại, thời gian có thể làm lại
- ✅ Trạng thái khóa quiz và lý do
- ✅ Cấu hình quiz (thời gian, số câu, điểm đạt)

### 2. Unlock Requirements (Yêu cầu Mở Khóa)

- ✅ Danh sách yêu cầu để mở khóa quiz
- ✅ Trạng thái hoàn thành từng yêu cầu
- ✅ Thông tin bài học/quiz cần hoàn thành

### 3. Progress Tracking (Theo Dõi Tiến Độ)

- ✅ Học viên đã bắt đầu/hoàn thành bài học chưa
- ✅ Tiến độ tổng thể trong khóa học
- ✅ Vị trí bài học trong chương

### 4. Lesson Position (Vị Trí Bài Học)

- ✅ Bài học trước/sau
- ✅ Thông tin chương học
- ✅ Tổng số bài trong chương

### 5. AI Context Suggestions (Gợi Ý cho AI) ⭐

- ✅ Trình độ học viên (BEGINNER/INTERMEDIATE/ADVANCED)
- ✅ Phát hiện khi nào cần động viên
- ✅ Điểm mạnh và điểm yếu của học viên
- ✅ Hành động được đề xuất
- ✅ Tóm tắt ngữ cảnh dạng text

## 📁 Files Created

| File                                    | Description                                      |
| --------------------------------------- | ------------------------------------------------ |
| `dto/student-lesson-context.dto.ts`     | TypeScript DTO definition với Swagger decorators |
| `courses.controller.ts`                 | API endpoint implementation                      |
| `courses.service.ts`                    | Business logic và database queries               |
| `docs/API_STUDENT_LESSON_CONTEXT.md`    | Tài liệu API đầy đủ (English)                    |
| `docs/API_STUDENT_LESSON_CONTEXT_VI.md` | Tài liệu API tóm tắt (Tiếng Việt)                |

## 🚀 Quick Start

### 1. Gọi API

```bash
curl -X GET \
  'http://localhost:3000/api/v1/courses/lessons/{lessonId}/student-context' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

### 2. Sử dụng trong Frontend

```typescript
// Fetch context
const response = await fetch(
  `/api/v1/courses/lessons/${lessonId}/student-context`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  },
);

const context = await response.json();

// Use for AI prompt
const prompt = createGeminiPrompt(context);

// Use for UI
renderLessonPage(context);
```

### 3. Tích Hợp với Gemini AI

```typescript
function createGeminiPrompt(context) {
  return `
    Bạn là trợ lý AI cho khóa học ${context.courseInfo.courseTitle}.
    
    THÔNG TIN HỌC VIÊN:
    - Bài học hiện tại: ${context.lessonTitle}
    - Trình độ: ${context.aiContextSuggestions.learnerLevel}
    - Tiến độ: ${context.courseInfo.totalProgress}%
    
    TÌNH TRẠNG:
    ${context.aiContextSuggestions.contextSummary}
    
    ${
      context.aiContextSuggestions.needsEncouragement
        ? "Người học đang cần hỗ trợ và động viên."
        : "Người học đang tiến bộ tốt."
    }
    
    Hãy trả lời câu hỏi của học viên một cách phù hợp với ngữ cảnh trên.
  `;
}
```

## 📊 Response Structure

```json
{
  "lessonId": "string",
  "lessonTitle": "string",
  "lessonType": "QUIZ | VIDEO | BLOG | MIXED",
  "studentId": "string",
  "enrollmentId": "string",

  "quizInfo": {
    "highestScore": number | null,
    "isPassed": boolean,
    "totalAttempts": number,
    "canRetry": boolean,
    "attemptsRemaining": number | null,
    ...
  },

  "unlockRequirements": [...],
  "isUnlockRequirementFor": [...],
  "progressInfo": {...},
  "lessonPosition": {...},
  "courseInfo": {...},

  "aiContextSuggestions": {
    "learnerLevel": "BEGINNER | INTERMEDIATE | ADVANCED",
    "needsEncouragement": boolean,
    "strugglingAreas": string[],
    "strongAreas": string[],
    "recommendedActions": string[],
    "contextSummary": string
  }
}
```

## 🔑 Key Fields for AI

Các field quan trọng nhất để sử dụng với Gemini AI:

### 1. `aiContextSuggestions.contextSummary`

Tóm tắt ngắn gọn toàn bộ tình trạng học tập của học viên.

**Example**:

```
"Học viên đang gặp khó khăn với quiz (điểm cao nhất: 75/80).
Tổng tiến độ khóa học: 45%. Cần động viên và hỗ trợ học viên vượt qua khó khăn."
```

### 2. `aiContextSuggestions.needsEncouragement`

Boolean để biết học viên có cần động viên không.

**Usage**:

```typescript
if (context.aiContextSuggestions.needsEncouragement) {
  promptStyle = "encouraging and supportive";
} else {
  promptStyle = "congratulatory and motivating";
}
```

### 3. `aiContextSuggestions.learnerLevel`

Trình độ học viên để điều chỉnh độ phức tạp câu trả lời.

**Values**: `BEGINNER` | `INTERMEDIATE` | `ADVANCED`

### 4. `aiContextSuggestions.recommendedActions`

Các hành động AI nên gợi ý cho học viên.

**Example**:

```json
[
  "Học viên có thể làm lại quiz, hãy động viên và gợi ý ôn tập",
  "Học viên mới bắt đầu khóa học, cần hướng dẫn chi tiết"
]
```

## 💡 Use Cases

### Use Case 1: Adaptive Learning Chatbot

```typescript
async function handleChatMessage(lessonId: string, userMessage: string) {
  // 1. Get context
  const context = await fetchStudentContext(lessonId);

  // 2. Create adaptive prompt
  const systemPrompt = createAdaptivePrompt(context);

  // 3. Call Gemini
  const response = await gemini.generateContent({
    contents: [
      { role: "system", parts: [{ text: systemPrompt }] },
      { role: "user", parts: [{ text: userMessage }] },
    ],
  });

  return response.text;
}
```

### Use Case 2: Smart Quiz Retry UI

```typescript
function QuizRetryButton({ lessonId }) {
  const context = useStudentContext(lessonId);

  if (!context?.quizInfo) return null;

  if (context.quizInfo.isPassed) {
    return <SuccessBadge score={context.quizInfo.highestScore} />;
  }

  if (!context.quizInfo.canRetry) {
    if (context.quizInfo.isBlocked) {
      return <UnlockInstructions requirements={context.unlockRequirements} />;
    }
    return <NoAttemptsLeft />;
  }

  return (
    <Button onClick={retryQuiz}>
      Làm lại ({context.quizInfo.attemptsRemaining} lần còn lại)
    </Button>
  );
}
```

### Use Case 3: Progress Dashboard

```typescript
function StudentDashboard() {
  const context = useStudentContext(currentLessonId);

  return (
    <div>
      <ProgressBar value={context.courseInfo.totalProgress} />

      {context.aiContextSuggestions.strongAreas.length > 0 && (
        <StrengthsCard strengths={context.aiContextSuggestions.strongAreas} />
      )}

      {context.aiContextSuggestions.strugglingAreas.length > 0 && (
        <ChallengesCard
          challenges={context.aiContextSuggestions.strugglingAreas}
          recommendations={context.aiContextSuggestions.recommendedActions}
        />
      )}
    </div>
  );
}
```

## 🔐 Security & Authorization

- ✅ **JWT Required**: Phải có token hợp lệ
- ✅ **Role Check**: Chỉ STUDENT role
- ✅ **Enrollment Check**: Học viên phải đã đăng ký khóa học
- ✅ **Data Privacy**: Không expose dữ liệu của học viên khác

## ⚡ Performance

### Caching Strategy

```typescript
// Recommended: Cache for 30-60 seconds
const CACHE_TTL = 30; // seconds

const cacheKey = `lesson-context:${lessonId}:${studentId}`;
const cached = await cache.get(cacheKey);

if (cached) return cached;

const fresh = await fetchContext();
await cache.set(cacheKey, fresh, CACHE_TTL);
return fresh;
```

### Database Optimization

API sử dụng Prisma với optimized includes để giảm số lượng queries:

```typescript
// Single query with nested includes
const lesson = await prisma.lesson.findUnique({
  where: { id: lessonId },
  include: {
    chapter: {
      include: {
        course: { include: { instructor: true } },
        lessons: true,
      },
    },
    questions: true,
    unlockRequirements: true,
    unlockTargets: true,
  },
});
```

## 🧪 Testing

### Test với Postman/Thunder Client

1. **Setup Environment**:

   - `baseUrl`: `http://localhost:3000/api/v1`
   - `token`: Your JWT token
   - `lessonId`: Valid lesson ID

2. **Make Request**:

   ```
   GET {{baseUrl}}/courses/lessons/{{lessonId}}/student-context
   Authorization: Bearer {{token}}
   ```

3. **Test Scenarios**:
   - ✅ Quiz chưa làm → `totalAttempts = 0`
   - ✅ Quiz đã làm nhưng chưa đạt → `isPassed = false`
   - ✅ Quiz đã đạt → `isPassed = true`
   - ✅ Quiz bị khóa → `isBlocked = true`
   - ✅ Có unlock requirements → `unlockRequirements.length > 0`
   - ❌ Không có enrollment → `404 Not Found`

## 📖 Documentation

Xem thêm tài liệu chi tiết:

- 📘 **English**: [`docs/API_STUDENT_LESSON_CONTEXT.md`](./API_STUDENT_LESSON_CONTEXT.md)

  - Detailed API specification
  - Complete response examples
  - Integration guides
  - Advanced use cases

- 📗 **Tiếng Việt**: [`docs/API_STUDENT_LESSON_CONTEXT_VI.md`](./API_STUDENT_LESSON_CONTEXT_VI.md)
  - Hướng dẫn sử dụng
  - Ví dụ thực tế
  - FAQs
  - Quick start

## 🎨 Frontend Integration

### React Hook Example

```typescript
function useStudentContext(lessonId: string) {
  const [context, setContext] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(
          `/api/v1/courses/lessons/${lessonId}/student-context`,
          {
            headers: {
              Authorization: `Bearer ${getToken()}`,
            },
          },
        );

        if (!response.ok) throw new Error("Failed to fetch");

        const data = await response.json();
        setContext(data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    if (lessonId) fetchData();
  }, [lessonId]);

  return { context, loading, error };
}
```

### Vue Composable Example

```typescript
export function useStudentContext(lessonId: Ref<string>) {
  const context = ref(null);
  const loading = ref(true);
  const error = ref(null);

  watchEffect(async () => {
    if (!lessonId.value) return;

    loading.value = true;
    try {
      const response = await fetch(
        `/api/v1/courses/lessons/${lessonId.value}/student-context`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        },
      );

      context.value = await response.json();
    } catch (err) {
      error.value = err;
    } finally {
      loading.value = false;
    }
  });

  return { context, loading, error };
}
```

## 🔄 API Versioning

Current version: **v1.0.0**

Future enhancements planned:

- Real-time updates via WebSocket
- ML-based learning path predictions
- Collaborative learning suggestions
- Analytics integration

## 📞 Support

Nếu gặp vấn đề hoặc có câu hỏi:

1. Check documentation first
2. Review test examples
3. Contact development team

## 🌟 Best Practices

### ✅ DO:

- Cache response for 30-60 seconds
- Use `aiContextSuggestions.contextSummary` cho AI prompts
- Check `needsEncouragement` để điều chỉnh tone
- Handle error cases appropriately

### ❌ DON'T:

- Don't call API on every render
- Don't ignore authorization errors
- Don't expose sensitive student data
- Don't skip error handling

## 📝 Changelog

| Version | Date       | Changes         |
| ------- | ---------- | --------------- |
| 1.0.0   | 2025-12-02 | Initial release |

---

## 🎓 Summary

API **Student Lesson Context** là một công cụ mạnh mẽ để:

1. ✨ **Làm giàu ngữ cảnh cho AI** - Cung cấp thông tin đầy đủ cho Gemini AI
2. 🎯 **Cá nhân hóa trải nghiệm** - Điều chỉnh nội dung phù hợp với từng học viên
3. 📊 **Theo dõi tiến độ** - Hiểu rõ học viên đang ở đâu trong hành trình học
4. 💪 **Động viên học viên** - Phát hiện và hỗ trợ khi gặp khó khăn

Hãy sử dụng API này để tạo ra trải nghiệm học tập thông minh và cá nhân hóa cho học viên! 🚀

---

**Made with ❤️ for better learning experiences**
