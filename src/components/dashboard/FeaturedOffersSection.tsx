import { Flame, ChevronRight } from 'lucide-react';
import { CoinIcon } from '@/contexts/SiteSettingsContext';

interface FeaturedOffer {
  id: string;
  name: string;
  description: string;
  coins: number;
  image?: string;
  color: string;
}

interface FeaturedOffersSectionProps {
  onOfferClick: (offer: { name: string; color: string; iframeUrl: string }) => void;
}

const FeaturedOffersSection = ({ onOfferClick }: FeaturedOffersSectionProps) => {
  // Demo featured offers - these could come from database later
  const featuredOffers: FeaturedOffer[] = [
    { id: '1', name: 'Gamers Universe', description: 'Register and collect...', coins: 384441, color: '#1a1a2e' },
    { id: '2', name: 'Wizards Bag', description: 'Reach 5000m han...', coins: 142300, color: '#2d2d44' },
    { id: '3', name: 'Spaceship Rush', description: '1.Click on the Link...', coins: 109707, color: '#1e3a5f' },
    { id: '4', name: 'Hopping Pumpkin', description: '1.Click the link belo...', coins: 102393, color: '#3d2d4a' },
    { id: '5', name: 'Wild Fish', description: 'Install the app and...', coins: 98882, color: '#0d4a4a' },
  ];

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500" />
          <h3 className="font-display font-bold text-lg">Featured Offers</h3>
        </div>
        <button className="flex items-center gap-1 text-xs text-primary hover:underline">
          View All <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {featuredOffers.map((offer) => (
          <div
            key={offer.id}
            onClick={() => onOfferClick({ name: offer.name, color: offer.color, iframeUrl: '' })}
            className="flex-shrink-0 w-28 cursor-pointer group"
          >
            {/* Card Image */}
            <div 
              className="relative w-full aspect-[3/4] rounded-xl overflow-hidden mb-2 group-hover:scale-105 transition-transform duration-300"
              style={{ background: `linear-gradient(135deg, ${offer.color}, ${offer.color}dd)` }}
            >
              {/* Placeholder game icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                  <span className="text-2xl">🎮</span>
                </div>
              </div>
              
              {/* Top badge */}
              <div className="absolute top-2 right-2 w-5 h-5 rounded-md bg-white/10 flex items-center justify-center">
                <span className="text-[10px]">📱</span>
              </div>
            </div>
            
            {/* Info */}
            <h4 className="text-xs font-semibold text-foreground truncate">{offer.name}</h4>
            <p className="text-[10px] text-muted-foreground truncate mb-1">{offer.description}</p>
            
            {/* Coins */}
            <div className="flex items-center gap-1">
              <CoinIcon className="w-3 h-3" />
              <span className="text-xs font-bold text-primary">
                {offer.coins.toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FeaturedOffersSection;
