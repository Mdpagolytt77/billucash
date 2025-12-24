import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Key, ArrowLeft, Menu, Home, Users, Wallet, Palette, LogOut, Eye, EyeOff, Save } from 'lucide-react';
import heroBg from '@/assets/hero-bg.jpg';
import SnowEffect from '@/components/SnowEffect';
import SnowToggle from '@/components/SnowToggle';
import { useSnowEffect } from '@/hooks/useSnowEffect';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const AdminPasswordReset = () => {
  const { isAdmin, signOut, user } = useAuth();
  const { snowEnabled, toggleSnow } = useSnowEffect();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  const sidebarItems = [
    { icon: Home, label: 'Dashboard', path: '/admin' },
    { icon: Users, label: 'All Users', path: '/admin/users' },
    { icon: Wallet, label: 'Withdraw', path: '/admin/withdraw' },
    { icon: Palette, label: 'Logo Customize', path: '/admin/logo' },
    { icon: Key, label: 'Password Reset', path: '/admin/password', active: true },
  ];

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
            <span className="logo-3d text-base">Password</span>
          </div>
          <div className="flex items-center gap-2">
            <SnowToggle enabled={snowEnabled} onToggle={toggleSnow} />
            <Link to="/admin" className="p-2 hover:bg-muted rounded-lg text-primary"><ArrowLeft className="w-5 h-5" /></Link>
          </div>
        </header>

        <main className="p-4 md:px-[5%] max-w-md mx-auto">
          <div className="glass-card p-6">
            <h2 className="text-lg font-bold text-primary flex items-center gap-2 mb-6">
              <Key className="w-5 h-5" /> Reset Admin Password
            </h2>

            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Current Email</label>
                <input type="email" value={user?.email || ''} disabled className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm opacity-50" />
              </div>

              <div className="relative">
                <label className="text-xs text-muted-foreground block mb-1">New Password</label>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm pr-10"
                  required
                />
                <button type="button" onClick={() => setShowPasswords(!showPasswords)} className="absolute right-3 top-7 text-muted-foreground">
                  {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1">Confirm Password</label>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-primary to-secondary text-white font-semibold text-sm disabled:opacity-50"
              >
                <Save className="w-4 h-4" /> {isLoading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </main>
      </div>
    </>
  );
};

export default AdminPasswordReset;
