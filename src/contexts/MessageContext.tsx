import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

export interface Message {
  id: string;
  text: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number; // Auto-dismiss duration in ms, 0 for no auto-dismiss
}

interface MessageContextType {
  messages: Message[];
  addMessage: (text: string, type: Message['type'], duration?: number) => string;
  removeMessage: (id: string) => void;
  clearMessages: () => void;
}

const MessageContext = createContext<MessageContextType | undefined>(undefined);

export const useMessages = () => {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error('useMessages must be used within a MessageProvider');
  }
  return context;
};

interface MessageProviderProps {
  children: React.ReactNode;
}

export const MessageProvider: React.FC<MessageProviderProps> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const addMessage = useCallback((text: string, type: Message['type'], duration = 8000): string => {
    const id = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const newMessage: Message = {
      id,
      text,
      type,
      duration
    };

    setMessages(prev => [...prev, newMessage]);

    // Auto-dismiss if duration is set
    if (duration > 0) {
      const timeout = setTimeout(() => {
        removeMessage(id);
      }, duration);
      
      timeoutsRef.current.set(id, timeout);
    }

    return id;
  }, []);

  const removeMessage = useCallback((id: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
    
    // Clear timeout if exists
    const timeout = timeoutsRef.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutsRef.current.delete(id);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    
    // Clear all timeouts
    timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    timeoutsRef.current.clear();
  }, []);

  // Cleanup timeouts on unmount
  React.useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  return (
    <MessageContext.Provider value={{ messages, addMessage, removeMessage, clearMessages }}>
      {children}
    </MessageContext.Provider>
  );
};

// Ensure this file is treated as a module
export {};