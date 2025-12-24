import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, Users, DollarSign, Home, 
  TrendingUp, AlertCircle, CheckCircle, Clock,
  RefreshCw, Menu, X, ArrowLeft,
  Wallet, Palette, Key, LogOut
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

interface Stats {
  totalUsers: number;
  totalEarnings: number;
  totalTasks: number;
  todaySignups: number;
}

const AdminPanel = () => {
  const { profile, isAdmin, signOut } = useAuth();
  const { snowEnabled, toggleSnow } = useSnowEffect();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalEarnings: 0,
    totalTasks: 0,
    todaySignups: 0,
  });

  // Fetch withdrawal requests
  const fetchWithdrawals = async () => {
    setIsLoadingData(true);
    try {
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWithdrawalRequests(data || []);
    } catch (error: any) {
      console.error('Error fetching withdrawals:', error);
      toast.error('Failed to load withdrawals');
    } finally {
      setIsLoadingData(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      // Get total users
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get total earnings (sum of all balances)
      const { data: balanceData } = await supabase
        .from('profiles')
        .select('balance');

      const totalEarnings = balanceData?.reduce((sum, p) => sum + (Number(p.balance) || 0), 0) || 0;

      // Get today's signups
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: todayCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      setStats({
        totalUsers: userCount || 0,
        totalEarnings: totalEarnings,
        totalTasks: 0, // Would need tasks table
        todaySignups: todayCount || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (isAdmin) {
      fetchWithdrawals();
      fetchStats();
    }
  }, [isAdmin]);

  // Real-time subscription for withdrawal requests
  useEffect(() => {
    if (!isAdmin) return;

    const channel = supabase
      .channel('withdrawal-requests-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'withdrawal_requests'
        },
        (payload) => {
          console.log('Realtime update:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newRequest = payload.new as WithdrawalRequest;
            if (newRequest.status === 'pending') {
              setWithdrawalRequests(prev => [newRequest, ...prev]);
              toast.info(`New withdrawal request from ${newRequest.username}`);
            }
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as WithdrawalRequest;
            if (updated.status !== 'pending') {
              setWithdrawalRequests(prev => prev.filter(w => w.id !== updated.id));
            } else {
              setWithdrawalRequests(prev => 
                prev.map(w => w.id === updated.id ? updated : w)
              );
            }
          } else if (payload.eventType === 'DELETE') {
            const deleted = payload.old as WithdrawalRequest;
            setWithdrawalRequests(prev => prev.filter(w => w.id !== deleted.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-4">You don't have permission to access this page.</p>
          <Link to="/dashboard" className="btn-primary inline-flex items-center gap-2">
            <Home className="w-4 h-4" /> Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Accounts', value: stats.totalUsers.toLocaleString(), icon: Users, color: 'text-blue-400' },
    { label: 'Total Earnings', value: `৳ ${stats.totalEarnings.toFixed(2)}`, icon: DollarSign, color: 'text-green-400' },
    { label: 'Tasks Completed', value: stats.totalTasks.toLocaleString(), icon: TrendingUp, color: 'text-purple-400' },
    { label: "Today's Signups", value: stats.todaySignups.toLocaleString(), icon: Clock, color: 'text-yellow-400' },
  ];

  const sidebarItems = [
    { icon: Home, label: 'Dashboard', path: '/admin', active: true },
    { icon: Users, label: 'All Users', path: '/admin/users' },
    { icon: Wallet, label: 'Withdraw', path: '/admin/withdraw' },
    { icon: Palette, label: 'Logo Customize', path: '/admin/logo' },
    { icon: Key, label: 'Password Reset', path: '/admin/password' },
  ];

  const handleApprove = async (id: string, username: string, amount: number) => {
    try {
      const { error } = await supabase
        .from('withdrawal_requests')
        .update({ 
          status: 'approved', 
          approved_at: new Date().toISOString() 
        })
        .eq('id', id);

      if (error) throw error;
      toast.success(`Approved ৳${amount.toFixed(2)} for ${username}`);
    } catch (error: any) {
      console.error('Error approving:', error);
      toast.error('Failed to approve withdrawal');
    }
  };

  const handleReject = async (id: string, username: string) => {
    try {
      const { error } = await supabase
        .from('withdrawal_requests')
        .update({ 
          status: 'rejected', 
          rejected_at: new Date().toISOString(),
          rejection_reason: 'Admin rejected request'
        })
        .eq('id', id);

      if (error) throw error;
      toast.success(`Rejected withdrawal from ${username}`);
    } catch (error: any) {
      console.error('Error rejecting:', error);
      toast.error('Failed to reject withdrawal');
    }
  };

  const handleApproveAll = async () => {
    if (withdrawalRequests.length === 0) {
      toast.error('No pending withdrawals');
      return;
    }

    for (const req of withdrawalRequests) {
      await handleApprove(req.id, req.username, req.amount);
    }
  };

  const handleRejectAll = async () => {
    if (withdrawalRequests.length === 0) {
      toast.error('No pending withdrawals');
      return;
    }

    for (const req of withdrawalRequests) {
      await handleReject(req.id, req.username);
    }
  };

  const handleLogout = async () => {
    await signOut();
    toast.success('Logged out');
  };

  const pendingCount = withdrawalRequests.length;

  return (
    <>
      {snowEnabled && <SnowEffect />}
      
      {/* Sidebar Overlay */}
      <div 
        className={`fixed inset-0 bg-black/70 z-40 transition-opacity ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-56 bg-background border-r border-border z-50 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 pt-20">
          <div className="text-center mb-6 pb-4 border-b border-border">
            <div className="logo-3d text-lg">BILLUCASH</div>
          </div>
          <nav className="space-y-1">
            {sidebarItems.map((item, i) => (
              <Link
                key={i}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  item.active ? 'bg-primary/20 text-primary font-medium' : 'hover:bg-muted text-muted-foreground'
                }`}
              >
                <item.icon className="w-4 h-4" /> {item.label}
              </Link>
            ))}
            <div className="pt-3 border-t border-border mt-3">
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          </nav>
        </div>
      </aside>

      <div 
        className="min-h-screen"
        style={{
          background: `linear-gradient(rgba(0,0,0,0.85), rgba(0,0,0,0.85)), url(${heroBg}) no-repeat center center fixed`,
          backgroundSize: 'cover',
        }}
      >
        {/* Header */}
        <header className="sticky top-0 z-30 px-4 py-3 bg-background/95 backdrop-blur-lg border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-muted rounded-lg">
              <Menu className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center font-bold text-sm">B</div>
            <span className="logo-3d text-base">Admin</span>
          </div>
          <div className="flex items-center gap-2">
            <SnowToggle enabled={snowEnabled} onToggle={toggleSnow} />
            <Link to="/dashboard" className="p-2 hover:bg-muted rounded-lg text-primary" title="Back to Dashboard">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 px-4 md:px-[5%] py-6">
          {statCards.map((stat, i) => (
            <div 
              key={i} 
              className="glass-card p-6 text-center hover:-translate-y-1 transition-transform relative overflow-hidden"
              style={{ borderTop: '4px solid hsl(var(--primary))' }}
            >
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <stat.icon className={`w-7 h-7 ${stat.color}`} />
              </div>
              <div className="text-3xl font-bold text-primary mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Withdrawal Requests Section */}
        <div className="mx-4 md:mx-[5%] mb-6">
          <div className="glass-card p-6 overflow-hidden">
            <h2 className="text-xl font-bold text-primary mb-5 flex items-center gap-2">
              <DollarSign className="w-6 h-6" /> Withdrawal Requests
              <span className="text-sm text-muted-foreground ml-2">({pendingCount} Pending)</span>
              {isLoadingData && <RefreshCw className="w-4 h-4 animate-spin ml-2" />}
            </h2>

            {/* Bulk Actions */}
            <div className="flex flex-wrap gap-3 mb-5 p-4 rounded-xl bg-muted/50 border border-border items-center">
              <button 
                onClick={handleApproveAll}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold text-sm hover:-translate-y-0.5 transition-transform shadow-lg"
              >
                <CheckCircle className="w-4 h-4" /> Approve All
              </button>
              <button 
                onClick={handleRejectAll}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold text-sm hover:-translate-y-0.5 transition-transform shadow-lg"
              >
                <X className="w-4 h-4" /> Reject All
              </button>
              <div className="flex items-center gap-2 ml-auto text-sm text-primary font-semibold">
                <AlertCircle className="w-4 h-4" />
                <span>Pending:</span>
                <span className="bg-primary text-white px-2.5 py-0.5 rounded-full text-xs font-bold">{pendingCount}</span>
              </div>
              <button 
                onClick={fetchWithdrawals}
                disabled={isLoadingData}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-500 text-white font-semibold text-sm hover:-translate-y-0.5 transition-transform disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingData ? 'animate-spin' : ''}`} /> Refresh
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-3 font-semibold text-primary bg-primary/10 rounded-tl-lg">User</th>
                    <th className="text-left py-3 px-3 font-semibold text-primary bg-primary/10">Method</th>
                    <th className="text-left py-3 px-3 font-semibold text-primary bg-primary/10">Account</th>
                    <th className="text-left py-3 px-3 font-semibold text-primary bg-primary/10">Amount</th>
                    <th className="text-left py-3 px-3 font-semibold text-primary bg-primary/10">Date</th>
                    <th className="text-left py-3 px-3 font-semibold text-primary bg-primary/10">Status</th>
                    <th className="text-left py-3 px-3 font-semibold text-primary bg-primary/10 rounded-tr-lg">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawalRequests.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-muted-foreground">
                        <CheckCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        No pending withdrawal requests
                      </td>
                    </tr>
                  ) : (
                    withdrawalRequests.map(req => (
                      <tr key={req.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-3 font-semibold">{req.username}</td>
                        <td className="py-3 px-3">{req.method}</td>
                        <td className="py-3 px-3 text-muted-foreground max-w-[120px] truncate">{req.account}</td>
                        <td className="py-3 px-3 text-green-400 font-semibold">৳ {Number(req.amount).toFixed(2)}</td>
                        <td className="py-3 px-3 text-muted-foreground">
                          {new Date(req.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                            {req.status}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex gap-1">
                            <button 
                              onClick={() => handleApprove(req.id, req.username, req.amount)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-green-500 text-white text-xs font-semibold hover:bg-green-600 transition-colors"
                            >
                              <CheckCircle className="w-3 h-3" /> Approve
                            </button>
                            <button 
                              onClick={() => handleReject(req.id, req.username)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition-colors"
                            >
                              <X className="w-3 h-3" /> Reject
                            </button>
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

        {/* Footer */}
        <footer className="px-4 md:px-[5%] py-6 text-center border-t border-border text-sm text-muted-foreground">
          <p className="font-semibold">BILLUCASH</p>
          <p className="mt-1">© 2025 BILLUCASH - Join us - Support - We are awesome</p>
        </footer>
      </div>
    </>
  );
};

export default AdminPanel;