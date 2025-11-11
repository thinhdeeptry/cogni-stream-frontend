/**
 * Utility functions for handling Google Drive URLs and converting them to displayable image URLs
 */

export interface GoogleDriveUrlInfo {
  fileId: string | null;
  isGoogleDriveUrl: boolean;
  directUrl: string;
  thumbnailUrl: string;
}

/**
 * Extract file ID from various Google Drive URL formats
 */
export const extractGoogleDriveFileId = (url: string): string | null => {
  if (!url || !url.includes("drive.google.com")) {
    return null;
  }

  // Format 1: https://drive.google.com/file/d/{fileId}/view?usp=drivesdk
  const viewMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (viewMatch) {
    return viewMatch[1];
  }

  // Format 2: https://drive.google.com/open?id={fileId}
  const openMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (openMatch) {
    return openMatch[1];
  }

  // Format 3: https://drive.google.com/uc?id={fileId}
  const ucMatch = url.match(/uc\?.*id=([a-zA-Z0-9_-]+)/);
  if (ucMatch) {
    return ucMatch[1];
  }

  return null;
};

/**
 * Check if URL is a Google Drive URL
 */
export const isGoogleDriveUrl = (url: string): boolean => {
  return !!(url && url.includes("drive.google.com"));
};

/**
 * Convert Google Drive URL to direct viewable image URL
 */
export const getGoogleDriveDirectUrl = (fileId: string): string => {
  return `https://drive.google.com/uc?export=view&id=${fileId}`;
};

/**
 * Get Google Drive thumbnail URL (useful as fallback)
 */
export const getGoogleDriveThumbnailUrl = (
  fileId: string,
  size: number = 1280,
): string => {
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w${size}`;
};

/**
 * Main function to get displayable image URL from any URL (Google Drive or regular)
 */
export const getDisplayableImageUrl = (
  url: string | null | undefined,
): string => {
  if (!url) return "";

  const fileId = extractGoogleDriveFileId(url);

  if (fileId) {
    return getGoogleDriveDirectUrl(fileId);
  }

  // Return original URL if not Google Drive
  return url;
};

/**
 * Get fallback thumbnail URL for Google Drive images
 */
export const getFallbackImageUrl = (
  url: string | null | undefined,
  size: number = 1280,
): string => {
  if (!url) return "";

  const fileId = extractGoogleDriveFileId(url);

  if (fileId) {
    return getGoogleDriveThumbnailUrl(fileId, size);
  }

  // Return empty string if not Google Drive (no fallback available)
  return "";
};

/**
 * Comprehensive Google Drive URL information
 */
export const getGoogleDriveUrlInfo = (
  url: string | null | undefined,
): GoogleDriveUrlInfo => {
  const fileId = url ? extractGoogleDriveFileId(url) : null;
  const isGoogleDrive = url ? isGoogleDriveUrl(url) : false;

  return {
    fileId,
    isGoogleDriveUrl: isGoogleDrive,
    directUrl: fileId ? getGoogleDriveDirectUrl(fileId) : url || "",
    thumbnailUrl: fileId ? getGoogleDriveThumbnailUrl(fileId) : "",
  };
};

/**
 * React component helper for Google Drive images with fallback
 */
export const createGoogleDriveImageProps = (url: string | null | undefined) => {
  const urlInfo = getGoogleDriveUrlInfo(url);

  return {
    src: urlInfo.directUrl,
    onError: (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      // Fallback to thumbnail if direct link fails
      if (
        urlInfo.thumbnailUrl &&
        e.currentTarget.src !== urlInfo.thumbnailUrl
      ) {
        e.currentTarget.src = urlInfo.thumbnailUrl;
      }
    },
  };
};

// Common image sizes for Google Drive thumbnails
export const GOOGLE_DRIVE_SIZES = {
  SMALL: 200,
  MEDIUM: 400,
  LARGE: 800,
  EXTRA_LARGE: 1280,
  FULL_HD: 1920,
} as const;

/**
 * Validate if Google Drive URL is accessible
 */
export const validateGoogleDriveUrl = async (url: string): Promise<boolean> => {
  try {
    const fileId = extractGoogleDriveFileId(url);
    if (!fileId) return false;

    // Try to fetch the thumbnail (lighter than full image)
    const thumbnailUrl = getGoogleDriveThumbnailUrl(
      fileId,
      GOOGLE_DRIVE_SIZES.SMALL,
    );
    const response = await fetch(thumbnailUrl, { method: "HEAD" });

    return response.ok;
  } catch (error) {
    console.warn("Error validating Google Drive URL:", error);
    return false;
  }
};
