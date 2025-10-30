import { useEffect, useRef, useState } from "react";

import { useSession } from "next-auth/react";
import { Socket, io } from "socket.io-client";

interface UseSocketOptions {
  namespace?: string;
  autoConnect?: boolean;
}

export const useSocket = (options: UseSocketOptions = {}) => {
  const { data: session } = useSession();
  const { namespace = "/class-chat", autoConnect = true } = options;
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!session?.accessToken || !autoConnect) return;

    // Create socket connection
    const newSocket = io(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}${namespace}`,
      {
        auth: {
          token: session.accessToken,
        },
        transports: ["websocket"],
      },
    );

    // Connection event handlers
    newSocket.on("connect", () => {
      console.log("Socket connected:", newSocket.id);
      setIsConnected(true);
    });

    newSocket.on("disconnect", () => {
      console.log("Socket disconnected");
      setIsConnected(false);
    });

    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      setIsConnected(false);
    });

    newSocket.on("error", (error) => {
      console.error("Socket error:", error);
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    return () => {
      newSocket.close();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    };
  }, [session?.accessToken, namespace, autoConnect]);

  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    }
  };

  return {
    socket,
    isConnected,
    disconnect,
  };
};
