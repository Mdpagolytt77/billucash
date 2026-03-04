import { useState, useEffect } from 'react';
import { CheckCircle, Menu, Search, Loader2, Calendar, Globe, Eye, EyeOff } from 'lucide-react';
import heroBg from '@/assets/hero-bg.jpg';
import SnowEffect from '@/components/SnowEffect';
import SnowToggle from '@/components/SnowToggle';
import AppSidebar from '@/components/AppSidebar';
import { useSnowEffect } from '@/hooks/useSnowEffect';
import { useAuth } from '@/contexts/AuthContext';
import { SiteLogo, CoinIcon } from '@/contexts/SiteSettingsContext';
import { supabase } from '@/integrations/supabase/client';

interface CompletedOffer {
  id: string;
  username: string;
  offerwall: string;
  offer_name: string;
  coin: number;
  created_at: string;
  country: string | null;
}

const UserCompletedOffers = () => {
  const { profile } = useAuth();
  const { snowEnabled, toggleSnow } = useSnowEffect();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showBalance, setShowBalance] = useState(false);
  const [countryFilter, setCountryFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [currentPage, setCurrentPage] = useState(1);
  const [offers, setOffers] = useState<CompletedOffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load ALL completed offers
  useEffect(() => {
    const loadOffers = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('completed_offers')
        .select('id, username, offerwall, offer_name, coin, created_at, country')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading offers:', error);
      } else {
        setOffers(data || []);
      }
      setIsLoading(false);
    };

    loadOffers();

    // Real-time subscription for all offers
    const channel = supabase
      .channel('all-completed-offers-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'completed_offers',
        },
        (payload) => {
          const newOffer = payload.new as CompletedOffer;
          setOffers(prev => [newOffer, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Get unique countries for filter
  const uniqueCountries = [...new Set(offers.map(o => o.country || 'Unknown'))].sort();

  // Filter by search term (username, offer name), country, and date range
  const filteredData = offers.filter(row => {
    const matchesSearch = 
      row.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.offer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.offerwall.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCountry = !countryFilter || (row.country || 'Unknown') === countryFilter;
    
    let matchesDate = true;
    if (row.created_at) {
      const offerDate = new Date(row.created_at).toISOString().split('T')[0];
      if (dateFrom && dateTo) {
        matchesDate = offerDate >= dateFrom && offerDate <= dateTo;
      } else if (dateFrom) {
        matchesDate = offerDate >= dateFrom;
      } else if (dateTo) {
        matchesDate = offerDate <= dateTo;
      }
    }
    
    return matchesSearch && matchesCountry && matchesDate;
  });

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const pageData = filteredData.slice(startIndex, startIndex + rowsPerPage);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, countryFilter, dateFrom, dateTo, rowsPerPage]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate total coins earned
  const totalCoins = offers.reduce((sum, o) => sum + o.coin, 0);

  return (
    <>
      {snowEnabled && <SnowEffect />}
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="min-h-screen" style={{ background: `linear-gradient(rgba(0,0,0,0.85), rgba(0,0,0,0.85)), url(${heroBg}) no-repeat center center fixed`, backgroundSize: 'cover' }}>
        <header className="sticky top-0 z-30 px-3 py-2 bg-background/95 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 hover:bg-muted rounded-lg"><Menu className="w-4 h-4" /></button>
            <SiteLogo size="sm" />
            <span className="text-xs text-muted-foreground">/ Completed Offers</span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowBalance(!showBalance)}
              className="px-2 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold flex items-center gap-1"
            >
              {showBalance ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              {showBalance ? (
                <>
                  <CoinIcon className="w-3.5 h-3.5" />
                  {profile?.balance?.toFixed(2) || '0.00'}
                </>
              ) : (
                <span>••••</span>
              )}
            </button>
            <SnowToggle enabled={snowEnabled} onToggle={toggleSnow} />
          </div>
        </header>

        <main className="p-3 md:px-[3%]">
          {/* Stats Card */}
          <div className="glass-card p-3 mb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground">Total Completed Offers</p>
                <p className="text-lg font-bold text-primary">{offers.length}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground">Total Coins Earned</p>
                <div className="flex items-center gap-1 justify-end">
                  <CoinIcon className="w-4 h-4" />
                  <p className="text-lg font-bold text-green-400">{totalCoins.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
              <h2 className="text-sm font-bold text-primary flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" /> All Completed Offers <span className="text-[10px] text-muted-foreground">({filteredData.length})</span>
              </h2>
              <div className="flex gap-2 items-center flex-wrap">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                  <input 
                    type="text" 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    placeholder="Search name/offer..." 
                    className="w-40 pl-6 pr-2 py-1.5 bg-muted border border-border rounded-lg text-[10px]" 
                  />
                </div>
                <div className="flex items-center gap-1">
                  <Globe className="w-3 h-3 text-muted-foreground" />
                  <select 
                    value={countryFilter} 
                    onChange={(e) => setCountryFilter(e.target.value)} 
                    className="px-2 py-1.5 bg-muted border border-border rounded-lg text-[10px]"
                  >
                    <option value="">All Countries</option>
                    {uniqueCountries.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-muted-foreground">From:</span>
                  <div className="relative">
                    <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                    <input 
                      type="date" 
                      value={dateFrom} 
                      onChange={(e) => setDateFrom(e.target.value)} 
                      className="pl-6 pr-2 py-1.5 bg-muted border border-border rounded-lg text-[10px] w-32"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-muted-foreground">To:</span>
                  <div className="relative">
                    <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                    <input 
                      type="date" 
                      value={dateTo} 
                      onChange={(e) => setDateTo(e.target.value)} 
                      className="pl-6 pr-2 py-1.5 bg-muted border border-border rounded-lg text-[10px] w-32"
                    />
                  </div>
                </div>
                {(dateFrom || dateTo || countryFilter) && (
                  <button 
                    onClick={() => { setDateFrom(''); setDateTo(''); setCountryFilter(''); }} 
                    className="px-2 py-1.5 bg-destructive/20 text-destructive rounded-lg text-[10px] hover:bg-destructive/30"
                  >
                    Clear
                  </button>
                )}
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
                <p className="text-[10px] mt-1">Complete offers to start earning!</p>
              </div>
            ) : (
              <>
                <div className="overflow-auto max-h-[55vh] border border-border rounded-lg">
                  <table className="w-full text-[10px]">
                    <thead className="sticky top-0 bg-muted/90">
                      <tr>
                        <th className="text-left p-2 text-muted-foreground">#</th>
                        <th className="text-left p-2 text-muted-foreground">Username</th>
                        <th className="text-left p-2 text-muted-foreground">Offerwall</th>
                        <th className="text-left p-2 text-muted-foreground">Offer Name</th>
                         <th className="text-center p-2 text-muted-foreground">Coins</th>
                        <th className="text-left p-2 text-muted-foreground">Country</th>
                        <th className="text-left p-2 text-muted-foreground">Date & Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageData.map((row, index) => (
                        <tr key={row.id} className={`border-t border-border/50 ${row.coin < 0 ? 'bg-red-500/10 hover:bg-red-500/15' : 'hover:bg-primary/5'}`}>
                          <td className="p-2 text-muted-foreground">{startIndex + index + 1}</td>
                          <td className="p-2 font-medium text-primary">{row.username}</td>
                          <td className="p-2">
                            <span className="px-1.5 py-0.5 rounded bg-primary/20 text-primary text-[9px] font-medium">
                              {row.offerwall}
                            </span>
                          </td>
                          <td className="p-2 max-w-[200px] truncate" title={row.offer_name}>
                            {row.coin < 0 && <span className="text-red-400 font-semibold mr-1">[Chargeback]</span>}
                            {row.offer_name}
                          </td>
                          <td className="p-2 text-center">
                            <div className={`flex items-center justify-center gap-1 font-semibold ${row.coin < 0 ? 'text-red-400' : 'text-green-400'}`}>
                              <CoinIcon className="w-3 h-3" />
                              {row.coin < 0 ? '' : '+'}{row.coin.toLocaleString()}
                            </div>
                          </td>
                          <td className="p-2 text-muted-foreground text-[9px]">
                            <span className="px-1.5 py-0.5 rounded bg-muted text-[9px]">{row.country || 'Unknown'}</span>
                          </td>
                          <td className="p-2 text-muted-foreground whitespace-nowrap">{formatDate(row.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between mt-3 text-[10px]">
                  <span className="text-muted-foreground">Showing {startIndex + 1}-{Math.min(startIndex + rowsPerPage, filteredData.length)} of {filteredData.length}</span>
                  <div className="flex gap-1">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-2 py-1 rounded bg-muted disabled:opacity-40">← Prev</button>
                    <span className="px-2 py-1 rounded bg-primary text-primary-foreground">{currentPage}</span>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-2 py-1 rounded bg-muted disabled:opacity-40">Next →</button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Total Dollar Value */}
          <div className="glass-card p-3 mt-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground">Total Revenue (USD)</p>
                <p className="text-xl font-bold text-green-400">${(totalCoins / 1000).toFixed(2)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground">Total Coins</p>
                <div className="flex items-center gap-1 justify-end">
                  <CoinIcon className="w-4 h-4" />
                  <p className="text-lg font-bold text-primary">{totalCoins.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default UserCompletedOffers;
