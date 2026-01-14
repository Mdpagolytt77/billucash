import { Link } from 'react-router-dom';
import { Menu, UserPlus, LogIn } from 'lucide-react';
import { SiteLogo } from '@/contexts/SiteSettingsContext';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';

interface HeaderProps {
  onLoginClick: () => void;
}

const Header = ({ onLoginClick }: HeaderProps) => {
  return (
    <header className="px-4 md:px-[5%] py-3 flex justify-between items-center bg-background/95 backdrop-blur-lg border-b border-border sticky top-0 z-50">
      {/* Left - Menu & Logo */}
      <div className="flex items-center gap-3">
        <Sheet>
          <SheetTrigger asChild>
            <button className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
              <Menu className="w-5 h-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="bg-background border-border">
            <div className="py-6">
              <SiteLogo size="md" />
              <nav className="mt-8 space-y-4">
                <Link to="/" className="block py-2 px-4 rounded-lg hover:bg-muted transition-colors">Home</Link>
                <Link to="/signup" className="block py-2 px-4 rounded-lg hover:bg-muted transition-colors">Sign Up</Link>
                <button onClick={onLoginClick} className="block w-full text-left py-2 px-4 rounded-lg hover:bg-muted transition-colors">Login</button>
              </nav>
            </div>
          </SheetContent>
        </Sheet>
        
        {/* Logo in header */}
        <Link to="/">
          <SiteLogo size="sm" />
        </Link>
      </div>
      
      {/* Right - Auth Buttons */}
      <div className="flex gap-2 items-center">
        <Link 
          to="/signup"
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold transition-all hover:-translate-y-0.5 hover:shadow-lg"
        >
          <UserPlus className="w-4 h-4" />
          <span className="hidden sm:inline">Sign Up</span>
        </Link>
        <button 
          onClick={onLoginClick}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-muted text-foreground text-sm font-semibold transition-all hover:-translate-y-0.5 hover:bg-muted/80"
        >
          <LogIn className="w-4 h-4" />
          <span className="hidden sm:inline">Log In</span>
        </button>
      </div>
    </header>
  );
};

export default Header;