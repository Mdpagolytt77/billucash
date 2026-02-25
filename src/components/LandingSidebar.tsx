import { Link } from 'react-router-dom';
import { Home, DollarSign, Gift, Wallet, Trophy, Star, Users, HelpCircle } from 'lucide-react';

interface LandingSidebarProps {
  onLoginClick: () => void;
}

const navItems = [
  { icon: Home, label: 'Home', href: '/', active: true },
  { icon: DollarSign, label: 'Earn', href: '#' },
  { icon: Gift, label: 'Offers', href: '#' },
  { icon: Wallet, label: 'Cashout', href: '#' },
  { icon: Trophy, label: 'Leaderboard', href: '/leaderboard' },
  { icon: Star, label: 'Rewards', href: '#' },
  { icon: Users, label: 'Affiliates', href: '#' },
  { icon: HelpCircle, label: 'Support', href: '#' },
];

const LandingSidebar = ({ onLoginClick }: LandingSidebarProps) => {
  return (
    <aside className="fixed left-0 top-[60px] h-[calc(100vh-60px)] z-40 flex flex-col items-center py-4 gap-1 transition-all duration-300 w-[48px] md:w-[180px] border-r"
      style={{ 
        background: '#0A0F1C', 
        borderColor: 'rgba(255,255,255,0.05)',
      }}
    >
      {navItems.map((item) => (
        <Link
          key={item.label}
          to={item.href}
          onClick={(e) => {
            if (item.href === '#') {
              e.preventDefault();
              onLoginClick();
            }
          }}
          className={`w-full flex items-center gap-3 px-3 py-2.5 transition-all duration-200 group relative ${
            item.active 
              ? 'text-primary' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
          style={item.active ? { background: 'rgba(29,191,115,0.1)' } : {}}
        >
          {item.active && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full" 
              style={{ background: '#1DBF73' }} 
            />
          )}
          <item.icon className={`w-5 h-5 flex-shrink-0 mx-auto md:mx-0 ${item.active ? 'text-primary' : ''}`} />
          <span className="text-sm font-medium hidden md:block">{item.label}</span>
        </Link>
      ))}
    </aside>
  );
};

export default LandingSidebar;
