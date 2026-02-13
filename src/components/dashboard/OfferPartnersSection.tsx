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
            className={`w-3 h-3 ${
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
      
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
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
            className="flex-shrink-0 w-[130px] cursor-pointer group perspective-[800px]"
          >
            {/* Card - Larger 3D portrait design */}
            <div 
              className={`relative w-full h-[175px] rounded-2xl overflow-hidden border transition-all duration-500 transform group-hover:scale-[1.08] group-hover:-translate-y-2 group-hover:rotate-y-3 flex flex-col items-center justify-center p-3 ${
                isPremium ? 'border-transparent' : 'border-white/10'
              }`}
              style={getGradientStyle(partner.color, isPremium)}
            >
              {/* Top glow light effect */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-12 bg-white/15 blur-2xl rounded-full" />
              
              {/* Badge */}
              {partner.badge && (
                <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-md text-[9px] font-bold flex items-center gap-0.5 ${getBadgeStyle(partner.badge.type)}`}>
                  {partner.badge.type === 'hot' && <Flame className="w-2.5 h-2.5" />}
                  {partner.badge.text}
                </div>
              )}
              
              {/* Shine sweep effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Bottom shadow for 3D depth */}
              <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-black/40 to-transparent" />
              
              {/* Logo - larger and centered */}
              <div className="flex items-center justify-center mb-3 relative z-10">
                {partner.logoUrl ? (
                  <img 
                    src={partner.logoUrl} 
                    alt={partner.name}
                    className="w-16 h-16 object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/25 shadow-lg">
                    <span className="text-xl font-bold text-white drop-shadow-lg">
                      {partner.name.substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Name */}
              <h4 className="text-xs font-bold text-center text-white truncate w-full px-1 relative z-10 drop-shadow-md">{partner.name}</h4>
              
              {/* Rating */}
              <div className="flex justify-center mt-1.5 relative z-10">
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
