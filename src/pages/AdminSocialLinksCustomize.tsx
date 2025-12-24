import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Menu, Plus, Trash2, Save, RotateCcw, GripVertical } from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';
import SnowEffect from '@/components/SnowEffect';
import SnowToggle from '@/components/SnowToggle';
import { useSnowEffect } from '@/hooks/useSnowEffect';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SocialLink {
  id: string;
  name: string;
  icon: string;
  url: string;
  enabled: boolean;
  color: string;
}

const AVAILABLE_ICONS = [
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'twitter', label: 'Twitter / X' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'telegram', label: 'Telegram' },
  { value: 'discord', label: 'Discord' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'pinterest', label: 'Pinterest' },
  { value: 'reddit', label: 'Reddit' },
  { value: 'snapchat', label: 'Snapchat' },
  { value: 'twitch', label: 'Twitch' },
  { value: 'github', label: 'GitHub' },
  { value: 'email', label: 'Email' },
  { value: 'website', label: 'Website' },
];

const DEFAULT_COLORS: Record<string, string> = {
  facebook: '#1877F2',
  instagram: '#E4405F',
  twitter: '#1DA1F2',
  youtube: '#FF0000',
  telegram: '#0088CC',
  discord: '#5865F2',
  tiktok: '#000000',
  whatsapp: '#25D366',
  linkedin: '#0A66C2',
  pinterest: '#E60023',
  reddit: '#FF4500',
  snapchat: '#FFFC00',
  twitch: '#9146FF',
  github: '#181717',
  email: '#EA4335',
  website: '#2ecc71',
};

const AdminSocialLinksCustomize = () => {
  const { isAdmin } = useAuth();
  const { snowEnabled, toggleSnow } = useSnowEffect();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [originalLinks, setOriginalLinks] = useState<SocialLink[]>([]);
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

      if (data?.social_links_settings && Array.isArray(data.social_links_settings)) {
        const links = data.social_links_settings as unknown as SocialLink[];
        setSocialLinks(links);
        setOriginalLinks(links);
      }
    } catch (error) {
      console.error('Error loading social links:', error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('site_settings')
        .update({
          social_links_settings: JSON.parse(JSON.stringify(socialLinks)),
          updated_at: new Date().toISOString(),
        })
        .eq('id', 'default');

      if (error) throw error;

      setOriginalLinks([...socialLinks]);
      toast.success('Social links saved successfully!');
    } catch (error) {
      console.error('Error saving social links:', error);
      toast.error('Failed to save social links');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSocialLinks([...originalLinks]);
    toast.info('Changes reverted');
  };

  const addSocialLink = () => {
    const newLink: SocialLink = {
      id: crypto.randomUUID(),
      name: 'New Link',
      icon: 'website',
      url: '',
      enabled: true,
      color: DEFAULT_COLORS['website'],
    };
    setSocialLinks([...socialLinks, newLink]);
  };

  const removeSocialLink = (id: string) => {
    setSocialLinks(socialLinks.filter(link => link.id !== id));
  };

  const updateSocialLink = (id: string, field: keyof SocialLink, value: string | boolean) => {
    setSocialLinks(socialLinks.map(link => {
      if (link.id === id) {
        const updated = { ...link, [field]: value };
        // Auto-update color when icon changes
        if (field === 'icon' && typeof value === 'string') {
          updated.color = DEFAULT_COLORS[value] || '#2ecc71';
          updated.name = AVAILABLE_ICONS.find(i => i.value === value)?.label || value;
        }
        return updated;
      }
      return link;
    }));
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-destructive">Access Denied</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {snowEnabled && <SnowEffect />}
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/90 backdrop-blur border-b border-border px-4 py-3">
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
        {/* Add Button */}
        <div className="mb-6">
          <Button onClick={addSocialLink} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Social Link
          </Button>
        </div>

        {/* Social Links List */}
        <div className="space-y-4">
          {socialLinks.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <p className="text-muted-foreground mb-4">No social links added yet</p>
              <Button onClick={addSocialLink} variant="outline" className="gap-2">
                <Plus className="w-4 h-4" />
                Add Your First Link
              </Button>
            </div>
          ) : (
            socialLinks.map((link) => (
              <div
                key={link.id}
                className="glass-card p-4 border border-border rounded-xl"
              >
                <div className="flex items-start gap-4">
                  {/* Drag Handle & Icon Preview */}
                  <div className="flex flex-col items-center gap-2">
                    <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg"
                      style={{ background: `linear-gradient(135deg, ${link.color}, ${link.color}dd)` }}
                    >
                      {link.name.charAt(0).toUpperCase()}
                    </div>
                  </div>

                  {/* Fields */}
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">
                        Platform
                      </label>
                      <Select
                        value={link.icon}
                        onValueChange={(value) => updateSocialLink(link.id, 'icon', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select platform" />
                        </SelectTrigger>
                        <SelectContent>
                          {AVAILABLE_ICONS.map((icon) => (
                            <SelectItem key={icon.value} value={icon.value}>
                              {icon.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">
                        Display Name
                      </label>
                      <Input
                        value={link.name}
                        onChange={(e) => updateSocialLink(link.id, 'name', e.target.value)}
                        placeholder="Link name"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">
                        URL
                      </label>
                      <Input
                        value={link.url}
                        onChange={(e) => updateSocialLink(link.id, 'url', e.target.value)}
                        placeholder="https://..."
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">
                        Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={link.color}
                          onChange={(e) => updateSocialLink(link.id, 'color', e.target.value)}
                          className="w-10 h-10 rounded-lg border border-border cursor-pointer"
                        />
                        <Input
                          value={link.color}
                          onChange={(e) => updateSocialLink(link.id, 'color', e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={link.enabled}
                          onCheckedChange={(checked) => updateSocialLink(link.id, 'enabled', checked)}
                        />
                        <span className="text-sm">
                          {link.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeSocialLink(link.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Action Buttons */}
        {socialLinks.length > 0 && (
          <div className="flex gap-3 justify-end mt-6">
            <Button variant="outline" onClick={handleReset} className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Reset
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="gap-2">
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminSocialLinksCustomize;
