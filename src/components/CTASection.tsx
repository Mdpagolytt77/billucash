import { Link } from 'react-router-dom';
import { ArrowRight, Gamepad2, Users, Gift } from 'lucide-react';

const CTASection = () => {
  return (
    <section className="py-10 px-4">
      <div className="bg-muted rounded-2xl p-8 max-w-4xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-2xl md:text-3xl font-display font-bold text-primary mb-4">
              Start earning<br />with WallsCash<br />today
            </h2>
            <p className="text-muted-foreground text-sm mb-6">
              Become a website and game tester, share your opinions in surveys, and earn cashback on your online shopping. Join now and start making money easily!
            </p>
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-semibold text-sm transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              SIGN UP
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          {/* Illustration */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-48 h-48 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl flex items-center justify-center">
                <div className="text-6xl">🎮</div>
              </div>
              <div className="absolute -top-4 -right-4 w-16 h-16 bg-green-500/20 rounded-xl flex items-center justify-center text-2xl">
                💰
              </div>
              <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-blue-500/20 rounded-xl flex items-center justify-center text-2xl">
                🎁
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
