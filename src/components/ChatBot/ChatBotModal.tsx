import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, X, Send, Bot } from 'lucide-react';

interface Message {
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

// const THREADS_BASE = process.env.NEXT_PUBLIC_THREADS_BASE_URL || 'http://localhost:8000/api';
// ✅ use the Vite / import.meta.env API
const THREADS_BASE = import.meta.env.VITE_THREADS_BASE_URL || 'http://localhost:8000/api';




const ChatBotModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const toggleOpen = () => {
    setIsOpen(open => !open);
    // Clear state when closed, if you like:
    // if (isOpen) {
    //   setMessages([]);
    //   setInputValue('');
    //   setIsTyping(false);
    // }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;


    // console.log("[UI] about to POST new thread:", userMsg.content);
    // const createRes = await fetch(`${THREADS_BASE}/thread`, { … });
    // console.log("[UI] thread creation response:", createRes.status);
    // const { id: threadId } = await createRes.json();
    // console.log("[UI] got threadId:", threadId);
    







    // 1) show user message immediately
    const userMsg: Message = {
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };
    setMessages(m => [...m, userMsg]);
    setInputValue('');
    setIsTyping(true);

    try {
      // 2) create a new thread
      const createRes = await fetch(`${THREADS_BASE}/thread`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: userMsg.content })
      });
      if (!createRes.ok) throw new Error(`Create thread failed (${createRes.status})`);
      const { id: threadId } = await createRes.json() as { id: number };

      // 3) poll until bot reply appears
      let botMsg: Message | null = null;
      while (!botMsg) {
        // wait between polls
        await new Promise(res => setTimeout(res, 2000));

        const msgsRes = await fetch(
          `${THREADS_BASE}/thread/${threadId}/prompt/messages`
        );
        if (!msgsRes.ok) continue; // try again

        const data = await msgsRes.json() as { messages: { type: string; content: string }[] };
        const found = data.messages.find(m => m.type === 'bot');
        if (found) {
          botMsg = {
            type: 'bot',
            content: found.content,
            timestamp: new Date()
          };
        }
      }

      // 4) append bot message
      setMessages(m => [...m, botMsg!]);

    } catch (err) {
      console.error('Chat error:', err);
      // show fallback error reply
      setMessages(m => [
        ...m,
        {
          type: 'bot',
          content: 'Sorry, something went wrong. Please try again later.',
          timestamp: new Date()
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed bottom-6 right-6 w-80 max-w-full bg-white rounded-xl shadow-lg flex flex-col overflow-hidden"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between bg-primary px-4 py-2 text-white">
              <span className="font-semibold">Chat with Bot</span>
              <button onClick={toggleOpen}>
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] px-3 py-2 rounded-lg ${
                      msg.type === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-900 flex items-center space-x-1'
                    }`}
                  >
                    {msg.type === 'bot' && <Bot className="h-4 w-4 text-gray-500" />}
                    <span>{msg.content}</span>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="text-gray-500 italic text-sm">
                  Bot is typing...
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-3 border-t flex items-center space-x-2">
              <Textarea
                className="flex-1 resize-none h-12"
                placeholder="Type a message…"
                value={inputValue}
                onChange={e => setInputValue(e.currentTarget.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <Button
                disabled={!inputValue.trim() || isTyping}
                onClick={handleSendMessage}
                aria-label="Send message"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating button */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="fixed right-6 bottom-6 bg-primary text-white rounded-full p-4 shadow-lg hover:bg-primary/90 transition-colors z-50"
          onClick={toggleOpen}
          aria-label="Open chat"
        >
          <MessageCircle className="h-6 w-6" />
        </motion.button>
      )}
    </>
  );
};

export default ChatBotModal;
