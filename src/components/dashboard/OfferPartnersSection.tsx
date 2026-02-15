import { Star, Flame, Crown } from 'lucide-react';

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
  onPartnerClick: (partner: { name: string; color: string; iframeUrl: string; popupWidth?: string; popupHeight?: string; popupAnimation?: 'fade' | 'slide' | 'scale' }) => void;
}

const OfferPartnersSection = ({ title, partners, isPremium = false, onPartnerClick }: OfferPartnersSectionProps) => {
  const getBadgeStyle = (type: 'hot' | 'new' | 'bonus') => {
    switch (type) {
      case 'hot':
        return 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg shadow-orange-500/30';
      case 'new':
        return 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30';
      case 'bonus':
        return 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/30';
      default:
        return 'bg-muted text-foreground';
    }
  };

  const getGradientStyle = (color: string, isPremium: boolean) => {
    if (isPremium) {
      return {
        background: `linear-gradient(160deg, ${color}ff, ${color}cc 40%, ${color}88 80%, ${color}55)`,
        boxShadow: `0 15px 35px -10px ${color}88, 0 8px 20px -5px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.2), inset 0 -2px 4px rgba(0,0,0,0.3)`,
      };
    }
    return {
      background: `linear-gradient(160deg, ${color}dd, ${color}99 40%, ${color}55 80%, hsl(var(--card)))`,
      borderColor: `${color}66`,
      boxShadow: `0 15px 35px -10px ${color}44, 0 8px 20px -5px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.15), inset 0 -2px 4px rgba(0,0,0,0.3)`,
    };
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-3.5 h-3.5 ${
              star <= rating 
                ? 'fill-[#FFC107] text-[#FFC107]' 
                : star - 0.5 <= rating 
                  ? 'fill-[#FFC107]/50 text-[#FFC107]' 
                  : 'fill-muted text-muted-foreground/30'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          {isPremium ? (
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <Crown className="w-4 h-4 text-white" />
            </div>
          ) : (
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/30">
              <Flame className="w-4 h-4 text-white" />
            </div>
          )}
          <h3 className="font-display font-bold text-lg bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{title}</h3>
        </div>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-[18px]">
        {partners.map((partner) => (
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
            className="cursor-pointer group"
          >
            {/* Card */}
            <div 
              className="relative w-full overflow-hidden transition-all duration-300 transform group-hover:scale-[1.03] group-hover:-translate-y-1 flex flex-col items-center justify-center p-5"
              style={{
                height: '120px',
                borderRadius: '16px',
                background: '#111111',
                border: '1px solid #1f1f1f',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.border = '1px solid hsl(var(--primary) / 0.4)';
                e.currentTarget.style.boxShadow = `0 0 15px 2px hsl(var(--primary) / 0.12), 0 0 30px 4px hsl(var(--primary) / 0.06)`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.border = '1px solid #1f1f1f';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Badge */}
              {partner.badge && (
                <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[9px] font-bold flex items-center gap-0.5 ${getBadgeStyle(partner.badge.type)}`}>
                  {partner.badge.type === 'hot' && <Flame className="w-2.5 h-2.5" />}
                  {partner.badge.text}
                </div>
              )}

              {/* Logo */}
              {partner.logoUrl ? (
                <img 
                  src={partner.logoUrl} 
                  alt={partner.name}
                  className="h-10 object-contain mb-2"
                />
              ) : (
                <span className="text-base font-black text-white drop-shadow-lg tracking-wide mb-2">
                  {partner.name}
                </span>
              )}

              {/* Name */}
              <h4 className="text-xs font-semibold text-foreground truncate w-full text-center">{partner.name}</h4>
              {/* Rating */}
              <div className="flex justify-center mt-1">
                {renderStars(partner.rating)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default OfferPartnersSection;
