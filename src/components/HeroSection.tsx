import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import FeaturedOffersSection from '@/components/FeaturedOffersSection';

const heroPhrases = [
  "Get Paid For Testing Apps & Games",
  "Earn Money Watching Videos",
  "Complete Surveys & Get Rewarded",
  "Refer Friends & Earn Together",
  "Withdraw Instantly To Your Wallet",
];

const HeroTypingText = () => {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const phrase = heroPhrases[phraseIndex];
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (currentText.length < phrase.length) {
          setCurrentText(phrase.slice(0, currentText.length + 1));
        } else {
          setTimeout(() => setIsDeleting(true), 1500);
        }
      } else {
        if (currentText.length > 0) {
          setCurrentText(currentText.slice(0, -1));
        } else {
          setIsDeleting(false);
          setPhraseIndex((prev) => (prev + 1) % heroPhrases.length);
        }
      }
    }, isDeleting ? 40 : 70);
    return () => clearTimeout(timeout);
  }, [currentText, isDeleting, phraseIndex]);

  return (
    <>
      <span className="text-rainbow">{currentText}</span>
      <span className="inline-block w-1 h-[1em] bg-primary ml-1 animate-blink align-middle" />
    </>
  );
};

interface HeroSectionProps {
  onOfferClick?: () => void;
}

const HeroSection = ({ onOfferClick }: HeroSectionProps) => {
  const { homepageImages } = useSiteSettings();

  return (
    <section className="relative px-4 pt-8 pb-6 md:pt-14 md:pb-10 overflow-hidden">
      {/* Background image overlay */}
      {homepageImages.heroIllustration && (
        <div 
          className="absolute inset-0 z-0 opacity-20"
          style={{
            backgroundImage: `url(${homepageImages.heroIllustration})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            maskImage: 'linear-gradient(to bottom, black 40%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 40%, transparent 100%)',
          }}
        />
      )}

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        {/* Headline */}
        <div className="font-display font-extrabold leading-tight mb-3 flex flex-col items-center">
          <span className="text-primary text-[10px] md:text-xs lg:text-sm font-bold tracking-wider uppercase mb-1">
            <HeroTypingText />
          </span>
          <h1 className="text-foreground text-lg md:text-2xl lg:text-3xl">WELCOME</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-8">
          Earn up to <span className="font-bold text-foreground">$50.00</span> per offer
        </p>

        {/* Featured Offer Cards */}
        <div className="mb-6">
          <FeaturedOffersSection onOfferClick={onOfferClick} />
        </div>

        {/* Trustpilot-style rating */}
        <div className="flex flex-col items-center gap-1 mb-6">
          <p className="text-xs text-muted-foreground">See our 120 reviews on</p>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-primary fill-primary" />
            <span className="text-sm font-bold text-foreground">Trustpilot</span>
            <div className="flex gap-0.5 ml-1">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-5 h-5 rounded-sm flex items-center justify-center" style={{ background: '#1DBF73' }}>
                  <Star className="w-3 h-3 text-white fill-white" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <Link
          to="/signup"
          className="inline-flex items-center gap-2 px-8 py-3 rounded-lg font-display font-bold text-sm uppercase tracking-wider transition-all hover:-translate-y-1 text-foreground border border-border"
          style={{
            background: '#162235',
          }}
        >
          START EARNING NOW
        </Link>
      </div>
    </section>
  );
};

export default HeroSection;
