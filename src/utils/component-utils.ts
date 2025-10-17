// utils/component-utils.ts
import React from "react";

/**
 * Utility functions for optimizing component performance
 */

// Check if component should be client-side
export function isClientComponent(component: any): boolean {
  return (
    component.toString().includes("useState") ||
    component.toString().includes("useEffect") ||
    component.toString().includes("onClick") ||
    component.toString().includes("onChange") ||
    component.toString().includes("onSubmit") ||
    component.toString().includes("window") ||
    component.toString().includes("document") ||
    component.toString().includes("localStorage")
  );
}

// Performance measurement utility
export function measureComponentRender<T>(
  componentName: string,
  renderFn: () => T,
): T {
  if (typeof performance !== "undefined") {
    performance.mark(`${componentName}-render-start`);
    const result = renderFn();
    performance.mark(`${componentName}-render-end`);
    performance.measure(
      `${componentName}-render`,
      `${componentName}-render-start`,
      `${componentName}-render-end`,
    );

    const measure = performance.getEntriesByName(`${componentName}-render`)[0];
    if (process.env.NODE_ENV === "development") {
      console.log(
        `🚀 ${componentName} render time: ${measure.duration.toFixed(2)}ms`,
      );
    }

    return result;
  }
  return renderFn();
}

// Chunk size calculator
export function calculateChunkSize(moduleName: string): Promise<number> {
  return import(moduleName)
    .then((module) => {
      const size = JSON.stringify(module).length;
      if (process.env.NODE_ENV === "development") {
        console.log(
          `📦 ${moduleName} chunk size: ${(size / 1024).toFixed(2)} KB`,
        );
      }
      return size;
    })
    .catch(() => 0);
}

// Performance monitoring hook
export function usePerformanceMonitor(componentName: string) {
  React.useEffect(() => {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;

      if (process.env.NODE_ENV === "development") {
        console.log(`⏱️ ${componentName} mount time: ${duration.toFixed(2)}ms`);
      }
    };
  }, [componentName]);
}

// Bundle size monitoring
export async function monitorBundleSize() {
  if (process.env.NODE_ENV === "development") {
    const sizes = await Promise.all([
      calculateChunkSize("react"),
      calculateChunkSize("next"),
      calculateChunkSize("lucide-react"),
      calculateChunkSize("@radix-ui/react-dialog"),
      calculateChunkSize("framer-motion"),
    ]);

    const totalSize = sizes.reduce((sum, size) => sum + size, 0);
    console.log(
      `📊 Total bundle size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`,
    );
  }
}
