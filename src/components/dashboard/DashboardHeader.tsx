import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Menu, ChevronDown, X, Gift } from 'lucide-react';
import { SiteLogo, CoinIcon } from '@/contexts/SiteSettingsContext';
import SnowToggle from '@/components/SnowToggle';
import { toast } from 'sonner';

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
    <header className="sticky top-0 z-30 px-3 md:px-[5%] py-2 bg-background/95 backdrop-blur-xl border-b border-border/50 flex items-center justify-between">
      {/* Left - Menu & Stay Connected */}
      <div className="flex items-center gap-2">
        <button onClick={onMenuClick} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
          <Menu className="w-5 h-5" />
        </button>
        
        <button className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-destructive/20 border border-destructive/30 text-destructive text-xs font-medium hover:bg-destructive/30 transition-colors">
          <span className="text-base">📢</span>
          Stay connected!
        </button>
      </div>

      {/* Center - Redeem Bonus & Balance */}
      <div className="flex items-center gap-2">
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/30 text-orange-400 text-xs font-medium hover:from-orange-500/30 hover:to-amber-500/30 transition-colors">
          <Gift className="w-4 h-4" />
          <span className="hidden sm:inline">Redeem Bonus</span>
        </button>
        
        {/* Balance */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted border border-border/50 text-sm">
          <CoinIcon className="w-4 h-4" />
          <span className="font-bold">{profile?.balance?.toFixed(0) || '0'}</span>
          <span className="text-[10px] text-muted-foreground hidden sm:inline">💳</span>
        </div>
      </div>

      {/* Right - Notifications & Profile */}
      <div className="flex items-center gap-2">
        {/* Snow Toggle */}
        <SnowToggle enabled={snowEnabled} onToggle={toggleSnow} />
        
        {/* Notifications */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-8 h-8 rounded-full bg-muted border border-border/50 flex items-center justify-center hover:bg-muted/80 transition-colors relative"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full text-[9px] font-bold flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>
          
          {showNotifications && (
            <div className="absolute right-0 top-10 w-64 bg-background border border-border rounded-xl shadow-xl p-2 max-h-72 overflow-auto z-50">
              <div className="flex justify-between items-center mb-2 pb-2 border-b border-border">
                <span className="font-semibold text-primary text-xs">Notifications</span>
                <div className="flex gap-1.5 items-center">
                  <button onClick={onMarkAllRead} className="text-[9px] px-1.5 py-0.5 rounded bg-muted hover:bg-muted/80">
                    Read
                  </button>
                  <button onClick={onClearNotifications} className="text-[9px] px-1.5 py-0.5 rounded bg-destructive/20 text-destructive hover:bg-destructive/30">
                    Clear
                  </button>
                  <button onClick={() => setShowNotifications(false)} className="text-muted-foreground hover:text-foreground">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                {notifications.length === 0 ? (
                  <p className="text-center text-muted-foreground py-3 text-xs">No notifications</p>
                ) : (
                  notifications.map(notif => (
                    <div 
                      key={notif.id} 
                      className={`p-2 rounded-lg transition-all text-[11px] ${notif.read ? 'bg-muted/50' : 'bg-primary/10 border-l-2 border-primary'}`}
                    >
                      <p>{notif.message}</p>
                      <span className="text-[9px] text-primary/70 mt-0.5 block">{notif.time}</span>
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
            className="flex items-center gap-1.5 hover:bg-muted/50 rounded-full px-1 py-1 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center font-bold text-xs text-primary-foreground">
              {profile?.username?.charAt(0).toUpperCase() || userEmail?.charAt(0).toUpperCase() || 'U'}
            </div>
            <ChevronDown className="w-3 h-3 hidden sm:block text-muted-foreground" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-10 w-36 bg-background border border-border rounded-xl shadow-xl py-1 z-50">
              <button 
                onClick={() => { navigate('/profile'); setShowUserMenu(false); }}
                className="w-full px-3 py-2 flex items-center gap-2 hover:bg-muted transition-colors text-xs"
              >
                Profile Settings
              </button>
              <button 
                onClick={() => { navigate('/withdraw'); setShowUserMenu(false); }}
                className="w-full px-3 py-2 flex items-center gap-2 hover:bg-muted transition-colors text-xs"
              >
                Withdraw
              </button>
              <hr className="my-1 border-border" />
              <button onClick={onLogout} className="w-full px-3 py-2 flex items-center gap-2 hover:bg-muted transition-colors text-xs text-destructive">
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
