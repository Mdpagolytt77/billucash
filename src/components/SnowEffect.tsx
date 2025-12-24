import { useEffect, useState } from 'react';

interface Snowflake {
  id: number;
  left: string;
  animationDuration: string;
  animationDelay: string;
  size: string;
  opacity: number;
}

const SnowEffect = () => {
  const [snowflakes, setSnowflakes] = useState<Snowflake[]>([]);

  useEffect(() => {
    const flakes: Snowflake[] = [];
    
    // Reduced to 25 snowflakes for less density
    for (let i = 0; i < 25; i++) {
      flakes.push({
        id: i,
        left: `${Math.random() * 100}vw`,
        // Slower: 10-18 seconds instead of 5-10
        animationDuration: `${Math.random() * 8 + 10}s`,
        animationDelay: `${Math.random() * 8}s`,
        // Smaller snowflakes: 4-10px
        size: `${Math.random() * 6 + 4}px`,
        // Lower opacity: 0.2-0.4 (around 40%)
        opacity: Math.random() * 0.2 + 0.2,
      });
    }
    
    setSnowflakes(flakes);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
      {snowflakes.map((flake) => (
        <div
          key={flake.id}
          className="absolute -top-2 rounded-full bg-white animate-snowfall"
          style={{
            left: flake.left,
            animationDuration: flake.animationDuration,
            animationDelay: flake.animationDelay,
            width: flake.size,
            height: flake.size,
            opacity: flake.opacity,
            boxShadow: '0 0 4px rgba(255,255,255,0.6)',
          }}
        />
      ))}
    </div>
  );
};

export default SnowEffect;
