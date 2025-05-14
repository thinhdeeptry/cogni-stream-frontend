// src/stores/useReportStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

// Định nghĩa cấu trúc dữ liệu cho báo cáo
export interface Report {
  id: string;
  title: string;
  date: string;
  data: any; // Dữ liệu báo cáo (có thể là số học viên, doanh thu, v.v.)
  aiAnalysis?: {
    chartData?: {
      revenue?: {
        labels: string[];
        datasets: {
          label: string;
          data: number[];
          backgroundColor?: string;
          borderColor?: string;
          borderWidth?: number;
        }[];
      };
      students?: {
        labels: string[];
        datasets: {
          label: string;
          data: number[];
          backgroundColor?: string[];
          borderColor?: string[];
          borderWidth?: number;
        }[];
      };
    };
    predictions?: {
      revenue?: { month: string; value: number }[];
      students?: { month: string; value: number }[];
    };
    recommendations?: string[];
    rawAnalysis?: string;
  };
}

interface ReportState {
  reports: Report[];
  addReport: (report: Report) => void;
  updateReportAnalysis: (id: string, aiAnalysis: Report["aiAnalysis"]) => void;
  clearReports: () => void;
  getReportById: (id: string) => Report | undefined;
}

const useReportStore = create<ReportState>()(
  persist(
    (set, get) => ({
      reports: [],
      addReport: (report) =>
        set((state) => ({ reports: [...state.reports, report] })),
      updateReportAnalysis: (id, aiAnalysis) =>
        set((state) => ({
          reports: state.reports.map((report) =>
            report.id === id ? { ...report, aiAnalysis } : report,
          ),
        })),
      clearReports: () => set({ reports: [] }),
      getReportById: (id) => get().reports.find((report) => report.id === id),
    }),
    {
      name: "report-storage", // Tên cho localStorage
    },
  ),
);

export default useReportStore;
