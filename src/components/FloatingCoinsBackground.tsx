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
      {/* Layered gradient background */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 0% 0%, #0F1C2E 0%, transparent 50%),
            radial-gradient(circle 140px at 50% 40%, rgba(41,121,255,0.15) 0%, transparent 100%),
            radial-gradient(ellipse 60% 60% at 100% 100%, #050B18 0%, transparent 50%)
          `
        }}
      />

      {/* Neon glow blobs */}
      {showGlow && (
        <>
          <div 
            className="absolute top-[20%] left-[10%] w-[400px] h-[400px] rounded-full opacity-20"
            style={{
              background: 'radial-gradient(circle, #00B0FF 0%, transparent 70%)',
              filter: 'blur(80px)',
            }}
          />
          <div 
            className="absolute top-[50%] right-[5%] w-[300px] h-[300px] rounded-full opacity-15"
            style={{
              background: 'radial-gradient(circle, #2962FF 0%, transparent 70%)',
              filter: 'blur(100px)',
            }}
          />
          <div 
            className="absolute bottom-[10%] left-[40%] w-[350px] h-[350px] rounded-full opacity-10"
            style={{
              background: 'radial-gradient(circle, #00B0FF 0%, transparent 70%)',
              filter: 'blur(120px)',
            }}
          />
        </>
      )}

      {/* Animated light beams */}
      {showBeams && (
        <>
          <div 
            className="absolute w-[200%] h-0.5 rotate-45 animate-pulse"
            style={{ 
              top: '25%', 
              left: '-50%',
              background: 'linear-gradient(90deg, transparent, rgba(0,176,255,0.08), transparent)',
            }}
          />
          <div 
            className="absolute w-[200%] h-px -rotate-12 animate-pulse"
            style={{ 
              top: '55%', 
              left: '-50%', 
              animationDelay: '1s',
              background: 'linear-gradient(90deg, transparent, rgba(41,121,255,0.06), transparent)',
            }}
          />
          <div 
            className="absolute w-[200%] h-px rotate-12 animate-pulse"
            style={{ 
              top: '75%', 
              left: '-50%', 
              animationDelay: '2s',
              background: 'linear-gradient(90deg, transparent, rgba(0,176,255,0.06), transparent)',
            }}
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
            animationDuration: '4s',
          }}
        >
          <div 
            className="w-full h-full rounded-lg flex items-center justify-center backdrop-blur-sm"
            style={{
              background: 'linear-gradient(135deg, rgba(0,176,255,0.6), rgba(41,121,255,0.4))',
              boxShadow: '0 4px 15px rgba(0,176,255,0.3)',
            }}
          >
            <DollarSign className="w-3/4 h-3/4 text-white" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default FloatingCoinsBackground;
