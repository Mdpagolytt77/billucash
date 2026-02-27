import { useState, useEffect, useRef } from 'react';
import { X, Globe, Server, Clock, Gift, Coins } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { SiteLogo, CoinIcon } from '@/contexts/SiteSettingsContext';

interface EarningEvent {
  id: string;
  username: string;
  coins: number;
  offerwall: string;
  country: string | null;
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
  trackerVisible?: boolean;
}

// Convert country code or name to ISO 2-letter code
const getCountryCode = (country: string | null): string | null => {
  if (!country || country === 'Unknown' || country === 'TEST') return null;
  if (country.length === 2 && /^[A-Za-z]{2}$/.test(country)) {
    return country.toUpperCase();
  }
  const nameToCode: Record<string, string> = {
    'afghanistan': 'AF', 'albania': 'AL', 'algeria': 'DZ', 'argentina': 'AR', 'australia': 'AU',
    'austria': 'AT', 'bangladesh': 'BD', 'belgium': 'BE', 'brazil': 'BR', 'canada': 'CA',
    'chile': 'CL', 'china': 'CN', 'colombia': 'CO', 'czech republic': 'CZ', 'denmark': 'DK',
    'egypt': 'EG', 'finland': 'FI', 'france': 'FR', 'germany': 'DE', 'greece': 'GR',
    'hong kong': 'HK', 'hungary': 'HU', 'india': 'IN', 'indonesia': 'ID', 'iran': 'IR',
    'iraq': 'IQ', 'ireland': 'IE', 'israel': 'IL', 'italy': 'IT', 'japan': 'JP',
    'kenya': 'KE', 'south korea': 'KR', 'korea': 'KR', 'malaysia': 'MY', 'mexico': 'MX',
    'morocco': 'MA', 'netherlands': 'NL', 'new zealand': 'NZ', 'nigeria': 'NG', 'norway': 'NO',
    'pakistan': 'PK', 'peru': 'PE', 'philippines': 'PH', 'poland': 'PL', 'portugal': 'PT',
    'romania': 'RO', 'russia': 'RU', 'saudi arabia': 'SA', 'singapore': 'SG', 'south africa': 'ZA',
    'spain': 'ES', 'sweden': 'SE', 'switzerland': 'CH', 'taiwan': 'TW', 'thailand': 'TH',
    'turkey': 'TR', 'ukraine': 'UA', 'united arab emirates': 'AE', 'uae': 'AE',
    'united kingdom': 'GB', 'uk': 'GB', 'united states': 'US', 'usa': 'US',
    'vietnam': 'VN', 'venezuela': 'VE',
  };
  return nameToCode[country.toLowerCase()] || null;
};

// Flag image component using flagcdn.com (works on all devices)
const FlagImage = ({ country, className = 'w-5 h-4' }: { country: string | null; className?: string }) => {
  const code = getCountryCode(country);
  if (!code) return <Globe className="w-4 h-4 text-muted-foreground flex-shrink-0" />;
  return (
    <img
      src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`}
      alt={code}
      className={`object-cover rounded-sm flex-shrink-0 ${className}`}
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = 'none';
      }}
    />
  );
};

const LiveEarningsTracker = () => {
  const { user } = useAuth();
  const [earnings, setEarnings] = useState<EarningEvent[]>([]);
  const [userCountry, setUserCountry] = useState<string | null>(null);
  const [settings, setSettings] = useState<TrackerSettings>({
    enabled: true,
    speed: 25,
    manualScrollEnabled: false,
    trackerVisible: true,
  });
  const [selectedOffer, setSelectedOffer] = useState<OfferDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Detect user's country via IP geolocation (multiple fallbacks)
  useEffect(() => {
    const detectCountry = async () => {
      const apis = [
        () => fetch('https://ipapi.co/json/').then(r => r.json()).then(d => d?.country_code),
        () => fetch('https://api.country.is/').then(r => r.json()).then(d => d?.country),
        () => fetch('https://ipwho.is/').then(r => r.json()).then(d => d?.country_code),
      ];
      for (const api of apis) {
        try {
          const code = await api();
          if (code && /^[A-Z]{2}$/.test(code)) {
            setUserCountry(code);
            return;
          }
        } catch {}
      }
      setUserCountry(null);
    };
    detectCountry();
  }, []);

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const handleOfferClick = async (earning: EarningEvent) => {
    if (!user) return;
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
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'site_settings', filter: 'id=eq.default' }, (payload) => {
        const newData = payload.new as any;
        if (newData.offerwall_settings?.trackerSettings) {
          setSettings(newData.offerwall_settings.trackerSettings);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    const getTodayRange = () => {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      return { startOfDay: startOfDay.toISOString(), endOfDay: endOfDay.toISOString() };
    };

    const loadRecentOffers = async () => {
      const { data } = await supabase.rpc('get_live_tracker_offers', { limit_count: 20 });

      if (data) {
        setEarnings(data.map((offer: any) => ({
          id: offer.id,
          username: offer.username,
          coins: offer.coin,
          offerwall: offer.offerwall,
          country: offer.country || null,
          created_at: new Date(offer.created_at),
        })));
      }
    };
    loadRecentOffers();

    const channel = supabase
      .channel('live-tracker-earnings')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'completed_offers' }, (payload) => {
        const newOffer = payload.new as any;
        const offerDate = new Date(newOffer.created_at);
        const now = new Date();
        // Only add if it's today's offer
        if (
          offerDate.getFullYear() === now.getFullYear() &&
          offerDate.getMonth() === now.getMonth() &&
          offerDate.getDate() === now.getDate()
        ) {
          const newEarning: EarningEvent = {
            id: newOffer.id,
            username: newOffer.username,
            coins: newOffer.coin,
            offerwall: newOffer.offerwall,
            country: newOffer.country || null,
            created_at: offerDate,
          };
          setEarnings(prev => [newEarning, ...prev.slice(0, 19)]);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
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
    scrollRef.current.scrollLeft = scrollLeft - (x - startX) * 2;
  };
  const handleMouseUp = () => setIsDragging(false);
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!settings.manualScrollEnabled || !scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.touches[0].pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !scrollRef.current) return;
    const x = e.touches[0].pageX - scrollRef.current.offsetLeft;
    scrollRef.current.scrollLeft = scrollLeft - (x - startX) * 2;
  };

  const noOffersToday = earnings.length === 0;

  const displayItems = earnings;

  const getAvatarColor = (name: string) => {
    const colors = [
      'from-[#00C6FF] to-[#0072FF]',
      'from-green-400 to-emerald-600',
      'from-orange-400 to-amber-600',
      'from-pink-400 to-rose-600',
      'from-purple-400 to-violet-600',
      'from-cyan-400 to-teal-600',
    ];
    return colors[name.charCodeAt(0) % colors.length];
  };

  // If tracker is hidden via admin settings, render nothing
  if (settings.trackerVisible === false) return null;

  return (
    <>
      {/* Details Popup */}
      {selectedOffer && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={() => setSelectedOffer(null)}>
          <div className="bg-[#0F172A] border border-[rgba(0,170,255,0.3)] rounded-[22px] w-full max-w-sm overflow-hidden shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-[rgba(0,170,255,0.2)] bg-gradient-to-r from-[#00C6FF]/10 to-[#0072FF]/10">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getAvatarColor(selectedOffer.username)} flex items-center justify-center shadow-lg`}>
                  <span className="text-sm font-bold text-white">{selectedOffer.username.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <h3 className="font-bold text-white">{selectedOffer.username}</h3>
                  <p className="text-xs text-[#A1A1AA]">Offer Details</p>
                </div>
              </div>
              <button onClick={() => setSelectedOffer(null)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-[14px] bg-gradient-to-r from-[#00C6FF]/20 to-[#0072FF]/20 border border-[rgba(0,170,255,0.3)]">
                <Coins className="w-5 h-5 text-[#00C6FF]" />
                <div className="flex-1">
                  <p className="text-xs text-[#A1A1AA]">Coins Earned</p>
                  <p className="font-bold text-lg text-[#00C6FF]">+{selectedOffer.coin.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-[14px] bg-[#0B0F19] border border-[rgba(0,170,255,0.15)]">
                <Gift className="w-5 h-5 text-[#A1A1AA]" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[#A1A1AA]">Offer Name</p>
                  <p className="font-medium text-sm text-white truncate">{selectedOffer.offer_name || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-[14px] bg-[#0B0F19] border border-[rgba(0,170,255,0.15)]">
                <Server className="w-5 h-5 text-[#A1A1AA]" />
                <div className="flex-1">
                  <p className="text-xs text-[#A1A1AA]">Offerwall</p>
                  <p className="font-medium text-sm text-white capitalize">{selectedOffer.offerwall}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-[14px] bg-[#0B0F19] border border-[rgba(0,170,255,0.15)]">
                <FlagImage country={selectedOffer.country} className="w-6 h-5" />
                <div className="flex-1">
                  <p className="text-xs text-[#A1A1AA]">Country</p>
                  <p className="font-medium text-sm text-white">{selectedOffer.country || 'Unknown'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-[14px] bg-[#0B0F19] border border-[rgba(0,170,255,0.15)]">
                <Clock className="w-5 h-5 text-[#A1A1AA]" />
                <div className="flex-1">
                  <p className="text-xs text-[#A1A1AA]">Completed</p>
                  <p className="font-medium text-sm text-white">{getTimeAgo(new Date(selectedOffer.created_at))}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {loadingDetails && (
        <div className="fixed inset-0 bg-black/50 z-[99] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#00C6FF] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Tracker */}
      <div className="w-full bg-background/80 backdrop-blur-sm border-b border-border/20 overflow-hidden">
        <div className="flex items-center h-12 px-3 gap-3">
          <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
            <FlagImage country={userCountry} className="w-5 h-4" />
          </div>
          {noOffersToday ? (
            <div className="flex-1 flex items-center gap-2 text-muted-foreground">
              <span className="text-xs">No completed offers today</span>
            </div>
          ) : (
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
                className={`flex items-center gap-2 whitespace-nowrap ${settings.enabled && !isDragging && earnings.length > 1 ? 'animate-scroll-left' : ''}`}
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
                    {/* Coin Icon */}
                    <CoinIcon className="w-5 h-5 flex-shrink-0" />
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
          )}
        </div>
      </div>
    </>
  );
};

export default LiveEarningsTracker;
