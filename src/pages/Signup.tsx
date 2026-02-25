import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, User, Mail, Lock, UserPlus, LogIn, Shield, Zap, TrendingUp, Headphones, Check, X, Loader2 } from 'lucide-react';
import LoadingScreen from '@/components/LoadingScreen';
import Header from '@/components/Header';
import LandingSidebar from '@/components/LandingSidebar';
import LoginPopup from '@/components/LoginPopup';
import Footer from '@/components/Footer';
import LiveEarningsTracker from '@/components/LiveEarningsTracker';
import FloatingCoinsBackground from '@/components/FloatingCoinsBackground';
import { useAuth } from '@/contexts/AuthContext';
import { SiteLogo, useSiteSettings } from '@/contexts/SiteSettingsContext';
import { useSoundContext } from '@/contexts/SoundContext';
import { toast } from 'sonner';
import signupIllustrationDefault from '@/assets/signup-illustration.png';

const Signup = () => {
  const navigate = useNavigate();
  const { user, signUp, isLoading: authLoading } = useAuth();
  const { homepageImages } = useSiteSettings();
  const signupIllustration = homepageImages.signupIllustration || signupIllustrationDefault;
  const { playSignupSound } = useSoundContext();
  const [isLoading, setIsLoading] = useState(true);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    terms: true,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'invalid'>('idle');

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!authLoading && user) navigate('/dashboard');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (formData.username.length < 3) { setUsernameStatus('idle'); return; }
    if (!/^[a-zA-Z0-9_.]{3,20}$/.test(formData.username)) { setUsernameStatus('invalid'); return; }
    setUsernameStatus('checking');
    const timer = setTimeout(() => setUsernameStatus('available'), 500);
    return () => clearTimeout(timer);
  }, [formData.username]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
      toast.error('Please fill all fields'); return;
    }
    if (!/^[a-zA-Z0-9_.]{3,20}$/.test(formData.username)) {
      toast.error('Username must be 3-20 characters'); return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error('Please enter a valid email'); return;
    }
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters'); return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match!'); return;
    }
    if (!formData.terms) {
      toast.error('Please agree to the Terms'); return;
    }

    setIsSubmitting(true);
    const { error } = await signUp(formData.email, formData.password, formData.username);
    if (error) {
      toast.error(error.message || 'Failed to create account');
      setIsSubmitting(false);
      return;
    }
    playSignupSound();
    toast.success('Account created! Redirecting...');
    setTimeout(() => navigate('/dashboard'), 1500);
  };

  const features = [
    { icon: Shield, text: 'Bank-level security' },
    { icon: Zap, text: 'Instant transactions' },
    { icon: TrendingUp, text: 'Growth opportunities' },
    { icon: Headphones, text: '24/7 Customer support' },
  ];

  if (authLoading) return <LoadingScreen isLoading={true} />;

  return (
    <>
      <LoadingScreen isLoading={isLoading} />
      <LoginPopup isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />

      <div
        className={`min-h-screen transition-opacity duration-500 relative ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        style={{ background: '#0A0F1C' }}
      >
        <div className="fixed inset-0 z-0">
          <FloatingCoinsBackground density="medium" showGlow={true} showBeams={true} />
        </div>

        <div className="relative z-10">
          <Header onLoginClick={() => setIsLoginOpen(true)} />
          <LandingSidebar onLoginClick={() => setIsLoginOpen(true)} />

          <main className="ml-[48px] md:ml-[180px]">
            <LiveEarningsTracker />

            <div className="px-4 md:px-[5%] py-10 md:py-14">
              <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center max-w-5xl mx-auto">
                
                {/* Left - Hero */}
                <div className="text-center lg:text-left">
                  <div className="flex justify-center lg:justify-start mb-6">
                    <div className="relative">
                      <div className="absolute inset-0 blur-3xl opacity-30" style={{ background: 'radial-gradient(circle, rgba(29,191,115,0.5) 0%, transparent 70%)' }} />
                      <img src={signupIllustration} alt="Signup" className="relative z-10 w-40 h-40 md:w-52 md:h-52 object-contain drop-shadow-2xl" />
                    </div>
                  </div>

                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-display font-black mb-3 text-foreground">
                    Start Earning <span className="text-gradient">Today</span>
                  </h1>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-md mx-auto lg:mx-0">
                    Join thousands of users earning real money by completing simple tasks, playing games, and referring friends.
                  </p>

                  <ul className="space-y-3">
                    {features.map((f, i) => (
                      <li key={i} className="flex items-center gap-2.5 justify-center lg:justify-start text-sm text-muted-foreground">
                        <f.icon className="w-4 h-4 text-primary flex-shrink-0" />
                        <span>{f.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Right - Sign Up Form */}
                <div>
                  <div
                    className="rounded-2xl p-6 md:p-7 max-w-md w-full mx-auto lg:ml-auto lg:mr-0 relative overflow-hidden"
                    style={{
                      background: '#111C2D',
                      border: '1px solid rgba(29,191,115,0.15)',
                      boxShadow: '0 15px 40px rgba(0,0,0,0.5)',
                    }}
                  >
                    <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, #1DBF73, transparent)' }} />

                    <div className="text-center mb-5">
                      <h2 className="text-xl font-display font-bold text-foreground mb-1">Create Account</h2>
                      <p className="text-xs text-muted-foreground">Join and start <span className="text-primary font-semibold">earning</span> today!</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                      {/* Username */}
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                        <input type="text" name="username" value={formData.username} onChange={handleInputChange} placeholder="Username" className="form-input-custom h-[48px] pl-10" />
                        {usernameStatus !== 'idle' && (
                          <div className={`text-[11px] mt-1 pl-3 flex items-center gap-1 ${usernameStatus === 'available' ? 'text-primary' : usernameStatus === 'invalid' ? 'text-destructive' : 'text-muted-foreground'}`}>
                            {usernameStatus === 'checking' && <><Loader2 className="w-3 h-3 animate-spin" /> Checking...</>}
                            {usernameStatus === 'available' && <><Check className="w-3 h-3" /> Available</>}
                            {usernameStatus === 'invalid' && <><X className="w-3 h-3" /> Invalid format</>}
                          </div>
                        )}
                      </div>

                      {/* Email */}
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                        <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="Email address" className="form-input-custom h-[48px] pl-10" />
                      </div>

                      {/* Password */}
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                        <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleInputChange} placeholder="Password" className="form-input-custom h-[48px] pl-10 pr-10" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>

                      {/* Confirm Password */}
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                        <input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} placeholder="Confirm Password" className="form-input-custom h-[48px] pl-10 pr-10" />
                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>

                      {/* Terms */}
                      <div className="flex items-start gap-2 text-[11px] text-muted-foreground">
                        <input type="checkbox" name="terms" id="terms" checked={formData.terms} onChange={handleInputChange} className="mt-0.5 accent-primary" />
                        <label htmlFor="terms">
                          I agree to the <a href="#" className="text-primary hover:underline">Terms</a> and <a href="#" className="text-primary hover:underline">Privacy Policy</a>
                        </label>
                      </div>

                      {/* Submit */}
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full h-[48px] rounded-lg font-semibold text-sm transition-all hover:-translate-y-0.5 disabled:opacity-50 text-white"
                        style={{ background: 'linear-gradient(135deg, #1DBF73, #17a566)', boxShadow: '0 8px 20px rgba(29,191,115,0.4)' }}
                      >
                        {isSubmitting ? (
                          <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Creating...</span>
                        ) : (
                          <span className="flex items-center justify-center gap-2"><UserPlus className="w-4 h-4" /> Create Account</span>
                        )}
                      </button>

                      {/* Divider */}
                      <div className="relative flex items-center justify-center my-1">
                        <div className="flex-1" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }} />
                        <span className="px-3 text-[11px] text-muted-foreground uppercase">Or sign up with</span>
                        <div className="flex-1" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }} />
                      </div>

                      {/* Google */}
                      <button type="button" className="w-full h-[48px] rounded-lg text-sm font-medium transition-all hover:bg-muted flex items-center justify-center gap-2 text-foreground" style={{ background: '#0E1625', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Sign up with Google
                      </button>

                      {/* Login link */}
                      <div className="text-center text-xs text-muted-foreground">
                        Already have an account?{' '}
                        <button type="button" onClick={() => setIsLoginOpen(true)} className="text-primary font-semibold hover:underline">Login</button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>

            <Footer />
          </main>
        </div>
      </div>
    </>
  );
};

export default Signup;
