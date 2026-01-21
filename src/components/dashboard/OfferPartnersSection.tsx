import { HelpCircle, ChevronRight, Star, Flame, Crown } from 'lucide-react';

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
        background: `linear-gradient(145deg, ${color}ee, ${color}aa, ${color}77)`,
        boxShadow: `0 10px 25px -10px ${color}66, 0 5px 15px -5px rgba(0,0,0,0.3)`,
      };
    }
    return {
      background: `linear-gradient(145deg, hsl(var(--card)), hsl(var(--muted)))`,
      borderColor: `${color}55`,
      boxShadow: `0 8px 20px -8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)`,
    };
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-2.5 h-2.5 ${
              star <= rating 
                ? 'fill-yellow-400 text-yellow-400 drop-shadow-sm' 
                : star - 0.5 <= rating 
                  ? 'fill-yellow-400/50 text-yellow-400' 
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
          <HelpCircle className="w-4 h-4 text-muted-foreground/50 cursor-help hover:text-muted-foreground transition-colors" />
        </div>
        <button className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium transition-colors">
          View All <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      
      <div className="flex gap-2.5 overflow-x-auto pb-3 scrollbar-hide">
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
            className="flex-shrink-0 w-[85px] cursor-pointer group"
          >
            {/* Card - Tall portrait design like reference */}
            <div 
              className={`relative w-full h-[110px] rounded-xl overflow-hidden border transition-all duration-300 transform group-hover:scale-105 group-hover:-translate-y-1 flex flex-col items-center justify-center p-2 ${
                isPremium ? 'border-transparent' : 'border-border/30'
              }`}
              style={getGradientStyle(partner.color, isPremium)}
            >
              {/* Badge */}
              {partner.badge && (
                <div className={`absolute top-1 right-1 px-1.5 py-0.5 rounded text-[8px] font-bold flex items-center gap-0.5 ${getBadgeStyle(partner.badge.type)}`}>
                  {partner.badge.type === 'hot' && <Flame className="w-2 h-2" />}
                  {partner.badge.text}
                </div>
              )}
              
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Logo - centered */}
              <div className="flex items-center justify-center mb-2">
                {partner.logoUrl ? (
                  <img 
                    src={partner.logoUrl} 
                    alt={partner.name}
                    className="w-10 h-10 object-contain drop-shadow-lg"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                    <span className="text-sm font-bold text-white drop-shadow-lg">
                      {partner.name.substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Name */}
              <h4 className="text-[10px] font-bold text-center text-white truncate w-full px-1 group-hover:text-primary transition-colors">{partner.name}</h4>
              
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
