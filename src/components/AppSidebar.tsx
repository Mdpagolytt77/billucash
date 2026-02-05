import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, User, Trophy, Wallet, Shield, LogOut, X, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { SiteLogo } from '@/contexts/SiteSettingsContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AppSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const AppSidebar = ({ isOpen, onClose }: AppSidebarProps) => {
  const location = useLocation();
  const { isAdmin, signOut } = useAuth();
  const [myOffersEnabled, setMyOffersEnabled] = useState(true);
  
  useEffect(() => {
    const loadSettings = async () => {
      const { data } = await supabase.rpc('get_public_site_settings');
      if (data && data.length > 0 && data[0].offerwall_settings) {
        const settings = data[0].offerwall_settings as { trackerSettings?: { myOffersEnabled?: boolean } };
        if (settings.trackerSettings?.myOffersEnabled !== undefined) {
          setMyOffersEnabled(settings.trackerSettings.myOffersEnabled);
        }
      }
    };
    loadSettings();
  }, []);
  
  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    await signOut();
    toast.success('Logged out');
  };

  const navItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    ...(myOffersEnabled ? [{ icon: CheckCircle, label: 'My Offers', path: '/my-offers' }] : []),
    { icon: User, label: 'Profile', path: '/profile' },
    { icon: Trophy, label: 'Leaderboard', path: '/leaderboard' },
    { icon: Wallet, label: 'Withdraw', path: '/withdraw' },
  ];

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black/70 z-40 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-48 bg-background border-r border-border z-50 transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-3">
          <div className="flex items-center justify-between mb-3">
            <SiteLogo size="sm" />
            <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          
          <nav className="space-y-0.5">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors ${
                  isActive(item.path)
                    ? 'bg-primary/20 text-primary font-medium'
                    : 'hover:bg-muted text-muted-foreground'
                }`}
              >
                <item.icon className="w-3.5 h-3.5" /> {item.label}
              </Link>
            ))}
            
            {isAdmin && (
              <Link
                to="/admin"
                onClick={onClose}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium ${
                  location.pathname.startsWith('/admin')
                    ? 'bg-yellow-500/30 text-yellow-400'
                    : 'bg-yellow-500/20 text-yellow-400'
                }`}
              >
                <Shield className="w-3.5 h-3.5" /> Admin
              </Link>
            )}
            
            <div className="pt-2 border-t border-border mt-2">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-destructive hover:bg-destructive/10"
              >
                <LogOut className="w-3.5 h-3.5" /> Logout
              </button>
            </div>
          </nav>
        </div>
      </aside>
    </>
  );
};

export default AppSidebar;
