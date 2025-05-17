import { AxiosFactory } from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

interface UserData {
  id: string;
  name: string;
  email: string;
  image?: string;
  role?: string;
  bio?: string;
}

export function useOtherUser(userId: string | undefined) {
  const {
    data: otherUserData,
    isLoading,
    error,
  } = useQuery<UserData>({
    queryKey: ["users", userId],
    queryFn: async () => {
      if (!userId) throw new Error("User ID is required");
      try {
        const data = await AxiosFactory.getUserInfo(userId);
        return data;
      } catch (error) {
        toast.error("Failed to fetch user information");
        throw error;
      }
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  return {
    otherUserData,
    isLoading,
    error,
  };
}
