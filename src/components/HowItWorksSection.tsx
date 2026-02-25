import { DollarSign, Search, Gift, Wallet } from 'lucide-react';

const steps = [
  {
    icon: DollarSign,
    title: 'Getting Started',
    description: 'Create your free account and set up your profile to begin earning.',
    color: '#1DBF73',
  },
  {
    icon: Search,
    title: 'Explore',
    description: 'Browse available surveys, offers, and tasks from our partners.',
    color: '#1DBF73',
  },
  {
    icon: Gift,
    title: 'Choose an Offer',
    description: 'Pick an offer that interests you and complete it to earn coins.',
    color: '#1DBF73',
  },
  {
    icon: Wallet,
    title: 'Cashout',
    description: 'Withdraw your earnings via PayPal, crypto, or gift cards instantly.',
    color: '#1DBF73',
  },
];

const HowItWorksSection = () => {
  return (
    <section className="py-12 px-4">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-display font-bold mb-2 text-foreground">
          How to use and earn?
        </h2>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto">
          Earn effortlessly! Join WallsCash for seamless surveys and offerwalls. Your opinions turn into real rewards. Sign up now!
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
        {steps.map((step, index) => (
          <div
            key={index}
            className="rounded-2xl p-5 text-center transition-all duration-300 hover:-translate-y-2 group"
            style={{
              background: '#111C2D',
              border: '1px solid rgba(29,191,115,0.12)',
            }}
          >
            <div 
              className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-3"
              style={{ background: 'rgba(29,191,115,0.12)' }}
            >
              <step.icon className="w-6 h-6" style={{ color: step.color }} />
            </div>
            <h3 className="text-sm font-bold text-foreground mb-1">{step.title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default HowItWorksSection;
