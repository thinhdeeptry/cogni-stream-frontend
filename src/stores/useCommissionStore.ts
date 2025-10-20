import { toast } from "@/hooks/use-toast";
import { create } from "zustand";

// Types for Commission
export interface CommissionHeader {
  id: string;
  name: string;
  description?: string | null;
  status: "ACTIVE" | "INACTIVE" | "SCHEDULED" | "EXPIRED";
  startDate?: string | null;
  endDate?: string | null;
  createdAt: string;
  updatedAt: string;
  details?: CommissionDetail[];
  _count?: {
    details: number;
  };
}

export interface CommissionDetail {
  id: string;
  headerId: string;
  courseId?: string | null;
  categoryId?: string | null;
  platformRate: number;
  instructorRate: number;
  priority: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  header?: {
    id: string;
    name: string;
  };
  course?: {
    id: string;
    title: string;
  };
  category?: {
    id: string;
    name: string;
  };
}

export interface CommissionStats {
  summary: {
    totalHeaders: number;
    activeHeaders: number;
    inactiveHeaders: number;
    totalDetails: number;
    activeDetails: number;
    lastUpdated: string;
  };
  headers: {
    active: number;
    inactive: number;
    total: number;
  };
  details: {
    active: number;
    inactive: number;
    total: number;
    courseSpecific: number;
    categorySpecific: number;
    general: number;
  };
  trends?: {
    recentChanges: Array<{
      date: string;
      headers: number;
      details: number;
      total: number;
    }>;
  };
}

export interface RecentCommissionActivity {
  id: string;
  type: "header" | "detail";
  action: "created" | "updated" | "activated" | "deactivated" | "deleted";
  title: string;
  description: string;
  timestamp: string;
  metadata: {
    headerId?: string;
    headerName?: string;
    detailId?: string;
    courseName?: string;
    categoryName?: string;
    platformRate?: number;
    instructorRate?: number;
  };
}

interface CommissionStore {
  // Headers State
  headers: CommissionHeader[];
  headersCount: number;
  headersMeta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };

  // Details State
  details: CommissionDetail[];
  detailsCount: number;
  detailsMeta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };

  // Statistics & Activity
  stats: CommissionStats | null;
  recentActivities: RecentCommissionActivity[];

  // Loading States
  isLoadingHeaders: boolean;
  isLoadingDetails: boolean;
  isLoadingStats: boolean;
  processingIds: Set<string>;

  // Actions for Headers
  fetchHeaders: (params?: {
    search?: string;
    status?: "ACTIVE" | "INACTIVE" | "SCHEDULED" | "EXPIRED";
    page?: number;
    limit?: number;
  }) => Promise<void>;

  createHeader: (data: {
    name: string;
    description?: string;
    startDate?: string;
    endDate?: string;
  }) => Promise<CommissionHeader>;

  updateHeader: (
    id: string,
    data: {
      name?: string;
      description?: string;
      type?: "BASE_COMMISSION" | "SPECIAL_PROMOTION" | "BONUS_COMMISSION";
      status?: "ACTIVE" | "INACTIVE" | "SCHEDULED" | "EXPIRED";
      startDate?: string;
      endDate?: string;
    },
  ) => Promise<CommissionHeader>;

  deleteHeader: (id: string) => Promise<void>;
  activateHeader: (id: string) => Promise<void>;
  deactivateHeader: (id: string) => Promise<void>;

  // Actions for Details
  fetchDetails: (params?: {
    headerId?: string;
    courseId?: string;
    categoryId?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }) => Promise<void>;

  createDetail: (data: {
    headerId: string;
    courseId?: string;
    categoryId?: string;
    platformRate: number;
    instructorRate: number;
    priority?: number;
  }) => Promise<CommissionDetail>;

  updateDetail: (
    id: string,
    data: {
      platformRate?: number;
      instructorRate?: number;
      priority?: number;
      isActive?: boolean;
    },
  ) => Promise<CommissionDetail>;

  deleteDetail: (id: string) => Promise<void>;

  // Statistics & Activity
  fetchStats: () => Promise<void>;
  fetchRecentActivities: () => Promise<void>;

  // Utility
  isProcessing: (id: string) => boolean;
  refreshAll: () => Promise<void>;
}

export const useCommissionStore = create<CommissionStore>((set, get) => ({
  // Initial State
  headers: [],
  headersCount: 0,
  headersMeta: undefined,
  details: [],
  detailsCount: 0,
  detailsMeta: undefined,
  stats: null,
  recentActivities: [],
  isLoadingHeaders: false,
  isLoadingDetails: false,
  isLoadingStats: false,
  processingIds: new Set(),

  // Headers Actions
  fetchHeaders: async (params = {}) => {
    set({ isLoadingHeaders: true });
    try {
      const { getCommissionHeaders } = await import(
        "@/actions/commissionActions"
      );
      const result = await getCommissionHeaders(params);

      set({
        headers: result.data || [],
        headersCount: result.total || 0,
        headersMeta: {
          total: result.total || 0,
          page: result.page || 1,
          limit: result.limit || 10,
          totalPages: result.totalPages || 1,
        },
      });
    } catch (error) {
      console.error("Error fetching headers:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách commission header",
        variant: "destructive",
      });
    } finally {
      set({ isLoadingHeaders: false });
    }
  },

  createHeader: async (data) => {
    try {
      // Import commission actions dynamically to avoid circular dependency
      const { createCommissionHeader } = await import(
        "@/actions/commissionActions"
      );
      const newHeader = await createCommissionHeader(data);

      // Refresh data
      await get().fetchHeaders();
      await get().fetchStats();

      return newHeader;
    } catch (error) {
      console.error("Error creating header:", error);
      throw error;
    }
  },

  updateHeader: async (id, data) => {
    set((state) => ({
      processingIds: new Set([...state.processingIds, id]),
    }));

    try {
      const { updateCommissionHeader } = await import(
        "@/actions/commissionActions"
      );
      const updatedHeader = await updateCommissionHeader(id, data);

      // Update local state
      set((state) => ({
        headers: state.headers.map((h) => (h.id === id ? updatedHeader : h)),
      }));

      return updatedHeader;
    } catch (error) {
      console.error("Error updating header:", error);
      throw error;
    } finally {
      set((state) => {
        const newProcessingIds = new Set(state.processingIds);
        newProcessingIds.delete(id);
        return { processingIds: newProcessingIds };
      });
    }
  },

  deleteHeader: async (id) => {
    set((state) => ({
      processingIds: new Set([...state.processingIds, id]),
    }));

    try {
      const { deleteCommissionHeader } = await import(
        "@/actions/commissionActions"
      );
      await deleteCommissionHeader(id);

      // Remove from local state
      set((state) => ({
        headers: state.headers.filter((h) => h.id !== id),
        headersCount: state.headersCount - 1,
      }));

      await get().fetchStats();
    } catch (error) {
      console.error("Error deleting header:", error);
      throw error;
    } finally {
      set((state) => {
        const newProcessingIds = new Set(state.processingIds);
        newProcessingIds.delete(id);
        return { processingIds: newProcessingIds };
      });
    }
  },

  activateHeader: async (id) => {
    await get().updateHeader(id, { status: "ACTIVE" });
  },

  deactivateHeader: async (id) => {
    await get().updateHeader(id, { status: "INACTIVE" });
  },

  // Details Actions
  fetchDetails: async (params = {}) => {
    set({ isLoadingDetails: true });
    try {
      const { getCommissionDetails } = await import(
        "@/actions/commissionActions"
      );
      const result = await getCommissionDetails(params);

      set({
        details: result.data || [],
        detailsCount: result.total || 0,
        detailsMeta: {
          total: result.total || 0,
          page: result.page || 1,
          limit: result.limit || 10,
          totalPages: result.totalPages || 1,
        },
      });
    } catch (error) {
      console.error("Error fetching details:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách commission detail",
        variant: "destructive",
      });
    } finally {
      set({ isLoadingDetails: false });
    }
  },

  createDetail: async (data) => {
    try {
      const { createCommissionDetail } = await import(
        "@/actions/commissionActions"
      );
      const newDetail = await createCommissionDetail(data);

      // Refresh data
      await get().fetchDetails();
      await get().fetchStats();

      return newDetail;
    } catch (error) {
      console.error("Error creating detail:", error);
      throw error;
    }
  },

  updateDetail: async (id, data) => {
    set((state) => ({
      processingIds: new Set([...state.processingIds, id]),
    }));

    try {
      const { updateCommissionDetail } = await import(
        "@/actions/commissionActions"
      );
      const updatedDetail = await updateCommissionDetail(id, data);

      // Update local state
      set((state) => ({
        details: state.details.map((d) => (d.id === id ? updatedDetail : d)),
      }));

      return updatedDetail;
    } catch (error) {
      console.error("Error updating detail:", error);
      throw error;
    } finally {
      set((state) => {
        const newProcessingIds = new Set(state.processingIds);
        newProcessingIds.delete(id);
        return { processingIds: newProcessingIds };
      });
    }
  },

  deleteDetail: async (id) => {
    set((state) => ({
      processingIds: new Set([...state.processingIds, id]),
    }));

    try {
      const { deleteCommissionDetail } = await import(
        "@/actions/commissionActions"
      );
      await deleteCommissionDetail(id);

      // Remove from local state
      set((state) => ({
        details: state.details.filter((d) => d.id !== id),
        detailsCount: state.detailsCount - 1,
      }));

      await get().fetchStats();
    } catch (error) {
      console.error("Error deleting detail:", error);
      throw error;
    } finally {
      set((state) => {
        const newProcessingIds = new Set(state.processingIds);
        newProcessingIds.delete(id);
        return { processingIds: newProcessingIds };
      });
    }
  },

  // Statistics & Activity
  fetchStats: async () => {
    set({ isLoadingStats: true });
    try {
      // Ensure we have fresh data for stats calculation
      const currentState = get();

      // If headers are not loaded yet, fetch them first
      if (currentState.headers.length === 0 && !currentState.isLoadingHeaders) {
        await get().fetchHeaders();
      }

      // If details are not loaded yet, fetch them first
      if (currentState.details.length === 0 && !currentState.isLoadingDetails) {
        await get().fetchDetails();
      }

      // Get fresh data after potential fetches
      const headers = get().headers;
      const details = get().details;

      const stats: CommissionStats = {
        summary: {
          totalHeaders: headers.length,
          activeHeaders: headers.filter((h) => h.status === "ACTIVE").length,
          inactiveHeaders: headers.filter((h) => h.status === "INACTIVE")
            .length,
          totalDetails: details.length,
          activeDetails: details.filter((d) => d.isActive).length,
          lastUpdated: new Date().toISOString(),
        },
        headers: {
          active: headers.filter((h) => h.status === "ACTIVE").length,
          inactive: headers.filter((h) => h.status === "INACTIVE").length,
          total: headers.length,
        },
        details: {
          active: details.filter((d) => d.isActive).length,
          inactive: details.filter((d) => !d.isActive).length,
          total: details.length,
          courseSpecific: details.filter((d) => d.courseId).length,
          categorySpecific: details.filter((d) => d.categoryId).length,
          general: details.filter((d) => !d.courseId && !d.categoryId).length,
        },
      };

      set({ stats });
    } catch (error) {
      console.error("Error fetching stats:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải thống kê commission",
        variant: "destructive",
      });
    } finally {
      set({ isLoadingStats: false });
    }
  },

  fetchRecentActivities: async () => {
    try {
      // TODO: Implement commission activities API in backend
      // For now, return empty array
      set({ recentActivities: [] });
    } catch (error) {
      console.error("Error fetching activities:", error);
    }
  },

  // Utility
  isProcessing: (id: string) => {
    return get().processingIds.has(id);
  },

  refreshAll: async () => {
    await Promise.all([
      get().fetchHeaders(),
      get().fetchDetails(),
      get().fetchStats(),
      get().fetchRecentActivities(),
    ]);
  },
}));
