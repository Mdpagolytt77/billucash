import { useState, useEffect } from 'react';
import { Wallet, Menu, RefreshCw, CheckCircle, X } from 'lucide-react';
import SnowEffect from '@/components/SnowEffect';
import SnowToggle from '@/components/SnowToggle';
import AdminSidebar from '@/components/AdminSidebar';
import { useSnowEffect } from '@/hooks/useSnowEffect';
import { useAuth } from '@/contexts/AuthContext';
import { SiteLogo } from '@/contexts/SiteSettingsContext';
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
  const { isAdmin, isModerator } = useAuth();
  const canAccess = isAdmin || isModerator;
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
    } catch { toast.error('Failed to load'); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { if (canAccess) fetchWithdrawals(); }, [canAccess, filter]);

  useEffect(() => {
    if (!canAccess) return;
    const channel = supabase.channel('admin-withdrawals').on('postgres_changes', { event: '*', schema: 'public', table: 'withdrawal_requests' }, () => fetchWithdrawals()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [canAccess]);

  const handleApprove = async (id: string, username: string, amount: number) => {
    try {
      const { data, error } = await supabase.rpc('approve_withdrawal', { _request_id: id });
      if (error) throw error;
      const result = data as { success?: boolean; error?: string } | null;
      if (result && !result.success) {
        toast.error(result.error || 'Failed to approve');
        return;
      }
      toast.success(`Approved ৳${amount.toFixed(2)} for ${username} (Balance deducted)`);
    } catch (err: any) { toast.error(err.message || 'Failed'); }
  };

  const handleReject = async (id: string, username: string) => {
    try {
      const { data, error } = await supabase.rpc('reject_withdrawal', { _request_id: id, _reason: 'Admin rejected' });
      if (error) throw error;
      const result = data as { success?: boolean; error?: string } | null;
      if (result && !result.success) {
        toast.error(result.error || 'Failed to reject');
        return;
      }
      toast.success(`Rejected from ${username}`);
    } catch (err: any) { toast.error(err.message || 'Failed'); }
  };

  const pendingCount = withdrawals.filter(w => w.status === 'pending').length;

  if (!canAccess) return <div className="min-h-screen flex items-center justify-center">Access Denied</div>;

  return (
    <>
      {snowEnabled && <SnowEffect />}
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="min-h-screen" style={{ background: '#000000' }}>
        <header className="sticky top-0 z-30 px-3 py-2 border-b flex items-center justify-between" style={{ background: '#0a0a0a', borderColor: '#1a1a1a' }}>
          <div className="flex items-center gap-2">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 hover:bg-muted rounded-lg"><Menu className="w-4 h-4" /></button>
            <SiteLogo size="sm" />
            <span className="text-xs text-muted-foreground">/ Withdraw</span>
          </div>
          <SnowToggle enabled={snowEnabled} onToggle={toggleSnow} />
        </header>

        <main className="p-3 md:px-[5%]">
          <div className="glass-card p-3">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h2 className="text-sm font-bold text-primary flex items-center gap-1.5">
                <Wallet className="w-4 h-4" /> Withdrawals
                <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded-full">{pendingCount} Pending</span>
              </h2>
              <div className="flex items-center gap-1.5">
                {(['pending', 'approved', 'rejected', 'all'] as const).map(f => (
                  <button key={f} onClick={() => setFilter(f)} className={`px-2 py-1 rounded-lg text-[10px] font-medium ${filter === f ? 'bg-primary text-white' : 'bg-muted'}`}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
                <button onClick={fetchWithdrawals} disabled={isLoading} className="p-1.5 bg-primary/20 rounded-lg">
                  <RefreshCw className={`w-3 h-3 text-primary ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-1.5 px-2 text-primary bg-primary/10">User</th>
                    <th className="text-left py-1.5 px-2 text-primary bg-primary/10">Method</th>
                    <th className="text-left py-1.5 px-2 text-primary bg-primary/10">Account</th>
                    <th className="text-left py-1.5 px-2 text-primary bg-primary/10">Amount</th>
                    <th className="text-left py-1.5 px-2 text-primary bg-primary/10">Date</th>
                    <th className="text-left py-1.5 px-2 text-primary bg-primary/10">Status</th>
                    <th className="text-left py-1.5 px-2 text-primary bg-primary/10">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-6 text-muted-foreground">{isLoading ? 'Loading...' : 'No withdrawals'}</td></tr>
                  ) : (
                    withdrawals.map(w => (
                      <tr key={w.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-1.5 px-2 font-medium">{w.username}</td>
                        <td className="py-1.5 px-2">{w.method}</td>
                        <td className="py-1.5 px-2 text-muted-foreground max-w-[80px] truncate">{w.account}</td>
                        <td className="py-1.5 px-2 text-green-400 font-semibold">৳ {Number(w.amount).toFixed(2)}</td>
                        <td className="py-1.5 px-2 text-muted-foreground">{new Date(w.created_at).toLocaleDateString()}</td>
                        <td className="py-1.5 px-2">
                          <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-semibold uppercase ${w.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : w.status === 'approved' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{w.status}</span>
                        </td>
                        <td className="py-1.5 px-2">
                          {w.status === 'pending' && (
                            <div className="flex gap-1">
                              <button onClick={() => handleApprove(w.id, w.username, w.amount)} className="p-1 bg-green-500 rounded text-white"><CheckCircle className="w-3 h-3" /></button>
                              <button onClick={() => handleReject(w.id, w.username)} className="p-1 bg-red-500 rounded text-white"><X className="w-3 h-3" /></button>
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
