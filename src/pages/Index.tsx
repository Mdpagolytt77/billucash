import { useState, useEffect } from 'react';
import SnowEffect from '@/components/SnowEffect';
import LoadingScreen from '@/components/LoadingScreen';
import Header from '@/components/Header';
import LoginBox from '@/components/LoginBox';
import FeaturedOffersSection from '@/components/FeaturedOffersSection';
import StatsSection from '@/components/StatsSection';
import HowItWorksSection from '@/components/HowItWorksSection';
import ProvidersSection from '@/components/ProvidersSection';
import FAQSection from '@/components/FAQSection';
import CTASection from '@/components/CTASection';
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

  return (
    <>
      {/* SEO Meta Tags */}
      <title>Billucash - Earn Money Online | Complete Tasks & Get Paid</title>
      <meta name="description" content="Join Billucash and start earning real money online. Complete simple tasks, play games, watch videos, and refer friends. Instant withdrawals with 24/7 support." />

      {/* Loading Screen */}
      <LoadingScreen isLoading={isLoading} />

      {/* Snow Effect */}
      <SnowEffect />

      {/* Login Popup */}
      <LoginPopup isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />

      {/* Main Content */}
      <div 
        className={`min-h-screen bg-background transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
      >
        {/* Header */}
        <Header onLoginClick={() => setIsLoginOpen(true)} />
        
        {/* Live Earnings Tracker */}
        <LiveEarningsTracker />

        {/* Featured Offers */}
        <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <FeaturedOffersSection />
        </div>

        {/* Login Box Section */}
        <div className="animate-fade-in px-4 pb-6" style={{ animationDelay: '0.2s' }}>
          <LoginBox />
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

        {/* CTA */}
        <div className="animate-fade-in" style={{ animationDelay: '0.7s' }}>
          <CTASection />
        </div>

        {/* Footer */}
        <div className="animate-fade-in" style={{ animationDelay: '0.8s' }}>
          <Footer />
        </div>
      </div>
    </>
  );
};

export default Index;
