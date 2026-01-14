const providers = [
  'PremReach',
  'SUSHI ADS',
  'AdWebMedia',
  'PubScale',
];

const ProvidersSection = () => {
  return (
    <section className="py-10 px-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl md:text-3xl font-display font-bold text-primary mb-2">
          Providers
        </h2>
        <p className="text-muted-foreground text-sm">
          We work with the best providers to ensure you have the best experience
        </p>
      </div>
      
      <div className="bg-muted rounded-2xl p-6 max-w-3xl mx-auto">
        <div className="flex flex-wrap justify-center items-center gap-8">
          {providers.map((provider, index) => (
            <div
              key={index}
              className="text-lg md:text-xl font-bold text-muted-foreground opacity-70 hover:opacity-100 hover:text-foreground transition-all cursor-pointer"
            >
              {provider}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProvidersSection;
