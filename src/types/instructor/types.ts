// @/types/instructor/types.ts

export enum RegistrationStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export interface InstructorRegistration {
  id: string;
  status: RegistrationStatus;
  headline?: string;
  bio?: string;
  specialization?: string;
  rejectionReason?: string;
  submittedAt: string; // ISO date string
  reviewedAt?: string; // ISO date string

  qualifications: string[]; // URLs or file paths
  experience_years?: number;
  portfolio_links: string[]; // URLs
  agree_terms: boolean;

  // Quan hệ
  user: {
    id: string;
    name: string;
    email: string;
    // thêm field user khác nếu cần
  };
  userId: string;
  reviewer?: {
    id: string;
    name: string;
    email: string;
  };
  reviewedBy?: string;
}
