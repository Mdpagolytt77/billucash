import { useEffect, useState } from 'react';

interface Snowflake {
  id: number;
  left: string;
  animationDuration: string;
  animationDelay: string;
  fontSize: string;
  opacity: number;
  symbol: string;
}

const SnowEffect = () => {
  const [snowflakes, setSnowflakes] = useState<Snowflake[]>([]);

  useEffect(() => {
    const symbols = ['❄', '❅', '❆', '•'];
    const flakes: Snowflake[] = [];
    
    for (let i = 0; i < 50; i++) {
      flakes.push({
        id: i,
        left: `${Math.random() * 100}vw`,
        animationDuration: `${Math.random() * 5 + 5}s`,
        animationDelay: `${Math.random() * 5}s`,
        fontSize: `${Math.random() * 10 + 10}px`,
        opacity: Math.random() * 0.5 + 0.3,
        symbol: symbols[Math.floor(Math.random() * symbols.length)],
      });
    }
    
    setSnowflakes(flakes);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
      {snowflakes.map((flake) => (
        <div
          key={flake.id}
          className="absolute -top-2 text-white animate-snowfall"
          style={{
            left: flake.left,
            animationDuration: flake.animationDuration,
            animationDelay: flake.animationDelay,
            fontSize: flake.fontSize,
            opacity: flake.opacity,
          }}
        >
          {flake.symbol}
        </div>
      ))}
    </div>
  );
};

export default SnowEffect;
