interface FeaturedOffersSectionProps {
  onOfferClick?: () => void;
}

const featuredOffers = [
  {
    title: 'Monopoly Go!',
    description: 'Complete offers on Tak...',
    reward: '$46.97',
    image: '/placeholder.svg',
    color: 'from-green-500 to-green-600',
  },
  {
    title: 'Smash Party',
    description: 'Complete offers on Tak...',
    reward: '$8.05',
    image: '/placeholder.svg',
    color: 'from-purple-500 to-purple-600',
  },
  {
    title: 'Merge Blast',
    description: 'Complete offers on Tak...',
    reward: '$14.91',
    image: '/placeholder.svg',
    color: 'from-blue-500 to-blue-600',
  },
];

const FeaturedOffersSection = ({ onOfferClick }: FeaturedOffersSectionProps) => {
  return (
    <section className="py-6 px-4">
      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
        {featuredOffers.map((offer, index) => (
          <div
            key={index}
            onClick={onOfferClick}
            className="min-w-[160px] bg-muted rounded-xl overflow-hidden flex-shrink-0 group cursor-pointer transition-transform hover:-translate-y-1"
          >
            <div className={`h-24 bg-gradient-to-br ${offer.color} flex items-center justify-center`}>
              <img 
                src={`https://images.unsplash.com/photo-1511512578047-dfb367046420?w=200&h=150&fit=crop`}
                alt={offer.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
            <div className="p-3">
              <h3 className="font-semibold text-sm truncate">{offer.title}</h3>
              <p className="text-xs text-muted-foreground truncate">{offer.description}</p>
              <p className="text-primary font-bold mt-1">{offer.reward}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FeaturedOffersSection;