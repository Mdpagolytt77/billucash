import { Star, Flame, Layers } from 'lucide-react';

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
    <div className="flex gap-0.5 justify-center mt-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className="w-2.5 h-2.5"
          style={{
            fill: star <= rating ? '#FFD700' : star - 0.5 <= rating ? 'rgba(255,215,0,0.5)' : 'rgba(255,255,255,0.15)',
            color: star <= rating ? '#FFD700' : 'rgba(255,255,255,0.2)',
          }}
        />
      ))}
    </div>
  );

  const renderCard = (partner: OfferPartner) => (
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
      className="snake-glow-card flex-shrink-0 cursor-pointer group transition-all duration-300 overflow-visible"
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.03)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
    >
      <div 
        className="relative z-10 overflow-hidden flex flex-col items-center justify-center p-2"
        style={{
          width: '108px',
          height: '160px',
          borderRadius: '16px',
          background: getCardBackground(partner.name, partner.color),
        }}
      >
        {partner.badge && (
          <div 
            className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md text-[8px] font-bold flex items-center gap-0.5"
            style={getBadgeStyle(partner.badge.type)}
          >
            {partner.badge.type === 'hot' && <Flame className="w-2.5 h-2.5" />}
            {partner.badge.text}
          </div>
        )}
        {partner.logoUrl ? (
          <img src={partner.logoUrl} alt={partner.name} className="h-8 object-contain mb-1" />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center mb-1">
            <span className="text-sm font-black text-white/90">{partner.name.charAt(0)}</span>
          </div>
        )}
        <h4 className="text-[9px] font-bold text-white text-center truncate w-full">{partner.name}</h4>
        {renderStars(partner.rating)}
      </div>
    </div>
  );

  // Split partners into 3 rows
  const perRow = Math.ceil(partners.length / 3);
  const row1 = partners.slice(0, perRow);
  const row2 = partners.slice(perRow, perRow * 2);
  const row3 = partners.slice(perRow * 2);

  const rowLabels = ['🎯 Offer Partners', '💎 Premium Partners', '📋 Survey Partners'];
  const rows = [row1, row2, row3].filter(r => r.length > 0);

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 fire-icon" />
          <h3 className="font-bold text-lg text-rainbow">{title}</h3>
        </div>
      </div>
      
      <div className="flex flex-col gap-4">
        {rows.map((row, idx) => (
          <div key={idx}>
            <p className="text-sm font-semibold mb-2 ml-1" style={{ color: '#9DB2C7', fontFamily: "'Playfair Display', serif" }}>
              {rowLabels[idx]}
            </p>
            <div 
              className="rounded-2xl p-3"
              style={{ background: '#0E1A27', border: '1px solid #162638' }}
            >
              <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
                {row.map(renderCard)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default OfferPartnersSection;
