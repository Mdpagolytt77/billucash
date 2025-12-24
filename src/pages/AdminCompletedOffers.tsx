import { useState, useEffect } from 'react';
import { CheckCircle, Menu, Search, Loader2 } from 'lucide-react';
import heroBg from '@/assets/hero-bg.jpg';
import SnowEffect from '@/components/SnowEffect';
import SnowToggle from '@/components/SnowToggle';
import AdminSidebar from '@/components/AdminSidebar';
import { useSnowEffect } from '@/hooks/useSnowEffect';
import { useAuth } from '@/contexts/AuthContext';
import { SiteLogo } from '@/contexts/SiteSettingsContext';
import { supabase } from '@/integrations/supabase/client';

interface CompletedOffer {
  id: string;
  username: string;
  offerwall: string;
  offer_name: string;
  coin: number;
  transaction_id: string | null;
  ip: string | null;
  country: string | null;
  created_at: string;
}

const AdminCompletedOffers = () => {
  const { isAdmin } = useAuth();
  const { snowEnabled, toggleSnow } = useSnowEffect();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [currentPage, setCurrentPage] = useState(1);
  const [offers, setOffers] = useState<CompletedOffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Calculate amount and revenue
  // 400 coin = $0.40 (coin / 1000)
  // Revenue = amount * 2 (so $0.80)
  const calculateAmount = (coin: number) => (coin / 1000).toFixed(2);
  const calculateRevenue = (coin: number) => ((coin / 1000) * 2).toFixed(2);

  // Load completed offers from database
  useEffect(() => {
    const loadOffers = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('completed_offers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading offers:', error);
      } else {
        setOffers(data || []);
      }
      setIsLoading(false);
    };

    loadOffers();

    // Real-time subscription
    const channel = supabase
      .channel('completed-offers-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'completed_offers',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setOffers(prev => [payload.new as CompletedOffer, ...prev]);
          } else if (payload.eventType === 'DELETE') {
            setOffers(prev => prev.filter(o => o.id !== (payload.old as { id: string }).id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredData = offers.filter(row =>
    row.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.offerwall.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (row.country || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const pageData = filteredData.slice(startIndex, startIndex + rowsPerPage);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, rowsPerPage]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (!isAdmin) return <div className="min-h-screen flex items-center justify-center text-xs">Access Denied</div>;

  return (
    <>
      {snowEnabled && <SnowEffect />}
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="min-h-screen" style={{ background: `linear-gradient(rgba(0,0,0,0.85), rgba(0,0,0,0.85)), url(${heroBg}) no-repeat center center fixed`, backgroundSize: 'cover' }}>
        <header className="sticky top-0 z-30 px-3 py-2 bg-background/95 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 hover:bg-muted rounded-lg"><Menu className="w-4 h-4" /></button>
            <SiteLogo size="sm" />
            <span className="text-xs text-muted-foreground">/ Offers</span>
          </div>
          <SnowToggle enabled={snowEnabled} onToggle={toggleSnow} />
        </header>

        <main className="p-3 md:px-[3%]">
          <div className="glass-card p-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
              <h2 className="text-sm font-bold text-primary flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" /> Completed Offers <span className="text-[10px] text-muted-foreground">({filteredData.length})</span>
              </h2>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                  <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search..." className="w-full pl-6 pr-2 py-1.5 bg-muted border border-border rounded-lg text-[10px]" />
                </div>
                <select value={rowsPerPage} onChange={(e) => setRowsPerPage(Number(e.target.value))} className="px-2 py-1.5 bg-muted border border-border rounded-lg text-[10px]">
                  {[10, 15, 25, 50].map(n => <option key={n} value={n}>{n} rows</option>)}
                </select>
              </div>
            </div>

            {isLoading ? (
              <div className="h-40 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : filteredData.length === 0 ? (
              <div className="h-40 flex flex-col items-center justify-center text-muted-foreground">
                <CheckCircle className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-xs">No completed offers yet</p>
              </div>
            ) : (
              <>
                <div className="overflow-auto max-h-[55vh] border border-border rounded-lg">
                  <table className="w-full text-[9px] min-w-[800px]">
                    <thead className="sticky top-0 bg-muted/90">
                      <tr>
                        <th className="text-left p-1.5 text-muted-foreground">User</th>
                        <th className="text-left p-1.5 text-muted-foreground">Offerwall</th>
                        <th className="text-left p-1.5 text-muted-foreground">Offer</th>
                        <th className="text-center p-1.5 text-muted-foreground">Coin</th>
                        <th className="text-center p-1.5 text-muted-foreground">Amount</th>
                        <th className="text-center p-1.5 text-muted-foreground">Revenue</th>
                        <th className="text-left p-1.5 text-muted-foreground">Country</th>
                        <th className="text-left p-1.5 text-muted-foreground">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageData.map((row) => (
                        <tr key={row.id} className="border-t border-border/50 hover:bg-primary/5">
                          <td className="p-1.5 font-medium">{row.username}</td>
                          <td className="p-1.5 text-muted-foreground">{row.offerwall}</td>
                          <td className="p-1.5 max-w-[100px] truncate">{row.offer_name}</td>
                          <td className="p-1.5 text-center">{row.coin}</td>
                          <td className="p-1.5 text-center text-green-400">${calculateAmount(row.coin)}</td>
                          <td className="p-1.5 text-center text-primary">${calculateRevenue(row.coin)}</td>
                          <td className="p-1.5 text-muted-foreground">{row.country || 'Unknown'}</td>
                          <td className="p-1.5 text-muted-foreground">{formatDate(row.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between mt-3 text-[10px]">
                  <span className="text-muted-foreground">Showing {startIndex + 1}-{Math.min(startIndex + rowsPerPage, filteredData.length)} of {filteredData.length}</span>
                  <div className="flex gap-1">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-2 py-1 rounded bg-muted disabled:opacity-40">← Prev</button>
                    <span className="px-2 py-1 rounded bg-primary text-white">{currentPage}</span>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-2 py-1 rounded bg-muted disabled:opacity-40">Next →</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </>
  );
};

export default AdminCompletedOffers;