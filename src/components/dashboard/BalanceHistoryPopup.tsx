import { useState, useEffect } from 'react';
import { X, ArrowDownLeft, ArrowUpRight, Clock, Coins, Loader2 } from 'lucide-react';
import { CoinIcon } from '@/contexts/SiteSettingsContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ScrollArea } from '@/components/ui/scroll-area';

interface HistoryItem {
  id: string;
  type: 'earn' | 'chargeback' | 'withdraw';
  offer_name: string;
  offerwall: string;
  coin: number;
  country: string;
  timeAgo: string;
  created_at: string;
}

const getTimeAgo = (dateStr: string) => {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString();
};

interface Props {
  open: boolean;
  onClose: () => void;
}

const BalanceHistoryPopup = ({ open, onClose }: Props) => {
  const { user, profile } = useAuth();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open || !user) return;
    setLoading(true);

    const load = async () => {
      const [offersRes, withdrawRes] = await Promise.all([
        supabase
          .from('completed_offers')
          .select('id, offer_name, offerwall, coin, country, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('withdrawal_requests')
          .select('id, method, amount, status, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20),
      ]);

      const history: HistoryItem[] = [];

      offersRes.data?.forEach(o => {
        history.push({
          id: o.id,
          type: o.coin < 0 ? 'chargeback' : 'earn',
          offer_name: o.offer_name,
          offerwall: o.offerwall,
          coin: o.coin,
          country: o.country || 'Unknown',
          timeAgo: getTimeAgo(o.created_at),
          created_at: o.created_at,
        });
      });

      withdrawRes.data?.forEach(w => {
        history.push({
          id: w.id,
          type: 'withdraw',
          offer_name: `Withdrawal (${w.method})`,
          offerwall: w.status,
          coin: -w.amount,
          country: '',
          timeAgo: getTimeAgo(w.created_at),
          created_at: w.created_at,
        });
      });

      history.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setItems(history);
      setLoading(false);
    };

    load();
  }, [open, user]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        style={{ background: '#0E1A27', border: '1px solid #1e3448' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 pb-3" style={{ borderBottom: '1px solid #162638' }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(29,191,115,0.15)' }}>
              <Coins className="w-4 h-4" style={{ color: '#1DBF73' }} />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Balance History</h3>
              <p className="text-[11px]" style={{ color: '#9DB2C7' }}>
                Current: <span className="font-bold" style={{ color: '#1DBF73' }}>{profile?.balance?.toFixed(0) || 0} coins</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
            <X className="w-4 h-4" style={{ color: '#9DB2C7' }} />
          </button>
        </div>

        {/* Content */}
        <ScrollArea className="h-[400px]">
          <div className="p-3 space-y-1.5">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#1DBF73' }} />
                <p className="text-xs" style={{ color: '#9DB2C7' }}>Loading history...</p>
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Clock className="w-8 h-8" style={{ color: '#9DB2C7' }} />
                <p className="text-sm" style={{ color: '#9DB2C7' }}>No transactions yet</p>
              </div>
            ) : (
              items.map(item => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-2.5 rounded-xl transition-all hover:bg-white/[0.03]"
                  style={{ background: 'rgba(255,255,255,0.02)' }}
                >
                  {/* Icon */}
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{
                      background: item.type === 'earn' ? 'rgba(29,191,115,0.15)' :
                        item.type === 'chargeback' ? 'rgba(239,68,68,0.15)' : 'rgba(251,146,60,0.15)',
                    }}
                  >
                    {item.type === 'earn' ? (
                      <ArrowDownLeft className="w-3.5 h-3.5" style={{ color: '#1DBF73' }} />
                    ) : (
                      <ArrowUpRight className="w-3.5 h-3.5" style={{ color: item.type === 'chargeback' ? '#ef4444' : '#fb923c' }} />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{item.offer_name}</p>
                    <p className="text-[10px] truncate" style={{ color: '#9DB2C7' }}>
                      {item.offerwall}
                      {item.country && item.country !== 'Unknown' && ` • ${item.country}`}
                    </p>
                  </div>

                  {/* Amount & Time */}
                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-1 justify-end text-xs font-bold" style={{
                      color: item.type === 'earn' ? '#1DBF73' : item.type === 'chargeback' ? '#ef4444' : '#fb923c'
                    }}>
                      <CoinIcon className="w-3 h-3" />
                      {item.coin > 0 ? '+' : ''}{item.coin.toLocaleString()}
                    </div>
                    <p className="text-[9px] mt-0.5" style={{ color: '#9DB2C7' }}>{item.timeAgo}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default BalanceHistoryPopup;
