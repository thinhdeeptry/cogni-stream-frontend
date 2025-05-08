import { uploadFile } from "@/actions/storage.action";

/**
 * Extracts media URLs from TinyMCE content
 * @param content The HTML content from TinyMCE editor
 * @returns Array of media URLs
 */
export function extractMediaFromContent(content: string): string[] {
  const mediaUrls: string[] = [];

  // Create a temporary DOM element to parse the HTML
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = content;

  // Find all img tags
  const images = tempDiv.getElementsByTagName("img");
  for (let i = 0; i < images.length; i++) {
    const src = images[i].getAttribute("src");
    if (src && !src.startsWith("data:image")) {
      mediaUrls.push(src);
    }
  }

  // Find all video tags
  const videos = tempDiv.getElementsByTagName("video");
  for (let i = 0; i < videos.length; i++) {
    const src = videos[i].getAttribute("src");
    if (src) {
      mediaUrls.push(src);
    }
  }

  // Find all audio tags
  const audios = tempDiv.getElementsByTagName("audio");
  for (let i = 0; i < audios.length; i++) {
    const src = audios[i].getAttribute("src");
    if (src) {
      mediaUrls.push(src);
    }
  }

  return mediaUrls;
}

/**
 * Downloads a file from a URL
 * @param url The URL to download from
 * @returns Promise resolving to a File object
 */
async function downloadFile(url: string): Promise<File> {
  const response = await fetch(url);
  const blob = await response.blob();
  const filename = url.split("/").pop() || "file";
  return new File([blob], filename, { type: blob.type });
}

/**
 * Processes media in TinyMCE content by uploading them to storage
 * @param content The HTML content from TinyMCE editor
 * @returns Promise resolving to the updated content with permanent URLs
 */
export async function processMediaInContent(content: string): Promise<string> {
  const mediaUrls = extractMediaFromContent(content);
  let updatedContent = content;

  for (const url of mediaUrls) {
    try {
      // Download the file
      const file = await downloadFile(url);

      // Upload to storage
      const response = await uploadFile(file, "blogs");

      // Replace the temporary URL with the permanent one
      updatedContent = updatedContent.replace(url, response.url);
    } catch (error) {
      console.error(`Failed to process media at ${url}:`, error);
    }
  }

  return updatedContent;
}

/**
 * Uploads a cover image to storage
 * @param file The file to upload
 * @param type The type of cover image (blogs, series, etc.)
 * @returns Promise resolving to the uploaded file URL
 */
export async function uploadCoverImage(
  file: File,
  type: "blogs" | "series",
): Promise<string> {
  try {
    const response = await uploadFile(file, type, "covers");
    return response.url;
  } catch (error) {
    console.error("Failed to upload cover image:", error);
    throw new Error("Failed to upload cover image");
  }
}
