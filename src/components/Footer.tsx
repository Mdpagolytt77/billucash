import { forwardRef, useEffect, useState } from 'react';
import { 
  Facebook, Send, MessageCircle, Youtube, Instagram, 
  Twitter, Linkedin, Github, Globe, Mail
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
};

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

  // Default links if none configured
  const defaultLinks = [
    { id: '1', icon: 'facebook', url: '#', color: '#1877F2' },
    { id: '2', icon: 'telegram', url: '#', color: '#0088CC' },
    { id: '3', icon: 'discord', url: '#', color: '#5865F2' },
    { id: '4', icon: 'youtube', url: '#', color: '#FF0000' },
    { id: '5', icon: 'instagram', url: '#', color: '#E4405F' },
  ];

  const linksToShow = socialLinks.length > 0 ? socialLinks : defaultLinks;

  return (
    <footer ref={ref} className="bg-background/90 border-t border-border py-12 px-4 md:px-[5%] mt-16">
      <div className="max-w-4xl mx-auto text-center">
        {/* Logo */}
        <div className="text-3xl md:text-4xl font-display font-black text-gradient mb-4">
          <SiteLogo size="lg" />
        </div>

        {/* Description */}
        <p className="opacity-80 leading-relaxed mb-8 max-w-xl mx-auto">
          A trusted platform for earning real money online. With instant payments, 24/7 support,
          and thousands of earning opportunities, your financial freedom starts here.
        </p>

        {/* Social Links */}
        <div className="flex justify-center gap-4 mb-8 flex-wrap">
          {linksToShow.map((link) => {
            const IconComponent = ICON_MAP[link.icon] || Globe;
            return (
              <a
                key={link.id}
                href={link.url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white transition-all duration-300 hover:-translate-y-1 hover:rotate-6 hover:shadow-lg"
                style={{ background: `linear-gradient(135deg, ${link.color}, ${link.color}dd)` }}
              >
                <IconComponent className="w-5 h-5" />
              </a>
            );
          })}
        </div>

        {/* Copyright */}
        <div className="text-sm opacity-60">
          © 2024 All rights reserved.
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = 'Footer';

export default Footer;
