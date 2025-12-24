import { Rocket, PlayCircle } from 'lucide-react';
import TypingText from './TypingText';

const HeroSection = () => {
  return (
    <div className="max-w-xl text-center mx-auto lg:mx-0 lg:text-left">
      {/* Logo */}
      <div className="text-center mb-6">
        <div className="logo-3d text-4xl md:text-5xl inline-block mb-1">BILLUCASH</div>
        <div className="text-primary text-sm tracking-[0.2em] font-semibold uppercase">
          earn & grow
        </div>
      </div>

      {/* Title */}
      <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-black mb-2 text-center">
        Get Paid For
      </h1>

      {/* Typing Animation */}
      <TypingText />

      {/* Description */}
      <p className="text-base md:text-lg opacity-90 leading-relaxed mb-8 text-center">
        Join thousands of users earning real money by completing simple tasks,
        playing games, watching videos, and referring friends. Start your journey
        with instant withdrawals and 24/7 support!
      </p>

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 mb-10 justify-center">
        <button className="btn-primary flex items-center justify-center gap-2">
          <Rocket className="w-5 h-5" />
          Start Earning Now
        </button>
        <button className="btn-glass flex items-center justify-center gap-2">
          <PlayCircle className="w-5 h-5" />
          How It Works
        </button>
      </div>

      {/* Stats */}
      <div className="flex gap-8 md:gap-12 justify-center flex-wrap">
        <div className="text-center">
          <div className="text-3xl md:text-4xl font-display font-black text-gradient mb-1">50K+</div>
          <div className="text-sm opacity-80 font-medium">Active Users</div>
        </div>
        <div className="text-center">
          <div className="text-3xl md:text-4xl font-display font-black text-gradient mb-1">$2M+</div>
          <div className="text-sm opacity-80 font-medium">Paid Out</div>
        </div>
        <div className="text-center">
          <div className="text-3xl md:text-4xl font-display font-black text-gradient mb-1">4.9★</div>
          <div className="text-sm opacity-80 font-medium">Rating</div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
