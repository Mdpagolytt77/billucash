import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, Users, DollarSign, Settings, Home, 
  TrendingUp, AlertCircle, CheckCircle, Clock,
  Search, Filter, Download, RefreshCw, Menu, X,
  Wallet, Image, Palette, Volume2, Key, LogOut,
  LayoutGrid, Trophy, User
} from 'lucide-react';
import heroBg from '@/assets/hero-bg.jpg';
import SnowEffect from '@/components/SnowEffect';
import LoadingScreen from '@/components/LoadingScreen';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const AdminPanel = () => {
  const { profile, isAdmin, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLoading, setShowLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

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

  if (showLoading) {
    return <LoadingScreen isLoading={true} />;
  }

  const stats = [
    { label: 'Total Accounts', value: '12,458', icon: Users, color: 'text-blue-400' },
    { label: 'Total Earnings', value: '৳ 45,290', icon: DollarSign, color: 'text-green-400' },
    { label: 'Tasks Completed', value: '3,847', icon: TrendingUp, color: 'text-purple-400' },
    { label: "Today's Signups", value: '156', icon: Clock, color: 'text-yellow-400' },
  ];

  const recentUsers = [
    { id: 1, username: 'john_doe', email: 'john@email.com', balance: 125.50, status: 'active' },
    { id: 2, username: 'jane_smith', email: 'jane@email.com', balance: 89.20, status: 'active' },
    { id: 3, username: 'mike_wilson', email: 'mike@email.com', balance: 234.00, status: 'pending' },
    { id: 4, username: 'sarah_jones', email: 'sarah@email.com', balance: 56.75, status: 'active' },
    { id: 5, username: 'alex_brown', email: 'alex@email.com', balance: 178.30, status: 'suspended' },
  ];

  const withdrawalRequests = [
    { id: 1, user: 'john_doe', amount: 50.00, method: 'Bkash', account: '01712345678', status: 'pending', date: '2024-12-24' },
    { id: 2, user: 'jane_smith', amount: 25.00, method: 'Nagad', account: '01887654321', status: 'pending', date: '2024-12-23' },
    { id: 3, user: 'mike_wilson', amount: 100.00, method: 'Bkash', account: '01912345678', status: 'pending', date: '2024-12-23' },
  ];

  const pendingCount = withdrawalRequests.filter(w => w.status === 'pending').length;

  const sidebarItems = [
    { icon: Home, label: 'Dashboard', active: true },
    { icon: Users, label: 'All Users' },
    { icon: Wallet, label: 'Withdraw' },
    { icon: CheckCircle, label: 'Completed Offers' },
    { icon: LayoutGrid, label: 'Offerwall Customize' },
    { icon: Volume2, label: 'Sound Customize' },
    { icon: Image, label: 'Background Customize' },
    { icon: Palette, label: 'Logo Customize' },
    { icon: Key, label: 'Admin Password Reset' },
  ];

  const handleApprove = (id: number, user: string, amount: number) => {
    toast.success(`Approved ৳${amount.toFixed(2)} for ${user}`);
  };

  const handleReject = (id: number, user: string) => {
    toast.error(`Rejected withdrawal from ${user}`);
  };

  const handleLogout = async () => {
    await signOut();
    toast.success('Logged out');
  };

  return (
    <>
      <SnowEffect />
      
      {/* Sidebar Overlay */}
      <div 
        className={`fixed inset-0 bg-black/70 z-40 transition-opacity ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-background border-r border-border z-50 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-5 pt-20">
          <div className="text-center mb-8 pb-5 border-b border-border">
            <div className="logo-3d text-2xl">BILLUCASH</div>
          </div>
          <nav className="space-y-1">
            {sidebarItems.map((item, i) => (
              <button
                key={i}
                onClick={() => setSidebarOpen(false)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  item.active 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground hover:translate-x-1'
                }`}
              >
                <item.icon className="w-5 h-5 text-primary" />
                {item.label}
              </button>
            ))}
            <div className="pt-4 border-t border-border mt-4">
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="w-5 h-5" /> Logout
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
        <header className="sticky top-0 z-30 px-4 md:px-[5%] py-4 bg-background/95 backdrop-blur-lg border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)} 
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center font-bold text-lg">W</div>
            <div className="logo-3d text-xl">BILLUCASH Admin</div>
          </div>
        </header>

        {/* Toast styled component for this page would go here in a real implementation */}

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 px-4 md:px-[5%] py-6">
          {stats.map((stat, i) => (
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
            </h2>

            {/* Bulk Actions */}
            <div className="flex flex-wrap gap-3 mb-5 p-4 rounded-xl bg-muted/50 border border-border items-center">
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold text-sm hover:-translate-y-0.5 transition-transform shadow-lg">
                <CheckCircle className="w-4 h-4" /> Approve All
              </button>
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold text-sm hover:-translate-y-0.5 transition-transform shadow-lg">
                <X className="w-4 h-4" /> Reject All
              </button>
              <div className="flex items-center gap-2 ml-auto text-sm text-primary font-semibold">
                <AlertCircle className="w-4 h-4" />
                <span>Pending:</span>
                <span className="bg-primary text-white px-2.5 py-0.5 rounded-full text-xs font-bold">{pendingCount}</span>
              </div>
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-500 text-white font-semibold text-sm hover:-translate-y-0.5 transition-transform">
                <RefreshCw className="w-4 h-4" /> Refresh
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
                        <td className="py-3 px-3 font-semibold">{req.user}</td>
                        <td className="py-3 px-3">{req.method}</td>
                        <td className="py-3 px-3 text-muted-foreground max-w-[120px] truncate">{req.account}</td>
                        <td className="py-3 px-3 text-green-400 font-semibold">৳ {req.amount.toFixed(2)}</td>
                        <td className="py-3 px-3 text-muted-foreground">{req.date}</td>
                        <td className="py-3 px-3">
                          <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                            {req.status}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex gap-1">
                            <button 
                              onClick={() => handleApprove(req.id, req.user, req.amount)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-green-500 text-white text-xs font-semibold hover:bg-green-600 transition-colors"
                            >
                              <CheckCircle className="w-3 h-3" /> Approve
                            </button>
                            <button 
                              onClick={() => handleReject(req.id, req.user)}
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