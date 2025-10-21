# Performance Optimization Guide - CogniStream Frontend

## 🎯 Mục tiêu

Giảm thời gian build và cải thiện performance từ 40-80s xuống 10-20s và giảm bundle size từ 478kB xuống dưới 200kB.

## 🔍 Vấn đề phát hiện

### 1. Quá nhiều Client Components (50+ components)

- Hầu hết components đều có `"use client"`
- Gây ra hydration overhead lớn
- Không tận dụng được Server Components

### 2. Bundle Size lớn

- Lesson editor: 478 kB (quá lớn)
- Discussion page: 351 kB
- Course lesson: 302 kB
- Admin reports: 287 kB

### 3. Server Actions warnings

- Top-level await trong actions gây warning
- Không hỗ trợ async/await trên target environment

## 🚀 Giải pháp chi tiết

### A. Tối ưu Server/Client Components

#### 1. Chuyển sang Server Components

```tsx
// ❌ Trước (Client Component)
"use client";
export default function UserList() {
  const [users, setUsers] = useState([]);
  // fetch data on client
}

// ✅ Sau (Server Component)
import { getUsers } from '@/actions/userActions';

export default async function UserList() {
  const users = await getUsers();
  return <div>{/* render users */}</div>
}
```

#### 2. Client Components chỉ khi cần thiết

```tsx
// ✅ Chỉ dùng "use client" khi có:
- useState, useEffect, event handlers
- Browser APIs (localStorage, window, etc.)
- Interactive components (forms, buttons with onClick)
```

### B. Dynamic Imports & Code Splitting

#### 1. Lazy load heavy components

```tsx
// components/LazyComponents.tsx
import dynamic from "next/dynamic";

export const LazyBlockNoteEditor = dynamic(
  () =>
    import("@blocknote/react").then((mod) => ({ default: mod.BlockNoteView })),
  {
    ssr: false,
    loading: () => <div>Loading editor...</div>,
  },
);

export const LazyChartJS = dynamic(() => import("react-chartjs-2"), {
  ssr: false,
  loading: () => <div>Loading chart...</div>,
});

export const LazyReactPlayer = dynamic(() => import("react-player"), {
  ssr: false,
  loading: () => <div>Loading player...</div>,
});
```

#### 2. Route-based Code Splitting

```tsx
// app/admin/courses/[courseId]/chapters/[chapterId]/lessons/[lessonId]/edit/page.tsx
import dynamic from "next/dynamic";

const LessonEditor = dynamic(() => import("@/components/lesson/LessonEditor"), {
  ssr: false,
  loading: () => <div className="p-8">Loading lesson editor...</div>,
});

export default function EditLessonPage() {
  return <LessonEditor />;
}
```

### C. Bundle Optimization

#### 1. Next.js Config tối ưu

```js
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  // Tối ưu webpack
  webpack: (config, { dev, isServer }) => {
    // Tree shaking
    config.optimization.usedExports = true;

    // Code splitting
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: "all",
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: "vendors",
            chunks: "all",
          },
          common: {
            name: "common",
            minChunks: 2,
            chunks: "all",
            enforce: true,
          },
        },
      };
    }

    return config;
  },

  // Experimental features
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-icons",
      "framer-motion",
    ],
  },

  // Images optimization
  images: {
    formats: ["image/webp", "image/avif"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },

  // Compression
  compress: true,
  poweredByHeader: false,

  // Build optimization
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
};
```

#### 2. Package.json scripts tối ưu

```json
{
  "scripts": {
    "dev": "next dev --turbo",
    "build": "next build",
    "build:analyze": "ANALYZE=true next build",
    "start": "next start",
    "lint": "next lint --fix",
    "type-check": "tsc --noEmit"
  }
}
```

### D. Sửa Server Actions Warnings

#### 1. Loại bỏ top-level await

```tsx
// ❌ Trước
const API_URL = await getApiUrl();

// ✅ Sau
const getApiUrl = () =>
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
```

#### 2. Async/await trong actions

```tsx
// actions/courseAction.ts
"use server";

import { revalidatePath } from "next/cache";

// actions/courseAction.ts

export async function getCourseById(id: string) {
  try {
    const response = await fetch(`${process.env.API_URL}/courses/${id}`);
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

### E. Component Architecture Tối ưu

#### 1. Tách UI và Logic

```tsx
// components/course/CourseCard.tsx (Server Component)
interface CourseCardProps {
  course: Course;
}

export function CourseCard({ course }: CourseCardProps) {
  return (
    <div className="card">
      <h3>{course.title}</h3>
      <p>{course.description}</p>
      <CourseActions courseId={course.id} />
    </div>
  );
}

// components/course/CourseActions.tsx (Client Component)
("use client");

interface CourseActionsProps {
  courseId: string;
}

export function CourseActions({ courseId }: CourseActionsProps) {
  const handleEnroll = () => {
    // Client-side logic
  };

  return <button onClick={handleEnroll}>Enroll Now</button>;
}
```

#### 2. Memoization cho heavy components

```tsx
"use client";

import { memo } from "react";

const HeavyComponent = memo(function HeavyComponent({ data }) {
  // Heavy computation
  return <div>{/* render */}</div>;
});
```

### F. Monitoring và Phân tích

#### 1. Bundle Analyzer

```bash
npm install --save-dev @next/bundle-analyzer

# Chạy phân tích
npm run build:analyze
```

#### 2. Performance monitoring

```tsx
// utils/performance.ts
export function measurePerformance(name: string, fn: () => void) {
  performance.mark(`${name}-start`);
  fn();
  performance.mark(`${name}-end`);
  performance.measure(name, `${name}-start`, `${name}-end`);

  const measure = performance.getEntriesByName(name)[0];
  console.log(`${name}: ${measure.duration}ms`);
}
```

## 📈 Kết quả mong đợi

### Build Time

- **Hiện tại**: 40-80 giây
- **Mục tiêu**: 10-20 giây
- **Cải thiện**: 60-75%

### Bundle Size

- **Hiện tại**: 478 kB (trang lớn nhất)
- **Mục tiêu**: <200 kB
- **Cải thiện**: 58%+

### First Load JS

- **Hiện tại**: 101 kB shared + 478 kB page
- **Mục tiêu**: 80 kB shared + 150 kB page
- **Cải thiện**: 60%+

## 🎯 Thứ tự ưu tiên thực hiện

1. **Tuần 1**: Sửa Server Actions warnings và tối ưu next.config.js
2. **Tuần 2**: Chuyển đổi components phù hợp sang Server Components
3. **Tuần 3**: Implement Dynamic Imports cho heavy components
4. **Tuần 4**: Bundle optimization và performance monitoring

## 🔧 Tools hỗ trợ

- Next.js Bundle Analyzer
- Chrome DevTools Performance tab
- Lighthouse CI
- Webpack Bundle Analyzer
