import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Menu, Save } from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';
import SnowEffect from '@/components/SnowEffect';
import SnowToggle from '@/components/SnowToggle';
import { useSnowEffect } from '@/hooks/useSnowEffect';
import { SiteLogo } from '@/contexts/SiteSettingsContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

// Fixed list of social platforms
const SOCIAL_PLATFORMS = [
  { key: 'linkedin', label: 'LinkedIn' },
  { key: 'facebook', label: 'Facebook' },
  { key: 'telegram', label: 'Telegram' },
  { key: 'twitter', label: 'Twitter' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'youtube', label: 'YouTube' },
  { key: 'whatsapp', label: 'WhatsApp' },
  { key: 'trustpilot', label: 'Trust Pilot' },
  { key: 'reddit', label: 'Reddit' },
  { key: 'discord', label: 'Discord' },
];

interface SocialLinksData {
  [key: string]: string;
}

const AdminSocialLinksCustomize = () => {
  const { isAdmin, isModerator } = useAuth();
  const canAccess = isAdmin || isModerator;
  const { snowEnabled, toggleSnow } = useSnowEffect();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [socialLinks, setSocialLinks] = useState<SocialLinksData>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('social_links_settings')
        .eq('id', 'default')
        .maybeSingle();

      if (error) throw error;

      if (data?.social_links_settings) {
        // Convert from array format to object format if needed
        if (Array.isArray(data.social_links_settings)) {
          const linksObj: SocialLinksData = {};
          (data.social_links_settings as any[]).forEach((link: any) => {
            if (link.icon && link.url) {
              linksObj[link.icon] = link.url;
            }
          });
          setSocialLinks(linksObj);
        } else {
          setSocialLinks(data.social_links_settings as SocialLinksData);
        }
      }
    } catch (error) {
      console.error('Error loading social links:', error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Convert to array format for footer compatibility
      const linksArray = SOCIAL_PLATFORMS
        .filter(platform => socialLinks[platform.key]?.trim())
        .map(platform => ({
          id: platform.key,
          name: platform.label,
          icon: platform.key,
          url: socialLinks[platform.key],
          enabled: true,
          color: getDefaultColor(platform.key),
        }));

      const { error } = await supabase
        .from('site_settings')
        .update({
          social_links_settings: linksArray,
          updated_at: new Date().toISOString(),
        })
        .eq('id', 'default');

      if (error) throw error;

      toast.success('Social links saved successfully!');
    } catch (error) {
      console.error('Error saving social links:', error);
      toast.error('Failed to save social links');
    } finally {
      setIsSaving(false);
    }
  };

  const getDefaultColor = (key: string): string => {
    const colors: Record<string, string> = {
      linkedin: '#0A66C2',
      facebook: '#1877F2',
      telegram: '#0088CC',
      twitter: '#1DA1F2',
      instagram: '#E4405F',
      youtube: '#FF0000',
      whatsapp: '#25D366',
      trustpilot: '#00B67A',
      reddit: '#FF4500',
      discord: '#5865F2',
    };
    return colors[key] || '#2ecc71';
  };

  const updateLink = (key: string, value: string) => {
    setSocialLinks(prev => ({ ...prev, [key]: value }));
  };

  if (!canAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-destructive">Access Denied</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#000000' }}>
      {snowEnabled && <SnowEffect />}
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Header */}
      <header className="sticky top-0 z-30 border-b px-4 py-3" style={{ background: '#0a0a0a', borderColor: '#1a1a1a' }}>
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 hover:bg-muted rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold text-gradient">Social Links</h1>
          </div>
          <SnowToggle enabled={snowEnabled} onToggle={toggleSnow} />
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto p-4 pb-20">
        <div className="glass-card p-6 rounded-xl border border-border">
          <div className="space-y-4">
            {SOCIAL_PLATFORMS.map((platform) => (
              <div key={platform.key}>
                <Label className="text-sm font-medium text-foreground mb-2 block">
                  {platform.label}
                </Label>
                <Input
                  value={socialLinks[platform.key] || ''}
                  onChange={(e) => updateLink(platform.key, e.target.value)}
                  placeholder={`https://...`}
                  className="bg-background"
                />
              </div>
            ))}
          </div>

          {/* Save Button */}
          <div className="mt-6">
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              className="gap-2"
              variant="destructive"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save changes'}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminSocialLinksCustomize;
