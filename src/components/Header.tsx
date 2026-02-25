import { Link } from 'react-router-dom';
import { Menu, LogIn, UserPlus, Home } from 'lucide-react';
import { SiteLogo } from '@/contexts/SiteSettingsContext';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';

interface HeaderProps {
  onLoginClick: () => void;
  hideSignup?: boolean;
}

const Header = ({ onLoginClick, hideSignup }: HeaderProps) => {
  return (
    <header 
      className="px-4 md:px-[5%] h-[60px] flex justify-between items-center sticky top-0 z-50 border-b"
      style={{
        background: 'rgba(10, 15, 28, 0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderColor: 'rgba(255,255,255,0.05)',
      }}
    >
      {/* Left - Menu (mobile) & Logo */}
      <div className="flex items-center gap-3">
        <Sheet>
          <SheetTrigger asChild>
            <button className="md:hidden w-9 h-9 rounded-lg flex items-center justify-center hover:bg-muted/60 transition-colors" style={{ background: '#162235' }}>
              <Menu className="w-4 h-4 text-foreground" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="border-border w-[200px]" style={{ background: '#0E1625', borderColor: 'rgba(255,255,255,0.05)' }}>
            <div className="py-6">
              <SiteLogo size="md" />
              <nav className="mt-6 space-y-1">
                <Link to="/" className="block py-2.5 px-3 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-primary/10 transition-all">Home</Link>
                <Link to="/signup" className="block py-2.5 px-3 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-primary/10 transition-all">Sign Up</Link>
                <button onClick={onLoginClick} className="block w-full text-left py-2.5 px-3 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-primary/10 transition-all">Login</button>
              </nav>
            </div>
          </SheetContent>
        </Sheet>
        
        <Link to="/" className="flex items-center">
          <SiteLogo size="lg" />
        </Link>
      </div>
      
      {/* Right - Auth Buttons */}
      <div className="flex gap-2 items-center">
        <button 
          onClick={onLoginClick}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all hover:-translate-y-0.5 text-foreground"
          style={{ background: '#162235' }}
        >
          <LogIn className="w-3.5 h-3.5" />
          <span>LOGIN</span>
        </button>
        <Link 
          to={hideSignup ? "/" : "/signup"}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all hover:-translate-y-0.5 text-white"
          style={{ 
            background: 'linear-gradient(135deg, #1DBF73, #17a566)',
            boxShadow: '0 4px 15px rgba(29,191,115,0.3)',
          }}
        >
          {hideSignup ? <Home className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
          <span>{hideSignup ? 'HOME' : 'SIGN UP'}</span>
        </Link>
      </div>
    </header>
  );
};

export default Header;
