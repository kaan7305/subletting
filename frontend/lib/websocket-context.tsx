'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface WebSocketContextType {
  isConnected: boolean;
  sendMessage: (conversationId: string, message: string) => void;
  setTyping: (conversationId: string, isTyping: boolean) => void;
  typingUsers: Record<string, boolean>;
  onlineUsers: Set<string>;
  onMessageReceived: (callback: (conversationId: string, message: any) => void) => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [messageCallbacks, setMessageCallbacks] = useState<Array<(conversationId: string, message: any) => void>>([]);

  useEffect(() => {
    // Simulate WebSocket connection
    const timer = setTimeout(() => {
      setIsConnected(true);
      // Simulate some users being online
      setOnlineUsers(new Set(['999', '1', '2', '3']));
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const sendMessage = (conversationId: string, message: string) => {
    // In a real app, this would send via WebSocket
    console.log('Sending message:', { conversationId, message });
    
    // Simulate message delivery
    setTimeout(() => {
      const newMessage = {
        id: Date.now(),
        conversationId,
        senderId: 'current-user',
        text: message,
        timestamp: new Date().toISOString(),
        read: false,
      };
      
      // Notify all callbacks
      messageCallbacks.forEach(callback => callback(conversationId, newMessage));
    }, 100);
  };

  const setTyping = (conversationId: string, isTyping: boolean) => {
    setTypingUsers(prev => ({
      ...prev,
      [conversationId]: isTyping,
    }));

    // Auto-clear typing indicator after 3 seconds
    if (isTyping) {
      setTimeout(() => {
        setTypingUsers(prev => ({
          ...prev,
          [conversationId]: false,
        }));
      }, 3000);
    }
  };

  const onMessageReceived = (callback: (conversationId: string, message: any) => void) => {
    setMessageCallbacks(prev => [...prev, callback]);
  };

  return (
    <WebSocketContext.Provider
      value={{
        isConnected,
        sendMessage,
        setTyping,
        typingUsers,
        onlineUsers,
        onMessageReceived,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within WebSocketProvider');
  }
  return context;
}
