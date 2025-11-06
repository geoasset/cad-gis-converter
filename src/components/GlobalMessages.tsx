import React from 'react';
import { useMessages } from '../contexts/MessageContext';
import MessageDisplay from './MessageDisplay';

const GlobalMessages: React.FC = () => {
  const { messages, removeMessage } = useMessages();

  if (messages.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm">
      {messages.map((message) => (
        <div
          key={message.id}
          className="animate-slide-in-right"
        >
          <MessageDisplay
            message={message.text}
            type={message.type}
            onDismiss={() => removeMessage(message.id)}
            className="shadow-xl border-2"
          />
        </div>
      ))}
    </div>
  );
};

export default GlobalMessages;

// Ensure this file is treated as a module
export {};