import { useState } from 'react';
import { Key, Menu, Eye, EyeOff, Save } from 'lucide-react';
import heroBg from '@/assets/hero-bg.jpg';
import SnowEffect from '@/components/SnowEffect';
import SnowToggle from '@/components/SnowToggle';
import AdminSidebar from '@/components/AdminSidebar';
import { useSnowEffect } from '@/hooks/useSnowEffect';
import { useAuth } from '@/contexts/AuthContext';
import { SiteLogo } from '@/contexts/SiteSettingsContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const AdminPasswordReset = () => {
  const { isAdmin, user } = useAuth();
  const { snowEnabled, toggleSnow } = useSnowEffect();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }
    if (newPassword.length < 6) { toast.error('Min 6 characters'); return; }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('Password updated!');
      setNewPassword(''); setConfirmPassword('');
    } catch (error: any) { toast.error(error.message || 'Failed'); }
    finally { setIsLoading(false); }
  };

  if (!isAdmin) return <div className="min-h-screen flex items-center justify-center">Access Denied</div>;

  return (
    <>
      {snowEnabled && <SnowEffect />}
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="min-h-screen" style={{ background: `linear-gradient(rgba(0,0,0,0.85), rgba(0,0,0,0.85)), url(${heroBg}) no-repeat center center fixed`, backgroundSize: 'cover' }}>
        <header className="sticky top-0 z-30 px-3 py-2 bg-background/95 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 hover:bg-muted rounded-lg"><Menu className="w-4 h-4" /></button>
            <SiteLogo size="sm" />
            <span className="text-xs text-muted-foreground">/ Password</span>
          </div>
          <SnowToggle enabled={snowEnabled} onToggle={toggleSnow} />
        </header>

        <main className="p-3 md:px-[5%] max-w-md mx-auto">
          <div className="glass-card p-4">
            <h2 className="text-sm font-bold text-primary flex items-center gap-1.5 mb-4">
              <Key className="w-4 h-4" /> Reset Admin Password
            </h2>

            <form onSubmit={handlePasswordReset} className="space-y-3">
              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">Current Email</label>
                <input type="email" value={user?.email || ''} disabled className="w-full px-2.5 py-2 bg-muted border border-border rounded-lg text-xs opacity-50" />
              </div>

              <div className="relative">
                <label className="text-[10px] text-muted-foreground block mb-1">New Password</label>
                <input type={showPasswords ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" className="w-full px-2.5 py-2 bg-muted border border-border rounded-lg text-xs pr-8" required />
                <button type="button" onClick={() => setShowPasswords(!showPasswords)} className="absolute right-2 top-6 text-muted-foreground">
                  {showPasswords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">Confirm Password</label>
                <input type={showPasswords ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm password" className="w-full px-2.5 py-2 bg-muted border border-border rounded-lg text-xs" required />
              </div>

              <button type="submit" disabled={isLoading} className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-primary to-secondary text-white font-semibold text-xs disabled:opacity-50">
                <Save className="w-3.5 h-3.5" /> {isLoading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </main>
      </div>
    </>
  );
};

export default AdminPasswordReset;
