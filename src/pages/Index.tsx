
import { useState, useEffect } from 'react';
import HeroSection from '@/components/HeroSection';
import FeaturedProducts from '@/components/home/FeaturedProducts';
import AboutSection from '@/components/home/AboutSection';
import FeaturesSection from '@/components/home/FeaturesSection';
import CtaSection from '@/components/home/CtaSection';
import ChatBotModal from '@/components/ChatBot/ChatBotModal';
import { useChatBot } from '@/hooks/useChatBot';

const Index = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { isOpen, openChat, closeChat, toggleChat, defaultLLM } = useChatBot({
    autoOpenDelay: 3000, // Open after 3 seconds
    defaultLLM: 'llama'
  });

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="overflow-hidden">
      {/* ChatBot Component
      <ChatBotModal 
        isOpen={isOpen} 
        onClose={toggleChat} 
        defaultLLM={defaultLLM}
      /> */}

      {/* Hero Section */}
      <HeroSection />

      {/* Featured Products */}
      <FeaturedProducts />

      {/* About */}
      <AboutSection />

      {/* Features */}
      <FeaturesSection />

      {/* CTA */}
      <CtaSection />
    </div>
  );
};

export default Index;
