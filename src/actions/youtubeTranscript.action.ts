"use server";

import { YoutubeTranscript } from "youtube-transcript";

// Updated interface for the response we'll send
interface TimestampedTranscriptItem {
  text: string;
  timestamp: string;
  offset: number; // Start time in milliseconds
  duration: number;
}

interface TranscriptResponse {
  transcript: string;
  timestampedTranscript: TimestampedTranscriptItem[];
  videoId: string;
  source: "transcript" | "subtitles" | "captions"; // Track the source of content
}

interface ErrorResponse {
  error: string;
  details?: string;
  videoId?: string;
}

export async function getYoutubeTranscript(
  url: string,
): Promise<TranscriptResponse | ErrorResponse> {
  let videoId = "";

  try {
    if (!url) {
      console.error("Missing YouTube URL parameter");
      return {
        error: "Missing YouTube URL parameter",
        videoId: "",
      };
    }

    console.log(`Processing request for URL: ${url}`);

    // Extract the YouTube video ID from the URL
    try {
      // Handle different YouTube URL formats
      if (url.includes("youtube.com/watch")) {
        // Format: https://www.youtube.com/watch?v=VIDEO_ID
        const urlObj = new URL(url);
        videoId = urlObj.searchParams.get("v") || "";
      } else if (url.includes("youtu.be/")) {
        // Format: https://youtu.be/VIDEO_ID
        videoId = url.split("youtu.be/")[1]?.split("?")[0] || "";
      } else if (url.includes("youtube.com/embed/")) {
        // Format: https://www.youtube.com/embed/VIDEO_ID
        videoId = url.split("youtube.com/embed/")[1]?.split("?")[0] || "";
      }

      console.log(`Extracted YouTube video ID: ${videoId}`);

      if (!videoId) {
        console.warn(`Could not extract video ID from URL: ${url}`);
        return {
          error: "Invalid YouTube URL format",
          videoId: "",
        };
      }
    } catch (error) {
      console.error(`Error extracting video ID from URL: ${url}`, error);
      return {
        error: "Invalid URL format",
        videoId: "",
      };
    }

    // Try to fetch transcript/subtitles with multiple language options
    let transcriptData;
    let sourceType: "transcript" | "subtitles" | "captions" = "transcript";
    const languagesToTry = ["vi", "en", "en-US", "en-GB", "auto"]; // Vietnamese first, then English variants, then auto-generated

    // The youtube-transcript library can fetch:
    // 1. Manual transcripts (uploaded by video creator)
    // 2. Auto-generated captions (created by YouTube's AI)
    // 3. Community-contributed subtitles (if available)
    // We try multiple languages to maximize success rate

    for (const lang of languagesToTry) {
      try {
        console.log(
          `Attempting to fetch transcript for video ID: ${videoId} with language: ${lang}`,
        );

        if (lang === "auto") {
          // Try without specifying language (auto-detect)
          transcriptData = await YoutubeTranscript.fetchTranscript(videoId);
          sourceType = "captions";
        } else {
          // Try with specific language
          transcriptData = await YoutubeTranscript.fetchTranscript(videoId, {
            lang: lang,
          });
          sourceType = lang === "vi" ? "subtitles" : "transcript";
        }

        if (transcriptData && transcriptData.length > 0) {
          console.log(
            `Successfully fetched ${sourceType} with ${transcriptData.length} items using language: ${lang}`,
          );
          break; // Found transcript, break out of loop
        }
      } catch (langError) {
        console.log(
          `Failed to fetch ${sourceType} with language ${lang}:`,
          langError,
        );
        // Continue to next language
      }
    }

    // If still no transcript data, try one more time with auto-generated captions
    if (!transcriptData || transcriptData.length === 0) {
      try {
        console.log(
          `Attempting to fetch auto-generated captions for video ID: ${videoId}`,
        );
        // Try to fetch auto-generated captions explicitly
        transcriptData = await YoutubeTranscript.fetchTranscript(videoId, {
          lang: "en",
        });
      } catch (autoError) {
        console.log("Auto-generated captions also failed:", autoError);
      }
    }

    if (!transcriptData || transcriptData.length === 0) {
      console.warn(
        `No transcript/subtitle data available for video ID: ${videoId}`,
      );
      return {
        error: "No transcript or subtitles available",
        details:
          "The video does not have any transcript data or subtitles available in supported languages (Vietnamese, English).",
        videoId,
      };
    }

    console.log(
      `Successfully fetched transcript/subtitles with ${transcriptData.length} items`,
    );

    if (!transcriptData || transcriptData.length === 0) {
      console.warn(
        `No transcript/subtitle data available for video ID: ${videoId}`,
      );
      return {
        error: "No transcript or subtitles available",
        details:
          "The video does not have any transcript data or subtitles available in supported languages (Vietnamese, English).",
        videoId,
      };
    }

    console.log(
      `Successfully fetched transcript/subtitles with ${transcriptData.length} items`,
    );

    // Format the transcript data
    const formattedTranscript = transcriptData
      .map((item: any) => item.text)
      .join(" ");

    const timestampedTranscript: TimestampedTranscriptItem[] =
      transcriptData.map((item: any) => {
        const offsetInSeconds =
          item.offset ||
          item.start ||
          item.startTime ||
          item.time ||
          item.timeMs / 1000 ||
          0;
        const totalMinutes = Math.floor(offsetInSeconds / 60);
        const remainingSeconds = Math.floor(offsetInSeconds % 60);

        let timestamp = `${totalMinutes}:${remainingSeconds.toString().padStart(2, "0")}`;

        if (totalMinutes >= 60) {
          const hours = Math.floor(totalMinutes / 60);
          const minutes = totalMinutes % 60;
          timestamp = `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
        }

        return {
          text: item.text,
          timestamp,
          offset: Math.round(offsetInSeconds * 1000),
          duration: item.duration || 0,
        };
      });

    return {
      transcript: formattedTranscript,
      timestampedTranscript,
      videoId,
      source: sourceType,
    };
  } catch (error) {
    console.error("Unexpected error in youtube-transcript action:", error);
    return {
      error: "Internal server error",
      details:
        error instanceof Error ? error.message : "An unexpected error occurred",
      videoId,
    };
  }
}
