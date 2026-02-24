import { UserPlus, ListTodo, Wallet } from 'lucide-react';
import howItWorksIllustrationDefault from '@/assets/how-it-works-illustration.png';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';

const steps = [
  {
    icon: UserPlus,
    title: 'Join In',
    description: 'Create your free account to start earning',
    number: '01',
  },
  {
    icon: ListTodo,
    title: 'Select Task',
    description: 'Select Task and complete them quickly.',
    number: '02',
  },
  {
    icon: Wallet,
    title: 'Withdraw',
    description: 'Get paid fast and securely',
    number: '03',
  },
];

const HowItWorksSection = () => {
  const { homepageImages } = useSiteSettings();
  const howItWorksIllustration = homepageImages.howItWorksIllustration || howItWorksIllustrationDefault;
  return (
    <section className="py-12 px-4">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-display font-bold mb-3">
          <span className="text-foreground">Your simple path to </span>
          <span className="text-gradient">extra income</span>
        </h2>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Complete easy tasks in your spare time and start earning today.
        </p>
      </div>

      {/* Illustration */}
      <div className="flex justify-center mb-10">
        <img 
          src={howItWorksIllustration} 
          alt="How it works" 
          className="w-full max-w-2xl h-auto object-contain drop-shadow-lg"
        />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
        {steps.map((step, index) => (
          <div
            key={index}
            className="rounded-2xl p-6 text-center transition-all duration-300 hover:-translate-y-2 cursor-pointer group"
            style={{
              background: '#111C2D',
              border: '1px solid rgba(29,191,115,0.15)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 15px 40px rgba(0,0,0,0.4), 0 0 20px rgba(29,191,115,0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all"
              style={{ background: 'rgba(29,191,115,0.15)' }}
            >
              <step.icon className="w-7 h-7" style={{ color: '#1DBF73' }} />
            </div>
            <div className="text-xs font-bold mb-1" style={{ color: '#1DBF73' }}>{step.number}</div>
            <h3 className="font-semibold mb-2 text-foreground">{step.title}</h3>
            <p className="text-sm text-muted-foreground">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default HowItWorksSection;
