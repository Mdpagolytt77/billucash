import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import FeaturedOffersSection from '@/components/FeaturedOffersSection';

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
        <p className="text-sm md:text-base font-semibold tracking-wide mb-2 text-primary uppercase">
          Get paid for
        </p>
        <h1 className="text-2xl md:text-4xl lg:text-5xl font-display font-extrabold leading-tight mb-3 text-foreground">
          Testing Apps, Games and Surveys
        </h1>
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
