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
}

// Convert ISO 3166-1 alpha-2 country code to flag emoji
const isoToFlag = (code: string): string => {
  const upper = code.toUpperCase();
  if (upper.length !== 2) return '';
  const cp1 = 0x1F1E6 + (upper.charCodeAt(0) - 65);
  const cp2 = 0x1F1E6 + (upper.charCodeAt(1) - 65);
  return String.fromCodePoint(cp1, cp2);
};

// Country name/code to flag emoji mapping
const getCountryFlag = (country: string | null): string => {
  if (!country || country === 'Unknown' || country === 'TEST') return '🌍';
  if (country.length === 2 && /^[A-Za-z]{2}$/.test(country)) {
    return isoToFlag(country);
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
  const code = nameToCode[country.toLowerCase()];
  if (code) return isoToFlag(code);
  return '🌍';
};

const LiveEarningsTracker = () => {
  const { user } = useAuth();
  const [earnings, setEarnings] = useState<EarningEvent[]>([]);
  const [userCountry, setUserCountry] = useState<string | null>(null);
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

  // Detect user's country via IP geolocation
  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => {
        if (data?.country_code) setUserCountry(data.country_code);
      })
      .catch(() => setUserCountry(null));
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
        const newEarning: EarningEvent = {
          id: newOffer.id,
          username: newOffer.username,
          coins: newOffer.coin,
          offerwall: newOffer.offerwall,
          country: newOffer.country || null,
          created_at: new Date(newOffer.created_at),
        };
        setEarnings(prev => [newEarning, ...prev.slice(0, 19)]);
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

  if (earnings.length === 0) return null;

  const displayItems = earnings.length >= 5 ? [...earnings, ...earnings] : earnings;

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
                <span className="text-2xl">{getCountryFlag(selectedOffer.country)}</span>
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

      {/* Live Earn Slider Bar */}
      <div 
        className="w-full overflow-hidden"
        style={{
          height: '70px',
          background: '#0F172A',
          border: '1px solid rgba(0,170,255,0.3)',
          borderRadius: '20px',
          boxShadow: '0 0 20px rgba(0,170,255,0.2)',
          margin: '8px auto',
          maxWidth: 'calc(100% - 16px)',
        }}
      >
        <div className="flex items-center h-full px-4 gap-3">
          <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-br from-[#00C6FF] to-[#0072FF] shadow-lg shadow-[rgba(0,170,255,0.4)]">
            <span className="text-lg leading-none">{getCountryFlag(userCountry)}</span>
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
              className={`flex items-center gap-3 whitespace-nowrap ${settings.enabled && !isDragging ? 'animate-scroll-left' : ''}`}
              style={{
                animationDuration: settings.enabled ? `${settings.speed}s` : '0s',
                animationPlayState: isDragging ? 'paused' : 'running',
              }}
            >
              {displayItems.map((earning, index) => (
                <div 
                  key={`${earning.id}-${index}`}
                  onClick={() => handleOfferClick(earning)}
                  className="flex-shrink-0 flex items-center gap-2 cursor-pointer transition-all duration-300 hover:scale-[1.04]"
                  style={{
                    width: '160px',
                    height: '48px',
                    background: 'linear-gradient(135deg, #00C6FF, #0072FF)',
                    borderRadius: '30px',
                    padding: '0 12px',
                  }}
                >
                  {/* Avatar */}
                  <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-bold text-white">
                      {earning.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  {/* Info */}
                  <div className="flex flex-col leading-none flex-1 min-w-0">
                    <span className="text-[11px] font-semibold text-white truncate">
                      {earning.username}
                    </span>
                    <span className="text-[9px] text-white/70 capitalize truncate">
                      {earning.offerwall}
                    </span>
                  </div>
                  {/* Coin Badge */}
                  <div 
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: '#0B0F19' }}
                  >
                    <CoinIcon className="w-3 h-3" />
                    <span className="text-[10px] font-bold text-[#00C6FF]">
                      {earning.coins.toLocaleString()}
                    </span>
                  </div>
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
