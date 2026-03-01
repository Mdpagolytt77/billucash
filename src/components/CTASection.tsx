import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const CTASection = () => {
  return (
    <section className="py-12 px-4">
      <div className="snake-glow-green rounded-2xl overflow-visible max-w-4xl mx-auto">
        <div
          className="relative z-10 rounded-2xl p-8 md:p-12 text-center"
          style={{ background: '#111C2D' }}
        >
          <h2 className="text-2xl md:text-3xl font-display font-bold mb-3 text-foreground">
            Ready to start <span className="text-gradient">earning</span>?
          </h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            Join thousands of users earning real money every day. Sign up now and start completing tasks!
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-lg font-semibold text-sm uppercase tracking-wide transition-all hover:-translate-y-1 text-white"
              style={{
                background: 'linear-gradient(135deg, #1DBF73, #17a566)',
                boxShadow: '0 8px 25px rgba(29,191,115,0.4)',
              }}
            >
              START EARN
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-lg font-semibold text-sm uppercase tracking-wide transition-all hover:-translate-y-1 text-foreground"
              style={{
                background: '#162235',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              JOIN NOW
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
