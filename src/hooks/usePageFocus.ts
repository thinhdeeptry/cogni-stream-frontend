import { useEffect, useState } from "react";

/**
 * Hook to manage page focus state for pausing/resuming time tracking
 */
export const usePageFocus = () => {
  const [isPageFocused, setIsPageFocused] = useState(true);

  useEffect(() => {
    const handleFocus = () => setIsPageFocused(true);
    const handleBlur = () => setIsPageFocused(false);
    const handleVisibilityChange = () => {
      setIsPageFocused(!document.hidden);
    };

    // Listen to focus/blur events
    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);

    // Listen to visibility change (tab switching)
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return isPageFocused;
};
