import { useNavigate } from 'react-router-dom';
import { DollarSign } from 'lucide-react';
import heroIllustrationDefault from '@/assets/hero-illustration.png';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';

const HeroSection = () => {
  const navigate = useNavigate();
  const { homepageImages } = useSiteSettings();
  const heroIllustration = homepageImages.heroIllustration || heroIllustrationDefault;

  // Floating coin positions
  const floatingCoins = [
    { top: '5%', left: '45%', delay: '0s', size: 'w-8 h-8' },
    { top: '15%', left: '12%', delay: '0.5s', size: 'w-6 h-6' },
    { top: '35%', left: '8%', delay: '1s', size: 'w-7 h-7' },
    { top: '55%', left: '5%', delay: '1.5s', size: 'w-5 h-5' },
    { top: '75%', left: '15%', delay: '2s', size: 'w-6 h-6' },
    { top: '65%', right: '10%', delay: '0.3s', size: 'w-7 h-7' },
    { top: '85%', right: '5%', delay: '0.8s', size: 'w-5 h-5' },
    { top: '25%', right: '8%', delay: '1.2s', size: 'w-6 h-6' },
  ];

  return (
    <section className="relative px-4 py-8 md:py-12">
      {/* Hero Container with rounded corners */}
      <div className="relative max-w-6xl mx-auto rounded-3xl overflow-hidden">
        {/* Dark background with gradient */}
        <div 
          className="absolute inset-0 z-0"
          style={{
            background: `
              linear-gradient(135deg, hsl(220 20% 10% / 0.98) 0%, hsl(220 25% 8% / 0.99) 100%)
            `,
          }}
        />
        
        {/* Glow effects */}
        <div 
          className="absolute inset-0 z-0 opacity-60"
          style={{
            background: `
              radial-gradient(ellipse 60% 40% at 50% 0%, hsl(var(--primary) / 0.25) 0%, transparent 60%),
              radial-gradient(ellipse 50% 50% at 100% 50%, hsl(var(--primary) / 0.15) 0%, transparent 50%),
              radial-gradient(ellipse 40% 60% at 0% 100%, hsl(var(--primary) / 0.1) 0%, transparent 50%)
            `
          }}
        />

        {/* Animated light beams */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div 
            className="absolute w-[200%] h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent rotate-45 animate-pulse"
            style={{ top: '30%', left: '-50%' }}
          />
          <div 
            className="absolute w-[200%] h-0.5 bg-gradient-to-r from-transparent via-primary/15 to-transparent -rotate-12 animate-pulse"
            style={{ top: '60%', left: '-50%', animationDelay: '1s' }}
          />
        </div>

        {/* Floating coin icons */}
        {floatingCoins.map((coin, i) => (
          <div
            key={i}
            className={`absolute ${coin.size} z-10 animate-float`}
            style={{
              top: coin.top,
              left: coin.left,
              right: coin.right,
              animationDelay: coin.delay,
              animationDuration: '3s',
            }}
          >
            <div className="w-full h-full rounded-lg bg-primary/90 flex items-center justify-center shadow-lg shadow-primary/30">
              <DollarSign className="w-3/4 h-3/4 text-white" />
            </div>
          </div>
        ))}

        {/* Content */}
        <div className="relative z-10 px-6 md:px-12 py-12 md:py-16 flex flex-col md:flex-row items-center gap-8">
          {/* Left side - Text content */}
          <div className="flex-1 text-left">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold leading-tight mb-6">
              <span className="block text-foreground animate-fade-in">
                Start earning
              </span>
              <span className="block text-foreground animate-fade-in" style={{ animationDelay: '0.1s' }}>
                with{' '}
                <span className="text-primary relative inline-block">
                  WallsCash
                  {/* Glowing underline */}
                  <span 
                    className="absolute -bottom-1 left-0 w-full h-1 rounded-full"
                    style={{
                      background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary) / 0.5))',
                      boxShadow: '0 0 20px hsl(var(--primary) / 0.5)'
                    }}
                  />
                </span>
              </span>
              <span className="block text-primary animate-fade-in" style={{ animationDelay: '0.2s' }}>
                today
              </span>
            </h1>

            <p 
              className="text-sm md:text-base text-muted-foreground max-w-md mb-8 leading-relaxed animate-fade-in"
              style={{ animationDelay: '0.3s' }}
            >
              Become a website and game tester, share your opinions in surveys, and earn cashback on your online shopping. Join now and start making money easily!
            </p>

            {/* CTA Button */}
            <button 
              onClick={() => navigate('/signup')}
              className="btn-primary text-base px-10 py-4 shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all animate-fade-in"
              style={{ animationDelay: '0.4s' }}
            >
              SIGN UP
            </button>
          </div>

          {/* Right side - 3D Illustration (visible on all screens) */}
          <div className="flex-1 flex items-center justify-center relative min-h-[250px] md:min-h-[350px]">
            {/* Glowing circle background */}
            <div 
              className="absolute w-64 h-64 rounded-full opacity-40 blur-3xl"
              style={{
                background: 'radial-gradient(circle, hsl(var(--primary) / 0.6) 0%, transparent 70%)'
              }}
            />
            {/* 3D Illustration Image */}
            <img 
              src={heroIllustration} 
              alt="Earn money online illustration" 
              className="relative z-10 w-full max-w-xs md:max-w-sm lg:max-w-md h-auto object-contain animate-fade-in drop-shadow-2xl"
              style={{ 
                animationDelay: '0.3s',
                filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.4))'
              }}
            />
          </div>
        </div>

        {/* Bottom gradient fade */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-20 z-5"
          style={{
            background: 'linear-gradient(to top, hsl(var(--background)), transparent)'
          }}
        />
      </div>
    </section>
  );
};

export default HeroSection;