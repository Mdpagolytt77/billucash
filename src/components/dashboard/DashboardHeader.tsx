import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Menu, ChevronDown, X } from 'lucide-react';
import { SiteLogo, CoinIcon } from '@/contexts/SiteSettingsContext';
import SnowToggle from '@/components/SnowToggle';

interface Notification {
  id: string;
  message: string;
  type: string;
  read: boolean;
  time: string;
}

interface DashboardHeaderProps {
  profile: { username?: string; balance?: number } | null;
  userEmail?: string;
  snowEnabled: boolean;
  toggleSnow: () => void;
  onMenuClick: () => void;
  onLogout: () => void;
  notifications: Notification[];
  onClearNotifications: () => void;
  onMarkAllRead: () => void;
}

const DashboardHeader = ({
  profile,
  userEmail,
  snowEnabled,
  toggleSnow,
  onMenuClick,
  onLogout,
  notifications,
  onClearNotifications,
  onMarkAllRead,
}: DashboardHeaderProps) => {
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="sticky top-0 z-30 px-3 md:px-[5%] py-2.5 bg-gradient-to-b from-background/98 to-background/95 backdrop-blur-xl border-b border-border/30 flex items-center justify-between shadow-lg shadow-black/20">
      {/* Left - Menu & Logo */}
      <div className="flex items-center gap-3">
        <button 
          onClick={onMenuClick} 
          className="p-2 hover:bg-primary/10 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 active:scale-95"
        >
          <Menu className="w-5 h-5" />
        </button>
        <SiteLogo size="sm" />
      </div>

      {/* Center - Balance */}
      <div className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-gradient-to-r from-primary/20 via-primary/10 to-secondary/20 border border-primary/30 shadow-lg shadow-primary/10">
        <CoinIcon className="w-5 h-5" />
        <span className="font-bold text-lg bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          {profile?.balance?.toFixed(0) || '0'}
        </span>
      </div>

      {/* Right - Notifications & Profile */}
      <div className="flex items-center gap-2">
        {/* Snow Toggle */}
        <SnowToggle enabled={snowEnabled} onToggle={toggleSnow} />
        
        {/* Notifications */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-muted to-muted/50 border border-border/50 flex items-center justify-center hover:from-primary/20 hover:to-primary/10 transition-all duration-300 shadow-md hover:shadow-lg hover:shadow-primary/20 relative"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-destructive to-red-600 rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse shadow-lg shadow-destructive/50">
                {unreadCount}
              </span>
            )}
          </button>
          
          {showNotifications && (
            <div className="absolute right-0 top-12 w-72 bg-gradient-to-b from-card to-background border border-border/50 rounded-2xl shadow-2xl shadow-black/40 p-3 max-h-80 overflow-auto z-50 backdrop-blur-xl">
              <div className="flex justify-between items-center mb-3 pb-2 border-b border-border/50">
                <span className="font-bold text-primary text-sm">Notifications</span>
                <div className="flex gap-2 items-center">
                  <button onClick={onMarkAllRead} className="text-[10px] px-2 py-1 rounded-lg bg-primary/20 hover:bg-primary/30 transition-colors font-medium">
                    Read All
                  </button>
                  <button onClick={onClearNotifications} className="text-[10px] px-2 py-1 rounded-lg bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors font-medium">
                    Clear
                  </button>
                  <button onClick={() => setShowNotifications(false)} className="text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                {notifications.length === 0 ? (
                  <p className="text-center text-muted-foreground py-6 text-sm">No notifications</p>
                ) : (
                  notifications.map(notif => (
                    <div 
                      key={notif.id} 
                      className={`p-3 rounded-xl transition-all text-xs ${notif.read ? 'bg-muted/30' : 'bg-gradient-to-r from-primary/15 to-primary/5 border-l-3 border-primary shadow-md'}`}
                    >
                      <p className="font-medium">{notif.message}</p>
                      <span className="text-[10px] text-primary/70 mt-1 block">{notif.time}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar */}
        <div className="relative">
          <button 
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 hover:bg-primary/10 rounded-xl px-2 py-1.5 transition-all duration-300"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary via-primary to-secondary flex items-center justify-center font-bold text-sm text-primary-foreground shadow-lg shadow-primary/30 transform hover:scale-105 transition-transform">
              {profile?.username?.charAt(0).toUpperCase() || userEmail?.charAt(0).toUpperCase() || 'U'}
            </div>
            <ChevronDown className="w-3.5 h-3.5 hidden sm:block text-muted-foreground" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-12 w-44 bg-gradient-to-b from-card to-background border border-border/50 rounded-2xl shadow-2xl shadow-black/40 py-2 z-50 backdrop-blur-xl">
              <button 
                onClick={() => { navigate('/profile'); setShowUserMenu(false); }}
                className="w-full px-4 py-2.5 flex items-center gap-2 hover:bg-primary/10 transition-all text-sm font-medium"
              >
                Profile Settings
              </button>
              <button 
                onClick={() => { navigate('/withdraw'); setShowUserMenu(false); }}
                className="w-full px-4 py-2.5 flex items-center gap-2 hover:bg-primary/10 transition-all text-sm font-medium"
              >
                Withdraw
              </button>
              <hr className="my-2 border-border/50" />
              <button onClick={onLogout} className="w-full px-4 py-2.5 flex items-center gap-2 hover:bg-destructive/10 transition-all text-sm font-medium text-destructive">
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
