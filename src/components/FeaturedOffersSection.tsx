import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Star } from 'lucide-react';

interface FeaturedOffer {
  id: string;
  name: string;
  description: string | null;
  coins: number;
  image_url: string | null;
  color: string | null;
  link_url: string | null;
  is_active: boolean | null;
  sort_order: number | null;
}

interface FeaturedOffersSectionProps {
  onOfferClick?: () => void;
}

const FeaturedOffersSection = ({ onOfferClick }: FeaturedOffersSectionProps) => {
  const [offers, setOffers] = useState<FeaturedOffer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOffers = async () => {
      try {
        const { data, error } = await supabase
          .from('featured_offers')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true })
          .limit(3);

        if (error) throw error;
        setOffers(data || []);
      } catch (error) {
        console.error('Error loading featured offers:', error);
      } finally {
        setLoading(false);
      }
    };

    loadOffers();
  }, []);

  if (loading) {
    return (
      <div className="flex items-end justify-center gap-4 md:gap-6">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`rounded-2xl animate-pulse ${
              i === 1 ? 'w-[140px] md:w-[154px] h-[182px] md:h-[196px]' : 'w-[112px] md:w-[126px] h-[154px] md:h-[168px]'
            }`}
            style={{ background: '#111C2D', border: '1px solid rgba(29,191,115,0.2)' }}
          />
        ))}
      </div>
    );
  }

  if (offers.length === 0) return null;

  const displayOffers = offers.slice(0, 3);

  return (
    <div className="flex items-end justify-center gap-4 md:gap-6">
      <style>{`
        @keyframes borderGlow {
          0% { 
            background-position: 0% 50%;
            box-shadow: 0 0 20px rgba(29,191,115,0.5), 0 0 40px rgba(29,191,115,0.2);
          }
          15% { 
            background-position: 50% 0%;
            box-shadow: 0 0 25px rgba(0,200,255,0.5), 0 0 50px rgba(0,200,255,0.2);
          }
          30% { 
            background-position: 100% 0%;
            box-shadow: 0 0 30px rgba(168,85,247,0.5), 0 0 60px rgba(168,85,247,0.2);
          }
          45% { 
            background-position: 100% 50%;
            box-shadow: 0 0 25px rgba(255,107,53,0.5), 0 0 50px rgba(255,107,53,0.2);
          }
          60% { 
            background-position: 100% 100%;
            box-shadow: 0 0 30px rgba(255,215,0,0.5), 0 0 60px rgba(255,215,0,0.2);
          }
          75% { 
            background-position: 50% 100%;
            box-shadow: 0 0 25px rgba(236,72,153,0.5), 0 0 50px rgba(236,72,153,0.2);
          }
          100% { 
            background-position: 0% 50%;
            box-shadow: 0 0 20px rgba(29,191,115,0.5), 0 0 40px rgba(29,191,115,0.2);
          }
        }
        .featured-card-glow {
          position: relative;
        }
        .featured-card-glow::before {
          content: '';
          position: absolute;
          inset: -2px;
          border-radius: 18px;
          padding: 2px;
          background: linear-gradient(
            270deg,
            #1DBF73,
            #00C8FF,
            #A855F7,
            #FF6B35,
            #FFD700,
            #EC4899,
            #1DBF73
          );
          background-size: 600% 600%;
          animation: borderGlow 3s linear infinite;
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          z-index: 0;
        }
      `}</style>
      {displayOffers.map((offer, index) => {
        const isCenter = index === 1 || displayOffers.length === 1;

        return (
          <div
            key={offer.id}
            className="featured-card-glow flex-shrink-0 rounded-2xl overflow-visible cursor-pointer transition-all duration-300 group"
            onClick={onOfferClick}
            style={{
              width: isCenter ? '154px' : '126px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div className="relative z-10 rounded-2xl overflow-hidden h-full" style={{ background: '#111C2D' }}>
              {/* Image */}
              <div className={`relative overflow-hidden flex-shrink-0 ${isCenter ? 'h-[100px]' : 'h-[85px]'}`}>
                {offer.image_url ? (
                  <img
                    src={offer.image_url}
                    alt={offer.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className={`w-full h-full bg-gradient-to-br ${offer.color || 'from-primary/80 to-secondary/60'} flex items-center justify-center`}>
                    <span className="text-3xl">🎮</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#111C2D] via-transparent to-transparent" />
              </div>

              {/* Info */}
              <div className="p-2">
                <h3 className="text-[10px] font-bold text-foreground truncate">{offer.name}</h3>
                <p className="text-[8px] text-muted-foreground truncate mt-0.5">
                  {offer.description || 'Complete this offer'}
                </p>
                <div className="flex items-center justify-between mt-1.5">
                  <p className="font-bold text-[10px]" style={{ color: '#1DBF73' }}>
                    ${(offer.coins / 100).toFixed(2)}
                  </p>
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-2 h-2" style={{ fill: '#FFD54F', color: '#FFD54F' }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FeaturedOffersSection;
