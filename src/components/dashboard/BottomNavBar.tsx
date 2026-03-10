import { useNavigate, useLocation } from 'react-router-dom';
import { Wallet, Home, Search, Award, MessageCircle } from 'lucide-react';

const BottomNavBar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Home, label: 'Home', path: '/dashboard' },
    { icon: Wallet, label: 'Cashout', path: '/withdraw' },
    { icon: Search, label: 'Explore', path: '/leaderboard', isCenter: true },
    { icon: Award, label: 'Rewards', path: '/profile' },
    { icon: MessageCircle, label: 'Chat', path: '/profile' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div 
        className="flex items-center justify-around px-2 pb-1 pt-1.5"
        style={{
          background: 'hsl(var(--card))',
          borderTop: '1px solid hsl(var(--border) / 0.5)',
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
                className="relative -mt-5 flex flex-col items-center"
              >
                <div 
                  className="w-[52px] h-[52px] rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95"
                  style={{
                    background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))',
                    boxShadow: '0 4px 15px hsl(var(--primary) / 0.4)',
                  }}
                >
                  <Icon className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-[10px] font-semibold text-primary mt-0.5">{item.label}</span>
              </button>
            );
          }

          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center gap-0.5 py-1.5 px-3"
            >
              <Icon 
                className="w-5 h-5 transition-colors"
                style={{ color: isActive ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))' }}
              />
              <span 
                className="text-[10px] font-medium transition-colors"
                style={{ color: isActive ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))' }}
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
