import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CoinIcon } from '@/contexts/SiteSettingsContext';

interface EarningEvent {
  id: string;
  username: string;
  coins: number;
  offerwall: string;
  created_at: Date;
}

const LiveEarningsBar = () => {
  const [earnings, setEarnings] = useState<EarningEvent[]>([]);

  useEffect(() => {
    const loadRecentOffers = async () => {
      const { data } = await supabase
        .from('completed_offers')
        .select('id, username, coin, offerwall, created_at')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (data) {
        setEarnings(data.map(offer => ({
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
      .channel('live-bar-earnings')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'completed_offers' }, (payload) => {
        const newOffer = payload.new as any;
        const newEarning: EarningEvent = {
          id: newOffer.id,
          username: newOffer.username,
          coins: newOffer.coin,
          offerwall: newOffer.offerwall,
          created_at: new Date(newOffer.created_at),
        };
        setEarnings(prev => [newEarning, ...prev.slice(0, 9)]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  if (earnings.length === 0) return null;

  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  const displayItems = [...earnings, ...earnings];

  const getAvatarColor = (name: string) => {
    const colors = ['#1DBF73', '#6C4BFF', '#FF6B35', '#00B0FF', '#E91E63', '#FF9800'];
    return colors[name.charCodeAt(0) % colors.length];
  };

  return (
    <div 
      className="w-full overflow-hidden h-[60px] flex items-center px-4"
      style={{ background: '#0F1F2F', borderBottom: '1px solid #162638' }}
    >
      <div className="flex gap-4 animate-scroll-left" style={{ animationDuration: '30s' }}>
        {displayItems.map((earning, index) => (
          <div 
            key={`${earning.id}-${index}`}
            className="flex-shrink-0 flex items-center gap-2.5 px-3.5 py-1.5 rounded-full"
            style={{ background: '#142739', border: '1px solid #1e3448' }}
          >
            {/* Avatar */}
            <div 
              className="w-[26px] h-[26px] rounded-full flex items-center justify-center"
              style={{ background: getAvatarColor(earning.username) }}
            >
              <span className="text-[10px] font-bold text-white">
                {earning.username.charAt(0).toUpperCase()}
              </span>
            </div>
            
            {/* Username */}
            <span className="text-xs font-medium text-white">
              {earning.username}
            </span>
            
            {/* Online dot */}
            <div className="w-2 h-2 rounded-full" style={{ background: '#00FF66' }} />
            
            {/* Earning Badge */}
            <div 
              className="flex items-center gap-1 px-2 py-0.5 rounded-[10px] text-xs font-bold text-white"
              style={{ background: '#1DBF73' }}
            >
              +{earning.coins.toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LiveEarningsBar;
