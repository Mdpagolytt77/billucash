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
    <footer ref={ref} className="bg-background border-t border-border mt-8">
      <div className="py-10 px-4 md:px-[5%]">
        <div className="max-w-6xl mx-auto">
          {/* Payment Methods */}
          {paymentMethods.length > 0 && (
            <div className="mb-8 pb-8 border-b border-border">
              <h3 className="text-sm font-semibold text-center mb-4 text-muted-foreground">Payment Methods</h3>
              <div className="flex flex-wrap justify-center gap-4">
                {paymentMethods.map((method) => (
                  <div key={method.name} className="flex items-center gap-2 px-4 py-2 bg-muted rounded-xl">
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
              <div className="text-xl font-display font-black text-primary mb-3">
                <SiteLogo size="lg" />
              </div>
              <p className="text-xs text-muted-foreground">
                WallsCash | All rights reserved © {currentYear}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-3">About</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-3">Support</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">FAQ</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-3">Social media</h3>
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
                        className="w-9 h-9 rounded-full flex items-center justify-center bg-muted text-muted-foreground transition-all hover:bg-primary hover:text-primary-foreground"
                      >
                        <IconComponent className="w-4 h-4" />
                      </a>
                    );
                  })
                ) : (
                  <>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center bg-muted text-muted-foreground">
                      <Linkedin className="w-4 h-4" />
                    </div>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center bg-muted text-muted-foreground">
                      <Facebook className="w-4 h-4" />
                    </div>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center bg-muted text-muted-foreground">
                      <Send className="w-4 h-4" />
                    </div>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center bg-muted text-muted-foreground">
                      <MessageCircle className="w-4 h-4" />
                    </div>
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
