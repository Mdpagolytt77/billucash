import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const CTASection = () => {
  return (
    <section className="py-12 px-4">
      <div 
        className="rounded-2xl overflow-hidden max-w-4xl mx-auto"
        style={{ background: '#111C2D', border: '1px solid rgba(0,176,255,0.15)' }}
      >
        <div className="grid md:grid-cols-2 gap-0 items-center">
          <div className="p-8 md:p-10">
            <h2 className="text-2xl md:text-3xl font-display font-bold mb-4 leading-tight">
              <span className="text-foreground">Start earning</span><br />
              <span className="text-foreground">with </span>
              <span className="text-gradient">WallsCash</span><br />
              <span className="text-foreground">today</span>
            </h2>
            <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
              Become a website and game tester, share your opinions in surveys, and earn cashback. Join now and start making money easily!
            </p>
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-lg font-semibold text-sm uppercase tracking-wide transition-all hover:-translate-y-1 text-white animate-neon-pulse"
              style={{
                background: 'linear-gradient(135deg, #00B0FF, #2979FF)',
                boxShadow: '0 10px 25px rgba(0,176,255,0.4)',
              }}
            >
              Sign Up
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          {/* Illustration */}
          <div className="flex justify-center items-end p-6 md:p-0">
            <div className="relative w-full max-w-[280px]">
              <div 
                className="w-full aspect-square rounded-2xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, rgba(0,176,255,0.15), rgba(41,121,255,0.08))' }}
              >
                <div className="grid grid-cols-3 gap-3 p-6">
                  <div className="text-4xl animate-float" style={{ animationDelay: '0s' }}>🎮</div>
                  <div className="text-4xl animate-float" style={{ animationDelay: '0.5s' }}>📱</div>
                  <div className="text-4xl animate-float" style={{ animationDelay: '1s' }}>💻</div>
                  <div className="text-4xl animate-float" style={{ animationDelay: '0.3s' }}>🎯</div>
                  <div className="text-4xl animate-float" style={{ animationDelay: '0.8s' }}>💰</div>
                  <div className="text-4xl animate-float" style={{ animationDelay: '1.3s' }}>🎁</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
