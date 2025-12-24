import { forwardRef } from 'react';
import { Facebook, Send, MessageCircle, Youtube, Instagram } from 'lucide-react';
import { SiteLogo } from '@/contexts/SiteSettingsContext';

const socialLinks = [
  { icon: Facebook, href: '#' },
  { icon: Send, href: '#' },
  { icon: MessageCircle, href: '#' },
  { icon: Youtube, href: '#' },
  { icon: Instagram, href: '#' },
];

const Footer = forwardRef<HTMLElement>((_, ref) => {
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
        <div className="flex justify-center gap-4 mb-8">
          {socialLinks.map((social, index) => (
            <a
              key={index}
              href={social.href}
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white transition-all duration-300 hover:-translate-y-1 hover:rotate-6 hover:shadow-lg"
              style={{ background: 'var(--gradient-primary)' }}
            >
              <social.icon className="w-5 h-5" />
            </a>
          ))}
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
