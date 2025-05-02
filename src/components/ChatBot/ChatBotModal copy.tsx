import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, X, Send, Bot, ChevronDown } from 'lucide-react';

// Define message interface
interface Message {
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

// Define LLM types
type LLMType = 'llama' | 'openai' | 'claude';



// // 1) create a thread
// const createRes = await fetch(`${process.env.THREADS_BASE_URL}/thread`, {
//   method: "POST",
//   headers: { "Content-Type": "application/json" },
//   body: JSON.stringify({ content: inputValue })
// });
// const { id: threadId } = await createRes.json();

// // 2) your bridge will pick it up, call your LLM, post the answer,
// //    and then you can poll GET `/thread/${threadId}/prompt/messages`
// //    to retrieve the bot’s reply and render it.








// Mock function to simulate LLM response
const generateLLMResponse = async (
  message: string, 
  llmType: LLMType
): Promise<string> => {
  console.log(`Using ${llmType} to process: ${message}`);
  // In a real implementation, this would call an API
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Return different responses based on the selected LLM
  const responses: Record<LLMType, string> = {
    llama: `[Llama3.2] Thanks for your message: "${message}". How can I help you with our packaging solutions?`,
    openai: `[OpenAI] I received your message: "${message}". How can I assist you with our products today?`,
    claude: `[Claude] I got your query: "${message}". What specific information about our packaging would you like to know?`
  };
  
  return responses[llmType];
};

// Predefined quick replies for each tab
const tabContent = {
  products: [
    "What types of aseptic bags do you offer?",
    "Tell me about examples of aseptic packaging solutions",
    "Do you have custom packaging solutions?",
    "Which kind of spouts are used in IBC solutions ?"
  ],
  solutions: [
    "How can you help with environment-friendly packaging ?",
    "What custom branding options do you offer?",
    "Can you supply laminated film without glue or tie layer ?",
    "What regions in the world can you supply ?"
  ],
  certifications: [
    "What quality certifications do you have?",
    "Are your products FDA approved?",
    "Do you have BRC and ISO certification?"    
  ],
  quality: [
    "What is the self-life of the products packed in your aseptic bags ?",
    "How do you ensure product quality?",
    "What materials do you use in your packaging?",
    "What is your quality control process?"    
  ],
  service: [
    "What's your typical response time?",
    "Do you offer rush delivery options?",
    "How can I place a bulk order?"   
  ]
};

interface ChatBotModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultLLM?: LLMType;
}

const ChatBotModal: React.FC<ChatBotModalProps> = ({ 
  isOpen, 
  onClose, 
  defaultLLM = 'llama' 
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      type: 'bot',
      content: "What can I do for you? You can ask a question 24/7 or select a query from the tabs below.",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedLLM, setSelectedLLM] = useState<LLMType>(defaultLLM);
  const [isLLMMenuOpen, setIsLLMMenuOpen] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage: Message = {
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      // Get response from LLM
      const response = await generateLLMResponse(inputValue, selectedLLM);
      
      // Add bot message
      const botMessage: Message = {
        type: 'bot',
        content: response,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error generating response:', error);
      
      // Add error message
      const errorMessage: Message = {
        type: 'bot',
        content: "I'm sorry, I encountered an error processing your request. Please try again.",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickReply = (query: string) => {
    setInputValue(query);
    // Focus on input
    inputRef.current?.focus();
  };

  const changeLLM = (type: LLMType) => {
    setSelectedLLM(type);
    setIsLLMMenuOpen(false);
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
                  onClick={() => setIsLLMMenuOpen(!isLLMMenuOpen)}
                >
                  {selectedLLM === 'llama' ? 'Llama3.2' : 
                   selectedLLM === 'openai' ? 'OpenAI' : 
                   'Claude'}
                  <ChevronDown className="h-3 w-3" />
                </Button>
                
                {isLLMMenuOpen && (
                  <div className="absolute right-0 mt-1 w-36 bg-white rounded-md shadow-lg py-1 border border-gray-200 z-10">
                    <button 
                      className={`block px-4 py-2 text-sm w-full text-left hover:bg-gray-100 ${selectedLLM === 'llama' ? 'bg-gray-50' : ''}`} 
                      onClick={() => changeLLM('llama')}
                    >
                      Llama3.2
                    </button>
                    <button 
                      className={`block px-4 py-2 text-sm w-full text-left hover:bg-gray-100 ${selectedLLM === 'openai' ? 'bg-gray-50' : ''}`} 
                      onClick={() => changeLLM('openai')}
                    >
                      OpenAI
                    </button>
                    <button 
                      className={`block px-4 py-2 text-sm w-full text-left hover:bg-gray-100 ${selectedLLM === 'claude' ? 'bg-gray-50' : ''}`} 
                      onClick={() => changeLLM('claude')}
                    >
                      Claude
                    </button>
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onClose}
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
                className={`flex mb-4 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.type === 'user'
                      ? 'bg-primary text-white'
                      : 'bg-white text-gray-800 border border-gray-200'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <div
                    className={`text-xs mt-1 ${
                      message.type === 'user' ? 'text-primary-foreground/70' : 'text-gray-500'
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start mb-4">
                <div className="bg-white text-gray-800 rounded-lg p-3 border border-gray-200">
                  <p className="text-sm">
                    <span className="inline-block w-2 h-2 bg-gray-400 rounded-full animate-pulse mr-1"></span>
                    <span className="inline-block w-2 h-2 bg-gray-400 rounded-full animate-pulse animation-delay-200 mx-1"></span>
                    <span className="inline-block w-2 h-2 bg-gray-400 rounded-full animate-pulse animation-delay-400 ml-1"></span>
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
                <TabsTrigger value="products" className="text-xs px-2 py-1">Products</TabsTrigger>
                <TabsTrigger value="solutions" className="text-xs px-2 py-1">Solutions</TabsTrigger>
                <TabsTrigger value="certifications" className="text-xs px-2 py-1">Certifications</TabsTrigger>
                <TabsTrigger value="quality" className="text-xs px-2 py-1">Quality</TabsTrigger>
                <TabsTrigger value="service" className="text-xs px-2 py-1">Customer Service</TabsTrigger>
              </TabsList>
              <div className="p-2 bg-gray-50 max-h-32 overflow-y-auto">
                <TabsContent value="products" className="m-0">
                  <div className="flex flex-wrap gap-2">
                    {tabContent.products.map((query, index) => (
                      <button
                        key={index}
                        className="text-xs bg-white hover:bg-gray-100 text-gray-800 font-medium py-1 px-2 border border-gray-200 rounded transition-colors"
                        onClick={() => handleQuickReply(query)}
                      >
                        {query}
                      </button>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="solutions" className="m-0">
                  <div className="flex flex-wrap gap-2">
                    {tabContent.solutions.map((query, index) => (
                      <button
                        key={index}
                        className="text-xs bg-white hover:bg-gray-100 text-gray-800 font-medium py-1 px-2 border border-gray-200 rounded transition-colors"
                        onClick={() => handleQuickReply(query)}
                      >
                        {query}
                      </button>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="certifications" className="m-0">
                  <div className="flex flex-wrap gap-2">
                    {tabContent.certifications.map((query, index) => (
                      <button
                        key={index}
                        className="text-xs bg-white hover:bg-gray-100 text-gray-800 font-medium py-1 px-2 border border-gray-200 rounded transition-colors"
                        onClick={() => handleQuickReply(query)}
                      >
                        {query}
                      </button>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="quality" className="m-0">
                  <div className="flex flex-wrap gap-2">
                    {tabContent.quality.map((query, index) => (
                      <button
                        key={index}
                        className="text-xs bg-white hover:bg-gray-100 text-gray-800 font-medium py-1 px-2 border border-gray-200 rounded transition-colors"
                        onClick={() => handleQuickReply(query)}
                      >
                        {query}
                      </button>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="service" className="m-0">
                  <div className="flex flex-wrap gap-2">
                    {tabContent.service.map((query, index) => (
                      <button
                        key={index}
                        className="text-xs bg-white hover:bg-gray-100 text-gray-800 font-medium py-1 px-2 border border-gray-200 rounded transition-colors"
                        onClick={() => handleQuickReply(query)}
                      >
                        {query}
                      </button>
                    ))}
                  </div>
                </TabsContent>
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
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      )}
      
      {/* Chat bubble button */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="fixed right-6 bottom-6 bg-primary text-white rounded-full p-4 shadow-lg z-50 hover:bg-primary/90 transition-colors"
          onClick={() => onClose()} // This will toggle the chat open
        >
          <MessageCircle className="h-6 w-6" />
        </motion.button>
      )}
    </AnimatePresence>
  );
};

export default ChatBotModal;
