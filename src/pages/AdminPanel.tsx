import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, Users, DollarSign, Settings, Home, 
  TrendingUp, AlertCircle, CheckCircle, Clock,
  ChevronRight, Search, Filter, Download, RefreshCw
} from 'lucide-react';
import heroBg from '@/assets/hero-bg.jpg';
import SnowEffect from '@/components/SnowEffect';
import { useAuth } from '@/contexts/AuthContext';

const AdminPanel = () => {
  const { profile, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

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

  const stats = [
    { label: 'Total Users', value: '12,458', change: '+12%', icon: Users, color: 'text-blue-400' },
    { label: 'Total Revenue', value: '$45,290', change: '+8%', icon: DollarSign, color: 'text-green-400' },
    { label: 'Active Tasks', value: '3,847', change: '+23%', icon: TrendingUp, color: 'text-purple-400' },
    { label: 'Pending Withdrawals', value: '156', change: '-5%', icon: Clock, color: 'text-yellow-400' },
  ];

  const recentUsers = [
    { id: 1, username: 'john_doe', email: 'john@email.com', balance: 125.50, status: 'active' },
    { id: 2, username: 'jane_smith', email: 'jane@email.com', balance: 89.20, status: 'active' },
    { id: 3, username: 'mike_wilson', email: 'mike@email.com', balance: 234.00, status: 'pending' },
    { id: 4, username: 'sarah_jones', email: 'sarah@email.com', balance: 56.75, status: 'active' },
    { id: 5, username: 'alex_brown', email: 'alex@email.com', balance: 178.30, status: 'suspended' },
  ];

  const withdrawalRequests = [
    { id: 1, user: 'john_doe', amount: 50.00, method: 'PayPal', status: 'pending', date: '2024-12-24' },
    { id: 2, user: 'jane_smith', amount: 25.00, method: 'Bitcoin', status: 'approved', date: '2024-12-23' },
    { id: 3, user: 'mike_wilson', amount: 100.00, method: 'Bkash', status: 'pending', date: '2024-12-23' },
  ];

  return (
    <>
      <SnowEffect />
      <div 
        className="min-h-screen"
        style={{
          background: `linear-gradient(rgba(0,0,0,0.85), rgba(0,0,0,0.85)), url(${heroBg}) no-repeat center center fixed`,
          backgroundSize: 'cover',
        }}
      >
        {/* Header */}
        <header className="sticky top-0 z-30 px-4 md:px-[5%] py-4 bg-background/95 backdrop-blur-lg border-b border-yellow-500/30 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Shield className="w-8 h-8 text-yellow-400" />
            <div>
              <h1 className="text-xl font-display font-bold text-yellow-400">Admin Panel</h1>
              <p className="text-xs text-muted-foreground">BILLUCASH Management</p>
            </div>
          </div>
          <Link to="/dashboard" className="btn-glass flex items-center gap-2 text-sm">
            <Home className="w-4 h-4" /> Back to Dashboard
          </Link>
        </header>

        {/* Main Content */}
        <main className="px-4 md:px-[5%] py-8">
          {/* Welcome */}
          <div className="glass-card p-6 mb-8 border-yellow-500/30 bg-yellow-500/5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                <Shield className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-display font-bold text-yellow-400">Welcome, {profile?.username}!</h2>
                <p className="text-muted-foreground">You have full administrative access to BILLUCASH</p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, i) => (
              <div key={i} className="glass-card p-5 hover:-translate-y-1 transition-transform">
                <div className="flex items-center justify-between mb-3">
                  <stat.icon className={`w-8 h-8 ${stat.color}`} />
                  <span className={`text-sm font-medium ${stat.change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                    {stat.change}
                  </span>
                </div>
                <div className="text-2xl font-display font-bold mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {['overview', 'users', 'withdrawals', 'settings'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 rounded-xl font-medium capitalize transition-all whitespace-nowrap ${
                  activeTab === tab 
                    ? 'bg-yellow-500 text-black' 
                    : 'bg-white/10 hover:bg-white/20'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Recent Users */}
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" /> Recent Users
                  </h3>
                  <button className="text-sm text-primary hover:underline">View All</button>
                </div>
                <div className="space-y-3">
                  {recentUsers.slice(0, 4).map(user => (
                    <div key={user.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center font-bold">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium">{user.username}</div>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-primary">${user.balance.toFixed(2)}</div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          user.status === 'active' ? 'bg-green-500/20 text-green-400' :
                          user.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {user.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Withdrawal Requests */}
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-primary" /> Withdrawal Requests
                  </h3>
                  <button className="text-sm text-primary hover:underline">View All</button>
                </div>
                <div className="space-y-3">
                  {withdrawalRequests.map(req => (
                    <div key={req.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                      <div>
                        <div className="font-medium">{req.user}</div>
                        <div className="text-xs text-muted-foreground">{req.method} • {req.date}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">${req.amount.toFixed(2)}</div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          req.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {req.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="glass-card p-6">
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input type="text" placeholder="Search users..." className="form-input-custom pl-10" />
                </div>
                <button className="btn-glass flex items-center gap-2">
                  <Filter className="w-4 h-4" /> Filter
                </button>
                <button className="btn-glass flex items-center gap-2">
                  <Download className="w-4 h-4" /> Export
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">User</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Email</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Balance</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentUsers.map(user => (
                      <tr key={user.id} className="border-b border-border/50 hover:bg-white/5">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center font-bold text-sm">
                              {user.username.charAt(0).toUpperCase()}
                            </div>
                            {user.username}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{user.email}</td>
                        <td className="py-3 px-4 font-semibold text-primary">${user.balance.toFixed(2)}</td>
                        <td className="py-3 px-4">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            user.status === 'active' ? 'bg-green-500/20 text-green-400' :
                            user.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <button className="text-primary hover:underline text-sm">Edit</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'withdrawals' && (
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold">All Withdrawal Requests</h3>
                <button className="btn-glass flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" /> Refresh
                </button>
              </div>
              <div className="space-y-4">
                {withdrawalRequests.map(req => (
                  <div key={req.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center font-bold">
                        {req.user.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold">{req.user}</div>
                        <div className="text-sm text-muted-foreground">{req.method} • {req.date}</div>
                      </div>
                    </div>
                    <div className="text-xl font-bold">${req.amount.toFixed(2)}</div>
                    <div className="flex items-center gap-2">
                      {req.status === 'pending' ? (
                        <>
                          <button className="px-4 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" /> Approve
                          </button>
                          <button className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors">
                            Reject
                          </button>
                        </>
                      ) : (
                        <span className="px-4 py-2 rounded-lg bg-green-500/20 text-green-400">Approved</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="glass-card p-6">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <Settings className="w-5 h-5" /> Admin Settings
              </h3>
              <div className="space-y-6 max-w-xl">
                <div>
                  <label className="block text-sm font-medium mb-2">Site Name</label>
                  <input type="text" defaultValue="BILLUCASH" className="form-input-custom" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Minimum Withdrawal</label>
                  <input type="number" defaultValue="5" className="form-input-custom" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Referral Bonus (%)</label>
                  <input type="number" defaultValue="10" className="form-input-custom" />
                </div>
                <button className="btn-primary">Save Settings</button>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
};

export default AdminPanel;
