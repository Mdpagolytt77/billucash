import { useState, useEffect } from 'react';
import LoadingScreen from '@/components/LoadingScreen';
import Header from '@/components/Header';
import LandingSidebar from '@/components/LandingSidebar';
import HeroSection from '@/components/HeroSection';
import SignUpFormSection from '@/components/SignUpFormSection';
import StatsSection from '@/components/StatsSection';
import HowItWorksSection from '@/components/HowItWorksSection';
import ProvidersSection from '@/components/ProvidersSection';
import FAQSection from '@/components/FAQSection';
import CTASection from '@/components/CTASection';
import FloatingCoinsBackground from '@/components/FloatingCoinsBackground';
import Footer from '@/components/Footer';
import LoginPopup from '@/components/LoginPopup';
import LiveEarningsTracker from '@/components/LiveEarningsTracker';

const Index = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1800);
    return () => clearTimeout(timer);
  }, []);

  const handleOfferClick = () => setIsLoginOpen(true);

  return (
    <>
      <title>WallsCash - Earn Money Online | Complete Tasks & Get Paid</title>
      <meta name="description" content="Join WallsCash and start earning real money online. Complete simple tasks, play games, watch videos, and refer friends. Instant withdrawals with 24/7 support." />

      <LoadingScreen isLoading={isLoading} />
      <LoginPopup isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />

      <div className={`min-h-screen transition-opacity duration-500 relative ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        style={{ background: '#0A0F1C' }}
      >
        {/* Background effects */}
        <div className="fixed inset-0 z-0">
          <FloatingCoinsBackground density="high" showGlow={true} showBeams={true} />
        </div>

        <div className="relative z-10">
          {/* Sticky Header */}
          <Header onLoginClick={() => setIsLoginOpen(true)} />

          {/* Left Sidebar */}
          <LandingSidebar onLoginClick={() => setIsLoginOpen(true)} />

          {/* Main content - offset by sidebar width */}
          <main className="ml-[48px] md:ml-[180px]">
            {/* Activity Ticker */}
            <LiveEarningsTracker />

            {/* Hero */}
            <HeroSection onOfferClick={handleOfferClick} />

            {/* Sign Up Form */}
            <SignUpFormSection />

            {/* Stats */}
            <StatsSection />

            {/* How to Earn */}
            <HowItWorksSection />

            {/* FAQ */}
            <FAQSection />

            {/* Join CTA */}
            <CTASection />

            {/* Partners */}
            <ProvidersSection />

            {/* Footer */}
            <Footer />
          </main>
        </div>
      </div>
    </>
  );
};

export default Index;
