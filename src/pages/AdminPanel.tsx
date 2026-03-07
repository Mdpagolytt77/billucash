import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Users, DollarSign, AlertCircle, CheckCircle, Clock,
  RefreshCw, Menu, X, Zap, Settings, CreditCard, History, ArrowDownCircle, RotateCcw
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import pageBg from '@/assets/page-bg.jpg';
import SnowEffect from '@/components/SnowEffect';
import SnowToggle from '@/components/SnowToggle';
import AdminSidebar from '@/components/AdminSidebar';
import { useSnowEffect } from '@/hooks/useSnowEffect';
import { useAuth } from '@/contexts/AuthContext';
import { SiteLogo, useSiteSettings, getBackgroundStyle } from '@/contexts/SiteSettingsContext';
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
  allUsers: number;
  completedOffers: number;
  totalRevenue: number;
  totalPendingWithdraw: number;
  totalWithdrawn: number;
  pendingWithdrawCount: number;
  allWithdrawHistory: number;
  chargeback: number;
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
  const { isAdmin, isModerator } = useAuth();
  const canAccess = isAdmin || isModerator;
  const navigate = useNavigate();
  const { snowEnabled, toggleSnow } = useSnowEffect();
  const { backgrounds } = useSiteSettings();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [stats, setStats] = useState<Stats>({ 
    allUsers: 0, 
    completedOffers: 0, 
    totalRevenue: 0, 
    totalPendingWithdraw: 0,
    totalWithdrawn: 0,
    pendingWithdrawCount: 0,
    allWithdrawHistory: 0,
    chargeback: 0
  });
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
      // All users count
      const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      
      // Completed offers count
      const { count: offersCount } = await supabase.from('completed_offers').select('*', { count: 'exact', head: true });
      
      // Total revenue from completed offers (coin sum * rate)
      const { data: offersData } = await supabase.from('completed_offers').select('coin');
      const totalCoins = offersData?.reduce((sum, o) => sum + (o.coin || 0), 0) || 0;
      const totalRevenue = totalCoins / 500; // 500 coins = $1

      // Pending withdrawals
      const { data: pendingData, count: pendingCount } = await supabase
        .from('withdrawal_requests')
        .select('amount', { count: 'exact' })
        .eq('status', 'pending');
      const totalPendingWithdraw = pendingData?.reduce((sum, w) => sum + Number(w.amount), 0) || 0;

      // Approved withdrawals (total withdrawn)
      const { data: approvedData, count: approvedCount } = await supabase
        .from('withdrawal_requests')
        .select('amount', { count: 'exact' })
        .eq('status', 'approved');
      const totalWithdrawn = approvedData?.reduce((sum, w) => sum + Number(w.amount), 0) || 0;

      // All withdrawal history count
      const { count: allWithdrawCount } = await supabase.from('withdrawal_requests').select('*', { count: 'exact', head: true });

      setStats({ 
        allUsers: userCount || 0, 
        completedOffers: offersCount || 0, 
        totalRevenue,
        totalPendingWithdraw,
        totalWithdrawn,
        pendingWithdrawCount: pendingCount || 0,
        allWithdrawHistory: allWithdrawCount || 0,
        chargeback: 0 // No chargeback table yet
      });
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
    if (canAccess) { fetchWithdrawals(); fetchStats(); fetchRealtimeTransactions(); }
  }, [canAccess]);

  // Real-time listener for withdrawals
  useEffect(() => {
    if (!canAccess) return;
    const channel = supabase.channel('withdrawal-requests-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'withdrawal_requests' }, (payload) => {
        fetchStats(); // Refresh stats on any withdrawal change
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
  }, [canAccess]);

  // Real-time listener for completed_offers (postbacks)
  useEffect(() => {
    if (!canAccess) return;
    const channel = supabase.channel('realtime-transactions')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'completed_offers' }, (payload) => {
        const newTx = payload.new as RealtimeTransaction;
        setRealtimeTransactions(prev => [newTx, ...prev.slice(0, 49)]);
        fetchStats(); // Refresh stats on new offer
        toast.success(`New postback: ${newTx.username} earned ${newTx.coin} coins from ${newTx.offerwall}`);
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [canAccess]);

  // Real-time listener for profiles (user count)
  useEffect(() => {
    if (!canAccess) return;
    const channel = supabase.channel('profiles-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchStats();
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [canAccess]);

  if (!canAccess) {
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

  const [isResettingWithdrawals, setIsResettingWithdrawals] = useState(false);

  const handleResetTotalWithdrawn = async () => {
    setIsResettingWithdrawals(true);
    try {
      // Delete all approved withdrawal records
      const { error } = await supabase
        .from('withdrawal_requests')
        .delete()
        .eq('status', 'approved');
      
      if (error) throw error;
      
      toast.success('Total withdrawn has been reset successfully!');
      fetchStats(); // Refresh stats
    } catch (error: any) {
      toast.error(error.message || 'Failed to reset withdrawals');
    } finally {
      setIsResettingWithdrawals(false);
    }
  };

  // Stat cards matching the reference image
  const statCards = [
    { label: 'All users', value: stats.allUsers.toLocaleString(), icon: Users, color: 'text-primary' },
    { label: 'Completed Offers', value: stats.completedOffers.toLocaleString(), icon: CheckCircle, color: 'text-primary' },
    { label: 'Total Revenue', value: `$ ${stats.totalRevenue.toFixed(2)}`, icon: CheckCircle, color: 'text-primary' },
    { label: 'Total pending Withdraw', value: `$ ${stats.totalPendingWithdraw.toFixed(0)}`, icon: CheckCircle, color: 'text-primary' },
  ];

  const statCards2 = [
    { label: 'Total Withdrawn', value: `$ ${stats.totalWithdrawn.toFixed(2)}`, icon: CheckCircle, color: 'text-primary', hasReset: true },
    { label: 'Pending Withdraw', value: stats.pendingWithdrawCount.toLocaleString(), icon: ArrowDownCircle, color: 'text-primary' },
    { label: 'All withdraw History', value: stats.allWithdrawHistory.toLocaleString(), icon: History, color: 'text-primary' },
    { label: 'Chargeback', value: `$ ${stats.chargeback}`, icon: CheckCircle, color: 'text-primary' },
  ];

  const pendingCount = withdrawalRequests.length;

  return (
    <>
      {snowEnabled && <SnowEffect />}
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="min-h-screen" style={{ background: '#000000' }}>
        <header className="sticky top-0 z-30 px-3 py-2 border-b flex items-center justify-between" style={{ background: '#0a0a0a', borderColor: '#1a1a1a' }}>
          <div className="flex items-center gap-2">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 hover:bg-muted rounded-lg"><Menu className="w-4 h-4" /></button>
            <SiteLogo size="sm" />
          </div>
          <SnowToggle enabled={snowEnabled} onToggle={toggleSnow} />
        </header>

        <div className="px-3 md:px-[5%] pt-4">
          <h1 className="text-lg font-bold text-foreground mb-4">Dashboard</h1>
        </div>

        {/* Stats Row 1 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 px-3 md:px-[5%]">
          {statCards.map((stat, i) => (
            <div key={i} className="p-4 rounded-xl" style={{ background: '#111111', border: '1px solid #1a1a1a' }}>
              <div className="text-[10px] text-muted-foreground mb-1">{stat.label}</div>
              <div className="text-lg font-bold text-foreground">{stat.value}</div>
              <div className="flex items-center gap-1 mt-1">
                <stat.icon className="w-3 h-3 text-primary" />
                <span className="text-[9px] text-primary">{stat.label}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Stats Row 2 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 px-3 md:px-[5%] pt-3">
          {statCards2.map((stat, i) => (
            <div key={i} className="p-4 rounded-xl relative" style={{ background: '#111111', border: '1px solid #1a1a1a' }}>
              <div className="text-[10px] text-muted-foreground mb-1">{stat.label}</div>
              <div className="text-lg font-bold text-foreground">{stat.value}</div>
              <div className="flex items-center gap-1 mt-1">
                <stat.icon className="w-3 h-3 text-primary" />
                <span className="text-[9px] text-primary">{stat.label}</span>
              </div>
              {stat.hasReset && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button 
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-400 transition-colors"
                      title="Reset Total Withdrawn"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reset Total Withdrawn?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will delete all approved withdrawal records and reset the total withdrawn amount to $0. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleResetTotalWithdrawn}
                        disabled={isResettingWithdrawals}
                        className="bg-red-500 hover:bg-red-600"
                      >
                        {isResettingWithdrawals ? 'Resetting...' : 'Reset'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          ))}
        </div>




        {/* Pending Withdrawals */}
        <div className="mx-3 md:mx-[5%] mb-4">
          <div className="p-4 rounded-xl" style={{ background: '#111111', border: '1px solid #1a1a1a' }}>
            <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" /> Pending Withdrawals
              <span className="text-xs text-muted-foreground">({pendingCount})</span>
              {isLoadingData && <RefreshCw className="w-3 h-3 animate-spin" />}
            </h2>

            <div className="flex flex-wrap gap-2 mb-3 p-2 rounded-lg border" style={{ background: '#0a0a0a', borderColor: '#1a1a1a' }}>
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
                  <tr style={{ borderBottom: '1px solid #1a1a1a' }}>
                    <th className="text-left py-1.5 px-2 text-muted-foreground">User</th>
                    <th className="text-left py-1.5 px-2 text-muted-foreground">Method</th>
                    <th className="text-left py-1.5 px-2 text-muted-foreground">Account</th>
                    <th className="text-left py-1.5 px-2 text-muted-foreground">Amount</th>
                    <th className="text-left py-1.5 px-2 text-muted-foreground">Date</th>
                    <th className="text-left py-1.5 px-2 text-muted-foreground">Status</th>
                    <th className="text-left py-1.5 px-2 text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawalRequests.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-6 text-muted-foreground"><CheckCircle className="w-8 h-8 mx-auto mb-1 opacity-50" />No pending</td></tr>
                  ) : (
                    withdrawalRequests.map(req => (
                      <tr key={req.id} style={{ borderBottom: '1px solid #1a1a1a' }} className="hover:bg-white/5">
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
          <div className="p-4 rounded-xl" style={{ background: '#111111', border: '1px solid #1a1a1a' }}>
            <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" /> Real-time Transactions
              <span className="text-xs text-muted-foreground">(Last 50 postbacks)</span>
              {loadingTransactions && <RefreshCw className="w-3 h-3 animate-spin" />}
              <button onClick={fetchRealtimeTransactions} disabled={loadingTransactions} className="ml-auto p-1.5 rounded-lg hover:bg-white/5">
                <RefreshCw className={`w-3 h-3 text-muted-foreground ${loadingTransactions ? 'animate-spin' : ''}`} />
              </button>
            </h2>

            <div className="overflow-x-auto max-h-64 overflow-y-auto">
              <table className="w-full text-[10px]">
                <thead className="sticky top-0" style={{ background: '#111111' }}>
                  <tr style={{ borderBottom: '1px solid #1a1a1a' }}>
                    <th className="text-left py-1.5 px-2 text-muted-foreground">Timestamp</th>
                    <th className="text-left py-1.5 px-2 text-muted-foreground">Transaction ID</th>
                    <th className="text-left py-1.5 px-2 text-muted-foreground">User</th>
                    <th className="text-left py-1.5 px-2 text-muted-foreground">Offerwall</th>
                    <th className="text-left py-1.5 px-2 text-muted-foreground">Offer</th>
                    <th className="text-left py-1.5 px-2 text-muted-foreground">Coins</th>
                  </tr>
                </thead>
                <tbody>
                  {realtimeTransactions.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-6 text-muted-foreground">
                      {loadingTransactions ? 'Loading...' : 'No transactions yet'}
                    </td></tr>
                  ) : (
                    realtimeTransactions.map(tx => (
                      <tr key={tx.id} style={{ borderBottom: '1px solid #1a1a1a' }} className="hover:bg-white/5">
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
