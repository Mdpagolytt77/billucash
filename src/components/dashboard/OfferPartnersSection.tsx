import { HelpCircle, ChevronRight, Star, Flame } from 'lucide-react';

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
        return 'bg-gradient-to-r from-orange-500 to-red-500 text-white';
      case 'new':
        return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white';
      case 'bonus':
        return 'bg-gradient-to-r from-primary to-secondary text-white';
      default:
        return 'bg-muted text-foreground';
    }
  };

  const getGradientStyle = (color: string, isPremium: boolean) => {
    if (isPremium) {
      return {
        background: `linear-gradient(145deg, ${color}dd, ${color}99, ${color}66)`,
      };
    }
    return {
      background: `linear-gradient(145deg, hsl(var(--card)), hsl(var(--muted)))`,
      borderColor: `${color}44`,
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
                ? 'fill-yellow-400 text-yellow-400' 
                : star - 0.5 <= rating 
                  ? 'fill-yellow-400/50 text-yellow-400' 
                  : 'fill-muted text-muted-foreground'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          {isPremium ? (
            <div className="w-5 h-5 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center">
              <span className="text-[10px]">💎</span>
            </div>
          ) : (
            <Flame className="w-5 h-5 text-primary" />
          )}
          <h3 className="font-display font-bold text-lg">{title}</h3>
          <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
        </div>
        <button className="flex items-center gap-1 text-xs text-primary hover:underline">
          View All <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
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
            className="flex-shrink-0 w-24 cursor-pointer group"
          >
            {/* Card */}
            <div 
              className={`relative w-full aspect-square rounded-xl overflow-hidden mb-2 border transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg ${
                isPremium ? 'border-transparent' : 'border-border/50'
              }`}
              style={getGradientStyle(partner.color, isPremium)}
            >
              {/* Badge */}
              {partner.badge && (
                <div className={`absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center gap-0.5 ${getBadgeStyle(partner.badge.type)}`}>
                  {partner.badge.type === 'hot' && <Flame className="w-2.5 h-2.5" />}
                  {partner.badge.text}
                </div>
              )}
              
              {/* Logo */}
              <div className="absolute inset-0 flex items-center justify-center p-3">
                {partner.logoUrl ? (
                  <img 
                    src={partner.logoUrl} 
                    alt={partner.name}
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <span className="text-lg font-bold text-white drop-shadow-lg">
                    {partner.name.substring(0, 2)}
                  </span>
                )}
              </div>
            </div>
            
            {/* Name */}
            <h4 className="text-xs font-semibold text-center text-foreground truncate">{partner.name}</h4>
            
            {/* Rating */}
            <div className="flex justify-center mt-0.5">
              {renderStars(partner.rating)}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default OfferPartnersSection;
