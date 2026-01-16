import { DollarSign } from 'lucide-react';

interface FloatingCoinsBackgroundProps {
  density?: 'low' | 'medium' | 'high';
  showGlow?: boolean;
  showBeams?: boolean;
}

const FloatingCoinsBackground = ({ 
  density = 'medium', 
  showGlow = true,
  showBeams = true 
}: FloatingCoinsBackgroundProps) => {
  // Different coin configurations based on density
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
      { top: '75%', right: '18%', delay: '0.8s', size: 'w-6 h-6' },
    ],
    high: [
      { top: '3%', left: '5%', delay: '0s', size: 'w-5 h-5' },
      { top: '8%', right: '10%', delay: '0.3s', size: 'w-6 h-6' },
      { top: '20%', left: '12%', delay: '0.6s', size: 'w-4 h-4' },
      { top: '25%', right: '5%', delay: '0.9s', size: 'w-7 h-7' },
      { top: '40%', left: '3%', delay: '1.2s', size: 'w-5 h-5' },
      { top: '50%', right: '15%', delay: '1.5s', size: 'w-6 h-6' },
      { top: '65%', left: '8%', delay: '1.8s', size: 'w-4 h-4' },
      { top: '70%', right: '8%', delay: '2.1s', size: 'w-5 h-5' },
      { top: '85%', left: '18%', delay: '2.4s', size: 'w-6 h-6' },
      { top: '90%', right: '12%', delay: '0.4s', size: 'w-4 h-4' },
    ],
  };

  const coins = coinConfigs[density];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Glow effects */}
      {showGlow && (
        <>
          <div 
            className="absolute inset-0 opacity-40"
            style={{
              background: `
                radial-gradient(ellipse 60% 40% at 50% 0%, hsl(var(--primary) / 0.2) 0%, transparent 60%),
                radial-gradient(ellipse 50% 50% at 100% 50%, hsl(var(--primary) / 0.1) 0%, transparent 50%),
                radial-gradient(ellipse 40% 60% at 0% 100%, hsl(var(--primary) / 0.08) 0%, transparent 50%)
              `
            }}
          />
          {/* Center glow */}
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-20 blur-3xl"
            style={{
              background: 'radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)'
            }}
          />
        </>
      )}

      {/* Animated light beams */}
      {showBeams && (
        <>
          <div 
            className="absolute w-[200%] h-0.5 bg-gradient-to-r from-transparent via-primary/15 to-transparent rotate-45 animate-pulse"
            style={{ top: '25%', left: '-50%' }}
          />
          <div 
            className="absolute w-[200%] h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent -rotate-12 animate-pulse"
            style={{ top: '55%', left: '-50%', animationDelay: '1s' }}
          />
          <div 
            className="absolute w-[200%] h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent rotate-12 animate-pulse"
            style={{ top: '75%', left: '-50%', animationDelay: '2s' }}
          />
        </>
      )}

      {/* Floating coins */}
      {coins.map((coin, i) => (
        <div
          key={i}
          className={`absolute ${coin.size} animate-float`}
          style={{
            top: coin.top,
            left: coin.left,
            right: coin.right,
            animationDelay: coin.delay,
            animationDuration: '3s',
          }}
        >
          <div className="w-full h-full rounded-lg bg-primary/80 flex items-center justify-center shadow-lg shadow-primary/30 backdrop-blur-sm">
            <DollarSign className="w-3/4 h-3/4 text-white" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default FloatingCoinsBackground;
