// Override Next.js page props types to avoid build type errors
declare namespace NextJs {
  interface PageProps {
    params: Record<string, string>;
    searchParams?: Record<string, string | string[] | undefined>;
  }
}

// Make TypeScript treat this file as a module
export {};
