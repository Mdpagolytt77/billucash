import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, Users, DollarSign, 
  TrendingUp, AlertCircle, CheckCircle, Clock,
  RefreshCw, Menu, X, Zap
} from 'lucide-react';
import heroBg from '@/assets/hero-bg.jpg';
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

interface Stats {
  totalUsers: number;
  totalEarnings: number;
  totalTasks: number;
  todaySignups: number;
}

interface RealtimeTransaction {
  id: string;
  transaction_id: string | null;
  username: string;
  offerwall: string;
  offer_name: string;
  coin: number;
  created_at: string;
}

const AdminPanel = () => {
  const { isAdmin } = useAuth();
  const { snowEnabled, toggleSnow } = useSnowEffect();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalEarnings: 0, totalTasks: 0, todaySignups: 0 });
  const [realtimeTransactions, setRealtimeTransactions] = useState<RealtimeTransaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  const fetchWithdrawals = async () => {
    setIsLoadingData(true);
    try {
      const { data, error } = await supabase.from('withdrawal_requests').select('*').eq('status', 'pending').order('created_at', { ascending: false });
      if (error) throw error;
      setWithdrawalRequests(data || []);
    } catch (error: any) {
      toast.error('Failed to load withdrawals');
    } finally {
      setIsLoadingData(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      const { data: balanceData } = await supabase.from('profiles').select('balance');
      const totalEarnings = balanceData?.reduce((sum, p) => sum + (Number(p.balance) || 0), 0) || 0;
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const { count: todayCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString());
      const { count: taskCount } = await supabase.from('completed_offers').select('*', { count: 'exact', head: true });
      setStats({ totalUsers: userCount || 0, totalEarnings, totalTasks: taskCount || 0, todaySignups: todayCount || 0 });
    } catch (error) { console.error('Error fetching stats:', error); }
  };

  const fetchRealtimeTransactions = async () => {
    setLoadingTransactions(true);
    try {
      const { data, error } = await supabase
        .from('completed_offers')
        .select('id, transaction_id, username, offerwall, offer_name, coin, created_at')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      setRealtimeTransactions(data || []);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setLoadingTransactions(false);
    }
  };

  useEffect(() => {
    if (isAdmin) { fetchWithdrawals(); fetchStats(); fetchRealtimeTransactions(); }
  }, [isAdmin]);

  // Real-time listener for withdrawals
  useEffect(() => {
    if (!isAdmin) return;
    const channel = supabase.channel('withdrawal-requests-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'withdrawal_requests' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newRequest = payload.new as WithdrawalRequest;
          if (newRequest.status === 'pending') {
            setWithdrawalRequests(prev => [newRequest, ...prev]);
            toast.info(`New withdrawal from ${newRequest.username}`);
          }
        } else if (payload.eventType === 'UPDATE') {
          const updated = payload.new as WithdrawalRequest;
          if (updated.status !== 'pending') setWithdrawalRequests(prev => prev.filter(w => w.id !== updated.id));
          else setWithdrawalRequests(prev => prev.map(w => w.id === updated.id ? updated : w));
        } else if (payload.eventType === 'DELETE') {
          setWithdrawalRequests(prev => prev.filter(w => w.id !== (payload.old as WithdrawalRequest).id));
        }
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isAdmin]);

  // Real-time listener for completed_offers (postbacks)
  useEffect(() => {
    if (!isAdmin) return;
    const channel = supabase.channel('realtime-transactions')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'completed_offers' }, (payload) => {
        const newTx = payload.new as RealtimeTransaction;
        setRealtimeTransactions(prev => [newTx, ...prev.slice(0, 49)]);
        toast.success(`New postback: ${newTx.username} earned ${newTx.coin} coins from ${newTx.offerwall}`);
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
          <h1 className="text-xl font-bold mb-2">Access Denied</h1>
          <Link to="/dashboard" className="text-primary text-sm">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

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

  const handleApproveAll = async () => { for (const req of withdrawalRequests) await handleApprove(req.id, req.username, req.amount); };
  const handleRejectAll = async () => { for (const req of withdrawalRequests) await handleReject(req.id, req.username); };

  const statCards = [
    { label: 'Total Accounts', value: stats.totalUsers.toLocaleString(), icon: Users, color: 'text-blue-400' },
    { label: 'Total Earnings', value: `৳ ${stats.totalEarnings.toFixed(2)}`, icon: DollarSign, color: 'text-green-400' },
    { label: 'Tasks Completed', value: stats.totalTasks.toLocaleString(), icon: TrendingUp, color: 'text-purple-400' },
    { label: "Today's Signups", value: stats.todaySignups.toLocaleString(), icon: Clock, color: 'text-yellow-400' },
  ];

  const pendingCount = withdrawalRequests.length;

  return (
    <>
      {snowEnabled && <SnowEffect />}
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="min-h-screen" style={{ background: `linear-gradient(rgba(0,0,0,0.85), rgba(0,0,0,0.85)), url(${heroBg}) no-repeat center center fixed`, backgroundSize: 'cover' }}>
        <header className="sticky top-0 z-30 px-3 py-2 bg-background/95 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 hover:bg-muted rounded-lg"><Menu className="w-4 h-4" /></button>
            <SiteLogo size="sm" />
            <span className="text-xs text-muted-foreground">/ Admin</span>
          </div>
          <SnowToggle enabled={snowEnabled} onToggle={toggleSnow} />
        </header>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 px-3 md:px-[5%] py-4">
          {statCards.map((stat, i) => (
            <div key={i} className="glass-card p-4 text-center" style={{ borderTop: '3px solid hsl(var(--primary))' }}>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-2">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div className="text-xl font-bold text-primary">{stat.value}</div>
              <div className="text-[10px] text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Withdrawals */}
        <div className="mx-3 md:mx-[5%] mb-4">
          <div className="glass-card p-4">
            <h2 className="text-sm font-bold text-primary mb-3 flex items-center gap-2">
              <DollarSign className="w-4 h-4" /> Withdrawals
              <span className="text-xs text-muted-foreground">({pendingCount} Pending)</span>
              {isLoadingData && <RefreshCw className="w-3 h-3 animate-spin" />}
            </h2>

            <div className="flex flex-wrap gap-2 mb-3 p-2 rounded-lg bg-muted/50 border border-border">
              <button onClick={handleApproveAll} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-green-500 text-white text-[10px] font-medium">
                <CheckCircle className="w-3 h-3" /> Approve All
              </button>
              <button onClick={handleRejectAll} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500 text-white text-[10px] font-medium">
                <X className="w-3 h-3" /> Reject All
              </button>
              <div className="flex items-center gap-1.5 ml-auto text-[10px] text-primary font-medium">
                <AlertCircle className="w-3 h-3" /> Pending: <span className="bg-primary text-white px-1.5 py-0.5 rounded-full text-[9px]">{pendingCount}</span>
              </div>
              <button onClick={fetchWithdrawals} disabled={isLoadingData} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-500 text-white text-[10px] font-medium">
                <RefreshCw className={`w-3 h-3 ${isLoadingData ? 'animate-spin' : ''}`} /> Refresh
              </button>
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
                  {withdrawalRequests.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-6 text-muted-foreground"><CheckCircle className="w-8 h-8 mx-auto mb-1 opacity-50" />No pending</td></tr>
                  ) : (
                    withdrawalRequests.map(req => (
                      <tr key={req.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-1.5 px-2 font-medium">{req.username}</td>
                        <td className="py-1.5 px-2">{req.method}</td>
                        <td className="py-1.5 px-2 text-muted-foreground max-w-[80px] truncate">{req.account}</td>
                        <td className="py-1.5 px-2 text-green-400 font-semibold">৳ {Number(req.amount).toFixed(2)}</td>
                        <td className="py-1.5 px-2 text-muted-foreground">{new Date(req.created_at).toLocaleDateString()}</td>
                        <td className="py-1.5 px-2"><span className="px-1.5 py-0.5 rounded-full text-[9px] font-semibold uppercase bg-yellow-500/20 text-yellow-400">{req.status}</span></td>
                        <td className="py-1.5 px-2">
                          <div className="flex gap-1">
                            <button onClick={() => handleApprove(req.id, req.username, req.amount)} className="p-1 bg-green-500 rounded text-white"><CheckCircle className="w-3 h-3" /></button>
                            <button onClick={() => handleReject(req.id, req.username)} className="p-1 bg-red-500 rounded text-white"><X className="w-3 h-3" /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Real-time Transactions Section */}
        <div className="mx-3 md:mx-[5%] mb-4">
          <div className="glass-card p-4">
            <h2 className="text-sm font-bold text-primary mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4" /> Real-time Transactions
              <span className="text-xs text-muted-foreground">(Last 50 postbacks)</span>
              {loadingTransactions && <RefreshCw className="w-3 h-3 animate-spin" />}
              <button onClick={fetchRealtimeTransactions} disabled={loadingTransactions} className="ml-auto p-1.5 bg-primary/20 rounded-lg hover:bg-primary/30">
                <RefreshCw className={`w-3 h-3 text-primary ${loadingTransactions ? 'animate-spin' : ''}`} />
              </button>
            </h2>

            <div className="overflow-x-auto max-h-64 overflow-y-auto">
              <table className="w-full text-[10px]">
                <thead className="sticky top-0 bg-background">
                  <tr className="border-b border-border">
                    <th className="text-left py-1.5 px-2 text-primary bg-primary/10">Timestamp</th>
                    <th className="text-left py-1.5 px-2 text-primary bg-primary/10">Transaction ID</th>
                    <th className="text-left py-1.5 px-2 text-primary bg-primary/10">User</th>
                    <th className="text-left py-1.5 px-2 text-primary bg-primary/10">Offerwall</th>
                    <th className="text-left py-1.5 px-2 text-primary bg-primary/10">Offer</th>
                    <th className="text-left py-1.5 px-2 text-primary bg-primary/10">Coins</th>
                  </tr>
                </thead>
                <tbody>
                  {realtimeTransactions.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-6 text-muted-foreground">
                      {loadingTransactions ? 'Loading...' : 'No transactions yet'}
                    </td></tr>
                  ) : (
                    realtimeTransactions.map(tx => (
                      <tr key={tx.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-1.5 px-2 text-muted-foreground">
                          {new Date(tx.created_at).toLocaleString()}
                        </td>
                        <td className="py-1.5 px-2 font-mono text-[9px] max-w-[100px] truncate" title={tx.transaction_id || ''}>
                          {tx.transaction_id || 'N/A'}
                        </td>
                        <td className="py-1.5 px-2 font-medium">{tx.username}</td>
                        <td className="py-1.5 px-2">
                          <span className="px-1.5 py-0.5 rounded bg-primary/20 text-primary text-[9px] font-medium uppercase">
                            {tx.offerwall}
                          </span>
                        </td>
                        <td className="py-1.5 px-2 max-w-[120px] truncate" title={tx.offer_name}>{tx.offer_name}</td>
                        <td className="py-1.5 px-2 text-green-400 font-semibold">{tx.coin}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminPanel;
