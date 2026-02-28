import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Loader2, Eye, EyeOff, Rocket } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSoundContext } from '@/contexts/SoundContext';
import { useSiteSettings, SiteLogo } from '@/contexts/SiteSettingsContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface LoginPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginPopup = ({ isOpen, onClose }: LoginPopupProps) => {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const { playLoginSound } = useSoundContext();
  const { logoText } = useSiteSettings();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Load saved credentials on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('wallscash_email');
    const savedRemember = localStorage.getItem('wallscash_remember');
    if (savedRemember === 'true' && savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }

    setIsLoading(true);

    // Save to localStorage if remember me is checked
    if (rememberMe) {
      localStorage.setItem('wallscash_email', email);
      localStorage.setItem('wallscash_remember', 'true');
    } else {
      localStorage.removeItem('wallscash_email');
      localStorage.removeItem('wallscash_remember');
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

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`
      }
    });

    if (error) {
      toast.error('Google login failed');
    }
  };

  return (
    <div 
      className="fixed inset-0 backdrop-blur-sm flex justify-center items-center z-[1000] animate-fade-in p-4"
      style={{
        background: 'radial-gradient(ellipse at center, rgba(29,191,115,0.12) 0%, rgba(0,0,0,0.85) 70%)',
        boxShadow: 'inset 0 0 200px 60px rgba(29,191,115,0.08)',
      }}
      onClick={onClose}
    >
      <div className="snake-glow-card w-full max-w-md animate-scale-in relative overflow-visible">
        <div 
          className="relative z-10 bg-card rounded-2xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
        {/* Header */}
        <div className="flex justify-between items-center p-4 pb-0">
          <h2 className="text-lg font-semibold text-foreground">Log In</h2>
          <button 
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-muted/80 flex items-center justify-center hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Logo & Welcome */}
        <div className="px-4 py-4">
          <div className="flex items-center gap-2 mb-2">
            <SiteLogo className="h-8 w-auto" />
          </div>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            Please log-in to your account and start the adventure
            <Rocket className="w-4 h-4 text-primary" />
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="p-4 pt-0 space-y-4">
          <div>
            <label className="text-sm text-muted-foreground mb-1.5 block">Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-muted-foreground/50"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-sm text-muted-foreground">Password</label>
              <button type="button" className="text-xs text-primary hover:underline">
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-muted-foreground/50 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          
          {/* Remember Me */}
          <label className="flex items-center gap-2 cursor-pointer">
            <div 
              className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                rememberMe ? 'bg-primary border-primary' : 'border-border'
              }`}
              onClick={() => setRememberMe(!rememberMe)}
            >
              {rememberMe && (
                <svg className="w-3 h-3 text-primary-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
            <span className="text-sm text-muted-foreground">Remember Me</span>
          </label>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-primary/30"
          >
            {isLoading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Please wait...</>
            ) : (
              'Login'
            )}
          </button>
        </form>

        {/* Bottom Links */}
        <div className="px-4 pb-4 space-y-3">
          <div className="text-center text-sm text-muted-foreground">
            New on our platform?{' '}
            <a 
              href="/signup"
              onClick={(e) => {
                e.preventDefault();
                onClose();
                navigate('/signup');
              }}
              className="text-primary font-semibold hover:underline"
            >
              Create an account
            </a>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Google Login */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full py-3 rounded-lg bg-muted/50 border border-border text-foreground font-medium text-sm flex items-center justify-center gap-2 hover:bg-muted transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Log In Via Google
          </button>
        </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPopup;
