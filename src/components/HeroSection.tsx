import { useSiteSettings } from '@/contexts/SiteSettingsContext';

const HeroSection = () => {
  const { homepageImages } = useSiteSettings();

  return (
    <section className="relative px-4 pt-8 pb-4 md:pt-16 md:pb-8">
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
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-display font-bold leading-tight mb-4">
          <span className="text-primary">Earn rewards.</span>{' '}
          <span className="text-foreground">testing apps,</span>
          <br />
          <span className="text-foreground">anywhere & anytime.</span>
        </h1>

        <p className="text-sm md:text-base text-muted-foreground max-w-lg mx-auto">
          Earn money online up to <span className="font-bold text-foreground">$14.99</span> per offer{' '}
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="font-medium text-foreground">340</span> available offers now
          </span>
        </p>
      </div>
    </section>
  );
};

export default HeroSection;
