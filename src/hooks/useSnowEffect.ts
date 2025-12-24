import { useState, useEffect } from 'react';

export const useSnowEffect = () => {
  const [snowEnabled, setSnowEnabled] = useState(() => {
    const saved = localStorage.getItem('snowEnabled');
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem('snowEnabled', JSON.stringify(snowEnabled));
  }, [snowEnabled]);

  const toggleSnow = () => setSnowEnabled(!snowEnabled);

  return { snowEnabled, toggleSnow };
};
