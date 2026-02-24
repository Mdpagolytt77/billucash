import { useRef } from 'react';
import { Star, Flame, ChevronLeft, ChevronRight, Layers } from 'lucide-react';

interface OfferPartner {
  id: string;
  name: string;
  logoUrl?: string;
  color: string;
  iframeUrl: string;
  rating: number;
  badge?: { text: string; type: 'hot' | 'new' | 'bonus' };
  popupWidth?: string;
  popupHeight?: string;
  popupAnimation?: 'fade' | 'slide' | 'scale';
}

interface OfferPartnersSectionProps {
  title: string;
  partners: OfferPartner[];
  isPremium?: boolean;
  cardHeight?: number;
  cardColumns?: number;
  cardGap?: number;
  cardBorderRadius?: number;
  mobileCardHeight?: number;
  cardPadding?: number;
  onPartnerClick: (partner: { name: string; color: string; iframeUrl: string; popupWidth?: string; popupHeight?: string; popupAnimation?: 'fade' | 'slide' | 'scale' }) => void;
}

const OfferPartnersSection = ({ title, partners, isPremium = false, onPartnerClick }: OfferPartnersSectionProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir === 'left' ? -200 : 200, behavior: 'smooth' });
    }
  };

  const getBadgeStyle = (type: 'hot' | 'new' | 'bonus') => {
    switch (type) {
      case 'hot': return 'bg-orange-500 text-white';
      case 'new': return 'bg-primary text-primary-foreground';
      case 'bonus': return 'bg-emerald-500 text-white';
      default: return '';
    }
  };

  const defaultGradients = [
    'linear-gradient(135deg, #0d4a4a, #0a3636)',
    'linear-gradient(135deg, #1E3A8A, #0F172A)',
    'linear-gradient(135deg, #134e5e, #0a2e38)',
    'linear-gradient(135deg, #16A34A, #065F46)',
    'linear-gradient(135deg, #1a3a5c, #0e2240)',
    'linear-gradient(135deg, #2d1f4e, #1a1035)',
  ];

  const getCardBackground = (color: string, index: number) => {
    if (color && color !== '#1a1a2e' && color !== '#2bd96f') {
      return `linear-gradient(135deg, ${color}, ${color}cc)`;
    }
    return defaultGradients[index % defaultGradients.length];
  };

  const renderStars = (rating: number) => (
    <div className="flex gap-0.5 justify-center mt-1.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className="w-3.5 h-3.5"
          style={{
            fill: star <= rating ? '#FFD700' : star - 0.5 <= rating ? 'rgba(255,215,0,0.5)' : 'rgba(255,255,255,0.15)',
            color: star <= rating ? '#FFD700' : 'rgba(255,255,255,0.2)',
          }}
        />
      ))}
    </div>
  );

  return (
    <section className="mb-5">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-emerald-400" />
          <h3 className="font-display font-bold text-base text-foreground">{title}</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => scroll('left')}
            className="w-7 h-7 rounded-lg bg-card border border-border/50 flex items-center justify-center hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="w-7 h-7 rounded-lg bg-card border border-border/50 flex items-center justify-center hover:bg-muted transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
        {partners.map((partner, index) => (
          <div
            key={partner.id}
            onClick={() => onPartnerClick({ 
              name: partner.name, 
              color: partner.color, 
              iframeUrl: partner.iframeUrl,
              popupWidth: partner.popupWidth,
              popupHeight: partner.popupHeight,
              popupAnimation: partner.popupAnimation,
            })}
            className="cursor-pointer group transition-all duration-200 active:scale-[0.97]"
          >
            <div 
              className="relative w-full h-[180px] md:h-[200px] rounded-2xl overflow-hidden flex flex-col items-center justify-center p-3"
              style={{
                background: getCardBackground(partner.color, index),
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {/* Badge */}
              {partner.badge && (
                <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-md text-[9px] font-bold flex items-center gap-0.5 ${getBadgeStyle(partner.badge.type)}`}>
                  {partner.badge.type === 'hot' && <Flame className="w-2.5 h-2.5" />}
                  {partner.badge.text}
                </div>
              )}

              {/* Logo */}
              {partner.logoUrl ? (
                <img 
                  src={partner.logoUrl} 
                  alt={partner.name}
                  className="h-12 object-contain mb-3"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-white/10 flex items-center justify-center mb-3">
                  <span className="text-lg font-black text-white/90">{partner.name.charAt(0)}</span>
                </div>
              )}

              {/* Name */}
              <h4 className="text-sm font-bold text-white text-center truncate w-full">{partner.name}</h4>
              
              {/* Rating */}
              {renderStars(partner.rating)}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default OfferPartnersSection;
