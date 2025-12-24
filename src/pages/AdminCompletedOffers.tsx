import { useState, useEffect } from 'react';
import { CheckCircle, Menu, Search } from 'lucide-react';
import heroBg from '@/assets/hero-bg.jpg';
import SnowEffect from '@/components/SnowEffect';
import SnowToggle from '@/components/SnowToggle';
import AdminSidebar from '@/components/AdminSidebar';
import { useSnowEffect } from '@/hooks/useSnowEffect';
import { useAuth } from '@/contexts/AuthContext';
import { SiteLogo } from '@/contexts/SiteSettingsContext';

interface CompletedOffer {
  id: number;
  username: string;
  offerwall: string;
  offerName: string;
  coin: string;
  amount: string;
  revenue: string;
  transactionId: string;
  ip: string;
  country: string;
  time: string;
}

const AdminCompletedOffers = () => {
  const { isAdmin } = useAuth();
  const { snowEnabled, toggleSnow } = useSnowEffect();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [currentPage, setCurrentPage] = useState(1);

  const [allData] = useState<CompletedOffer[]>(() => {
    const countries = ['Unknown', 'USA', 'UK', 'Germany', 'France', 'Canada'];
    const offerwalls = ['Adtowall', 'Tapjoy', 'OfferToro', 'Adgate', 'Pubscale', 'Monlix'];
    const offerNames = ['Amazon Prime Video', 'Netflix Premium', 'Disney+ Plan', 'Survey - Gaming', 'Mobile Game Level 25', 'App Download'];
    const ips = ['us', 'gb', 'de', 'fr', 'ca', 'au'];
    return Array.from({ length: 200 }, (_, i) => ({
      id: 1475 + i,
      username: `user${1000 + i}`,
      offerwall: offerwalls[Math.floor(Math.random() * offerwalls.length)],
      offerName: offerNames[Math.floor(Math.random() * offerNames.length)],
      coin: (Math.floor(Math.random() * 1000) + 100).toFixed(2),
      amount: `$${(Math.random() * 2).toFixed(2)}`,
      revenue: `$${(Math.random() * 3).toFixed(2)}`,
      transactionId: Math.random().toString(36).substring(2, 14),
      ip: ips[Math.floor(Math.random() * ips.length)],
      country: countries[Math.floor(Math.random() * countries.length)],
      time: `${Math.floor(Math.random() * 28) + 1} Dec 2024`
    }));
  });

  const filteredData = allData.filter(row =>
    row.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.offerwall.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.country.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const pageData = filteredData.slice(startIndex, startIndex + rowsPerPage);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, rowsPerPage]);

  const getOfferwallColor = (name: string) => {
    const colors: Record<string, string> = {
      'Adtowall': 'from-yellow-400 to-orange-500', 'Tapjoy': 'from-blue-400 to-blue-600',
      'OfferToro': 'from-green-400 to-emerald-600', 'Adgate': 'from-pink-400 to-rose-500',
      'Pubscale': 'from-cyan-400 to-teal-500', 'Monlix': 'from-purple-400 to-violet-600',
    };
    return colors[name] || 'from-gray-400 to-gray-600';
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

            <div className="overflow-auto max-h-[55vh] border border-border rounded-lg">
              <table className="w-full text-[9px] min-w-[800px]">
                <thead className="sticky top-0 bg-muted/90">
                  <tr>
                    <th className="text-left p-1.5 text-muted-foreground">ID</th>
                    <th className="text-left p-1.5 text-muted-foreground">User</th>
                    <th className="text-left p-1.5 text-muted-foreground">Offerwall</th>
                    <th className="text-left p-1.5 text-muted-foreground">Offer</th>
                    <th className="text-center p-1.5 text-muted-foreground">Coin</th>
                    <th className="text-center p-1.5 text-muted-foreground">Amount</th>
                    <th className="text-left p-1.5 text-muted-foreground">Country</th>
                    <th className="text-left p-1.5 text-muted-foreground">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {pageData.map((row) => (
                    <tr key={row.id} className="border-t border-border/50 hover:bg-primary/5">
                      <td className="p-1.5">{row.id}</td>
                      <td className="p-1.5 font-medium">{row.username}</td>
                      <td className="p-1.5">
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold text-black bg-gradient-to-r ${getOfferwallColor(row.offerwall)}`}>{row.offerwall}</span>
                      </td>
                      <td className="p-1.5 max-w-[100px] truncate">{row.offerName}</td>
                      <td className="p-1.5 text-center">{row.coin}</td>
                      <td className="p-1.5 text-center text-green-400">{row.amount}</td>
                      <td className="p-1.5 text-muted-foreground">{row.country}</td>
                      <td className="p-1.5 text-muted-foreground">{row.time}</td>
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
          </div>
        </main>
      </div>
    </>
  );
};

export default AdminCompletedOffers;
