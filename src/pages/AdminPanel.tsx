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
    { label: 'All users', value: stats.allUsers.toLocaleString(), icon: Users, color: 'text-primary', link: '/admin/users' },
    { label: 'Completed Offers', value: stats.completedOffers.toLocaleString(), icon: CheckCircle, color: 'text-primary', link: '/admin/offers' },
    { label: 'Total Revenue', value: `$ ${stats.totalRevenue.toFixed(2)}`, icon: CheckCircle, color: 'text-primary', link: '/admin/offers' },
    { label: 'Total pending Withdraw', value: `$ ${stats.totalPendingWithdraw.toFixed(0)}`, icon: CheckCircle, color: 'text-primary', link: '/admin/withdraw' },
  ];

  const statCards2 = [
    { label: 'Total Withdrawn', value: `$ ${stats.totalWithdrawn.toFixed(2)}`, icon: CheckCircle, color: 'text-primary', link: '/admin/withdraw' },
    { label: 'Pending Withdraw', value: stats.pendingWithdrawCount.toLocaleString(), icon: ArrowDownCircle, color: 'text-primary', link: '/admin/withdraw' },
    { label: 'All withdraw History', value: stats.allWithdrawHistory.toLocaleString(), icon: History, color: 'text-primary', link: '/admin/withdraw' },
    { label: 'Chargeback', value: `$ ${stats.chargeback}`, icon: CheckCircle, color: 'text-primary', link: '/admin/chargeback' },
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
            <div key={i} onClick={() => navigate(stat.link)} className="p-4 rounded-xl cursor-pointer hover:bg-white/5 transition-colors" style={{ background: '#111111', border: '1px solid #1a1a1a' }}>
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
            <div key={i} onClick={() => stat.link && navigate(stat.link)} className="p-4 rounded-xl relative cursor-pointer hover:bg-white/5 transition-colors" style={{ background: '#111111', border: '1px solid #1a1a1a' }}>
              <div className="text-[10px] text-muted-foreground mb-1">{stat.label}</div>
              <div className="text-lg font-bold text-foreground">{stat.value}</div>
              <div className="flex items-center gap-1 mt-1">
                <stat.icon className="w-3 h-3 text-primary" />
                <span className="text-[9px] text-primary">{stat.label}</span>
              </div>
            </div>
          ))}
        </div>






      </div>
    </>
  );
};

export default AdminPanel;
