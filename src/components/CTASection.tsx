import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const CTASection = () => {
  return (
    <section className="py-10 px-4">
      <div className="bg-muted rounded-2xl overflow-hidden max-w-4xl mx-auto">
        <div className="grid md:grid-cols-2 gap-0 items-center">
          <div className="p-8 md:p-10">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-primary mb-4 leading-tight">
              Start earning<br />with WallsCash<br />today
            </h2>
            <p className="text-muted-foreground text-sm mb-6">
              Become a website and game tester, share your opinions in surveys, and earn cashback on your online shopping. Join now and start making money easily!
            </p>
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 rounded-full font-semibold text-sm uppercase tracking-wide transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/30"
            >
              Sign Up
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          {/* Illustration */}
          <div className="flex justify-center items-end p-4 md:p-0">
            <div className="relative w-full max-w-[280px]">
              <div className="w-full aspect-square bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl flex items-center justify-center">
                <div className="grid grid-cols-3 gap-2 p-6">
                  <div className="text-4xl">🎮</div>
                  <div className="text-4xl">📱</div>
                  <div className="text-4xl">💻</div>
                  <div className="text-4xl">🎯</div>
                  <div className="text-4xl">💰</div>
                  <div className="text-4xl">🎁</div>
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
