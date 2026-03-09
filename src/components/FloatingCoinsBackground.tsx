import { DollarSign } from 'lucide-react';
import { memo } from 'react';

interface FloatingCoinsBackgroundProps {
  density?: 'low' | 'medium' | 'high';
  showGlow?: boolean;
  showBeams?: boolean;
}

const coinConfigs = {
  low: [
    { top: '10%', left: '5%', delay: '0s', size: 'w-5 h-5' },
    { top: '60%', right: '8%', delay: '1s', size: 'w-6 h-6' },
    { top: '80%', left: '15%', delay: '2s', size: 'w-4 h-4' },
  ],
  medium: [
    { top: '5%', left: '8%', delay: '0s', size: 'w-6 h-6' },
    { top: '15%', right: '12%', delay: '0.5s', size: 'w-5 h-5' },
    { top: '40%', left: '5%', delay: '1s', size: 'w-7 h-7' },
    { top: '65%', right: '6%', delay: '1.5s', size: 'w-5 h-5' },
    { top: '85%', left: '20%', delay: '2s', size: 'w-4 h-4' },
  ],
  high: [
    { top: '3%', left: '5%', delay: '0s', size: 'w-5 h-5' },
    { top: '8%', right: '10%', delay: '0.3s', size: 'w-6 h-6' },
    { top: '25%', right: '5%', delay: '0.9s', size: 'w-7 h-7' },
    { top: '40%', left: '3%', delay: '1.2s', size: 'w-5 h-5' },
    { top: '65%', left: '8%', delay: '1.8s', size: 'w-4 h-4' },
    { top: '85%', left: '18%', delay: '2.4s', size: 'w-6 h-6' },
  ],
};

const FloatingCoinsBackground = memo(({ 
  density = 'medium', 
  showGlow = true,
}: FloatingCoinsBackgroundProps) => {
  const coins = coinConfigs[density];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Simple gradient background - no blur filters */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 0% 0%, #0F1C2E 0%, transparent 50%),
            radial-gradient(ellipse 60% 60% at 100% 100%, #050B18 0%, transparent 50%)
          `
        }}
      />

      {/* Static glow spots - using opacity instead of blur */}
      {showGlow && (
        <>
          <div 
            className="absolute top-[20%] left-[10%] w-[300px] h-[300px] rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(29,191,115,0.12) 0%, transparent 70%)',
            }}
          />
          <div 
            className="absolute top-[50%] right-[5%] w-[250px] h-[250px] rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(23,165,102,0.08) 0%, transparent 70%)',
            }}
          />
        </>
      )}

      {/* Floating coins - using transform for GPU acceleration */}
      {coins.map((coin, i) => (
        <div
          key={i}
          className={`absolute ${coin.size} animate-float`}
          style={{
            top: coin.top,
            left: coin.left,
            right: (coin as any).right,
            animationDelay: coin.delay,
            animationDuration: '5s',
            willChange: 'transform',
          }}
        >
          <div 
            className="w-full h-full rounded-lg flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, rgba(29,191,115,0.5), rgba(23,165,102,0.3))',
              boxShadow: '0 4px 12px rgba(29,191,115,0.2)',
            }}
          >
            <DollarSign className="w-3/4 h-3/4 text-white" />
          </div>
        </div>
      ))}
    </div>
  );
});

FloatingCoinsBackground.displayName = 'FloatingCoinsBackground';

export default FloatingCoinsBackground;
