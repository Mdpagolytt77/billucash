import { UserPlus, LogIn } from 'lucide-react';

interface HeaderProps {
  onLoginClick: () => void;
}

const Header = ({ onLoginClick }: HeaderProps) => {
  return (
    <header className="px-4 md:px-[5%] py-4 flex justify-between items-center bg-background/90 backdrop-blur-lg border-b border-border sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="logo-3d text-xl md:text-2xl">BILLUCASH</div>
      </div>
      
      <div className="flex gap-3 items-center">
        <button className="w-11 h-11 rounded-full bg-white/10 border border-white/20 backdrop-blur-lg flex items-center justify-center transition-all hover:bg-white/20 hover:-translate-y-0.5 hover:shadow-lg group relative">
          <UserPlus className="w-5 h-5" />
          <span className="absolute -bottom-9 left-1/2 -translate-x-1/2 bg-black/80 text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Sign Up
          </span>
        </button>
        <button 
          onClick={onLoginClick}
          className="w-11 h-11 rounded-full flex items-center justify-center transition-all hover:-translate-y-0.5 hover:shadow-lg group relative"
          style={{ background: 'var(--gradient-primary)' }}
        >
          <LogIn className="w-5 h-5" />
          <span className="absolute -bottom-9 left-1/2 -translate-x-1/2 bg-black/80 text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Login
          </span>
        </button>
      </div>
    </header>
  );
};

export default Header;
