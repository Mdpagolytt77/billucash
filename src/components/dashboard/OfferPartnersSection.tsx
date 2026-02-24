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

const offerwallGradients: Record<string, string> = {
  'Offery': 'linear-gradient(135deg, #0F3D3E, #1DBF73)',
  'Notik': 'linear-gradient(135deg, #1F1C2C, #928DAB)',
  'AdToWall': 'linear-gradient(135deg, #134E5E, #71B280)',
  'Adtowall': 'linear-gradient(135deg, #134E5E, #71B280)',
  'Pubscale': 'linear-gradient(135deg, #1E3C72, #2A5298)',
  'PubScale': 'linear-gradient(135deg, #1E3C72, #2A5298)',
  'GemiAd': 'linear-gradient(135deg, #3A1C71, #D76D77)',
  'Mobivortex': 'linear-gradient(135deg, #42275a, #734b6d)',
  'Adswed': 'linear-gradient(135deg, #000428, #004e92)',
  'Adsved': 'linear-gradient(135deg, #000428, #004e92)',
  'RadiantWall': 'linear-gradient(135deg, #2c3e50, #e74c3c)',
  'Radientwall': 'linear-gradient(135deg, #2c3e50, #e74c3c)',
  'Upwall': 'linear-gradient(135deg, #1D4350, #A43931)',
  'Adbreak': 'linear-gradient(135deg, #141E30, #243B55)',
  'Revtoo': 'linear-gradient(135deg, #0F2027, #2C5364)',
  'Primewall': 'linear-gradient(135deg, #2C003E, #4B0082)',
  'Adscend': 'linear-gradient(135deg, #0d4a4a, #0a3636)',
  'Admantium': 'linear-gradient(135deg, #3d1f1f, #5c2e2e)',
  'Mylead': 'linear-gradient(135deg, #2d2d44, #1a1035)',
  'Lootably': 'linear-gradient(135deg, #3d2d4a, #2a1a38)',
  'Adgatemedia': 'linear-gradient(135deg, #2d4a0d, #1a3006)',
  'Pixylabs': 'linear-gradient(135deg, #0d2d4a, #061a30)',
};

const OfferPartnersSection = ({ title, partners, onPartnerClick }: OfferPartnersSectionProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir === 'left' ? -200 : 200, behavior: 'smooth' });
    }
  };

  const getBadgeStyle = (type: 'hot' | 'new' | 'bonus') => {
    switch (type) {
      case 'hot': return { background: '#FF6B35', color: '#FFFFFF' };
      case 'new': return { background: '#1DBF73', color: '#FFFFFF' };
      case 'bonus': return { background: '#1DBF73', color: '#FFFFFF' };
      default: return {};
    }
  };

  const getCardBackground = (name: string, color: string) => {
    return offerwallGradients[name] || `linear-gradient(135deg, ${color}, ${color}cc)`;
  };

  const renderStars = (rating: number) => (
    <div className="flex gap-0.5 justify-center mt-2">
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
    <section className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5" style={{ color: '#1DBF73' }} />
          <h3 className="font-bold text-xl text-white">{title}</h3>
        </div>
      </div>
      
      {/* Wrap in a box container */}
      <div 
        className="rounded-2xl p-5"
        style={{ background: '#0E1A27', border: '1px solid #162638' }}
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 justify-items-center">
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
              className="cursor-pointer group transition-all duration-300"
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.03)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <div 
                className="relative overflow-hidden flex flex-col items-center justify-center p-4"
                style={{
                  width: '210px',
                  height: '270px',
                  borderRadius: '18px',
                  background: getCardBackground(partner.name, partner.color),
                  border: '1px solid rgba(255,255,255,0.08)',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
                }}
              >
                {/* Badge */}
                {partner.badge && (
                  <div 
                    className="absolute top-3 right-3 px-2.5 py-1 rounded-[10px] text-xs font-bold flex items-center gap-0.5"
                    style={getBadgeStyle(partner.badge.type)}
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
                    className="h-14 object-contain mb-3"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-white/10 flex items-center justify-center mb-3">
                    <span className="text-2xl font-black text-white/90">{partner.name.charAt(0)}</span>
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
      </div>
    </section>
  );
};

export default OfferPartnersSection;
