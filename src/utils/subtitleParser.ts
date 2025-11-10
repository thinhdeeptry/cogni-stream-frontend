/**
 * Utility functions for parsing and processing subtitles from various sources
 */

export interface SubtitleItem {
  text: string;
  timestamp: string;
  offset: number; // Start time in milliseconds
  duration: number;
}

/**
 * Parse VTT (WebVTT) subtitle format
 */
export function parseVTT(vttContent: string): SubtitleItem[] {
  const lines = vttContent.split("\n");
  const subtitles: SubtitleItem[] = [];
  let currentItem: Partial<SubtitleItem> = {};
  let isTimeline = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip WEBVTT header and empty lines
    if (line === "WEBVTT" || line === "") {
      continue;
    }

    // Check if line contains timestamp (format: 00:00:00.000 --> 00:00:05.000)
    const timeMatch = line.match(
      /(\d{2}:\d{2}:\d{2}\.\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}\.\d{3})/,
    );

    if (timeMatch) {
      isTimeline = true;
      const startTime = parseTimeToSeconds(timeMatch[1]);
      const endTime = parseTimeToSeconds(timeMatch[2]);

      currentItem = {
        offset: Math.round(startTime * 1000),
        duration: Math.round((endTime - startTime) * 1000),
        timestamp: formatSecondsToTimestamp(startTime),
        text: "",
      };
    } else if (isTimeline && line && !line.includes("-->")) {
      // This is subtitle text
      if (currentItem.text) {
        currentItem.text += " " + line;
      } else {
        currentItem.text = line;
      }
    } else if (line === "" && currentItem.text) {
      // End of current subtitle item
      subtitles.push(currentItem as SubtitleItem);
      currentItem = {};
      isTimeline = false;
    }
  }

  // Add last item if exists
  if (currentItem.text) {
    subtitles.push(currentItem as SubtitleItem);
  }

  return subtitles;
}

/**
 * Parse SRT subtitle format
 */
export function parseSRT(srtContent: string): SubtitleItem[] {
  const blocks = srtContent.trim().split("\n\n");
  const subtitles: SubtitleItem[] = [];

  for (const block of blocks) {
    const lines = block.split("\n");
    if (lines.length < 3) continue;

    // Skip sequence number (first line)
    const timeLine = lines[1];
    const textLines = lines.slice(2);

    // Parse timestamp (format: 00:00:00,000 --> 00:00:05,000)
    const timeMatch = timeLine.match(
      /(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})/,
    );

    if (timeMatch) {
      const startTime = parseTimeToSeconds(timeMatch[1].replace(",", "."));
      const endTime = parseTimeToSeconds(timeMatch[2].replace(",", "."));

      subtitles.push({
        text: textLines.join(" ").trim(),
        timestamp: formatSecondsToTimestamp(startTime),
        offset: Math.round(startTime * 1000),
        duration: Math.round((endTime - startTime) * 1000),
      });
    }
  }

  return subtitles;
}

/**
 * Convert time string to seconds
 * Supports formats: HH:MM:SS.mmm or HH:MM:SS,mmm
 */
function parseTimeToSeconds(timeStr: string): number {
  const parts = timeStr.split(":");
  if (parts.length !== 3) return 0;

  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  const secondsAndMs = parts[2].split(/[.,]/);
  const seconds = parseInt(secondsAndMs[0], 10);
  const milliseconds = secondsAndMs[1]
    ? parseInt(secondsAndMs[1].padEnd(3, "0"), 10)
    : 0;

  return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
}

/**
 * Format seconds to timestamp string (MM:SS or HH:MM:SS)
 */
function formatSecondsToTimestamp(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  } else {
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }
}

/**
 * Attempt to fetch subtitles from YouTube's caption endpoint
 * This is a fallback method when transcript API fails
 */
export async function fetchYouTubeSubtitles(
  videoId: string,
): Promise<SubtitleItem[] | null> {
  try {
    // Note: This approach has limitations due to CORS policies
    // You might need to implement this on the server side
    console.log(`Attempting to fetch subtitles for video ${videoId}`);

    // This is a placeholder for server-side implementation
    // In a real scenario, you would:
    // 1. Use YouTube Data API to get available caption tracks
    // 2. Download the caption file (VTT or SRT format)
    // 3. Parse it using the functions above

    return null;
  } catch (error) {
    console.error("Failed to fetch YouTube subtitles:", error);
    return null;
  }
}

/**
 * Extract video ID from YouTube URL
 */
export function extractVideoId(url: string): string | null {
  try {
    if (url.includes("youtube.com/watch")) {
      const urlObj = new URL(url);
      return urlObj.searchParams.get("v");
    } else if (url.includes("youtu.be/")) {
      return url.split("youtu.be/")[1]?.split("?")[0] || null;
    } else if (url.includes("youtube.com/embed/")) {
      return url.split("youtube.com/embed/")[1]?.split("?")[0] || null;
    }
  } catch (error) {
    console.error("Error extracting video ID:", error);
  }
  return null;
}
