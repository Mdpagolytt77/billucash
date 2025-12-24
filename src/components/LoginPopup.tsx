import { Link } from 'react-router-dom';
import { X, LogIn, UserPlus } from 'lucide-react';

interface LoginPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginPopup = ({ isOpen, onClose }: LoginPopupProps) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-lg flex justify-center items-center z-[1000] animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="glass-card p-8 w-[90%] max-w-md animate-scale-in relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gradient line at top */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/10 to-primary/5 rounded-2xl -z-10" />

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-display font-extrabold text-gradient">
            Login to BILLUCASH
          </h2>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-lg flex items-center justify-center transition-all hover:bg-white/20 hover:rotate-90"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form className="space-y-5">
          <input
            type="text"
            placeholder="Username or Email"
            className="form-input-custom"
          />
          <input
            type="password"
            placeholder="Password"
            className="form-input-custom"
          />
          <button type="button" className="btn-primary w-full flex items-center justify-center gap-2">
            <LogIn className="w-4 h-4" />
            Login to Account
          </button>
        </form>

        <div className="flex justify-center mt-6">
          <Link 
            to="/signup" 
            onClick={onClose}
            className="text-primary text-sm flex items-center gap-2 hover:underline transition-transform hover:translate-x-1"
          >
            <UserPlus className="w-4 h-4" />
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPopup;
