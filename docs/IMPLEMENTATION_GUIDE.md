# Immediate Implementation Guide

## 🚀 Quick Wins (Có thể làm ngay)

### 1. Sử dụng Lazy Components

```tsx
// Thay vì import trực tiếp:
import ReactPlayer from "react-player";

// Sử dụng lazy loading:
import { LazyReactPlayer } from "@/components/LazyComponents";

// Trong component:
<LazyReactPlayer url={videoUrl} />;
```

### 2. Tối ưu Heavy Pages

#### Lesson Editor Page (từ 478kB → <200kB)

```tsx
// app/(sidebar-layout)/(admin)/admin/courses/[courseId]/chapters/[chapterId]/lessons/[lessonId]/edit/page.tsx
import dynamic from "next/dynamic";

const LessonEditor = dynamic(() => import("@/components/lesson/LessonEditor"), {
  ssr: false,
  loading: () => <LessonEditorSkeleton />,
});

export default function EditLessonPage() {
  return <LessonEditor />;
}
```

#### Discussion Page (từ 351kB → <180kB)

```tsx
// app/discussion/page.tsx
import dynamic from "next/dynamic";

const DiscussionBoard = dynamic(
  () => import("@/components/discussion/DiscussionBoard"),
  { ssr: false },
);

const CreatePostModal = dynamic(
  () => import("@/components/discussion/CreatePostModal"),
  { ssr: false },
);
```

### 3. Server Components Migration

#### Before (Client Component):

```tsx
"use client";

import { useEffect, useState } from "react";

export default function CourseList() {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    fetchCourses().then(setCourses);
  }, []);

  return <div>{/* render courses */}</div>;
}
```

#### After (Server Component):

```tsx
import { getCourses } from "@/actions/courseActions";

export default async function CourseList() {
  const courses = await getCourses();

  return (
    <div>
      {courses.map((course) => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  );
}
```

### 4. Bundle Analyzer Setup

```bash
npm install --save-dev @next/bundle-analyzer

# Thêm vào package.json:
"scripts": {
  "analyze": "ANALYZE=true npm run build"
}
```

## 📈 Metrics Tracking

### Before Optimization

- Build time: 40-80 seconds
- Lesson editor: 478 kB
- Discussion: 351 kB
- Course lesson: 302 kB

### Target After Optimization

- Build time: 10-20 seconds (75% improvement)
- Lesson editor: <200 kB (58% improvement)
- Discussion: <180 kB (49% improvement)
- Course lesson: <150 kB (50% improvement)

## 🎯 Priority Implementation Order

### Week 1: Infrastructure

1. ✅ Fix build errors (DONE)
2. ✅ Update next.config.js (DONE)
3. ✅ Create LazyComponents.tsx (DONE)
4. Test build performance

### Week 2: Heavy Pages

1. Optimize lesson editor pages
2. Optimize discussion page
3. Optimize admin reports
4. Measure improvements

### Week 3: Server Components

1. Identify components for server-side rendering
2. Convert static data components
3. Implement proper data fetching patterns

### Week 4: Final Polish

1. Bundle analysis and fine-tuning
2. Performance monitoring setup
3. Documentation updates

## 🔧 Tools for Monitoring

### Build Time Monitoring

```bash
# Terminal timer
time npm run build

# Detailed analysis
npm run analyze
```

### Runtime Performance

```tsx
// Add to layout.tsx
import { monitorBundleSize } from "@/utils/component-utils";

useEffect(() => {
  if (process.env.NODE_ENV === "development") {
    monitorBundleSize();
  }
}, []);
```

### Lighthouse CI

```bash
npm install -g @lhci/cli
lhci autorun
```

## 🚫 Common Mistakes to Avoid

1. ❌ Don't add "use client" to every component
2. ❌ Don't import heavy libraries globally
3. ❌ Don't skip error boundaries for lazy components
4. ❌ Don't forget loading states
5. ❌ Don't ignore bundle analyzer warnings

## ✅ Success Criteria

- [ ] Build time under 20 seconds
- [ ] No page over 200kB First Load JS
- [ ] Lighthouse Performance score >90
- [ ] No critical Server Actions warnings
- [ ] Proper lazy loading for heavy components
