import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, ArrowLeft, Menu, Home, Users, Wallet, Key, Palette, LogOut, Search, FileCheck } from 'lucide-react';
import heroBg from '@/assets/hero-bg.jpg';
import SnowEffect from '@/components/SnowEffect';
import SnowToggle from '@/components/SnowToggle';
import { useSnowEffect } from '@/hooks/useSnowEffect';
import { useAuth } from '@/contexts/AuthContext';

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
  const { isAdmin, signOut } = useAuth();
  const { snowEnabled, toggleSnow } = useSnowEffect();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [currentPage, setCurrentPage] = useState(1);

  // Generate sample data
  const [allData] = useState<CompletedOffer[]>(() => {
    const countries = ['Unknown', 'USA', 'UK', 'Germany', 'France', 'Canada', 'Australia', 'Japan', 'India', 'Brazil'];
    const offerwalls = ['Adtowall', 'Tapjoy', 'OfferToro', 'Adgate', 'Pubscale', 'Monlix'];
    const offerNames = [
      'Amazon Prime Video [FR/SE/FI/UK/ES/IT]',
      'Netflix Premium Subscription',
      'Disney+ Annual Plan',
      'Complete Survey - Gaming Edition',
      'Mobile Game Level 25',
      'App Download & Run for 7 days',
    ];
    const ips = ['us', 'gb', 'de', 'fr', 'ca', 'au', 'jp', 'in', 'br'];

    return Array.from({ length: 200 }, (_, i) => ({
      id: 1475 + i,
      username: `user${1000 + i}`,
      offerwall: offerwalls[Math.floor(Math.random() * offerwalls.length)],
      offerName: offerNames[Math.floor(Math.random() * offerNames.length)],
      coin: (Math.floor(Math.random() * 1000) + 100).toFixed(2),
      amount: `$${(Math.random() * 2).toFixed(2)}`,
      revenue: `$${(Math.random() * 3).toFixed(2)}`,
      transactionId: Math.random().toString(36).substring(2, 12) + Math.random().toString(36).substring(2, 12),
      ip: ips[Math.floor(Math.random() * ips.length)],
      country: countries[Math.floor(Math.random() * countries.length)],
      time: `${Math.floor(Math.random() * 28) + 1} Dec 2024 ${Math.floor(Math.random() * 12) + 1}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')} ${Math.random() > 0.5 ? 'am' : 'pm'}`
    }));
  });

  const filteredData = allData.filter(row =>
    row.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.offerwall.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.offerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.transactionId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const pageData = filteredData.slice(startIndex, startIndex + rowsPerPage);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, rowsPerPage]);

  const getOfferwallColor = (name: string) => {
    const colors: Record<string, string> = {
      'Adtowall': 'from-yellow-400 to-orange-500',
      'Tapjoy': 'from-blue-400 to-blue-600',
      'OfferToro': 'from-green-400 to-emerald-600',
      'Adgate': 'from-pink-400 to-rose-500',
      'Pubscale': 'from-cyan-400 to-teal-500',
      'Monlix': 'from-purple-400 to-violet-600',
    };
    return colors[name] || 'from-gray-400 to-gray-600';
  };

  const sidebarItems = [
    { icon: Home, label: 'Dashboard', path: '/admin' },
    { icon: Users, label: 'All Users', path: '/admin/users' },
    { icon: Wallet, label: 'Withdraw', path: '/admin/withdraw' },
    { icon: FileCheck, label: 'Completed Offers', path: '/admin/offers', active: true },
    { icon: Palette, label: 'Logo Customize', path: '/admin/logo' },
    { icon: Key, label: 'Password Reset', path: '/admin/password' },
  ];

  if (!isAdmin) return <div className="min-h-screen flex items-center justify-center text-xs">Access Denied</div>;

  return (
    <>
      {snowEnabled && <SnowEffect />}
      
      <div className={`fixed inset-0 bg-black/70 z-40 transition-opacity ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setSidebarOpen(false)} />

      <aside className={`fixed top-0 left-0 h-full w-48 bg-background border-r border-border z-50 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-3 pt-14">
          <div className="text-center mb-4 pb-3 border-b border-border">
            <div className="logo-3d text-sm">BILLUCASH</div>
          </div>
          <nav className="space-y-0.5">
            {sidebarItems.map((item, i) => (
              <Link key={i} to={item.path} onClick={() => setSidebarOpen(false)}
                className={`w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] transition-colors ${
                  item.active ? 'bg-primary/20 text-primary font-medium' : 'hover:bg-muted text-muted-foreground'
                }`}
              >
                <item.icon className="w-3 h-3" /> {item.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-border mt-2">
              <button onClick={() => signOut()} className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-destructive hover:bg-destructive/10 text-[10px]">
                <LogOut className="w-3 h-3" /> Logout
              </button>
            </div>
          </nav>
        </div>
      </aside>

      <div className="min-h-screen" style={{ background: `linear-gradient(rgba(0,0,0,0.85), rgba(0,0,0,0.85)), url(${heroBg}) no-repeat center center fixed`, backgroundSize: 'cover' }}>
        <header className="sticky top-0 z-30 px-3 py-2 bg-background/95 backdrop-blur-lg border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 hover:bg-muted rounded-lg"><Menu className="w-4 h-4" /></button>
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center font-bold text-[10px]">B</div>
            <span className="logo-3d text-xs">Offers</span>
          </div>
          <div className="flex items-center gap-1.5">
            <SnowToggle enabled={snowEnabled} onToggle={toggleSnow} />
            <Link to="/admin" className="p-1.5 hover:bg-muted rounded-lg text-primary"><ArrowLeft className="w-4 h-4" /></Link>
          </div>
        </header>

        <main className="p-3 md:px-[3%]">
          <div className="glass-card p-3">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
              <div>
                <h2 className="text-sm font-bold text-primary flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4" /> All Completed Offers
                </h2>
                <p className="text-[10px] text-muted-foreground">Total: <strong>{filteredData.length}</strong></p>
              </div>
              <div className="flex gap-2">
                <div className="bg-muted/50 border border-border rounded-lg px-2 py-1 text-center">
                  <div className="text-xs font-bold text-primary">$0.50</div>
                  <div className="text-[8px] text-muted-foreground">Last Amt</div>
                </div>
                <div className="bg-muted/50 border border-border rounded-lg px-2 py-1 text-center">
                  <div className="text-xs font-bold text-primary">500</div>
                  <div className="text-[8px] text-muted-foreground">Coins</div>
                </div>
              </div>
            </div>

            {/* Search & Rows */}
            <div className="flex flex-col sm:flex-row gap-2 mb-3">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search username, tx id, country, offerwall..."
                  className="w-full pl-7 pr-2 py-1.5 bg-muted border border-border rounded-lg text-[10px]"
                />
              </div>
              <select
                value={rowsPerPage}
                onChange={(e) => setRowsPerPage(Number(e.target.value))}
                className="px-2 py-1.5 bg-muted border border-border rounded-lg text-[10px]"
              >
                {[5, 10, 15, 20, 25, 50].map(n => (
                  <option key={n} value={n}>{n} rows</option>
                ))}
              </select>
            </div>

            {/* Table */}
            <div className="overflow-auto max-h-[55vh] border border-border rounded-lg">
              <table className="w-full text-[9px] min-w-[900px]">
                <thead className="sticky top-0 bg-muted/90 backdrop-blur">
                  <tr>
                    <th className="text-left p-1.5 text-muted-foreground font-medium">ID</th>
                    <th className="text-left p-1.5 text-muted-foreground font-medium">User</th>
                    <th className="text-left p-1.5 text-muted-foreground font-medium">Offerwall</th>
                    <th className="text-left p-1.5 text-muted-foreground font-medium">Offer Name</th>
                    <th className="text-center p-1.5 text-muted-foreground font-medium">Coin</th>
                    <th className="text-center p-1.5 text-muted-foreground font-medium">Amount</th>
                    <th className="text-center p-1.5 text-muted-foreground font-medium">Revenue</th>
                    <th className="text-left p-1.5 text-muted-foreground font-medium">Tx ID</th>
                    <th className="text-center p-1.5 text-muted-foreground font-medium">IP</th>
                    <th className="text-left p-1.5 text-muted-foreground font-medium">Country</th>
                    <th className="text-left p-1.5 text-muted-foreground font-medium">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {pageData.map((row) => (
                    <tr key={row.id} className="border-t border-border/50 hover:bg-primary/5">
                      <td className="p-1.5">{row.id}</td>
                      <td className="p-1.5 font-medium">{row.username}</td>
                      <td className="p-1.5">
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold text-black bg-gradient-to-r ${getOfferwallColor(row.offerwall)}`}>
                          {row.offerwall}
                        </span>
                      </td>
                      <td className="p-1.5 max-w-[120px] truncate">{row.offerName}</td>
                      <td className="p-1.5 text-center">{row.coin}</td>
                      <td className="p-1.5 text-center text-green-400">{row.amount}</td>
                      <td className="p-1.5 text-center text-yellow-400">{row.revenue}</td>
                      <td className="p-1.5 font-mono text-muted-foreground max-w-[80px] truncate">{row.transactionId}</td>
                      <td className="p-1.5 text-center uppercase text-muted-foreground">{row.ip}</td>
                      <td className="p-1.5 text-muted-foreground">{row.country}</td>
                      <td className="p-1.5 text-muted-foreground">{row.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-between mt-3 gap-2 text-[10px]">
              <div className="text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(startIndex + rowsPerPage, filteredData.length)} of {filteredData.length}
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-2 py-1 rounded bg-muted border border-border disabled:opacity-40"
                >
                  ← Prev
                </button>
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  const page = currentPage <= 3 ? i + 1 : currentPage + i - 2;
                  if (page > totalPages || page < 1) return null;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-2 py-1 rounded border ${
                        currentPage === page
                          ? 'bg-primary text-black border-primary font-bold'
                          : 'bg-muted border-border'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2 py-1 rounded bg-muted border border-border disabled:opacity-40"
                >
                  Next →
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default AdminCompletedOffers;
