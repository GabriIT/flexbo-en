import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

// Pages
import Index from "./pages/Index";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import NotFound from "./pages/NotFound";

// Layout Components
import Header from "./components/Header";
import Footer from "./components/Footer";

// Chatbot
import ChatBotModal from "./components/ChatBot/ChatBotModal";
import { useChatBot } from "./hooks/useChatBot";

const queryClient = new QueryClient();

export default function App() {
  const { isOpen, openChat, closeChat, toggleChat } = useChatBot({
    // set to null to avoid auto-open during testing
    autoOpenDelay: null,
    defaultLLM: "llama",
  });

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="flex flex-col min-h-screen">
            <Header />

            <main className="flex-1">
              <AnimatePresence mode="wait">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/products/:id" element={<ProductDetail />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </AnimatePresence>
            </main>

            <Footer />

            {/* Chatbot is mounted once here and controlled via props */}
            <ChatBotModal
              isOpen={isOpen}
              onClose={toggleChat}   // toggles open/close
              defaultLLM="llama"
            />

            {/* Optional: a global button to open chat if you don't want the bubble in the modal */}
            {!isOpen && (
              <button
                className="fixed right-6 bottom-6 bg-primary text-white rounded-full p-4 shadow-lg z-50 hover:bg-primary/90 transition-colors"
                onClick={openChat}
                aria-label="Open chat"
              >
                💬
              </button>
            )}
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
