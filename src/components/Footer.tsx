import { forwardRef, useEffect, useState } from 'react';
import { 
  Facebook, Send, MessageCircle, Youtube, Instagram, 
  Twitter, Linkedin, Github, Globe, Mail, Star
} from 'lucide-react';
import { SiteLogo } from '@/contexts/SiteSettingsContext';
import { supabase } from '@/integrations/supabase/client';

interface SocialLink {
  id: string;
  name: string;
  icon: string;
  url: string;
  enabled: boolean;
  color: string;
}

const ICON_MAP: Record<string, React.ElementType> = {
  facebook: Facebook,
  instagram: Instagram,
  twitter: Twitter,
  youtube: Youtube,
  telegram: Send,
  discord: MessageCircle,
  whatsapp: MessageCircle,
  linkedin: Linkedin,
  github: Github,
  email: Mail,
  website: Globe,
  tiktok: Globe,
  pinterest: Globe,
  reddit: Globe,
  snapchat: Globe,
  twitch: Globe,
  trustpilot: Star,
};

const JOIN_US_PLATFORMS = ['facebook', 'telegram', 'whatsapp', 'youtube', 'instagram', 'twitter', 'discord', 'linkedin', 'tiktok', 'reddit'];

interface PaymentMethod {
  name: string;
  icon_url: string | null;
}

const Footer = forwardRef<HTMLElement>((_, ref) => {
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  useEffect(() => {
    loadSocialLinks();
    loadPaymentMethods();
    
    const channel = supabase
      .channel('footer-social-links')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'site_settings',
          filter: 'id=eq.default'
        },
        (payload) => {
          const newData = payload.new as { social_links_settings?: SocialLink[] };
          if (newData.social_links_settings && Array.isArray(newData.social_links_settings)) {
            setSocialLinks(newData.social_links_settings.filter(l => l.enabled));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadSocialLinks = async () => {
    try {
      const { data, error } = await supabase.rpc('get_public_site_settings');
      if (error) throw error;
      if (data && data.length > 0 && data[0].social_links_settings && Array.isArray(data[0].social_links_settings)) {
        const links = data[0].social_links_settings as unknown as SocialLink[];
        setSocialLinks(links.filter(l => l.enabled));
      }
    } catch (error) {
      console.error('Error loading social links:', error);
    }
  };

  const loadPaymentMethods = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('name, icon_url')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (!error && data) {
        setPaymentMethods(data);
      }
    } catch (error) {
      console.error('Error loading payment methods:', error);
    }
  };

  const joinUsLinks = socialLinks.filter(link => JOIN_US_PLATFORMS.includes(link.icon));
  const currentYear = new Date().getFullYear();

  return (
    <footer ref={ref} className="mt-8" style={{ background: '#0A0F1C', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="py-10 px-4 md:px-[5%]">
        <div className="max-w-6xl mx-auto">
          {/* Payment Methods */}
          {paymentMethods.length > 0 && (
            <div className="mb-8 pb-8" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <h3 className="text-sm font-semibold text-center mb-4 text-muted-foreground">Payment Methods</h3>
              <div className="flex flex-wrap justify-center gap-4">
                {paymentMethods.map((method) => (
                  <div key={method.name} className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: '#111C2D' }}>
                    {method.icon_url && (
                      <img src={method.icon_url} alt={method.name} className="w-6 h-6 object-contain" />
                    )}
                    <span className="text-xs font-medium text-foreground">{method.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Main Footer Content */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="text-xl font-display font-black mb-3">
                <SiteLogo size="lg" />
              </div>
              <p className="text-xs text-muted-foreground">
                WallsCash | All rights reserved © {currentYear}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-3 text-foreground">About</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-3 text-foreground">Support</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">FAQ</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-3 text-foreground">Social media</h3>
              <div className="flex gap-2">
                {joinUsLinks.length > 0 ? (
                  joinUsLinks.slice(0, 4).map((link) => {
                    const IconComponent = ICON_MAP[link.icon] || Globe;
                    return (
                      <a
                        key={link.id}
                        href={link.url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:-translate-y-1"
                        style={{ 
                          background: '#111C2D', 
                          color: '#9AA6B2',
                          border: '1px solid rgba(0,176,255,0.1)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'linear-gradient(135deg, #00B0FF, #2979FF)';
                          e.currentTarget.style.color = '#FFFFFF';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#111C2D';
                          e.currentTarget.style.color = '#9AA6B2';
                        }}
                      >
                        <IconComponent className="w-4 h-4" />
                      </a>
                    );
                  })
                ) : (
                  <>
                    {[Linkedin, Facebook, Send, MessageCircle].map((Icon, i) => (
                      <div key={i} className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: '#111C2D', color: '#9AA6B2' }}>
                        <Icon className="w-4 h-4" />
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = 'Footer';

export default Footer;
