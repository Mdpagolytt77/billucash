import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, User, Mail, Lock, UserPlus, Home, LogIn, Shield, Zap, TrendingUp, Headphones, Check, X, Loader2 } from 'lucide-react';
import SnowEffect from '@/components/SnowEffect';
import LoadingScreen from '@/components/LoadingScreen';
import LoginPopup from '@/components/LoginPopup';
import Footer from '@/components/Footer';
import LiveEarningsTracker from '@/components/LiveEarningsTracker';
import { useAuth } from '@/contexts/AuthContext';
import { useSiteSettings, SiteLogo, getBackgroundStyle } from '@/contexts/SiteSettingsContext';
import { useSoundContext } from '@/contexts/SoundContext';
import { toast } from 'sonner';
import heroBg from '@/assets/hero-bg.jpg';

const Signup = () => {
  const navigate = useNavigate();
  const { user, signUp, isLoading: authLoading } = useAuth();
  const { background } = useSiteSettings();
  const { playSignupSound } = useSoundContext();
  const [isLoading, setIsLoading] = useState(true);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    terms: false,
  });
  
  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Username validation state
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'invalid'>('idle');

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/dashboard');
    }
  }, [user, authLoading, navigate]);

  // Username validation
  useEffect(() => {
    if (formData.username.length < 3) {
      setUsernameStatus('idle');
      return;
    }

    const usernameRegex = /^[a-zA-Z0-9_.]{3,20}$/;
    if (!usernameRegex.test(formData.username)) {
      setUsernameStatus('invalid');
      return;
    }

    setUsernameStatus('checking');
    const timer = setTimeout(() => {
      setUsernameStatus('available');
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.username]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
      toast.error('Please fill all fields');
      return;
    }

    const usernameRegex = /^[a-zA-Z0-9_.]{3,20}$/;
    if (!usernameRegex.test(formData.username)) {
      toast.error('Username must be 3-20 characters (letters, numbers, underscore, dot only)');
      return;
    }

    if (!validateEmail(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match!');
      return;
    }

    if (!formData.terms) {
      toast.error('Please agree to the Terms and Conditions');
      return;
    }

    setIsSubmitting(true);

    const { error } = await signUp(formData.email, formData.password, formData.username);

    if (error) {
      toast.error(error.message || 'Failed to create account');
      setIsSubmitting(false);
      return;
    }

    // Play signup success sound
    playSignupSound();
    
    toast.success('Account created successfully! Redirecting to dashboard...');
    
    setTimeout(() => {
      navigate('/dashboard');
    }, 1500);
  };

  const features = [
    { icon: Shield, text: 'Bank-level security' },
    { icon: Zap, text: 'Instant transactions' },
    { icon: TrendingUp, text: 'Growth opportunities' },
    { icon: Headphones, text: '24/7 Customer support' },
  ];

  if (authLoading) {
    return <LoadingScreen isLoading={true} />;
  }

  const backgroundStyle = getBackgroundStyle(background, heroBg);

  return (
    <>
      <LoadingScreen isLoading={isLoading} />
      <SnowEffect />
      <LoginPopup isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />

      <div 
        className={`min-h-screen transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        style={backgroundStyle}
      >
        {/* Header */}
        <header className="px-4 md:px-[5%] py-4 flex justify-between items-center bg-background/90 backdrop-blur-lg border-b border-border sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <SiteLogo size="md" />
          </div>
          
          <div className="flex gap-3 items-center">
            <Link 
              to="/"
              className="w-11 h-11 rounded-full bg-white/10 border border-white/20 backdrop-blur-lg flex items-center justify-center transition-all hover:bg-white/20 hover:-translate-y-0.5 hover:shadow-lg group relative"
            >
              <Home className="w-5 h-5" />
              <span className="absolute -bottom-9 left-1/2 -translate-x-1/2 bg-black/80 text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                Home
              </span>
            </Link>
            <button 
              onClick={() => setIsLoginOpen(true)}
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

        {/* Live Earnings Tracker */}
        <LiveEarningsTracker />

        {/* Main Content */}
        <main className="px-4 md:px-[5%] py-10 md:py-16">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center min-h-[calc(100vh-200px)]">
            
            {/* Left Side - Hero Content */}
            <div className="animate-fade-in text-center lg:text-left" style={{ animationDelay: '0.2s' }}>
              <div className="mb-6">
                <div className="text-4xl md:text-5xl inline-block mb-1">
                  <SiteLogo size="lg" />
                </div>
                <div className="text-primary text-sm tracking-[0.2em] font-semibold uppercase">
                  earn & grow
                </div>
              </div>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-black mb-4">
                Start Earning <span className="text-gradient">Today</span>
              </h1>

              <p className="text-base md:text-lg opacity-90 leading-relaxed mb-10">
                Join thousands of users earning real money by completing simple tasks,
                playing games, watching videos, and referring friends. Start your journey
                with instant withdrawals and 24/7 support!
              </p>

              <ul className="space-y-4">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3 justify-center lg:justify-start">
                    <feature.icon className="w-5 h-5 text-primary" />
                    <span>{feature.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right Side - Signup Box */}
            <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <div className="glass-card p-8 max-w-md w-full mx-auto lg:ml-auto lg:mr-0 transition-all duration-300 hover:-translate-y-2 relative overflow-hidden">
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

                <h2 className="text-2xl font-display font-extrabold mb-2 text-center text-gradient">
                  Create Account
                </h2>
                <p className="text-center opacity-80 mb-6 text-sm">
                  Join and start earning today!
                </p>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Username */}
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/70 z-10" />
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      placeholder="Username"
                      className="form-input-custom pl-12"
                    />
                    {usernameStatus !== 'idle' && (
                      <div className={`text-xs mt-1 pl-4 flex items-center gap-1 ${
                        usernameStatus === 'available' ? 'text-primary' : 
                        usernameStatus === 'invalid' ? 'text-destructive' : 'text-muted-foreground'
                      }`}>
                        {usernameStatus === 'checking' && <><Loader2 className="w-3 h-3 animate-spin" /> Checking...</>}
                        {usernameStatus === 'available' && <><Check className="w-3 h-3" /> Username available</>}
                        {usernameStatus === 'invalid' && <><X className="w-3 h-3" /> Invalid username format</>}
                      </div>
                    )}
                  </div>

                  {/* Email */}
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/70 z-10" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Email Address"
                      className="form-input-custom pl-12"
                    />
                  </div>

                  {/* Password */}
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/70 z-10" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Password"
                      className="form-input-custom pl-12 pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white/90 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  {/* Confirm Password */}
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/70 z-10" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Confirm Password"
                      className="form-input-custom pl-12 pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white/90 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  {/* Terms */}
                  <div className="flex items-start gap-3 text-sm text-white/80">
                    <input
                      type="checkbox"
                      name="terms"
                      id="terms"
                      checked={formData.terms}
                      onChange={handleInputChange}
                      className="mt-1 accent-primary"
                    />
                    <label htmlFor="terms">
                      I agree to the <a href="#" className="text-primary hover:underline">Terms and Conditions</a> and <a href="#" className="text-primary hover:underline">Privacy Policy</a>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isSubmitting ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Creating Account...</>
                    ) : (
                      <><UserPlus className="w-4 h-4" /> Create Account</>
                    )}
                  </button>

                  {/* Login Link */}
                  <div className="text-center text-sm text-white/80">
                    Already have an account?{' '}
                    <button 
                      type="button"
                      onClick={() => setIsLoginOpen(true)}
                      className="text-primary font-semibold hover:underline"
                    >
                      Login
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Signup;
