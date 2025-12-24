import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wallet, Menu, Home, User, Trophy, Shield, LogOut, ArrowRight, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import LoadingScreen from '@/components/LoadingScreen';
import SnowEffect from '@/components/SnowEffect';
import SnowToggle from '@/components/SnowToggle';
import { useSnowEffect } from '@/hooks/useSnowEffect';
import { supabase } from '@/integrations/supabase/client';
import heroBg from '@/assets/hero-bg.jpg';
import { toast } from 'sonner';

interface WithdrawalHistory {
  id: string;
  amount: number;
  method: string;
  account: string;
  status: string;
  created_at: string;
}

const Withdraw = () => {
  const navigate = useNavigate();
  const { user, profile, isLoading, isAdmin, signOut } = useAuth();
  const { snowEnabled, toggleSnow } = useSnowEffect();
  const [showLoading, setShowLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('bkash');
  const [account, setAccount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState<WithdrawalHistory[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => setShowLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (user) fetchHistory();
  }, [user]);

  const fetchHistory = async () => {
    const { data } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })
      .limit(10);
    if (data) setHistory(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !account) {
      toast.error('Please fill all fields');
      return;
    }
    const amountNum = parseFloat(amount);
    if (amountNum < 1) {
      toast.error('Minimum withdrawal is $1.00');
      return;
    }
    if (amountNum > (profile?.balance || 0)) {
      toast.error('Insufficient balance');
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from('withdrawal_requests').insert({
      user_id: user?.id,
      username: profile?.username || 'Unknown',
      amount: amountNum,
      method,
      account,
      status: 'pending'
    });

    if (error) {
      toast.error('Failed to submit request');
    } else {
      toast.success('Withdrawal request submitted!');
      setAmount('');
      setAccount('');
      fetchHistory();
    }
    setSubmitting(false);
  };

  const handleLogout = async () => {
    await signOut();
    toast.success('Logged out');
    navigate('/');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-3.5 h-3.5 text-green-400" />;
      case 'rejected': return <XCircle className="w-3.5 h-3.5 text-red-400" />;
      default: return <Clock className="w-3.5 h-3.5 text-yellow-400" />;
    }
  };

  const methods = [
    { id: 'bkash', name: 'bKash', color: '#E2136E' },
    { id: 'nagad', name: 'Nagad', color: '#F6921E' },
    { id: 'rocket', name: 'Rocket', color: '#8B2B8B' },
    { id: 'upay', name: 'Upay', color: '#00AEEF' },
  ];

  if (isLoading || showLoading) {
    return <LoadingScreen isLoading={true} />;
  }

  return (
    <>
      {snowEnabled && <SnowEffect />}
      <div className={`fixed inset-0 bg-black/70 z-40 transition-opacity ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setSidebarOpen(false)} />

      <aside className={`fixed top-0 left-0 h-full w-52 bg-background border-r border-border z-50 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-3 pt-16">
          <div className="text-center mb-4 pb-3 border-b border-border">
            <div className="logo-3d text-base">BILLUCASH</div>
          </div>
          <nav className="space-y-1">
            <Link to="/dashboard" onClick={() => setSidebarOpen(false)} className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-muted text-xs transition-colors">
              <Home className="w-3.5 h-3.5 text-primary" /> Dashboard
            </Link>
            <Link to="/profile" onClick={() => setSidebarOpen(false)} className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-muted text-xs transition-colors">
              <User className="w-3.5 h-3.5 text-primary" /> Profile
            </Link>
            <Link to="/leaderboard" onClick={() => setSidebarOpen(false)} className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-muted text-xs transition-colors">
              <Trophy className="w-3.5 h-3.5 text-primary" /> Leaderboard
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-primary/20 text-primary text-xs font-medium">
              <Wallet className="w-3.5 h-3.5" /> Withdraw
            </button>
            {isAdmin && (
              <Link to="/admin" onClick={() => setSidebarOpen(false)} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-yellow-500/20 text-yellow-400 text-xs font-medium">
                <Shield className="w-3.5 h-3.5" /> Admin
              </Link>
            )}
            <div className="pt-2 border-t border-border mt-2">
              <button onClick={handleLogout} className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-destructive hover:bg-destructive/10 text-xs">
                <LogOut className="w-3.5 h-3.5" /> Logout
              </button>
            </div>
          </nav>
        </div>
      </aside>

      <div className="min-h-screen" style={{ background: `linear-gradient(rgba(0,0,0,0.8), rgba(0,0,0,0.8)), url(${heroBg}) no-repeat center center fixed`, backgroundSize: 'cover' }}>
        <header className="sticky top-0 z-30 px-3 py-2.5 bg-background/95 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 hover:bg-muted rounded-lg">
              <Menu className="w-4 h-4" />
            </button>
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center font-bold text-xs">B</div>
            <span className="logo-3d text-sm">Withdraw</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-2.5 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold">
              ${profile?.balance?.toFixed(2) || '0.00'}
            </div>
            <SnowToggle enabled={snowEnabled} onToggle={toggleSnow} />
          </div>
        </header>

        <main className="px-3 md:px-[5%] py-4 max-w-md mx-auto">
          {/* Withdraw Form */}
          <div className="glass-card p-4 mb-4">
            <h2 className="text-base font-bold text-primary flex items-center gap-2 mb-3">
              <Wallet className="w-4 h-4" /> Withdraw Funds
            </h2>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">Amount ($)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Min: $1.00"
                  step="0.01"
                  min="1"
                  className="w-full px-2.5 py-2 bg-muted border border-border rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">Payment Method</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {methods.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMethod(m.id)}
                      className={`p-2 rounded-lg border text-[10px] font-medium transition-all ${
                        method === m.id
                          ? 'border-primary bg-primary/20 text-primary'
                          : 'border-border bg-muted hover:border-primary/50'
                      }`}
                    >
                      {m.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">{method.charAt(0).toUpperCase() + method.slice(1)} Number</label>
                <input
                  type="text"
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  placeholder="Enter account number"
                  className="w-full px-2.5 py-2 bg-muted border border-border rounded-lg text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-primary to-secondary text-white font-semibold text-xs disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Request'} <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          {/* History */}
          <div className="glass-card p-3">
            <h3 className="text-xs font-bold text-primary mb-2">Recent Requests</h3>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {history.length === 0 ? (
                <p className="text-center text-muted-foreground text-[10px] py-3">No withdrawal history</p>
              ) : (
                history.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg text-[10px]">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(item.status)}
                      <div>
                        <span className="font-medium">${item.amount.toFixed(2)}</span>
                        <span className="text-muted-foreground ml-1.5">{item.method}</span>
                      </div>
                    </div>
                    <span className={`capitalize px-1.5 py-0.5 rounded text-[9px] font-medium ${
                      item.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                      item.status === 'rejected' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default Withdraw;
