"use client";

import { useState } from "react";

import { motion } from "framer-motion";
import ReactPlayer from "react-player";

interface VideoPlayerProps {
  videoUrl: string;
  title?: string;
}

export function VideoPlayer({ videoUrl, title }: VideoPlayerProps) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <motion.div
      className="mb-6"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2 }}
    >
      <div className="relative w-full max-w-5xl mx-auto aspect-video bg-black rounded-lg overflow-hidden shadow-lg">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            <span className="ml-3 text-white">Đang tải video...</span>
          </div>
        )}
        <ReactPlayer
          url={videoUrl}
          width="100%"
          height="100%"
          controls
          onReady={() => setIsLoading(false)}
          onError={() => setIsLoading(false)}
          config={{
            youtube: {
              playerVars: {
                showinfo: 1,
                controls: 1,
                rel: 0,
              },
            },
          }}
        />
      </div>
      {title && (
        <p className="text-center text-sm text-gray-600 mt-2">{title}</p>
      )}
    </motion.div>
  );
}
