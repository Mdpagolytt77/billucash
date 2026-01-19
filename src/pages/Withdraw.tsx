import { useState, useEffect } from 'react';
import { Menu, History, CreditCard } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import LoadingScreen from '@/components/LoadingScreen';
import SnowEffect from '@/components/SnowEffect';
import SnowToggle from '@/components/SnowToggle';
import AppSidebar from '@/components/AppSidebar';
import { useSnowEffect } from '@/hooks/useSnowEffect';
import { SiteLogo, CoinIcon } from '@/contexts/SiteSettingsContext';
import { supabase } from '@/integrations/supabase/client';
import heroBg from '@/assets/hero-bg.jpg';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface WithdrawalHistory {
  id: string;
  amount: number;
  method: string;
  account: string;
  status: string;
  created_at: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  icon_url: string | null;
  gradient: string;
  category: 'crypto' | 'giftcard' | 'cash';
  min_amount: number;
}

const Withdraw = () => {
  const { user, profile, isLoading } = useAuth();
  const { snowEnabled, toggleSnow } = useSnowEffect();
  const [showLoading, setShowLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [amount, setAmount] = useState('');
  const [account, setAccount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState<WithdrawalHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => setShowLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    fetchMethods();
    if (user) fetchHistory();
  }, [user]);

  const fetchMethods = async () => {
    const { data } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    if (data) setMethods(data as PaymentMethod[]);
  };

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
    if (!selectedMethod || !amount || !account) {
      toast.error('Please fill all fields');
      return;
    }
    const amountNum = parseFloat(amount);
    if (amountNum < selectedMethod.min_amount) {
      toast.error(`Minimum withdrawal for ${selectedMethod.name} is $${selectedMethod.min_amount}`);
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
      method: selectedMethod.name,
      account,
      status: 'pending'
    });

    if (error) {
      toast.error('Failed to submit request');
    } else {
      toast.success('Withdrawal request submitted!');
      setAmount('');
      setAccount('');
      setSelectedMethod(null);
      fetchHistory();
    }
    setSubmitting(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-400 bg-green-500/20';
      case 'rejected': return 'text-red-400 bg-red-500/20';
      default: return 'text-yellow-400 bg-yellow-500/20';
    }
  };

  const cryptoMethods = methods.filter(m => m.category === 'crypto');
  const giftcardMethods = methods.filter(m => m.category === 'giftcard');
  const cashMethods = methods.filter(m => m.category === 'cash');

  if (isLoading || showLoading) {
    return <LoadingScreen isLoading={true} />;
  }

  return (
    <>
      {snowEnabled && <SnowEffect />}
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="min-h-screen" style={{ background: `linear-gradient(rgba(0,0,0,0.85), rgba(0,0,0,0.85)), url(${heroBg}) no-repeat center center fixed`, backgroundSize: 'cover' }}>
        {/* Header */}
        <header className="sticky top-0 z-30 px-4 py-3 bg-background/95 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-muted rounded-lg transition-colors">
              <Menu className="w-5 h-5" />
            </button>
            <SiteLogo size="sm" />
          </div>
          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-sm font-semibold flex items-center gap-1.5">
              <CoinIcon className="w-4 h-4" />
              ${profile?.balance?.toFixed(2) || '0.00'}
            </div>
            <button 
              onClick={() => setShowHistory(true)}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              title="Withdrawal History"
            >
              <History className="w-5 h-5" />
            </button>
            <SnowToggle enabled={snowEnabled} onToggle={toggleSnow} />
          </div>
        </header>

        {/* Main Content */}
        <main className="px-4 md:px-8 py-6 max-w-5xl mx-auto">
          {/* Page Title */}
          <h1 className="text-xl font-bold text-primary flex items-center gap-2 mb-6">
            🛒 Shop
          </h1>

          {/* Crypto Section */}
          {cryptoMethods.length > 0 && (
            <section className="mb-8">
              <h2 className="text-sm font-semibold text-foreground mb-3">Crypto</h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                {cryptoMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedMethod(method)}
                    className={`group relative aspect-square rounded-xl bg-gradient-to-br ${method.gradient} p-3 flex flex-col items-center justify-center gap-2 transition-all hover:scale-105 hover:shadow-lg hover:shadow-primary/20 border-2 ${
                      selectedMethod?.id === method.id ? 'border-primary ring-2 ring-primary/50' : 'border-transparent'
                    }`}
                  >
                    {method.icon_url ? (
                      <img src={method.icon_url} alt={method.name} className="w-10 h-10 sm:w-12 sm:h-12 object-contain" />
                    ) : (
                      <CreditCard className="w-8 h-8 text-white/70" />
                    )}
                    <span className="text-[10px] sm:text-xs font-medium text-white/90 text-center leading-tight">{method.name}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Gift Card Section */}
          {giftcardMethods.length > 0 && (
            <section className="mb-8">
              <h2 className="text-sm font-semibold text-foreground mb-3">Gift Card</h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                {giftcardMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedMethod(method)}
                    className={`group relative aspect-square rounded-xl bg-gradient-to-br ${method.gradient} p-3 flex flex-col items-center justify-center gap-2 transition-all hover:scale-105 hover:shadow-lg hover:shadow-primary/20 border-2 ${
                      selectedMethod?.id === method.id ? 'border-primary ring-2 ring-primary/50' : 'border-transparent'
                    }`}
                  >
                    {method.icon_url ? (
                      <img src={method.icon_url} alt={method.name} className="w-10 h-10 sm:w-12 sm:h-12 object-contain" />
                    ) : (
                      <CreditCard className="w-8 h-8 text-white/70" />
                    )}
                    <span className="text-[10px] sm:text-xs font-medium text-white/90 text-center leading-tight">{method.name}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Cash Section */}
          {cashMethods.length > 0 && (
            <section className="mb-8">
              <h2 className="text-sm font-semibold text-foreground mb-3">Cash</h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                {cashMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedMethod(method)}
                    className={`group relative aspect-square rounded-xl bg-gradient-to-br ${method.gradient} p-3 flex flex-col items-center justify-center gap-2 transition-all hover:scale-105 hover:shadow-lg hover:shadow-primary/20 border-2 ${
                      selectedMethod?.id === method.id ? 'border-primary ring-2 ring-primary/50' : 'border-transparent'
                    }`}
                  >
                    {method.icon_url ? (
                      <img src={method.icon_url} alt={method.name} className="w-10 h-10 sm:w-12 sm:h-12 object-contain" />
                    ) : (
                      <CreditCard className="w-8 h-8 text-white/70" />
                    )}
                    <span className="text-[10px] sm:text-xs font-medium text-white/90 text-center leading-tight">{method.name}</span>
                  </button>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>

      {/* Withdraw Dialog */}
      <Dialog open={!!selectedMethod} onOpenChange={(open) => !open && setSelectedMethod(null)}>
        <DialogContent className="sm:max-w-md bg-background border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${selectedMethod?.gradient} flex items-center justify-center`}>
                {selectedMethod?.icon_url ? (
                  <img src={selectedMethod.icon_url} alt={selectedMethod.name} className="w-6 h-6 object-contain" />
                ) : (
                  <CreditCard className="w-5 h-5 text-white" />
                )}
              </div>
              Withdraw via {selectedMethod?.name}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <label className="text-xs text-muted-foreground block mb-1.5">
                Amount (Min: ${selectedMethod?.min_amount})
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`Minimum $${selectedMethod?.min_amount}`}
                step="0.01"
                min={selectedMethod?.min_amount}
                className="w-full px-3 py-2.5 bg-muted border border-border rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground block mb-1.5">
                {selectedMethod?.category === 'crypto' ? 'Wallet Address' : 
                 selectedMethod?.category === 'giftcard' ? 'Email Address' : 'Account Number'}
              </label>
              <input
                type="text"
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                placeholder={
                  selectedMethod?.category === 'crypto' ? 'Enter wallet address' :
                  selectedMethod?.category === 'giftcard' ? 'Enter email address' : 'Enter account number'
                }
                className="w-full px-3 py-2.5 bg-muted border border-border rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-primary to-secondary text-white font-semibold text-sm disabled:opacity-50 transition-all hover:shadow-lg hover:shadow-primary/30"
              >
                {submitting ? 'Processing...' : 'Submit Withdrawal'}
              </button>
            </div>

            <p className="text-[10px] text-muted-foreground text-center">
              Your balance: <span className="text-primary font-semibold">${profile?.balance?.toFixed(2) || '0.00'}</span>
            </p>
          </form>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="sm:max-w-md bg-background border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              Withdrawal History
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-2 max-h-80 overflow-y-auto mt-4">
            {history.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-8">No withdrawal history</p>
            ) : (
              history.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">${item.amount.toFixed(2)}</span>
                    <span className="text-xs text-muted-foreground">{item.method}</span>
                  </div>
                  <span className={`capitalize px-2 py-1 rounded text-xs font-medium ${getStatusColor(item.status)}`}>
                    {item.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Withdraw;
