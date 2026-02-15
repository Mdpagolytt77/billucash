import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Menu, ChevronDown, X, User } from 'lucide-react';
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
      className="sticky top-0 z-30 px-3 md:px-[5%] py-2.5 backdrop-blur-xl flex items-center justify-between"
      style={{
        background: 'linear-gradient(to bottom, #0F172Af8, #0F172Af0)',
        borderBottom: '1px solid rgba(0,170,255,0.2)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      }}
    >
      {/* Left */}
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="p-2 hover:bg-[rgba(0,170,255,0.1)] rounded-xl transition-all duration-300 active:scale-95">
          <Menu className="w-5 h-5" />
        </button>
        <SiteLogo size="sm" />
      </div>

      {/* Center - Balance */}
      <div className="flex items-center gap-1.5 px-3 py-1.5">
        <CoinIcon className="w-5 h-5" />
        <span className="font-bold text-lg text-white">
          {profile?.balance?.toFixed(0) || '0'}
        </span>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        <SnowToggle enabled={snowEnabled} onToggle={toggleSnow} />
        
        {/* Notifications */}
        <div className="relative">
          <button onClick={() => setShowNotifications(!showNotifications)} className="flex items-center justify-center hover:bg-[rgba(0,170,255,0.1)] rounded-xl p-2 transition-all duration-300 relative">
            <Bell className="w-5 h-5 text-[#A1A1AA]" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive rounded-full text-[9px] font-bold flex items-center justify-center text-white">
                {unreadCount}
              </span>
            )}
          </button>
          
          {showNotifications && (
            <div className="absolute right-0 top-12 w-72 border rounded-[18px] shadow-2xl p-3 max-h-80 overflow-auto z-50 backdrop-blur-xl" style={{ background: 'linear-gradient(to bottom, #111827, #0B0F19)', borderColor: 'rgba(0,170,255,0.25)' }}>
              <div className="flex justify-between items-center mb-3 pb-2 border-b border-[rgba(0,170,255,0.15)]">
                <span className="font-bold text-[#00C6FF] text-sm">Notifications</span>
                <div className="flex gap-2 items-center">
                  <button onClick={onMarkAllRead} className="text-[10px] px-2 py-1 rounded-lg bg-[rgba(0,170,255,0.15)] hover:bg-[rgba(0,170,255,0.25)] transition-colors font-medium text-[#00C6FF]">Read All</button>
                  <button onClick={onClearNotifications} className="text-[10px] px-2 py-1 rounded-lg bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors font-medium">Clear</button>
                  <button onClick={() => setShowNotifications(false)} className="text-[#A1A1AA] hover:text-white"><X className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="space-y-2">
                {notifications.length === 0 ? (
                  <p className="text-center text-[#A1A1AA] py-6 text-sm">No notifications</p>
                ) : (
                  notifications.map(notif => (
                    <div key={notif.id} className="p-3 rounded-[14px] transition-all text-xs" style={{ background: notif.read ? 'rgba(255,255,255,0.03)' : 'linear-gradient(to right, rgba(0,198,255,0.15), rgba(0,198,255,0.05))', borderLeft: notif.read ? 'none' : '3px solid #00C6FF' }}>
                      <p className="font-medium text-white">{notif.message}</p>
                      <span className="text-[10px] text-[#00C6FF]/70 mt-1 block">{notif.time}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Icon */}
        <div className="relative">
          <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center gap-2 hover:bg-[rgba(0,170,255,0.1)] rounded-xl px-2 py-1.5 transition-all duration-300">
            <User className="w-5 h-5 text-[#A1A1AA]" />
            <ChevronDown className="w-3.5 h-3.5 hidden sm:block text-[#A1A1AA]" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-12 w-44 border rounded-[18px] shadow-2xl py-2 z-50 backdrop-blur-xl" style={{ background: 'linear-gradient(to bottom, #111827, #0B0F19)', borderColor: 'rgba(0,170,255,0.25)' }}>
              <button onClick={() => { navigate('/profile'); setShowUserMenu(false); }} className="w-full px-4 py-2.5 flex items-center gap-2 hover:bg-[rgba(0,170,255,0.1)] transition-all text-sm font-medium text-white">
                Profile Settings
              </button>
              <button onClick={() => { navigate('/withdraw'); setShowUserMenu(false); }} className="w-full px-4 py-2.5 flex items-center gap-2 hover:bg-[rgba(0,170,255,0.1)] transition-all text-sm font-medium text-white">
                Withdraw
              </button>
              <hr className="my-2 border-[rgba(0,170,255,0.15)]" />
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
