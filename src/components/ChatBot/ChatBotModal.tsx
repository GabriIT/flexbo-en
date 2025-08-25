import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, X, Send, Bot, ChevronDown } from "lucide-react";

interface Message {
  type: "user" | "bot";
  content: string;
  timestamp: Date;
}

type LLMType = "llama" | "openai" | "claude";

const tabContent = {
  products: [
    "What types of aseptic bags do you offer?",
    "What are the specific features of Flexbo’s aseptic bags?",
    "Tell me about examples of aseptic packaging solutions",
    "Do you have custom packaging solutions ?",
    "Which kind of spouts are used in IBC solutions?",
    "What are aseptic bags used for ?",
  ],
  solutions: [
    "How can you help with environment-friendly packaging ?",
    "Can we order directly liquid bags from Flexbo and how ?",
    "What solutions do you offer ?",
    "Can you supply laminated film without glue or tie layer ?",
    "What regions in the world can you supply ?",
  ],
  certifications: [
    "What quality certifications do you have ?",
    "Are your products FDA approved ?",
    "Do you have BRC and ISO certification ?",
  ],
  quality: [
    "What is the shelf life of the products packed in your aseptic bags ?",
    "How do you ensure product quality ?",
    "What materials do you use in your packaging ?",
    "What is your quality control process ?",
  ],
  service: [
    "What's your typical response time ?",
    "Do you offer rush delivery options ?",
    "How can I place a bulk order ?",
  ],
};

interface ChatBotModalProps {
  isOpen: boolean;
  onClose: () => void; // we pass toggleChat from App
  defaultLLM?: LLMType;
}

const API_KEY = import.meta.env.VITE_API_KEY || "secret";

async function sendChatOnce(message: string, threadId: number | null) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": API_KEY,
    },
    body: JSON.stringify({ message, thread_id: threadId }),
  });
  let data: any = null;
  try {
    data = await res.json();
  } catch (e) {
    // if proxy/nginx sent HTML or empty body
    throw new Error(`chat ${res.status} - invalid JSON`);
  }
  if (!res.ok) {
    const detail = (data && (data.detail || data.response || data.error)) || res.statusText;
    const err = new Error(`chat ${res.status} - ${detail}`);
    // @ts-expect-error attach status
    (err as any).status = res.status;
    throw err;
  }
  return data;
}

/** Robust send: retries once with thread_id=null if server rejects old id */
async function sendChatRobust(message: string, currentTid: number | null) {
  try {
    return await sendChatOnce(message, currentTid);
  } catch (err: any) {
    // If stale thread id caused 404/500, retry with null (server auto-creates)
    if (err?.message?.startsWith("chat 404") || err?.message?.startsWith("chat 500")) {
      console.warn("[chat] retrying with thread_id=null due to", err?.message);
      return await sendChatOnce(message, null);
    }
    throw err;
  }
}

const ChatBotModal: React.FC<ChatBotModalProps> = ({
  isOpen,
  onClose,
  defaultLLM = "llama",
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      type: "bot",
      content:
        "What can I do for you? You can ask a question 24/7 or select a query from the tabs below.",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedLLM, setSelectedLLM] = useState<LLMType>(defaultLLM);
  const [isLLMMenuOpen, setIsLLMMenuOpen] = useState(false);
  const [threadId, setThreadId] = useState<number | null>(null);

  // hydrate thread id from localStorage
  useEffect(() => {
    const raw = localStorage.getItem("flexbo_tid");
    const tid = raw ? Number(raw) : null;
    if (tid && !Number.isNaN(tid)) setThreadId(tid);
  }, []);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) inputRef.current.focus();
  }, [isOpen]);

  const pushBot = (text: string) =>
    setMessages((prev) => [
      ...prev,
      { type: "bot", content: text, timestamp: new Date() },
    ]);

  const pushUser = (text: string) =>
    setMessages((prev) => [
      ...prev,
      { type: "user", content: text, timestamp: new Date() },
    ]);

  const handleSend = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    pushUser(trimmed);
    setInputValue("");
    setIsTyping(true);

    try {
      const data = await sendChatRobust(trimmed, threadId);
      // Always adopt the server's thread_id
      const newTid = Number(data.thread_id);
      if (newTid && !Number.isNaN(newTid)) {
        setThreadId(newTid);
        localStorage.setItem("flexbo_tid", String(newTid));
      }

      pushBot(data.response);
    } catch (err: any) {
      console.error("Chat error:", err);
      // If we retried and still failed, clear thread & tell user
      localStorage.removeItem("flexbo_tid");
      setThreadId(null);
      pushBot(
        "I ran into a connection error. I’ve reset the conversation—please try again."
      );
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendMessage = () => handleSend(inputValue);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickReply = (query: string) => {
    // send immediately for snappier UX
    handleSend(query);
  };

  const changeLLM = (type: LLMType) => {
    setSelectedLLM(type);
    setIsLLMMenuOpen(false);
    // (backend currently ignores this; UI affordance only)
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.3 }}
          className="fixed right-6 bottom-6 w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden z-50 border border-gray-200"
          role="dialog"
          aria-modal="true"
          aria-label="FLEXBO Assistant"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gray-50">
            <div className="flex items-center space-x-2">
              <Bot className="h-5 w-5 text-primary" />
              <h3 className="font-medium">FLEXBO Assistant</h3>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs flex items-center gap-1 px-2"
                  onClick={() => setIsLLMMenuOpen((v) => !v)}
                >
                  {selectedLLM === "llama"
                    ? "Llama3.2"
                    : selectedLLM === "openai"
                    ? "OpenAI"
                    : "Claude"}
                  <ChevronDown className="h-3 w-3" />
                </Button>

                {isLLMMenuOpen && (
                  <div className="absolute right-0 mt-1 w-36 bg-white rounded-md shadow-lg py-1 border border-gray-200 z-10">
                    {(["llama", "openai", "claude"] as LLMType[]).map((k) => (
                      <button
                        key={k}
                        className={`block px-4 py-2 text-sm w-full text-left hover:bg-gray-100 ${
                          selectedLLM === k ? "bg-gray-50" : ""
                        }`}
                        onClick={() => changeLLM(k)}
                      >
                        {k === "llama" ? "Llama3.2" : k === "openai" ? "OpenAI" : "Claude"}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onClose}
                aria-label="Close chat"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="p-4 overflow-y-auto max-h-80 min-h-60 bg-gray-50">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex mb-4 ${
                  message.type === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.type === "user"
                      ? "bg-primary text-white"
                      : "bg-white text-gray-800 border border-gray-200"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <div
                    className={`text-xs mt-1 ${
                      message.type === "user"
                        ? "text-primary-foreground/70"
                        : "text-gray-500"
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start mb-4">
                <div className="bg-white text-gray-800 rounded-lg p-3 border border-gray-200">
                  <p className="text-sm">
                    <span className="inline-block w-2 h-2 rounded-full animate-pulse mr-1 bg-gray-400"></span>
                    <span className="inline-block w-2 h-2 rounded-full animate-pulse mx-1 bg-gray-400"></span>
                    <span className="inline-block w-2 h-2 rounded-full animate-pulse ml-1 bg-gray-400"></span>
                  </p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Reply Tabs */}
          <div className="border-t border-gray-200">
            <Tabs defaultValue="products" className="w-full">
              <TabsList className="w-full justify-start overflow-x-auto p-1 h-auto flex-nowrap">
                <TabsTrigger value="products" className="text-xs px-2 py-1">
                  Products
                </TabsTrigger>
                <TabsTrigger value="solutions" className="text-xs px-2 py-1">
                  Solutions
                </TabsTrigger>
                <TabsTrigger value="certifications" className="text-xs px-2 py-1">
                  Certifications
                </TabsTrigger>
                <TabsTrigger value="quality" className="text-xs px-2 py-1">
                  Quality
                </TabsTrigger>
                <TabsTrigger value="service" className="text-xs px-2 py-1">
                  Customer Service
                </TabsTrigger>
              </TabsList>
              <div className="p-2 bg-gray-50 max-h-32 overflow-y-auto">
                {(
                  Object.keys(tabContent) as Array<keyof typeof tabContent>
                ).map((k) => (
                  <TabsContent key={k} value={k} className="m-0">
                    <div className="flex flex-wrap gap-2">
                      {tabContent[k].map((query, i) => (
                        <button
                          key={i}
                          className="text-xs bg-white hover:bg-gray-100 text-gray-800 font-medium py-1 px-2 border border-gray-200 rounded transition-colors"
                          onClick={() => handleQuickReply(query)}
                        >
                          {query}
                        </button>
                      ))}
                    </div>
                  </TabsContent>
                ))}
              </div>
            </Tabs>
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-200 flex items-center">
            <Input
              ref={inputRef}
              className="flex-1 p-2 focus-visible:ring-1"
              placeholder="Type your message..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
            />
            <Button
              className="ml-2 p-2"
              variant="default"
              size="icon"
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isTyping}
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      )}

      {/* Chat bubble button shown when modal is closed */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="fixed right-6 bottom-6 bg-primary text-white rounded-full p-4 shadow-lg z-50 hover:bg-primary/90 transition-colors"
          onClick={onClose}
          aria-label="Open chat"
        >
          <MessageCircle className="h-6 w-6" />
        </motion.button>
      )}
    </AnimatePresence>
  );
};

export default ChatBotModal;
