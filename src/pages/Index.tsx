import { useState, useEffect } from 'react';
import SnowEffect from '@/components/SnowEffect';
import LoadingScreen from '@/components/LoadingScreen';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import LoginBox from '@/components/LoginBox';
import FeaturedOffersSection from '@/components/FeaturedOffersSection';
import StatsSection from '@/components/StatsSection';
import HowItWorksSection from '@/components/HowItWorksSection';
import ProvidersSection from '@/components/ProvidersSection';
import FAQSection from '@/components/FAQSection';
import FloatingCoinsBackground from '@/components/FloatingCoinsBackground';

import Footer from '@/components/Footer';
import LoginPopup from '@/components/LoginPopup';
import LiveEarningsTracker from '@/components/LiveEarningsTracker';

const Index = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1800);

    return () => clearTimeout(timer);
  }, []);

  const handleOfferClick = () => {
    setIsLoginOpen(true);
  };

  return (
    <>
      {/* SEO Meta Tags */}
      <title>WallsCash - Earn Money Online | Complete Tasks & Get Paid</title>
      <meta name="description" content="Join WallsCash and start earning real money online. Complete simple tasks, play games, watch videos, and refer friends. Instant withdrawals with 24/7 support." />

      {/* Loading Screen */}
      <LoadingScreen isLoading={isLoading} />

      {/* Snow Effect */}
      <SnowEffect />

      {/* Login Popup */}
      <LoginPopup isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />

      {/* Main Content */}
      <div 
        className={`min-h-screen bg-background transition-opacity duration-500 relative ${isLoading ? 'opacity-0' : 'opacity-100'}`}
      >
        {/* Global Floating Coins Background */}
        <div className="fixed inset-0 z-0">
          <FloatingCoinsBackground density="high" showGlow={true} showBeams={true} />
        </div>

        {/* Content wrapper with relative z-index */}
        <div className="relative z-10">
          {/* Header */}
          <Header onLoginClick={() => setIsLoginOpen(true)} />
          
          {/* Live Earnings Tracker */}
          <LiveEarningsTracker />

          {/* Hero Section - Centered text */}
          <div className="animate-fade-in">
            <HeroSection />
          </div>

          {/* Featured Offers + Login Box side by side */}
          <div className="animate-fade-in px-4 pb-8" style={{ animationDelay: '0.15s' }}>
            <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-start gap-6 lg:gap-8">
              {/* Featured Offers - Left */}
              <div className="flex-1 w-full">
                <FeaturedOffersSection onOfferClick={handleOfferClick} />
              </div>

              {/* Login Box - Right */}
              <div className="w-full lg:w-[400px] flex-shrink-0">
                <LoginBox />
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <StatsSection />
          </div>

          {/* How It Works */}
          <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <HowItWorksSection />
          </div>

          {/* Providers */}
          <div className="animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <ProvidersSection />
          </div>

          {/* FAQ */}
          <div className="animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <FAQSection />
          </div>

          {/* Footer */}
          <div className="animate-fade-in" style={{ animationDelay: '0.8s' }}>
            <Footer />
          </div>
        </div>
      </div>
    </>
  );
};

export default Index;
