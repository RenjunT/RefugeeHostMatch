import { useEffect, useRef } from "react";

interface UseWebSocketOptions {
  onMessage?: (data: any) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
}

export function useWebSocket(path: string, options: UseWebSocketOptions = {}) {
  const socketRef = useRef<WebSocket | null>(null);
  const { onMessage, onOpen, onClose, onError } = options;

  useEffect(() => {
    // Determine the protocol based on current location
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}${path}`;

    // Create WebSocket connection
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = (event) => {
      console.log('WebSocket connected');
      onOpen?.();
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage?.(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    socket.onclose = (event) => {
      console.log('WebSocket disconnected');
      onClose?.(event);
    };

    socket.onerror = (event) => {
      console.error('WebSocket error:', event);
      onError?.(event);
    };

    // Cleanup on unmount
    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [path, onMessage, onOpen, onClose, onError]);

  // Function to send messages
  const sendMessage = (data: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket is not connected');
    }
  };

  return {
    sendMessage,
    socket: socketRef.current,
    isConnected: socketRef.current?.readyState === WebSocket.OPEN
  };
}
