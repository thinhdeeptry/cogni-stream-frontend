// Example usage of Google Drive upload with context-aware folder structure
// This file demonstrates how to use the new upload functions
import {
  uploadClassAssignment,
  uploadClassMaterial,
  uploadCourseDocument,
  uploadCourseThumbnail,
  uploadCourseVideo,
  uploadFileToDrive,
  uploadUserAvatar,
  uploadUserDocument,
} from "../actions/courseAction";

// ============================================
// EXAMPLES FOR DIFFERENT CONTEXTS
// ============================================

// Example 1: Course-related uploads
export const courseUploadExamples = {
  // Upload course thumbnail
  uploadThumbnail: async (file: File, courseId: string) => {
    const result = await uploadCourseThumbnail(file, courseId);
    if (result.success) {
      console.log("✅ Thumbnail uploaded to:", result.folderPath);
      console.log("📁 Drive URL:", result.driveUrl);
      // Update course thumbnail URL in database
      // await updateCourse(courseId, { thumbnailUrl: result.driveUrl });
    }
    return result;
  },

  // Upload course video
  uploadVideo: async (file: File, courseId: string) => {
    const result = await uploadCourseVideo(file, courseId);
    if (result.success) {
      console.log("✅ Video uploaded to:", result.folderPath);
      console.log("📁 Drive URL:", result.driveUrl);
      // Update lesson video URL
      // await updateLesson(lessonId, { videoUrl: result.driveUrl });
    }
    return result;
  },

  // Upload course document/material
  uploadDocument: async (file: File, courseId: string) => {
    const result = await uploadCourseDocument(file, courseId);
    if (result.success) {
      console.log("✅ Document uploaded to:", result.folderPath);
      console.log("📁 Drive URL:", result.driveUrl);
    }
    return result;
  },
};

// Example 2: User-related uploads
export const userUploadExamples = {
  // Upload user avatar
  uploadAvatar: async (file: File, userId: string) => {
    const result = await uploadUserAvatar(file, userId);
    if (result.success) {
      console.log("✅ Avatar uploaded to:", result.folderPath);
      console.log("📁 Drive URL:", result.driveUrl);
      // Update user avatar in database
      // await updateUser(userId, { avatarUrl: result.driveUrl });
    }
    return result;
  },

  // Upload user document
  uploadDocument: async (file: File, userId: string) => {
    const result = await uploadUserDocument(file, userId);
    if (result.success) {
      console.log("✅ Document uploaded to:", result.folderPath);
      console.log("📁 Drive URL:", result.driveUrl);
    }
    return result;
  },
};

// Example 3: Class-related uploads
export const classUploadExamples = {
  // Upload class material
  uploadMaterial: async (file: File, classId: string) => {
    const result = await uploadClassMaterial(file, classId);
    if (result.success) {
      console.log("✅ Material uploaded to:", result.folderPath);
      console.log("📁 Drive URL:", result.driveUrl);
    }
    return result;
  },

  // Upload assignment
  uploadAssignment: async (file: File, classId: string) => {
    const result = await uploadClassAssignment(file, classId);
    if (result.success) {
      console.log("✅ Assignment uploaded to:", result.folderPath);
      console.log("📁 Drive URL:", result.driveUrl);
    }
    return result;
  },
};

// Example 4: Generic upload with custom context
export const genericUploadExample = async (
  file: File,
  type: "course" | "user" | "class",
  entityId: string,
  subfolder?: string,
) => {
  const result = await uploadFileToDrive(file, {
    type,
    entityId,
    subfolder,
  });

  if (result.success) {
    console.log("✅ File uploaded successfully!");
    console.log("📁 Folder structure:", result.folderPath);
    console.log("🔗 Drive URL:", result.driveUrl);
    console.log("📋 File ID:", result.fileId);
    console.log("📍 Context:", result.context);
  } else {
    console.error("❌ Upload failed:", result.message);
  }

  return result;
};

// ============================================
// FOLDER STRUCTURE WILL BE CREATED AUTOMATICALLY:
// ============================================
/*
CogniStream-Files/
├── courses/
│   ├── course-123/
│   │   ├── thumbnails/
│   │   │   └── course-thumbnail.jpg
│   │   ├── videos/
│   │   │   └── lesson-video.mp4
│   │   └── documents/
│   │       └── course-material.pdf
│   └── course-456/
│       └── thumbnails/
│           └── another-thumbnail.jpg
├── users/
│   ├── user-789/
│   │   ├── avatars/
│   │   │   └── avatar.jpg
│   │   └── documents/
│   │       └── user-document.pdf
│   └── user-101/
│       └── avatars/
│           └── profile-pic.png
└── classes/
    ├── class-abc/
    │   ├── materials/
    │   │   └── lesson-slide.pptx
    │   └── assignments/
    │       └── homework.pdf
    └── class-def/
        └── materials/
            └── reading-list.docx
*/

// ============================================
// REACT COMPONENT USAGE EXAMPLE
// ============================================
/*
import React from 'react';
import { uploadCourseThumbnail } from './actions/courseAction';

const CourseForm = ({ courseId }) => {
  const handleThumbnailUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const result = await uploadCourseThumbnail(file, courseId);
      if (result.success) {
        console.log('Thumbnail uploaded:', result.driveUrl);
        // Update your course state/database with the new thumbnail URL
      }
    } catch (error) {
      console.error('Upload error:', error);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={handleThumbnailUpload}
      />
    </div>
  );
};
*/
