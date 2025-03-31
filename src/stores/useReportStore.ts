// src/stores/useReportStore.ts
import { create } from "zustand";

interface ReportState {
  reports: { id: string; title: string; date: string }[];
  addReport: (report: { id: string; title: string; date: string }) => void;
  clearReports: () => void;
}

const useReportStore = create<ReportState>((set) => ({
  reports: [],
  addReport: (report) =>
    set((state) => ({ reports: [...state.reports, report] })),
  clearReports: () => set({ reports: [] }),
}));

export default useReportStore;
