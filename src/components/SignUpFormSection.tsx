import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const SignUpFormSection = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email');
      return;
    }
    navigate(`/signup?email=${encodeURIComponent(email)}`);
  };

  return (
    <section className="py-12 px-4">
      <div 
        className="max-w-md mx-auto rounded-2xl p-6 md:p-8"
        style={{
          background: '#111C2D',
          border: '1px solid rgba(29,191,115,0.15)',
          boxShadow: '0 15px 40px rgba(0,0,0,0.5)',
        }}
      >
        <h2 className="text-xl font-display font-bold text-foreground text-center mb-1">Sign Up for Free</h2>
        <p className="text-sm text-muted-foreground text-center mb-6">
          Sign Up to start <span className="text-primary font-semibold">earning</span> today!
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input-custom h-[48px] pl-10"
            />
          </div>

          <p className="text-[11px] text-muted-foreground">
            By signing up you agree to the{' '}
            <a href="#" className="text-primary hover:underline">Terms of Service</a> and{' '}
            <a href="#" className="text-primary hover:underline">Privacy Policy</a>
          </p>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-[48px] rounded-lg font-semibold text-sm transition-all hover:-translate-y-0.5 text-white"
            style={{
              background: 'linear-gradient(135deg, #1DBF73, #17a566)',
              boxShadow: '0 8px 20px rgba(29,191,115,0.4)',
            }}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Processing...
              </span>
            ) : (
              'SIGN IN'
            )}
          </button>

          <div className="relative flex items-center justify-center my-2">
            <div className="flex-1" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }} />
            <span className="px-3 text-xs text-muted-foreground uppercase">Or sign in with others</span>
            <div className="flex-1" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }} />
          </div>

          <button
            type="button"
            className="w-full h-[48px] rounded-lg text-sm font-medium transition-all hover:bg-muted flex items-center justify-center gap-2 text-foreground"
            style={{
              background: '#0E1625',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Login with Google
          </button>
        </form>
      </div>
    </section>
  );
};

export default SignUpFormSection;
