"use client";

import { useEffect, useState } from "react";

import { PopupChatbot } from "@/components/ai/PopupChatbot";

interface UsePopupChatbotOptions {
  systemPrompt?: string;
  referenceText?: string;
  title?: string;
  placeholder?: string;
  buttonClassName?: string;
  cardClassName?: string;
  initialOpen?: boolean;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
}

/**
 * Hook to add a popup chatbot to any page with reference content
 * @param options Configuration options for the popup chatbot
 * @returns A React component that renders the popup chatbot
 */
export function usePopupChatbot(options: UsePopupChatbotOptions = {}) {
  const [mounted, setMounted] = useState(false);

  // Use client-side only rendering to avoid hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  // Return the component
  return () => {
    if (!mounted) return null;

    return (
      <PopupChatbot
        systemPrompt={options.systemPrompt}
        referenceText={options.referenceText}
        title={options.title}
        placeholder={options.placeholder}
        buttonClassName={options.buttonClassName}
        cardClassName={options.cardClassName}
        initialOpen={options.initialOpen}
        position={options.position}
      />
    );
  };
}
