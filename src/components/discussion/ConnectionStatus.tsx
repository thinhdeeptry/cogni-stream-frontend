import { Loader2, Users, WifiOff } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import type { TypingUser } from "./type";

interface ConnectionStatusProps {
  isConnected: boolean;
  connectionError: string | null;
  isReconnecting: boolean;
  threadUsers: TypingUser[];
  currentUserId?: string;
}

export function ConnectionStatus({
  isConnected,
  connectionError,
  isReconnecting,
  threadUsers,
  currentUserId,
}: ConnectionStatusProps) {
  const otherUsers = threadUsers.filter(
    (user) => user.userId !== currentUserId,
  );
  const userCount = otherUsers.length;

  if (!isConnected) {
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
              ? "Reconnecting to discussion server..."
              : "Disconnected from discussion server")}
          {isReconnecting && <Loader2 className="h-4 w-4 animate-spin" />}
        </AlertDescription>
      </Alert>
    );
  }

  if (userCount === 0) return null;

  return (
    <Alert variant="default" className="mb-4 bg-blue-50">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4" />
        <AlertTitle className="text-sm font-normal">
          {userCount === 1
            ? `${otherUsers[0].userName} is viewing this discussion`
            : `${otherUsers[0].userName} and ${userCount - 1} other${userCount > 2 ? "s" : ""} are viewing this discussion`}
        </AlertTitle>
      </div>
    </Alert>
  );
}
