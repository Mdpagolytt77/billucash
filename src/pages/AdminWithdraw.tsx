import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Wallet, ArrowLeft, Menu, Home, Users, Key, Palette, LogOut,
  RefreshCw, CheckCircle, X, AlertCircle
} from 'lucide-react';
import heroBg from '@/assets/hero-bg.jpg';
import SnowEffect from '@/components/SnowEffect';
import SnowToggle from '@/components/SnowToggle';
import { useSnowEffect } from '@/hooks/useSnowEffect';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface WithdrawalRequest {
  id: string;
  user_id: string;
  username: string;
  amount: number;
  method: string;
  account: string;
  status: string;
  created_at: string;
}

const AdminWithdraw = () => {
  const { isAdmin, signOut } = useAuth();
  const { snowEnabled, toggleSnow } = useSnowEffect();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');

  const fetchWithdrawals = async () => {
    setIsLoading(true);
    try {
      let query = supabase.from('withdrawal_requests').select('*').order('created_at', { ascending: false });
      if (filter !== 'all') query = query.eq('status', filter);
      const { data, error } = await query;
      if (error) throw error;
      setWithdrawals(data || []);
    } catch (error: any) {
      toast.error('Failed to load withdrawals');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) fetchWithdrawals();
  }, [isAdmin, filter]);

  useEffect(() => {
    if (!isAdmin) return;
    const channel = supabase
      .channel('admin-withdrawals')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'withdrawal_requests' }, () => fetchWithdrawals())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isAdmin]);

  const handleApprove = async (id: string, username: string, amount: number) => {
    try {
      const { error } = await supabase.from('withdrawal_requests')
        .update({ status: 'approved', approved_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
      toast.success(`Approved ৳${amount.toFixed(2)} for ${username}`);
    } catch { toast.error('Failed'); }
  };

  const handleReject = async (id: string, username: string) => {
    try {
      const { error } = await supabase.from('withdrawal_requests')
        .update({ status: 'rejected', rejected_at: new Date().toISOString(), rejection_reason: 'Admin rejected' }).eq('id', id);
      if (error) throw error;
      toast.success(`Rejected withdrawal from ${username}`);
    } catch { toast.error('Failed'); }
  };

  const sidebarItems = [
    { icon: Home, label: 'Dashboard', path: '/admin' },
    { icon: Users, label: 'All Users', path: '/admin/users' },
    { icon: Wallet, label: 'Withdraw', path: '/admin/withdraw', active: true },
    { icon: Palette, label: 'Logo Customize', path: '/admin/logo' },
    { icon: Key, label: 'Password Reset', path: '/admin/password' },
  ];

  const pendingCount = withdrawals.filter(w => w.status === 'pending').length;

  if (!isAdmin) return <div className="min-h-screen flex items-center justify-center">Access Denied</div>;

  return (
    <>
      {snowEnabled && <SnowEffect />}
      
      <div className={`fixed inset-0 bg-black/70 z-40 transition-opacity ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setSidebarOpen(false)} />

      <aside className={`fixed top-0 left-0 h-full w-56 bg-background border-r border-border z-50 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 pt-20">
          <div className="text-center mb-6 pb-4 border-b border-border">
            <div className="logo-3d text-lg">BILLUCASH</div>
          </div>
          <nav className="space-y-1">
            {sidebarItems.map((item, i) => (
              <Link key={i} to={item.path} onClick={() => setSidebarOpen(false)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  item.active ? 'bg-primary/20 text-primary font-medium' : 'hover:bg-muted text-muted-foreground'
                }`}
              >
                <item.icon className="w-4 h-4" /> {item.label}
              </Link>
            ))}
            <div className="pt-3 border-t border-border mt-3">
              <button onClick={() => signOut()} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-destructive hover:bg-destructive/10 text-sm">
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          </nav>
        </div>
      </aside>

      <div className="min-h-screen" style={{ background: `linear-gradient(rgba(0,0,0,0.85), rgba(0,0,0,0.85)), url(${heroBg}) no-repeat center center fixed`, backgroundSize: 'cover' }}>
        <header className="sticky top-0 z-30 px-4 py-3 bg-background/95 backdrop-blur-lg border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-muted rounded-lg"><Menu className="w-5 h-5" /></button>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center font-bold text-sm">B</div>
            <span className="logo-3d text-base">Withdraw</span>
          </div>
          <div className="flex items-center gap-2">
            <SnowToggle enabled={snowEnabled} onToggle={toggleSnow} />
            <Link to="/admin" className="p-2 hover:bg-muted rounded-lg text-primary"><ArrowLeft className="w-5 h-5" /></Link>
          </div>
        </header>

        <main className="p-4 md:px-[5%]">
          <div className="glass-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h2 className="text-lg font-bold text-primary flex items-center gap-2">
                <Wallet className="w-5 h-5" /> Withdrawals
                <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">{pendingCount} Pending</span>
              </h2>
              <div className="flex items-center gap-2">
                {(['pending', 'approved', 'rejected', 'all'] as const).map(f => (
                  <button key={f} onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium ${filter === f ? 'bg-primary text-white' : 'bg-muted hover:bg-muted/80'}`}
                  >{f.charAt(0).toUpperCase() + f.slice(1)}</button>
                ))}
                <button onClick={fetchWithdrawals} disabled={isLoading} className="p-2 bg-primary/20 rounded-lg">
                  <RefreshCw className={`w-4 h-4 text-primary ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-2 font-semibold text-primary bg-primary/10">User</th>
                    <th className="text-left py-2 px-2 font-semibold text-primary bg-primary/10">Method</th>
                    <th className="text-left py-2 px-2 font-semibold text-primary bg-primary/10">Account</th>
                    <th className="text-left py-2 px-2 font-semibold text-primary bg-primary/10">Amount</th>
                    <th className="text-left py-2 px-2 font-semibold text-primary bg-primary/10">Date</th>
                    <th className="text-left py-2 px-2 font-semibold text-primary bg-primary/10">Status</th>
                    <th className="text-left py-2 px-2 font-semibold text-primary bg-primary/10">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">{isLoading ? 'Loading...' : 'No withdrawals found'}</td></tr>
                  ) : (
                    withdrawals.map(w => (
                      <tr key={w.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-2 px-2 font-medium">{w.username}</td>
                        <td className="py-2 px-2">{w.method}</td>
                        <td className="py-2 px-2 text-muted-foreground max-w-[100px] truncate">{w.account}</td>
                        <td className="py-2 px-2 text-green-400 font-semibold">৳ {Number(w.amount).toFixed(2)}</td>
                        <td className="py-2 px-2 text-muted-foreground">{new Date(w.created_at).toLocaleDateString()}</td>
                        <td className="py-2 px-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                            w.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                            w.status === 'approved' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                          }`}>{w.status}</span>
                        </td>
                        <td className="py-2 px-2">
                          {w.status === 'pending' && (
                            <div className="flex gap-1">
                              <button onClick={() => handleApprove(w.id, w.username, w.amount)} className="p-1.5 bg-green-500 rounded text-white"><CheckCircle className="w-3 h-3" /></button>
                              <button onClick={() => handleReject(w.id, w.username)} className="p-1.5 bg-red-500 rounded text-white"><X className="w-3 h-3" /></button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default AdminWithdraw;
