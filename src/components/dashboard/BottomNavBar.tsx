import { useNavigate, useLocation } from 'react-router-dom';
import { Wallet, Users, Gift, LayoutGrid, User } from 'lucide-react';

const BottomNavBar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Wallet, label: 'Cashout', path: '/withdraw' },
    { icon: Users, label: 'Referrals', path: '/leaderboard' },
    { icon: Gift, label: 'Earn', path: '/dashboard', isCenter: true },
    { icon: LayoutGrid, label: 'Offers', path: '/completed-offers' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div 
        className="relative flex items-end justify-around px-4 pb-2 pt-3 backdrop-blur-xl"
        style={{
          height: '65px',
          background: '#0F172A',
          borderTop: '1px solid rgba(0,170,255,0.3)',
        }}
      >
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          if (item.isCenter) {
            return (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className="relative -mt-6 flex flex-col items-center"
              >
                <div 
                  className="w-[60px] h-[60px] rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                  style={{
                    background: 'linear-gradient(135deg, #00C6FF, #0072FF)',
                    boxShadow: '0 0 25px rgba(0,170,255,0.6)',
                  }}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-[10px] font-semibold text-[#00C6FF] mt-1">{item.label}</span>
              </button>
            );
          }

          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center gap-0.5 py-1"
            >
              <Icon 
                className="w-5 h-5 transition-colors"
                style={{ 
                  color: isActive ? '#00C6FF' : '#A1A1AA',
                  filter: isActive ? '0 0 10px #00C6FF' : 'none',
                }} 
              />
              <span 
                className="text-[10px] font-medium transition-colors"
                style={{ color: isActive ? '#00C6FF' : '#A1A1AA' }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavBar;
