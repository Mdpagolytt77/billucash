import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, UserPlus, Loader2, Eye, EyeOff } from 'lucide-react';
import { SiteLogo } from '@/contexts/SiteSettingsContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSoundContext } from '@/contexts/SoundContext';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';

const LoginBox = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const { playLoginSound } = useSoundContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }

    setIsLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      toast.error(error.message || 'Login failed. Check your email and password.');
      setIsLoading(false);
      return;
    }

    // Play login success sound
    playLoginSound();
    
    toast.success('Login successful! Redirecting...');
    
    setTimeout(() => {
      navigate('/dashboard');
    }, 500);
  };

  return (
    <div className="bg-muted/80 backdrop-blur-xl border border-border rounded-2xl p-6 md:p-8 max-w-md w-full mx-auto transition-all duration-300">
      {/* Title */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-display font-bold mb-1">Get Started!</h2>
        <p className="text-sm text-muted-foreground">
          It's free! Sign up and start to earn money!
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-1.5 block">Email</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-background border border-border text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          />
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-sm font-medium">Password</label>
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
              className="w-full px-4 py-3 rounded-lg bg-background border border-border text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Checkbox 
            id="remember" 
            checked={rememberMe}
            onCheckedChange={(checked) => setRememberMe(checked as boolean)}
          />
          <label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
            Remember Me
          </label>
        </div>
        
        <button 
          type="submit" 
          disabled={isLoading}
          className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-sm transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Logging in...
            </span>
          ) : (
            'Start Earning Now'
          )}
        </button>
        
        <div className="relative flex items-center justify-center my-4">
          <div className="border-t border-border flex-1" />
          <span className="px-3 text-xs text-muted-foreground">or</span>
          <div className="border-t border-border flex-1" />
        </div>
        
        <button 
          type="button"
          className="w-full py-3 rounded-lg bg-background border border-border text-sm font-medium transition-all hover:bg-muted flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Sign up via Google
        </button>
      </form>

      {/* Link */}
      <div className="flex justify-center mt-5">
        <Link to="/signup" className="text-primary text-sm flex items-center gap-2 hover:underline transition-transform hover:translate-x-1">
          <UserPlus className="w-4 h-4" />
          Create Account
        </Link>
      </div>
    </div>
  );
};

export default LoginBox;
