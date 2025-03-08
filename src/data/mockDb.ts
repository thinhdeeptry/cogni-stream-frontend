enum EnrollmentStatus {
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  PENDING = "PENDING",
}

export const mockUsers = [
  {
    id: "user5",
    name: "Kien Tran",
    email: "john@example.com",
    password: "123456789",
    phone: "0325421880",
    address: "123 Main St",
    image:
      "https://res.cloudinary.com/dxxsudprj/image/upload/v1733839978/Anime_Characters_cnkjji.jpg",
    role: "ADMIN",
    accountType: "LOCAL",
    isActive: true,
  },
  {
    id: "user1",
    name: "Join",
    email: "john@example.com",
    password: "123456789",
    phone: "0325421880",
    address: "123 Main St",
    image:
      "https://res.cloudinary.com/dxxsudprj/image/upload/v1733839978/Anime_Characters_cnkjji.jpg",
    role: "USER",
    accountType: "LOCAL",
    isActive: true,
  },
];

export const mockEnrollments = [
  {
    id: "enrollment1",
    userId: "user5",
    courseId: "250c6539-e7b3-4d79-af09-debab6c0d75b",
    courseName: "Phát triển tư duy phản biện",
    userName: "Kien Tran",
    status: EnrollmentStatus.ACTIVE,
    isFree: false,
    paymentId: "payment1",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    completedAt: null,
  },
  {
    id: "enrollment2",
    userId: "user5",
    courseId: "7d530f37-8a33-42d9-ada7-81476896af2b",
    courseName: "Thiết kế UI/UX",
    userName: "Kien Tran",
    status: EnrollmentStatus.ACTIVE,
    isFree: false,
    paymentId: "payment2",
    createdAt: new Date("2024-02-01"),
    updatedAt: new Date("2024-02-01"),
    completedAt: null,
  },
];

export const mockUserProgress = [
  {
    id: "progress1",
    enrollmentId: "enrollment1",
    lessonId: "o5p6q7r8-s9t0-41u2-v3w4-x5y6z7a8b9c0",
    isCompleted: true,
    progress: 100,
    updatedAt: new Date("2024-01-05"),
  },
  {
    id: "progress2",
    enrollmentId: "enrollment2",
    lessonId: "o5p6q7r8-s9t0-41u2-v3w4-x5y6z7a8b9c0",
    isCompleted: false,
    progress: 60,
    updatedAt: new Date("2024-01-10"),
  },
  {
    id: "progress3",
    enrollmentId: "enrollment2",
    lessonId: "or8s9t0u1-v2w3-44x5-y6z7-a8b9c0d1e2f3",
    isCompleted: false,
    progress: 30,
    updatedAt: new Date("2024-01-10"),
  },
];

export const mockCertificates = [
  {
    id: "cert1",
    enrollmentId: "enrollment1",
    certificateUrl: "https://example.com/certificates/cert1.pdf",
    issuedAt: new Date("2024-02-15"),
    updatedAt: new Date("2024-02-15"),
  },
];

// Helper functions to simulate database queries
export const mockDb = {
  getUserEnrollments: (userId: string) => {
    return mockEnrollments.filter((enrollment) => enrollment.userId === userId);
  },

  getUserProgress: (enrollmentId: string) => {
    return mockUserProgress.filter(
      (progress) => progress.enrollmentId === enrollmentId,
    );
  },

  getCertificate: (enrollmentId: string) => {
    return mockCertificates.find((cert) => cert.enrollmentId === enrollmentId);
  },

  getUserById: (userId: string) => {
    return mockUsers.find((user) => user.id === userId);
  },
};
