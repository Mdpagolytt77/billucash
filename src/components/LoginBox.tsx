import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, UserPlus, Loader2 } from 'lucide-react';
import { SiteLogo } from '@/contexts/SiteSettingsContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSoundContext } from '@/contexts/SoundContext';
import { toast } from 'sonner';

const LoginBox = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const { playLoginSound } = useSoundContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
    <div className="glass-card p-8 max-w-md w-full mx-auto lg:ml-auto lg:mr-0 transition-all duration-300 hover:-translate-y-2 relative overflow-hidden">
      {/* Gradient line at top */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />

      {/* Logo */}
      <div className="text-center mb-4">
        <div className="text-3xl inline-block mb-1">
          <SiteLogo size="lg" />
        </div>
        <div className="text-primary text-xs tracking-[0.2em] font-semibold uppercase">
          earn & grow
        </div>
      </div>

      {/* Title */}
      <h2 className="text-2xl font-display font-extrabold mb-2 text-center text-gradient">
        Welcome Back!
      </h2>
      <p className="text-center opacity-80 mb-6 text-sm">
        Login to your account
      </p>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="form-input-custom"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="form-input-custom"
        />
        <button 
          type="submit" 
          disabled={isLoading}
          className="btn-primary w-full flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
        >
          {isLoading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Logging in...</>
          ) : (
            <><LogIn className="w-4 h-4" /> Login to Account</>
          )}
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