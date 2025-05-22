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

    // Fetch the transcript using the youtube-transcript library
    let transcriptData;
    try {
      console.log(`Attempting to fetch transcript for video ID: ${videoId}`);
      transcriptData = await YoutubeTranscript.fetchTranscript(videoId);

      if (!transcriptData || transcriptData.length === 0) {
        console.warn(`No transcript data returned for video ID: ${videoId}`);
        return {
          error: "No transcript available",
          details: "The video does not have any transcript data available.",
          videoId,
        };
      }

      console.log(
        `Successfully fetched transcript with ${transcriptData.length} items`,
      );
    } catch (error) {
      console.error(
        `Error fetching transcript for video ID ${videoId}:`,
        error,
      );

      if (error instanceof Error) {
        if (error.message.includes("Transcript is disabled")) {
          return {
            error: "Transcript is not available for this video",
            details:
              "The video owner has disabled captions/transcripts or they are not available for this video.",
            videoId,
          };
        }

        if (
          error.message.includes("Failed to fetch") ||
          error.message.includes("NetworkError")
        ) {
          return {
            error: "Network error while fetching transcript",
            details:
              "There was an issue connecting to YouTube's servers. This might be related to HTTPS restrictions in production.",
            videoId,
          };
        }
      }

      return {
        error: "Failed to fetch transcript",
        details:
          error instanceof Error ? error.message : "Unknown error occurred",
        videoId,
      };
    }

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
