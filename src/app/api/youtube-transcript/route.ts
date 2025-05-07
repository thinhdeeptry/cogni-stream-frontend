import { NextRequest, NextResponse } from "next/server";

import { YoutubeTranscript } from "youtube-transcript";

// Updated interface for the response we'll send
interface TimestampedTranscriptItem {
  text: string;
  timestamp: string;
  offset: number; // Start time in milliseconds
  duration: number;
}

export async function GET(request: NextRequest) {
  try {
    // Get the YouTube URL from the query parameters
    const url = request.nextUrl.searchParams.get("url");

    if (!url) {
      return NextResponse.json(
        { error: "Missing YouTube URL parameter" },
        { status: 400 },
      );
    }

    // Extract the YouTube video ID from the URL
    let videoId = "";
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
      }
    } catch (error) {
      console.error(`Error extracting video ID from URL: ${url}`, error);
    }

    // Fetch the transcript using the youtube-transcript library
    let transcriptData;
    try {
      // First try with the URL
      transcriptData = await YoutubeTranscript.fetchTranscript(url);
      console.log(
        `Successfully fetched transcript with ${transcriptData.length} items`,
      );

      // Check if we got valid data
      if (!transcriptData || transcriptData.length === 0) {
        throw new Error("Empty transcript data returned");
      }
    } catch (error) {
      console.error("Error fetching transcript with URL:", error);

      // If we have a video ID, try again with just the ID
      if (videoId) {
        try {
          console.log(`Trying to fetch transcript with video ID: ${videoId}`);
          transcriptData = await YoutubeTranscript.fetchTranscript(videoId);
          console.log(
            `Successfully fetched transcript with video ID, got ${transcriptData.length} items`,
          );

          // Check if we got valid data
          if (!transcriptData || transcriptData.length === 0) {
            throw new Error("Empty transcript data returned with video ID");
          }
        } catch (videoIdError) {
          console.error(
            "Error fetching transcript with video ID:",
            videoIdError,
          );
          throw videoIdError;
        }
      } else {
        throw error;
      }
    }

    // Log the first few items to understand the structure
    console.log("Transcript data structure:");
    console.log(
      "First item (full):",
      JSON.stringify(transcriptData[0], null, 2),
    );
    console.log(
      "Available properties:",
      Object.keys(transcriptData[0]).join(", "),
    );

    // Log a few more items to see if they have different structures
    if (transcriptData.length > 1) {
      console.log(
        "Second item (full):",
        JSON.stringify(transcriptData[1], null, 2),
      );
    }
    if (transcriptData.length > 2) {
      console.log(
        "Third item (full):",
        JSON.stringify(transcriptData[2], null, 2),
      );
    }

    // Check if we have start property instead of offset
    const firstItem = transcriptData[0] as any;
    if (firstItem.start !== undefined) {
      console.log("Using 'start' property for timestamps (in seconds)");
      console.log(
        "Sample start times:",
        transcriptData.slice(0, 5).map((item: any) => item.start),
      );
    } else if (firstItem.offset !== undefined) {
      console.log("Using 'offset' property for timestamps (in milliseconds)");
      console.log(
        "Sample offset times:",
        transcriptData.slice(0, 5).map((item: any) => item.offset),
      );
    } else {
      console.log(
        "WARNING: Neither 'start' nor 'offset' property found in transcript data",
      );
    }

    // Format the transcript data with timestamps
    const formattedTranscript = transcriptData
      .map((item: any) => item.text)
      .join(" ");

    // Format the transcript data with timestamps for reference
    const timestampedTranscript: TimestampedTranscriptItem[] =
      transcriptData.map((item: any) => {
        // The YouTube transcript API returns different property names in different versions
        // We need to check all possible properties that might contain the timestamp
        let startTimeInSeconds = 0;

        // Log the entire item for debugging
        console.log(`Processing item: ${JSON.stringify(item)}`);

        // Check all possible property names for timestamps
        if (typeof item.offset === "number") {
          // offset is in milliseconds
          startTimeInSeconds = item.offset / 1000;
          console.log(
            `Using offset property: ${item.offset} ms -> ${startTimeInSeconds} s`,
          );
        } else if (typeof item.start === "number") {
          // start is in seconds
          startTimeInSeconds = item.start;
          console.log(`Using start property: ${startTimeInSeconds} s`);
        } else if (typeof item.startTime === "number") {
          // Some versions use startTime
          startTimeInSeconds = item.startTime;
          console.log(`Using startTime property: ${startTimeInSeconds} s`);
        } else if (typeof item.time === "number") {
          // Some versions use time
          startTimeInSeconds = item.time;
          console.log(`Using time property: ${startTimeInSeconds} s`);
        } else if (typeof item.timeMs === "number") {
          // Some versions use timeMs (in milliseconds)
          startTimeInSeconds = item.timeMs / 1000;
          console.log(
            `Using timeMs property: ${item.timeMs} ms -> ${startTimeInSeconds} s`,
          );
        } else {
          // Try to find any property that might be a timestamp
          const numericProps = Object.entries(item)
            .filter(([_, value]) => typeof value === "number")
            .map(([key, value]) => ({ key, value: value as number }));

          console.log(
            `Numeric properties found: ${JSON.stringify(numericProps)}`,
          );

          // Look for properties that might be timestamps (in seconds or milliseconds)
          const possibleTimestampProps = numericProps.filter(
            (prop) =>
              prop.key.toLowerCase().includes("time") ||
              prop.key.toLowerCase().includes("start") ||
              prop.key.toLowerCase().includes("offset"),
          );

          if (possibleTimestampProps.length > 0) {
            // Use the first property that looks like a timestamp
            const timestampProp = possibleTimestampProps[0];
            console.log(
              `Using detected timestamp property: ${timestampProp.key} = ${timestampProp.value}`,
            );

            // If the value is large, assume it's in milliseconds
            const value = timestampProp.value;
            startTimeInSeconds = value > 1000 ? value / 1000 : value;
          } else if (numericProps.length > 0) {
            // If no obvious timestamp property, try the first numeric property
            const firstNumeric = numericProps[0];
            console.log(
              `Falling back to first numeric property: ${firstNumeric.key} = ${firstNumeric.value}`,
            );

            // If the value is large, assume it's in milliseconds
            const value = firstNumeric.value;
            startTimeInSeconds = value > 1000 ? value / 1000 : value;
          } else {
            console.warn(
              `No numeric properties found in item: ${JSON.stringify(item)}`,
            );
          }
        }

        // Convert to minutes and seconds
        const totalSeconds = Math.floor(startTimeInSeconds);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const timestamp = `${minutes}:${seconds.toString().padStart(2, "0")}`;

        // Log the time calculation for debugging
        console.log(
          `Final time calculation: startTime=${startTimeInSeconds}, minutes=${minutes}, seconds=${seconds}, timestamp=${timestamp}`,
        );

        return {
          text: item.text,
          timestamp,
          offset: startTimeInSeconds * 1000, // Store in milliseconds for consistency
          duration: item.duration || 0,
        };
      });

    // Return both the formatted transcript and the timestamped data
    return NextResponse.json({
      transcript: formattedTranscript,
      timestampedTranscript,
    });
  } catch (error) {
    console.error("Error fetching YouTube transcript:", error);
    return NextResponse.json(
      { error: "Failed to fetch transcript" },
      { status: 500 },
    );
  }
}
