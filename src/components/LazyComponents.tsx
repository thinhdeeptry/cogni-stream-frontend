// components/LazyComponents.tsx
import dynamic from "next/dynamic";

// Heavy components lazy loading
export const LazyReactPlayer = dynamic(() => import("react-player"), {
  ssr: false,
  loading: () => (
    <div className="aspect-video bg-gray-100 flex items-center justify-center rounded-lg">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
        <span>Loading video player...</span>
      </div>
    </div>
  ),
});

export const LazyTinyMCE = dynamic(
  () =>
    import("@tinymce/tinymce-react").then((mod) => ({ default: mod.Editor })),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-64 bg-gray-100 flex items-center justify-center rounded-lg border">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <span>Loading rich text editor...</span>
        </div>
      </div>
    ),
  },
);

// Data visualization components
export const LazyCalendar = dynamic(
  () => import("react-big-calendar").then((mod) => ({ default: mod.Calendar })),
  {
    ssr: false,
    loading: () => (
      <div className="h-96 bg-gray-100 flex items-center justify-center rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <span>Loading calendar...</span>
        </div>
      </div>
    ),
  },
);
