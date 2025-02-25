import { Loader2 } from "lucide-react";

export function Loading() {
  return (
    <div className="flex items-center justify-center h-screen">
      <Loader2 className="h-4 w-4 animate-spin" />
    </div>
  );
}
