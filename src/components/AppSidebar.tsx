import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Gift, Wallet, Trophy, Award, Users, HeadphonesIcon, Shield, LogOut, X, CheckCircle } from 'lucide-react';
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
  const { isAdmin, isModerator, signOut } = useAuth();
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
    { icon: Home, label: 'Earn', path: '/dashboard' },
    ...(myOffersEnabled ? [{ icon: CheckCircle, label: 'Offers', path: '/my-offers' }] : []),
    { icon: Wallet, label: 'Cashout', path: '/withdraw' },
    { icon: Trophy, label: 'Leaderboard', path: '/leaderboard' },
    { icon: Award, label: 'Rewards', path: '/profile' },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full" style={{ background: '#0E1A27' }}>
      {/* Logo */}
      <div className="p-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#1DBF73' }}>
            <Shield className="w-4 h-4 text-white" />
          </div>
          <SiteLogo size="sm" />
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors md:hidden">
          <X className="w-4 h-4 text-[#9DB2C7]" />
        </button>
      </div>
      
      {/* Nav */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={onClose}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200"
            style={{
              background: isActive(item.path) ? '#1DBF73' : 'transparent',
              color: isActive(item.path) ? '#FFFFFF' : '#9DB2C7',
            }}
            onMouseEnter={(e) => {
              if (!isActive(item.path)) {
                e.currentTarget.style.background = '#132435';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive(item.path)) {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            <item.icon className="w-4.5 h-4.5" /> {item.label}
          </Link>
        ))}
        
        {(isAdmin || isModerator) && (
          <Link
            to="/admin"
            onClick={onClose}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold mt-2"
            style={{
              background: location.pathname.startsWith('/admin') ? '#1DBF73' : 'rgba(29,191,115,0.15)',
              color: location.pathname.startsWith('/admin') ? '#FFFFFF' : '#1DBF73',
            }}
          >
            <Shield className="w-4.5 h-4.5" /> {isModerator && !isAdmin ? 'Mod Panel' : 'Admin'}
          </Link>
        )}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t" style={{ borderColor: '#162638' }}>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-[#9DB2C7] hover:bg-[#132435] transition-colors"
        >
          <LogOut className="w-4.5 h-4.5" /> Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar - always visible */}
      <aside className="hidden md:block fixed top-0 left-0 h-full w-[230px] z-40" style={{ borderRight: '1px solid #162638' }}>
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      <div 
        className={`fixed inset-0 bg-black/70 z-40 transition-opacity md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Mobile sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-[230px] z-50 transition-transform duration-300 md:hidden ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {sidebarContent}
      </aside>
    </>
  );
};

export default AppSidebar;
