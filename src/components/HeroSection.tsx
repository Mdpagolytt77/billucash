import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const HeroSection = () => {
  const [offersCount, setOffersCount] = useState(530);
  const [maxReward, setMaxReward] = useState(14.99);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { count } = await supabase
          .from('completed_offers')
          .select('*', { count: 'exact', head: true });
        
        if (count && count > 0) {
          setOffersCount(count);
        }
      } catch (err) {
        console.error('Failed to fetch offers count:', err);
      }
    };

    fetchStats();
  }, []);

  return (
    <section className="relative overflow-hidden">
      {/* Gradient Background with Gaming Visual */}
      <div className="absolute inset-0 z-0">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
        
        {/* Gaming-style decorative gradient */}
        <div 
          className="absolute inset-0 opacity-40"
          style={{
            background: `
              radial-gradient(ellipse 80% 50% at 50% 0%, hsl(var(--primary) / 0.3) 0%, transparent 50%),
              radial-gradient(ellipse 60% 40% at 80% 20%, hsl(280 70% 50% / 0.2) 0%, transparent 40%),
              radial-gradient(ellipse 60% 40% at 20% 30%, hsl(200 80% 50% / 0.15) 0%, transparent 40%)
            `
          }}
        />
        
        {/* Floating particles effect */}
        <div className="absolute inset-0">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-primary/40 animate-float"
              style={{
                left: `${15 + i * 12}%`,
                top: `${20 + (i % 3) * 20}%`,
                animationDelay: `${i * 0.3}s`,
                animationDuration: `${3 + (i % 2)}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 px-4 py-12 md:py-16 text-center">
        {/* Main Heading with Animation */}
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold leading-tight mb-4">
          <span className="inline-block animate-fade-in">
            <span className="text-primary relative">
              Earn rewards
              {/* Underline decoration */}
              <span className="absolute -bottom-1 left-0 w-full h-1 bg-primary/50 rounded-full" />
            </span>
            <span className="text-foreground">. testing apps,</span>
          </span>
          <br />
          <span className="inline-block animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <span className="text-foreground">anywhere & anytime.</span>
          </span>
        </h1>

        {/* Subtext */}
        <p 
          className="text-sm md:text-base text-muted-foreground animate-fade-in"
          style={{ animationDelay: '0.4s' }}
        >
          Earn money online up to{' '}
          <span className="text-primary font-semibold">${maxReward.toFixed(2)}</span>
          {' '}per offer{' '}
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-green-400 font-medium">{offersCount}</span>
          </span>
          {' '}available offers now
        </p>
      </div>
    </section>
  );
};

export default HeroSection;