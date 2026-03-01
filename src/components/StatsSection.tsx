import { Users, CheckCircle, Clock, DollarSign } from 'lucide-react';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';

const stats = [
  { icon: DollarSign, value: '$30,000+', label: 'Total Paid Yet' },
  { icon: Users, value: '680,000+', label: 'Total Users Joined' },
  { icon: Clock, value: '18m 30s', label: 'Average time for first cashout' },
  { icon: CheckCircle, value: '$20+', label: 'Average Daily User Earn' },
];

const StatsSection = () => {
  const { homepageImages } = useSiteSettings();
  const statsImage = homepageImages?.statsIllustration;

  return (
    <section className="py-10 px-4">
      <div className="relative max-w-4xl mx-auto">
        {/* Overlapping image - 60% above box, 40% behind/below box */}
        {statsImage && (
          <div className="flex justify-center relative z-0" style={{ marginBottom: '-80px' }}>
            <img
              src={statsImage}
              alt="Stats illustration"
              className="max-h-[200px] md:max-h-[260px] object-contain"
              style={{ filter: 'drop-shadow(0 10px 30px rgba(29,191,115,0.2))' }}
            />
          </div>
        )}

        {/* Stats box */}
        <div 
          className="rounded-2xl p-6 md:p-8 relative z-[1]"
          style={{ background: '#0E1625', border: '1px solid rgba(29,191,115,0.1)' }}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {stats.map((stat, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <stat.icon className="w-6 h-6 icon-rainbow-glow" />
                <div className="text-xl md:text-2xl font-display font-bold text-rainbow">
                  {stat.value}
                </div>
                <p className="text-xs text-muted-foreground leading-tight">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
