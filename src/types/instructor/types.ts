// @/types/instructor/types.ts

export enum RegistrationStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export interface InstructorRegistration {
  id: string;
  status: RegistrationStatus;
  rejectionReason?: string;
  submittedAt: string; // ISO date string
  reviewedAt?: string; // ISO date string

  // 🆕 Các field mới theo schema đã cập nhật
  curriculum_vitae_link?: string; // Link đến lý lịch khoa học (CV template)
  qualifications: string[]; // Mảng file chứng chỉ (dạng URL hoặc path)
  portfolio_links: string[]; // Mảng link portfolio (Github, LinkedIn,...)
  agree_terms: boolean; // Đồng ý điều khoản

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
