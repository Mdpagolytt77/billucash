import { useState, useEffect, useRef } from 'react';
import { X, Globe, Server, Clock, Gift, Coins } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { SiteLogo } from '@/contexts/SiteSettingsContext';

interface EarningEvent {
  id: string;
  username: string;
  coins: number;
  offerwall: string;
  created_at: Date;
}

interface OfferDetails {
  id: string;
  username: string;
  coin: number;
  offerwall: string;
  offer_name: string;
  ip: string | null;
  country: string | null;
  transaction_id: string | null;
  created_at: string;
}

interface TrackerSettings {
  enabled: boolean;
  speed: number;
  manualScrollEnabled: boolean;
}

// Country name to flag emoji mapping
const getCountryFlag = (country: string | null): string => {
  if (!country || country === 'Unknown') return '🌍';
  
  const countryFlags: Record<string, string> = {
    'Afghanistan': '🇦🇫', 'Albania': '🇦🇱', 'Algeria': '🇩🇿', 'Argentina': '🇦🇷', 'Australia': '🇦🇺',
    'Austria': '🇦🇹', 'Bangladesh': '🇧🇩', 'Belgium': '🇧🇪', 'Brazil': '🇧🇷', 'Canada': '🇨🇦',
    'Chile': '🇨🇱', 'China': '🇨🇳', 'Colombia': '🇨🇴', 'Czech Republic': '🇨🇿', 'Denmark': '🇩🇰',
    'Egypt': '🇪🇬', 'Finland': '🇫🇮', 'France': '🇫🇷', 'Germany': '🇩🇪', 'Greece': '🇬🇷',
    'Hong Kong': '🇭🇰', 'Hungary': '🇭🇺', 'India': '🇮🇳', 'Indonesia': '🇮🇩', 'Iran': '🇮🇷',
    'Iraq': '🇮🇶', 'Ireland': '🇮🇪', 'Israel': '🇮🇱', 'Italy': '🇮🇹', 'Japan': '🇯🇵',
    'Kenya': '🇰🇪', 'South Korea': '🇰🇷', 'Korea': '🇰🇷', 'Malaysia': '🇲🇾', 'Mexico': '🇲🇽',
    'Morocco': '🇲🇦', 'Netherlands': '🇳🇱', 'New Zealand': '🇳🇿', 'Nigeria': '🇳🇬', 'Norway': '🇳🇴',
    'Pakistan': '🇵🇰', 'Peru': '🇵🇪', 'Philippines': '🇵🇭', 'Poland': '🇵🇱', 'Portugal': '🇵🇹',
    'Romania': '🇷🇴', 'Russia': '🇷🇺', 'Saudi Arabia': '🇸🇦', 'Singapore': '🇸🇬', 'South Africa': '🇿🇦',
    'Spain': '🇪🇸', 'Sweden': '🇸🇪', 'Switzerland': '🇨🇭', 'Taiwan': '🇹🇼', 'Thailand': '🇹🇭',
    'Turkey': '🇹🇷', 'Ukraine': '🇺🇦', 'United Arab Emirates': '🇦🇪', 'UAE': '🇦🇪',
    'United Kingdom': '🇬🇧', 'UK': '🇬🇧', 'GB': '🇬🇧', 'United States': '🇺🇸', 'US': '🇺🇸', 'USA': '🇺🇸',
    'Vietnam': '🇻🇳', 'Venezuela': '🇻🇪',
  };
  
  // Try exact match first
  if (countryFlags[country]) return countryFlags[country];
  
  // Try case-insensitive match
  const lowerCountry = country.toLowerCase();
  for (const [key, flag] of Object.entries(countryFlags)) {
    if (key.toLowerCase() === lowerCountry) return flag;
  }
  
  return '🌍';
};

const LiveEarningsTracker = () => {
  const { user } = useAuth();
  const [earnings, setEarnings] = useState<EarningEvent[]>([]);
  const [settings, setSettings] = useState<TrackerSettings>({
    enabled: true,
    speed: 25,
    manualScrollEnabled: false,
  });
  const [selectedOffer, setSelectedOffer] = useState<OfferDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) {
      const mins = Math.floor(seconds / 60);
      return `${mins}m ago`;
    }
    if (seconds < 86400) {
      const hours = Math.floor(seconds / 3600);
      return `${hours}h ago`;
    }
    const days = Math.floor(seconds / 86400);
    return `${days}d ago`;
  };

  const handleOfferClick = async (earning: EarningEvent) => {
    if (!user) return; // Only authenticated users can see details
    
    setLoadingDetails(true);
    try {
      const { data } = await supabase.rpc('get_offer_details', { offer_id: earning.id });
      if (data && data.length > 0) {
        setSelectedOffer(data[0] as OfferDetails);
      }
    } catch (error) {
      console.error('Failed to load offer details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    const loadSettings = async () => {
      const { data } = await supabase.rpc('get_public_site_settings');
      if (data && data.length > 0 && data[0].offerwall_settings) {
        const offerwallSettings = data[0].offerwall_settings as any;
        if (offerwallSettings.trackerSettings) {
          setSettings(offerwallSettings.trackerSettings);
        }
      }
    };
    loadSettings();

    const channel = supabase
      .channel('tracker-settings-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'site_settings',
          filter: 'id=eq.default'
        },
        (payload) => {
          const newData = payload.new as any;
          if (newData.offerwall_settings?.trackerSettings) {
            setSettings(newData.offerwall_settings.trackerSettings);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const loadRecentOffers = async () => {
      const { data } = await supabase.rpc('get_live_tracker_offers', { limit_count: 20 });
      
      if (data) {
        setEarnings(data.map((offer: { id: string; username: string; coin: number; offerwall: string; created_at: string }) => ({
          id: offer.id,
          username: offer.username,
          coins: offer.coin,
          offerwall: offer.offerwall,
          created_at: new Date(offer.created_at),
        })));
      }
    };
    
    loadRecentOffers();

    const channel = supabase
      .channel('live-tracker-earnings')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'completed_offers',
        },
        (payload) => {
          const newOffer = payload.new as { 
            id: string; 
            username: string; 
            coin: number; 
            offerwall: string;
            created_at: string; 
          };
          
          const newEarning: EarningEvent = {
            id: newOffer.id,
            username: newOffer.username,
            coins: newOffer.coin,
            offerwall: newOffer.offerwall,
            created_at: new Date(newOffer.created_at),
          };
          setEarnings(prev => [newEarning, ...prev.slice(0, 19)]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!settings.manualScrollEnabled || !scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!settings.manualScrollEnabled || !scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.touches[0].pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !scrollRef.current) return;
    const x = e.touches[0].pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  if (earnings.length === 0) return null;

  const displayItems = earnings.length >= 5 ? [...earnings, ...earnings] : earnings;

  const getAvatarColor = (name: string) => {
    const colors = [
      'from-primary to-secondary',
      'from-green-400 to-emerald-600',
      'from-orange-400 to-amber-600',
      'from-pink-400 to-rose-600',
      'from-purple-400 to-violet-600',
      'from-cyan-400 to-teal-600',
    ];
    return colors[name.charCodeAt(0) % colors.length];
  };

  return (
    <>
      {/* Details Popup */}
      {selectedOffer && (
        <div 
          className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedOffer(null)}
        >
          <div 
            className="bg-background border border-border rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-scale-in"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-primary/10 to-secondary/10">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getAvatarColor(selectedOffer.username)} flex items-center justify-center shadow-lg`}>
                  <span className="text-sm font-bold text-white">
                    {selectedOffer.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-foreground">{selectedOffer.username}</h3>
                  <p className="text-xs text-muted-foreground">Offer Details</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedOffer(null)}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Details */}
            <div className="p-4 space-y-3">
              {/* Coins */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/30">
                <Coins className="w-5 h-5 text-primary" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Coins Earned</p>
                  <p className="font-bold text-lg text-primary">+{selectedOffer.coin.toLocaleString()}</p>
                </div>
              </div>

              {/* Offer Name */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border">
                <Gift className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Offer Name</p>
                  <p className="font-medium text-sm text-foreground truncate">{selectedOffer.offer_name || 'N/A'}</p>
                </div>
              </div>

              {/* Offerwall */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border">
                <Server className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Offerwall</p>
                  <p className="font-medium text-sm text-foreground capitalize">{selectedOffer.offerwall}</p>
                </div>
              </div>

              {/* Country */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border">
                <span className="text-2xl">{getCountryFlag(selectedOffer.country)}</span>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Country</p>
                  <p className="font-medium text-sm text-foreground">{selectedOffer.country || 'Unknown'}</p>
                </div>
              </div>

              {/* Time */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border">
                <Clock className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Completed</p>
                  <p className="font-medium text-sm text-foreground">{getTimeAgo(new Date(selectedOffer.created_at))}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {loadingDetails && (
        <div className="fixed inset-0 bg-black/50 z-[99] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Tracker */}
      <div className="w-full bg-background/80 backdrop-blur-sm border-b border-border/20 overflow-hidden">
        <div className="flex items-center h-12 px-3 gap-3">
          <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
            <SiteLogo size="sm" />
          </div>
          <div 
            ref={scrollRef}
            className={`flex-1 overflow-hidden ${settings.manualScrollEnabled ? 'cursor-grab active:cursor-grabbing overflow-x-auto scrollbar-hide' : ''}`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
          >
            <div 
              className={`flex items-center gap-2 whitespace-nowrap ${settings.enabled && !isDragging ? 'animate-scroll-left' : ''}`}
              style={{
                animationDuration: settings.enabled ? `${settings.speed}s` : '0s',
                animationPlayState: isDragging ? 'paused' : 'running',
              }}
            >
              {displayItems.map((earning, index) => (
                <div 
                  key={`${earning.id}-${index}`}
                  onClick={() => handleOfferClick(earning)}
                  className="flex-shrink-0 flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-card/60 border border-border/30 cursor-pointer hover:border-primary/30 transition-all"
                >
                  {/* Avatar */}
                  <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${getAvatarColor(earning.username)} flex items-center justify-center flex-shrink-0`}>
                    <span className="text-[10px] font-bold text-white">
                      {earning.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  {/* Info */}
                  <div className="flex flex-col leading-none">
                    <span className="text-[11px] font-semibold text-foreground truncate max-w-[60px]">
                      {earning.username}
                    </span>
                    <span className="text-[9px] text-muted-foreground capitalize">
                      {earning.offerwall}
                    </span>
                  </div>
                  {/* Coins */}
                  <span className="text-[11px] font-bold text-primary">
                    {earning.coins.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LiveEarningsTracker;