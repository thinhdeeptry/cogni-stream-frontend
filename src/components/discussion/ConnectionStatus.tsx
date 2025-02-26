import { Loader2, WifiOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ConnectionStatusProps {
  isConnected: boolean;
  connectionError: string | null;
  isReconnecting: boolean;
}

export function ConnectionStatus({
  isConnected,
  connectionError,
  isReconnecting,
}: ConnectionStatusProps) {
  if (isConnected) return null;

  return (
    <Alert
      variant={isReconnecting ? "default" : "destructive"}
      className="mb-4"
    >
      {isReconnecting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <WifiOff className="h-4 w-4" />
      )}
      <AlertDescription className="flex items-center gap-2">
        {connectionError ||
          (isReconnecting
            ? "Reconnecting..."
            : "Disconnected from discussion server")}
        {isReconnecting && <Loader2 className="h-4 w-4 animate-spin" />}
      </AlertDescription>
    </Alert>
  );
}
