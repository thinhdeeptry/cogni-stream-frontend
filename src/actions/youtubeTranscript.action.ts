"use server";

// Import thư viện InnerTube (mạnh mẽ hơn youtube-transcript)
import { Innertube, UniversalCache, Utils } from "youtubei.js";

// --- Interfaces giữ nguyên như cũ ---
interface TimestampedTranscriptItem {
  text: string;
  timestamp: string;
  offset: number;
  duration: number;
}

interface TranscriptResponse {
  transcript: string;
  timestampedTranscript: TimestampedTranscriptItem[];
  videoId: string;
  source: "transcript" | "subtitles" | "captions";
}

interface ErrorResponse {
  error: string;
  details?: string;
  videoId?: string;
}

// Khởi tạo instance của Youtube Client (Singleton pattern để tránh tạo lại nhiều lần)
let youtubeClient: Innertube | null = null;

async function getYoutubeClient() {
  if (!youtubeClient) {
    youtubeClient = await Innertube.create({
      cache: new UniversalCache(false),
      generate_session_locally: true, // Giúp tránh bị chặn IP tốt hơn
    });
  }
  return youtubeClient;
}

export async function getYoutubeTranscript(
  url: string,
): Promise<TranscriptResponse | ErrorResponse> {
  let videoId = "";

  try {
    if (!url) {
      return { error: "Missing YouTube URL parameter" };
    }

    // --- 1. Extract ID (Giữ nguyên logic của bạn hoặc dùng Utils của thư viện) ---
    // Cách extract ID của bạn đã tốt, nhưng để chắc chắn mình clean lại 1 chút
    try {
      if (url.includes("youtu.be")) {
        videoId = url.split("youtu.be/")[1]?.split("?")[0] || "";
      } else if (url.includes("v=")) {
        videoId = new URLSearchParams(url.split("?")[1]).get("v") || "";
      } else if (url.includes("embed/")) {
        videoId = url.split("embed/")[1]?.split("?")[0] || "";
      }

      // Fallback nếu logic trên trượt
      if (!videoId && url.length === 11) videoId = url;
    } catch (e) {
      console.error("Error parsing URL", e);
    }

    if (!videoId) {
      return { error: "Invalid YouTube URL format", videoId: "" };
    }

    console.log(`Fetching transcript for Video ID: ${videoId}`);

    // --- 2. Gọi Youtube API qua InnerTube ---
    const youtube = await getYoutubeClient();

    // Lấy thông tin video
    const info = await youtube.getInfo(videoId);

    // Lấy dữ liệu transcript
    // getTranscript() của thư viện này tự động xử lý việc tìm caption
    const transcriptData = await info.getTranscript();

    if (
      !transcriptData ||
      transcriptData.transcript.content?.body?.initial_segments.length === 0
    ) {
      return {
        error: "No transcript available",
        details: "Video does not have captions/subtitles.",
        videoId,
      };
    }

    // --- 3. Xử lý dữ liệu trả về ---
    // Thư viện trả về format hơi khác, cần map lại
    const rawSegments =
      transcriptData.transcript.content?.body?.initial_segments || [];

    const timestampedTranscript: TimestampedTranscriptItem[] = rawSegments.map(
      (segment: any) => {
        const startMs = Number(segment.start_ms || 0);
        const endMs = Number(segment.end_ms || 0);

        // Format timestamp HH:MM:SS
        const totalSeconds = Math.floor(startMs / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        const timestamp =
          hours > 0
            ? `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
            : `${minutes}:${seconds.toString().padStart(2, "0")}`;

        // Gom text từ các "runs" (Youtube chia nhỏ text)
        const text =
          segment.snippet?.text ||
          segment.runs?.map((r: any) => r.text).join("") ||
          "";

        return {
          text: text.trim(),
          timestamp: timestamp,
          offset: startMs,
          duration: endMs - startMs,
        };
      },
    );

    // Lọc bỏ các dòng trống
    const validItems = timestampedTranscript.filter(
      (item) => item.text.length > 0,
    );

    const fullText = validItems.map((item) => item.text).join(" ");

    // Xác định ngôn ngữ (Optional detection)
    // Mặc định thư viện này sẽ lấy ngôn ngữ của hệ thống hoặc ưu tiên tiếng Anh/Việt tùy config,
    // nhưng nó trả về cái tốt nhất có thể.

    return {
      transcript: fullText,
      timestampedTranscript: validItems,
      videoId,
      source: "captions", // InnerTube thường lấy captions chuẩn
    };
  } catch (error: any) {
    console.error("Error fetching transcript:", error);

    // Xử lý lỗi cụ thể
    if (error.message?.includes("Video unavailable")) {
      return { error: "Video is unavailable or private", videoId };
    }
    if (error.message?.includes("No transcript")) {
      return { error: "No transcript found for this video", videoId };
    }

    return {
      error: "Internal server error",
      details: error.message,
      videoId,
    };
  }
}
