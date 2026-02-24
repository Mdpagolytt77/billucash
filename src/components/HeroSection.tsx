import { useSiteSettings } from '@/contexts/SiteSettingsContext';

const HeroSection = () => {
  const { homepageImages } = useSiteSettings();

  return (
    <section className="relative px-4 pt-6 pb-2 md:pt-10 md:pb-4">
      {/* Background image if set */}
      {homepageImages.heroIllustration && (
        <div 
          className="absolute inset-0 z-0 opacity-30"
          style={{
            backgroundImage: `url(${homepageImages.heroIllustration})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            maskImage: 'linear-gradient(to bottom, black 40%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 40%, transparent 100%)',
          }}
        />
      )}

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <h1 className="text-xl md:text-2xl lg:text-3xl font-display font-bold leading-tight mb-2">
          <span className="text-primary">Get paid</span>{' '}
          <span className="text-foreground">for</span>
          <br />
          <span className="text-foreground">Testing Apps, Games and Surveys</span>
        </h1>

        <p className="text-xs md:text-sm text-muted-foreground max-w-lg mx-auto">
          Earn up to <span className="font-bold text-foreground">$10.00</span> per offer
        </p>
      </div>
    </section>
  );
};

export default HeroSection;
