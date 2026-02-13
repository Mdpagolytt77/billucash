import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Upload, Trash2, Image, Save, Loader2, Menu } from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';
import SnowEffect from '@/components/SnowEffect';
import { useSnowEffect } from '@/hooks/useSnowEffect';
import { useAuth } from '@/contexts/AuthContext';
import { SiteLogo } from '@/contexts/SiteSettingsContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface HomepageImages {
  heroIllustration: string;
  statsIllustration: string;
  howItWorksIllustration: string;
  signupIllustration: string;
}

const defaultImages: HomepageImages = {
  heroIllustration: '',
  statsIllustration: '',
  howItWorksIllustration: '',
  signupIllustration: '',
};

const imageFields = [
  { key: 'heroIllustration' as const, label: 'Hero Section Image', description: 'Main hero illustration on homepage' },
  { key: 'statsIllustration' as const, label: 'Stats Section Image', description: 'Image shown in the stats/earnings section' },
  { key: 'howItWorksIllustration' as const, label: 'How It Works Image', description: 'Image for the How It Works section' },
  { key: 'signupIllustration' as const, label: 'Signup Page Image', description: 'Image shown on the signup page' },
];

const AdminHomepageImages = () => {
  const { isAdmin } = useAuth();
  const { snowEnabled } = useSnowEffect();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [images, setImages] = useState<HomepageImages>(defaultImages);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    const loadImages = async () => {
      const { data } = await supabase.rpc('get_public_site_settings');
      if (data && data.length > 0 && data[0].homepage_images) {
        const saved = data[0].homepage_images as unknown as HomepageImages;
        setImages(prev => ({ ...prev, ...saved }));
      }
    };
    loadImages();
  }, []);

  const handleUpload = async (key: keyof HomepageImages, file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Only image files allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Max file size is 5MB');
      return;
    }

    setUploading(key);
    try {
      const fileName = `homepage/${key}_${Date.now()}.${file.name.split('.').pop()}`;
      const { data, error } = await supabase.storage
        .from('site-assets')
        .upload(fileName, file, { upsert: true });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('site-assets')
        .getPublicUrl(data.path);

      setImages(prev => ({ ...prev, [key]: publicUrl }));
      toast.success('Image uploaded!');
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(null);
    }
  };

  const handleUrlChange = (key: keyof HomepageImages, url: string) => {
    setImages(prev => ({ ...prev, [key]: url }));
  };

  const handleRemove = (key: keyof HomepageImages) => {
    setImages(prev => ({ ...prev, [key]: '' }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('site_settings')
        .update({ homepage_images: images as any })
        .eq('id', 'default');

      if (error) throw error;
      toast.success('Homepage images saved!');
    } catch (err: any) {
      toast.error(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-destructive">Access Denied</p>
      </div>
    );
  }

  return (
    <>
      {snowEnabled && <SnowEffect />}
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-30 px-3 py-2 bg-background/95 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 hover:bg-muted rounded-lg">
              <Menu className="w-4 h-4" />
            </button>
            <SiteLogo size="sm" />
          </div>
          <Link to="/admin" className="text-xs text-primary flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" /> Back
          </Link>
        </header>

        <div className="px-3 md:px-[5%] py-4 max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Image className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-display font-bold">Homepage Images</h1>
              <p className="text-xs text-muted-foreground">Upload or paste URL for homepage section images</p>
            </div>
          </div>

          <div className="space-y-4">
            {imageFields.map((field) => (
              <div key={field.key} className="glass-card rounded-xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold">{field.label}</h3>
                    <p className="text-[11px] text-muted-foreground">{field.description}</p>
                  </div>
                  {images[field.key] && (
                    <button
                      onClick={() => handleRemove(field.key)}
                      className="p-1.5 rounded-lg bg-destructive/20 hover:bg-destructive/30 text-destructive transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Preview */}
                {images[field.key] && (
                  <div className="mb-3 rounded-lg overflow-hidden bg-muted/30 border border-border/30 p-2">
                    <img
                      src={images[field.key]}
                      alt={field.label}
                      className="max-h-32 object-contain mx-auto"
                    />
                  </div>
                )}

                {/* URL input */}
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={images[field.key]}
                    onChange={(e) => handleUrlChange(field.key, e.target.value)}
                    placeholder="Paste image URL here..."
                    className="flex-1 px-3 py-2 rounded-lg bg-muted/50 border border-border/50 text-xs focus:outline-none focus:border-primary"
                  />
                </div>

                {/* Upload button */}
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary text-xs font-medium cursor-pointer transition-colors">
                  {uploading === field.key ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  Upload Image
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUpload(field.key, file);
                    }}
                  />
                </label>
              </div>
            ))}
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-primary-foreground font-bold text-sm transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/30 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </>
  );
};

export default AdminHomepageImages;
