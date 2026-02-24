import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Menu, X, User, ChevronDown } from 'lucide-react';
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
  profile, userEmail, snowEnabled, toggleSnow, onMenuClick, onLogout,
  notifications, onClearNotifications, onMarkAllRead,
}: DashboardHeaderProps) => {
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header 
      className="sticky top-0 z-30 px-3 md:px-[5%] py-2 backdrop-blur-xl flex items-center justify-between"
      style={{
        background: 'hsl(var(--card) / 0.95)',
        borderBottom: '1px solid hsl(var(--border) / 0.5)',
      }}
    >
      {/* Left */}
      <div className="flex items-center gap-2">
        <button onClick={onMenuClick} className="p-1.5 hover:bg-muted rounded-lg transition-colors active:scale-95">
          <Menu className="w-5 h-5 text-muted-foreground" />
        </button>
        <SiteLogo size="sm" />
      </div>

      {/* Right */}
      <div className="flex items-center gap-1.5">
        {/* Balance pill */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 border border-border/30">
          <ChevronDown className="w-3 h-3 text-muted-foreground" />
          <span className="font-bold text-sm text-foreground">
            {profile?.balance?.toFixed(0) || '0'}
          </span>
          <CoinIcon className="w-4 h-4" />
        </div>

        <SnowToggle enabled={snowEnabled} onToggle={toggleSnow} />
        
        {/* Notifications */}
        <div className="relative">
          <button onClick={() => setShowNotifications(!showNotifications)} className="p-1.5 hover:bg-muted rounded-lg transition-colors relative">
            <Bell className="w-5 h-5 text-muted-foreground" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive rounded-full text-[9px] font-bold flex items-center justify-center text-white">
                {unreadCount}
              </span>
            )}
          </button>
          
          {showNotifications && (
            <div className="absolute right-0 top-10 w-72 border border-border/50 rounded-2xl shadow-2xl p-3 max-h-80 overflow-auto z-50 backdrop-blur-xl bg-card/95">
              <div className="flex justify-between items-center mb-3 pb-2 border-b border-border/30">
                <span className="font-bold text-primary text-sm">Notifications</span>
                <div className="flex gap-2 items-center">
                  <button onClick={onMarkAllRead} className="text-[10px] px-2 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors font-medium text-primary">Read All</button>
                  <button onClick={onClearNotifications} className="text-[10px] px-2 py-1 rounded-lg bg-destructive/15 text-destructive hover:bg-destructive/25 transition-colors font-medium">Clear</button>
                  <button onClick={() => setShowNotifications(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="space-y-2">
                {notifications.length === 0 ? (
                  <p className="text-center text-muted-foreground py-6 text-sm">No notifications</p>
                ) : (
                  notifications.map(notif => (
                    <div key={notif.id} className={`p-2.5 rounded-xl transition-all text-xs ${notif.read ? 'bg-muted/20' : 'bg-primary/10 border-l-2 border-primary'}`}>
                      <p className="font-medium text-foreground">{notif.message}</p>
                      <span className="text-[10px] text-muted-foreground mt-1 block">{notif.time}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar */}
        <div className="relative">
          <button onClick={() => setShowUserMenu(!showUserMenu)} className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 border border-border/30 flex items-center justify-center hover:from-primary/40 hover:to-secondary/40 transition-all">
            <User className="w-4 h-4 text-foreground" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-10 w-44 border border-border/50 rounded-2xl shadow-2xl py-2 z-50 backdrop-blur-xl bg-card/95">
              <button onClick={() => { navigate('/profile'); setShowUserMenu(false); }} className="w-full px-4 py-2.5 flex items-center gap-2 hover:bg-muted transition-all text-sm font-medium text-foreground">
                Profile Settings
              </button>
              <button onClick={() => { navigate('/withdraw'); setShowUserMenu(false); }} className="w-full px-4 py-2.5 flex items-center gap-2 hover:bg-muted transition-all text-sm font-medium text-foreground">
                Withdraw
              </button>
              <hr className="my-1.5 border-border/30" />
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
