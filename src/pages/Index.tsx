import { useState, useEffect } from 'react';
import heroBg from '@/assets/hero-bg.jpg';
import SnowEffect from '@/components/SnowEffect';
import LoadingScreen from '@/components/LoadingScreen';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import LoginBox from '@/components/LoginBox';
import PaymentSection from '@/components/PaymentSection';
import Footer from '@/components/Footer';
import LoginPopup from '@/components/LoginPopup';

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
        className={`min-h-screen transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        style={{
          background: `linear-gradient(rgba(0,0,0,0.75), rgba(0,0,0,0.75)), url(${heroBg}) no-repeat center center fixed`,
          backgroundSize: 'cover',
        }}
      >
        {/* Header */}
        <Header onLoginClick={() => setIsLoginOpen(true)} />

        {/* Main Layout */}
        <main className="px-4 md:px-[5%] py-10 md:py-16">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center min-h-[calc(100vh-200px)]">
            {/* Hero Content */}
            <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <HeroSection />
            </div>

            {/* Login Box */}
            <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <LoginBox />
            </div>
          </div>
        </main>

        {/* Payment Section */}
        <div className="animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <PaymentSection onLoginClick={() => setIsLoginOpen(true)} />
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
