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
  cardHeight?: number;
  cardColumns?: number;
  onPartnerClick: (partner: { name: string; color: string; iframeUrl: string; popupWidth?: string; popupHeight?: string; popupAnimation?: 'fade' | 'slide' | 'scale' }) => void;
}

const OfferPartnersSection = ({ title, partners, isPremium = false, cardHeight = 200, cardColumns = 5, onPartnerClick }: OfferPartnersSectionProps) => {
  const getBadgeStyle = (type: 'hot' | 'new' | 'bonus') => {
    switch (type) {
      case 'hot':
        return { background: '#2563EB', color: 'white' };
      case 'new':
        return { background: '#00C6FF', color: 'white' };
      case 'bonus':
        return { background: '#0284C7', color: 'white' };
      default:
        return {};
    }
  };

  const defaultGradients = [
    'linear-gradient(135deg, #00C6FF, #0072FF)',
    'linear-gradient(135deg, #1E3A8A, #0F172A)',
    'linear-gradient(135deg, #22D3EE, #0284C7)',
    'linear-gradient(135deg, #16A34A, #065F46)',
    'linear-gradient(135deg, #2563EB, #1E40AF)',
    'linear-gradient(135deg, #00C6FF, #003566)',
  ];

  const getCardBackground = (color: string, index: number) => {
    if (color && color !== '#1a1a2e' && color !== '#2bd96f') {
      // Use admin-set color as a gradient base
      return `linear-gradient(135deg, ${color}, ${color}cc)`;
    }
    return defaultGradients[index % defaultGradients.length];
  };

  const renderStars = (rating: number) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className="w-3.5 h-3.5"
          style={{
            fill: star <= rating ? '#FFD700' : star - 0.5 <= rating ? 'rgba(255,215,0,0.5)' : 'rgba(255,255,255,0.1)',
            color: star <= rating ? '#FFD700' : 'rgba(255,255,255,0.2)',
          }}
        />
      ))}
    </div>
  );

  return (
    <section className="mb-8">
      {/* Section Container */}
      <div 
        className="p-6"
        style={{
          background: isPremium ? '#0B1220' : '#0F172A',
          borderRadius: '22px',
          border: `1px solid rgba(0,170,255,${isPremium ? '0.35' : '0.3'})`,
          boxShadow: '0 0 30px rgba(0,170,255,0.15)',
        }}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            {isPremium ? (
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
                <Crown className="w-4 h-4 text-white" />
              </div>
            ) : (
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #00C6FF, #0072FF)' }}>
                <Flame className="w-4 h-4 text-white" />
              </div>
            )}
            <h3 className="font-display font-bold text-lg text-white">{title}</h3>
          </div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3" style={{ '--lg-cols': cardColumns } as React.CSSProperties} id="offer-grid">
          <style>{`@media (min-width: 1024px) { #offer-grid { grid-template-columns: repeat(var(--lg-cols), minmax(0, 1fr)) !important; } }`}</style>
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
              className="cursor-pointer group"
            >
              <div 
                className="relative w-full overflow-hidden transition-all duration-300 ease-out transform group-hover:scale-[1.05] group-hover:-translate-y-1.5 flex flex-col items-center justify-center p-4 max-sm:!h-[160px]"
                style={{
                  height: `${cardHeight}px`,
                  borderRadius: '20px',
                  background: getCardBackground(partner.color, index),
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 25px rgba(0,170,255,0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Badge */}
                {partner.badge && (
                  <div 
                    className="absolute top-2.5 right-2.5 px-3 py-1 rounded-[20px] text-[10px] font-bold flex items-center gap-1"
                    style={{
                      ...getBadgeStyle(partner.badge.type),
                      minWidth: '55px',
                      height: '24px',
                      justifyContent: 'center',
                    }}
                  >
                    {partner.badge.type === 'hot' && <Flame className="w-3 h-3" />}
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
                  <span className="text-lg font-black text-white drop-shadow-lg tracking-wide mb-3">
                    {partner.name}
                  </span>
                )}

                {/* Name */}
                <h4 className="text-xs font-semibold text-white/90 truncate w-full text-center">{partner.name}</h4>
                {/* Rating */}
                <div className="flex justify-center mt-2">
                  {renderStars(partner.rating)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default OfferPartnersSection;
