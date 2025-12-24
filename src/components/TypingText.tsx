import { useState, useEffect } from 'react';

const phrases = [
  "Watching Videos",
  "Playing Games",
  "Completing Tasks",
  "Referring Friends"
];

const TypingText = () => {
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentPhrase = phrases[currentPhraseIndex];
    
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (currentText.length < currentPhrase.length) {
          setCurrentText(currentPhrase.slice(0, currentText.length + 1));
        } else {
          setTimeout(() => setIsDeleting(true), 1200);
        }
      } else {
        if (currentText.length > 0) {
          setCurrentText(currentText.slice(0, -1));
        } else {
          setIsDeleting(false);
          setCurrentPhraseIndex((prev) => (prev + 1) % phrases.length);
        }
      }
    }, isDeleting ? 50 : 100);

    return () => clearTimeout(timeout);
  }, [currentText, isDeleting, currentPhraseIndex]);

  return (
    <div className="text-2xl md:text-3xl lg:text-4xl font-display font-extrabold mb-6 min-h-[50px] flex items-center justify-center">
      <span className="text-gradient">{currentText}</span>
      <span className="inline-block w-1 h-8 md:h-10 bg-primary ml-1 animate-blink" />
    </div>
  );
};

export default TypingText;
