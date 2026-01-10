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

// Social platforms for "Join us" section
const JOIN_US_PLATFORMS = ['facebook', 'telegram', 'whatsapp', 'youtube', 'instagram', 'twitter', 'discord', 'linkedin', 'tiktok', 'reddit'];

// Support platforms
const SUPPORT_PLATFORMS = ['telegram', 'email'];

const Footer = forwardRef<HTMLElement>((_, ref) => {
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);

  useEffect(() => {
    loadSocialLinks();
    
    // Subscribe to real-time changes
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

  // Filter links for "Join us" section
  const joinUsLinks = socialLinks.filter(link => JOIN_US_PLATFORMS.includes(link.icon));
  
  // Filter links for "Support" section (telegram and email)
  const supportLinks = socialLinks.filter(link => SUPPORT_PLATFORMS.includes(link.icon));

  const currentYear = new Date().getFullYear();

  return (
    <footer ref={ref} className="bg-background border-t border-primary/30 mt-16">
      {/* Gradient line at top */}
      <div className="h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent" />
      
      <div className="py-12 px-4 md:px-[5%]">
        <div className="max-w-6xl mx-auto">
          {/* Main Footer Content - 3 Column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 mb-10">
            
            {/* Left Column - Logo & Description */}
            <div className="text-center md:text-left">
              <div className="text-2xl md:text-3xl font-display font-black text-gradient mb-4">
                <SiteLogo size="lg" />
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                A platform that contains various offerwall content for users.
              </p>
            </div>

            {/* Middle Column - Join Us */}
            <div className="text-center">
              <h3 className="text-lg font-semibold text-primary mb-4">Join us</h3>
              <div className="flex justify-center gap-3 flex-wrap">
                {joinUsLinks.length > 0 ? (
                  joinUsLinks.slice(0, 4).map((link) => {
                    const IconComponent = ICON_MAP[link.icon] || Globe;
                    return (
                      <a
                        key={link.id}
                        href={link.url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-11 h-11 rounded-lg flex items-center justify-center bg-primary/20 text-primary border border-primary/30 transition-all duration-300 hover:-translate-y-1 hover:bg-primary/30 hover:shadow-lg hover:shadow-primary/20"
                      >
                        <IconComponent className="w-5 h-5" />
                      </a>
                    );
                  })
                ) : (
                  // Default icons if no links configured
                  <>
                    <div className="w-11 h-11 rounded-lg flex items-center justify-center bg-primary/20 text-primary border border-primary/30">
                      <Facebook className="w-5 h-5" />
                    </div>
                    <div className="w-11 h-11 rounded-lg flex items-center justify-center bg-primary/20 text-primary border border-primary/30">
                      <Send className="w-5 h-5" />
                    </div>
                    <div className="w-11 h-11 rounded-lg flex items-center justify-center bg-primary/20 text-primary border border-primary/30">
                      <MessageCircle className="w-5 h-5" />
                    </div>
                    <div className="w-11 h-11 rounded-lg flex items-center justify-center bg-primary/20 text-primary border border-primary/30">
                      <Youtube className="w-5 h-5" />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Right Column - Support & Rating */}
            <div className="text-center md:text-right">
              <div className="flex flex-col md:flex-row md:justify-end gap-8">
                {/* Support Section */}
                <div>
                  <h3 className="text-lg font-semibold text-primary mb-4">Support</h3>
                  <div className="flex justify-center md:justify-end gap-3">
                    {supportLinks.length > 0 ? (
                      supportLinks.map((link) => {
                        const IconComponent = ICON_MAP[link.icon] || Globe;
                        return (
                          <a
                            key={link.id}
                            href={link.icon === 'email' ? `mailto:${link.url}` : link.url || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-11 h-11 rounded-lg flex items-center justify-center bg-primary/20 text-primary border border-primary/30 transition-all duration-300 hover:-translate-y-1 hover:bg-primary/30 hover:shadow-lg hover:shadow-primary/20"
                          >
                            <IconComponent className="w-5 h-5" />
                          </a>
                        );
                      })
                    ) : (
                      <>
                        <div className="w-11 h-11 rounded-lg flex items-center justify-center bg-primary/20 text-primary border border-primary/30">
                          <Send className="w-5 h-5" />
                        </div>
                        <div className="w-11 h-11 rounded-lg flex items-center justify-center bg-primary/20 text-primary border border-primary/30">
                          <Mail className="w-5 h-5" />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* We are awesome - Star Rating */}
                <div>
                  <h3 className="text-lg font-semibold text-primary mb-4">We are awesome</h3>
                  <div className="flex justify-center md:justify-end gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star} 
                        className={`w-6 h-6 ${star <= 4 ? 'fill-primary text-primary' : 'text-primary'}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="text-center text-sm text-muted-foreground pt-6 border-t border-border/50">
            © {currentYear} <SiteLogo className="inline" />
          </div>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = 'Footer';

export default Footer;
