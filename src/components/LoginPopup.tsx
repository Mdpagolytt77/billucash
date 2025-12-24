import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, LogIn, UserPlus, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSoundContext } from '@/contexts/SoundContext';
import { toast } from 'sonner';

interface LoginPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginPopup = ({ isOpen, onClose }: LoginPopupProps) => {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const { playLoginSound } = useSoundContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load saved credentials on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('billucash_email');
    const savedRemember = localStorage.getItem('billucash_remember');
    if (savedRemember === 'true' && savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }

    setIsLoading(true);

    // Save to localStorage if remember me is checked
    if (rememberMe) {
      localStorage.setItem('billucash_email', email);
      localStorage.setItem('billucash_remember', 'true');
    } else {
      localStorage.removeItem('billucash_email');
      localStorage.removeItem('billucash_remember');
    }

    const { error } = await signIn(email, password);

    if (error) {
      toast.error(error.message || 'Login failed. Check your email and password.');
      setIsLoading(false);
      return;
    }

    // Play login success sound
    playLoginSound();
    
    toast.success('Login successful! Redirecting...');
    onClose();
    
    setTimeout(() => {
      navigate('/dashboard');
    }, 500);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-[1000] animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-background border border-border rounded-xl p-6 w-[90%] max-w-sm animate-scale-in relative shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-display font-bold text-gradient">
            Login
          </h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-muted-foreground mb-4">
          Enter your email and password to login
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          
          {/* Remember Me */}
          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="accent-primary w-4 h-4"
            />
            <span className="text-muted-foreground">Remember me</span>
          </label>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-2.5 rounded-lg bg-gradient-to-r from-primary to-secondary text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isLoading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Logging in...</>
            ) : (
              <><LogIn className="w-4 h-4" /> Login</>
            )}
          </button>
        </form>

        <div className="text-center mt-4 text-xs text-muted-foreground">
          Don't have an account?{' '}
          <Link 
            to="/signup" 
            onClick={onClose}
            className="text-primary font-semibold hover:underline"
          >
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPopup;
