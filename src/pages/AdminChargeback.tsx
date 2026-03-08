import { useState, useEffect, useMemo } from 'react';
import { Menu, AlertCircle, RefreshCw, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import SnowEffect from '@/components/SnowEffect';
import SnowToggle from '@/components/SnowToggle';
import AdminSidebar from '@/components/AdminSidebar';
import { useSnowEffect } from '@/hooks/useSnowEffect';
import { useAuth } from '@/contexts/AuthContext';
import { SiteLogo } from '@/contexts/SiteSettingsContext';
import { supabase } from '@/integrations/supabase/client';

interface ChargebackEntry {
  id: string;
  username: string;
  offerwall: string;
  offer_name: string;
  coin: number;
  created_at: string;
  transaction_id: string | null;
}

const AdminChargeback = () => {
  const { isAdmin, isModerator } = useAuth();
  const canAccess = isAdmin || isModerator;
  const { snowEnabled, toggleSnow } = useSnowEffect();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chargebacks, setChargebacks] = useState<ChargebackEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalChargeback, setTotalChargeback] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredChargebacks = useMemo(() => {
    if (!searchQuery.trim()) return chargebacks;
    const q = searchQuery.toLowerCase();
    return chargebacks.filter(cb =>
      cb.username.toLowerCase().includes(q) ||
      cb.offerwall.toLowerCase().includes(q) ||
      cb.offer_name.toLowerCase().includes(q) ||
      (cb.transaction_id && cb.transaction_id.toLowerCase().includes(q))
    );
  }, [chargebacks, searchQuery]);

  const fetchChargebacks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('completed_offers')
        .select('id, username, offerwall, offer_name, coin, created_at, transaction_id')
        .lt('coin', 0)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setChargebacks(data || []);
      const total = (data || []).reduce((sum, cb) => sum + Math.abs(cb.coin), 0);
      setTotalChargeback(total / 500);
    } catch (error) {
      console.error('Failed to load chargebacks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canAccess) fetchChargebacks();
  }, [canAccess]);

  if (!canAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#000000' }}>
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
          <h1 className="text-xl font-bold mb-2">Access Denied</h1>
          <Link to="/dashboard" className="text-primary text-sm">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {snowEnabled && <SnowEffect />}
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="min-h-screen" style={{ background: '#000000' }}>
        <header className="sticky top-0 z-30 px-3 py-2 border-b flex items-center justify-between" style={{ background: '#0a0a0a', borderColor: '#1a1a1a' }}>
          <div className="flex items-center gap-2">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 hover:bg-muted rounded-lg"><Menu className="w-4 h-4" /></button>
            <SiteLogo size="sm" />
            <span className="text-xs text-muted-foreground">/ Chargeback</span>
          </div>
          <SnowToggle enabled={snowEnabled} onToggle={toggleSnow} />
        </header>

        <div className="px-3 md:px-[5%] pt-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg font-bold text-foreground">Chargebacks</h1>
            <button onClick={fetchChargebacks} disabled={loading} className="p-1.5 rounded-lg hover:bg-white/5">
              <RefreshCw className={`w-4 h-4 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-4 rounded-xl" style={{ background: '#111111', border: '1px solid #1a1a1a' }}>
              <div className="text-[10px] text-muted-foreground mb-1">Total Chargebacks</div>
              <div className="text-lg font-bold text-red-400">{chargebacks.length}</div>
            </div>
            <div className="p-4 rounded-xl" style={{ background: '#111111', border: '1px solid #1a1a1a' }}>
              <div className="text-[10px] text-muted-foreground mb-1">Total Amount</div>
              <div className="text-lg font-bold text-red-400">$ {totalChargeback.toFixed(2)}</div>
            </div>
          </div>

          {/* Search */}
          <div className="mb-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by username, offerwall, offer, transaction ID..."
              className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-transparent border focus:outline-none focus:border-primary text-foreground placeholder:text-muted-foreground"
              style={{ background: '#111111', borderColor: '#1a1a1a' }}
            />
          </div>

          {/* Table */}
          <div className="p-4 rounded-xl" style={{ background: '#111111', border: '1px solid #1a1a1a' }}>
            <div className="overflow-x-auto">
              <table className="w-full text-[10px] min-w-[600px]">
                <thead>
                  <tr style={{ borderBottom: '1px solid #1a1a1a' }}>
                    <th className="text-left py-1.5 px-2 text-muted-foreground">#</th>
                    <th className="text-left py-1.5 px-2 text-muted-foreground">Username</th>
                    <th className="text-left py-1.5 px-2 text-muted-foreground">Offerwall</th>
                    <th className="text-left py-1.5 px-2 text-muted-foreground">Offer</th>
                    <th className="text-left py-1.5 px-2 text-muted-foreground">Coins</th>
                    <th className="text-left py-1.5 px-2 text-muted-foreground">Transaction ID</th>
                    <th className="text-left py-1.5 px-2 text-muted-foreground">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredChargebacks.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-muted-foreground">
                        {loading ? 'Loading...' : searchQuery ? 'No results found' : 'No chargebacks found'}
                      </td>
                    </tr>
                  ) : (
                    filteredChargebacks.map((cb, i) => (
                      <tr key={cb.id} style={{ borderBottom: '1px solid #1a1a1a' }} className="hover:bg-white/5">
                        <td className="py-1.5 px-2 text-muted-foreground">{i + 1}</td>
                        <td className="py-1.5 px-2 font-medium">{cb.username}</td>
                        <td className="py-1.5 px-2">
                          <span className="px-1.5 py-0.5 rounded bg-primary/20 text-primary text-[9px] font-medium uppercase">
                            {cb.offerwall}
                          </span>
                        </td>
                        <td className="py-1.5 px-2 max-w-[150px] truncate" title={cb.offer_name}>{cb.offer_name}</td>
                        <td className="py-1.5 px-2 text-red-400 font-semibold">{cb.coin}</td>
                        <td className="py-1.5 px-2 font-mono text-[9px] max-w-[100px] truncate" title={cb.transaction_id || ''}>
                          {cb.transaction_id || 'N/A'}
                        </td>
                        <td className="py-1.5 px-2 text-muted-foreground">{new Date(cb.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Summary */}
          <div className="p-4 rounded-xl mt-4 mb-6" style={{ background: '#111111', border: '1px solid #1a1a1a' }}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">Total Chargebacks</p>
                <p className="text-lg font-bold text-red-400">{filteredChargebacks.length}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">Total Coins</p>
                <p className="text-lg font-bold text-red-400">{filteredChargebacks.reduce((sum, cb) => sum + Math.abs(cb.coin), 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminChargeback;
