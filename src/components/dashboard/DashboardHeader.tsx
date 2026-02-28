import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Menu, X, User } from 'lucide-react';
import { CoinIcon, SiteLogo } from '@/contexts/SiteSettingsContext';
import SnowToggle from '@/components/SnowToggle';
import BalanceHistoryPopup from '@/components/dashboard/BalanceHistoryPopup';

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
  const [showBalanceHistory, setShowBalanceHistory] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header 
      className="sticky top-0 z-30 h-[60px] flex items-center justify-between px-4 md:px-6"
      style={{
        background: '#0F1F2F',
        borderBottom: '1px solid #162638',
      }}
    >
      {/* Left - hamburger for mobile */}
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="p-1.5 hover:bg-white/5 rounded-lg transition-colors active:scale-95">
          <Menu className="w-5 h-5 text-[#9DB2C7]" />
        </button>
        <SiteLogo size="sm" className="max-h-8" />
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Balance pill */}
        <button 
          onClick={() => setShowBalanceHistory(true)}
          className="flex items-center gap-2 px-4 py-1.5 rounded-full cursor-pointer hover:brightness-110 transition-all active:scale-95"
          style={{ background: '#142739', border: '1px solid #1e3448' }}
        >
          <CoinIcon className="w-4 h-4" />
          <span className="font-bold text-sm text-white">
            {profile?.balance?.toFixed(0) || '0'}
          </span>
        </button>

        
        
        {/* Notifications */}
        <div className="relative">
          <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 hover:bg-white/5 rounded-lg transition-colors relative">
            <Bell className="w-5 h-5 text-white" />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center text-white" style={{ background: '#1DBF73' }}>
                {unreadCount}
              </span>
            )}
          </button>
          
          {showNotifications && (
            <div 
              className="absolute right-0 top-12 w-72 rounded-2xl shadow-2xl p-3 max-h-80 overflow-auto z-50"
              style={{ background: '#0E1A27', border: '1px solid #162638' }}
            >
              <div className="flex justify-between items-center mb-3 pb-2" style={{ borderBottom: '1px solid #162638' }}>
                <span className="font-bold text-sm" style={{ color: '#1DBF73' }}>Notifications</span>
                <div className="flex gap-2 items-center">
                  <button onClick={onMarkAllRead} className="text-[10px] px-2 py-1 rounded-lg font-medium" style={{ background: 'rgba(29,191,115,0.15)', color: '#1DBF73' }}>Read All</button>
                  <button onClick={onClearNotifications} className="text-[10px] px-2 py-1 rounded-lg font-medium text-red-400" style={{ background: 'rgba(239,68,68,0.15)' }}>Clear</button>
                  <button onClick={() => setShowNotifications(false)} className="text-[#9DB2C7] hover:text-white"><X className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="space-y-2">
                {notifications.length === 0 ? (
                  <p className="text-center text-[#9DB2C7] py-6 text-sm">No notifications</p>
                ) : (
                  notifications.map(notif => (
                    <div key={notif.id} className="p-2.5 rounded-xl transition-all text-xs" style={{
                      background: notif.read ? 'rgba(255,255,255,0.03)' : 'rgba(29,191,115,0.1)',
                      borderLeft: notif.read ? 'none' : '2px solid #1DBF73',
                    }}>
                      <p className="font-medium text-white">{notif.message}</p>
                      <span className="text-[10px] text-[#9DB2C7] mt-1 block">{notif.time}</span>
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
            className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center"
            style={{ border: '2px solid rgba(29,191,115,0.3)' }}
          >
            <img 
              src={`https://api.dicebear.com/7.x/avataaars/png?seed=${profile?.username || 'user'}`}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-12 w-44 rounded-2xl shadow-2xl py-2 z-50" style={{ background: '#0E1A27', border: '1px solid #162638' }}>
              <button onClick={() => { navigate('/profile'); setShowUserMenu(false); }} className="w-full px-4 py-2.5 flex items-center gap-2 hover:bg-white/5 transition-all text-sm font-medium text-white">
                Profile Settings
              </button>
              <button onClick={() => { navigate('/withdraw'); setShowUserMenu(false); }} className="w-full px-4 py-2.5 flex items-center gap-2 hover:bg-white/5 transition-all text-sm font-medium text-white">
                Withdraw
              </button>
              <hr className="my-1.5" style={{ borderColor: '#162638' }} />
              <button onClick={onLogout} className="w-full px-4 py-2.5 flex items-center gap-2 hover:bg-red-500/10 transition-all text-sm font-medium text-red-400">
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
      <BalanceHistoryPopup open={showBalanceHistory} onClose={() => setShowBalanceHistory(false)} />
    </header>
  );
};

export default DashboardHeader;
