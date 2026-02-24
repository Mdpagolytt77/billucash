import { useSiteSettings } from '@/contexts/SiteSettingsContext';

const HeroSection = () => {
  const { homepageImages } = useSiteSettings();

  return (
    <section className="relative px-4 pt-10 pb-4 md:pt-16 md:pb-6">
      {/* Background image if set */}
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

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto text-center">
        {/* Small heading */}
        <p className="text-accent text-sm md:text-base font-semibold tracking-wide mb-3 uppercase">
          #1 Trusted Earning Platform
        </p>

        {/* Main heading */}
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-extrabold leading-tight mb-4">
          <span className="text-foreground">Get </span>
          <span className="text-gradient">Paid</span>
          <span className="text-foreground"> for</span>
          <br />
          <span className="text-foreground">Testing </span>
          <span className="text-gradient">Apps, Games</span>
          <span className="text-foreground"> &</span>
          <br />
          <span className="text-gradient">Surveys</span>
        </h1>

        {/* Subtext */}
        <p className="text-sm md:text-base text-muted-foreground max-w-lg mx-auto leading-relaxed">
          Earn up to <span className="font-bold text-foreground">$10.00</span> per offer. Complete simple tasks, play games, and get paid instantly.
        </p>
      </div>
    </section>
  );
};

export default HeroSection;
