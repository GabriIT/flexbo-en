
import { useState, useEffect } from 'react';

export type LLMType = 'llama' | 'openai' | 'claude';

interface UseChatBotOptions {
  autoOpenDelay?: number | null;
  defaultLLM?: LLMType;
}

export const useChatBot = ({
  autoOpenDelay = 2000,
  defaultLLM = 'llama'
}: UseChatBotOptions = {}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  useEffect(() => {
    let timeoutId: number | undefined;
    
    // Auto open after delay if autoOpenDelay is provided
    if (autoOpenDelay !== null) {
      timeoutId = window.setTimeout(() => {
        setIsOpen(true);
      }, autoOpenDelay);
    }
    
    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [autoOpenDelay]);
  
  const openChat = () => setIsOpen(true);
  const closeChat = () => setIsOpen(false);
  const toggleChat = () => setIsOpen(prev => !prev);
  
  return {
    isOpen,
    openChat,
    closeChat,
    toggleChat,
    defaultLLM
  };
};
