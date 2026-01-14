import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Upload, Loader2, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { SiteLogo } from '@/contexts/SiteSettingsContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ProviderLogo {
  id: string;
  name: string;
  url: string;
}

const AdminProvidersCustomize = () => {
  const { isAdmin } = useAuth();
  const [providerLogos, setProviderLogos] = useState<ProviderLogo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newLogoName, setNewLogoName] = useState('');
  const [newLogoUrl, setNewLogoUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('provider_logos')
        .eq('id', 'default')
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data?.provider_logos && Array.isArray(data.provider_logos)) {
        setProviderLogos(data.provider_logos as unknown as ProviderLogo[]);
      }
    } catch (error: any) {
      toast.error('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size must be less than 2MB');
      return;
    }

    setIsUploading(true);
    try {
      const fileName = `provider-${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from('site-assets')
        .upload(fileName, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('site-assets')
        .getPublicUrl(fileName);

      setNewLogoUrl(urlData.publicUrl);
      toast.success('Image uploaded successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const addLogo = () => {
    if (!newLogoName.trim() || !newLogoUrl.trim()) {
      toast.error('Please enter name and upload an image');
      return;
    }

    const newLogo: ProviderLogo = {
      id: Date.now().toString(),
      name: newLogoName.trim(),
      url: newLogoUrl.trim(),
    };

    setProviderLogos(prev => [...prev, newLogo]);
    setNewLogoName('');
    setNewLogoUrl('');
    toast.success('Logo added to list');
  };

  const removeLogo = (id: string) => {
    setProviderLogos(prev => prev.filter(logo => logo.id !== id));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Convert to JSON-compatible format
      const logosJson = JSON.parse(JSON.stringify(providerLogos));
      const { error } = await supabase
        .from('site_settings')
        .update({ provider_logos: logosJson, updated_at: new Date().toISOString() })
        .eq('id', 'default');

      if (error) throw error;
      toast.success('Provider logos saved successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-xl font-bold mb-2">Access Denied</h1>
          <Link to="/dashboard" className="text-primary text-sm">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 px-3 py-2 bg-background/95 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to="/admin" className="p-1.5 hover:bg-muted rounded-lg">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <SiteLogo size="sm" />
        </div>
        <Button onClick={handleSave} disabled={isSaving} size="sm">
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
          Save Changes
        </Button>
      </header>

      <div className="p-4 md:p-6 max-w-2xl mx-auto">
        <h1 className="text-xl font-bold mb-6">Provider Logos</h1>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Add New Logo */}
            <div className="bg-muted rounded-xl p-4 mb-6">
              <h3 className="font-semibold mb-4">Add New Provider Logo</h3>
              
              <div className="space-y-4">
                <div>
                  <Label>Provider Name</Label>
                  <Input
                    value={newLogoName}
                    onChange={(e) => setNewLogoName(e.target.value)}
                    placeholder="e.g., Lootably, AdScend"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Logo Image</Label>
                  <div className="mt-1 flex gap-2">
                    <Input
                      value={newLogoUrl}
                      onChange={(e) => setNewLogoUrl(e.target.value)}
                      placeholder="Image URL or upload"
                      className="flex-1"
                    />
                    <label className="flex items-center gap-1 px-3 py-2 bg-primary text-primary-foreground rounded-lg cursor-pointer hover:bg-primary/90 transition-colors">
                      {isUploading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                        disabled={isUploading}
                      />
                    </label>
                  </div>
                  {newLogoUrl && (
                    <div className="mt-2 p-2 bg-background rounded-lg inline-block">
                      <img src={newLogoUrl} alt="Preview" className="h-8 object-contain" />
                    </div>
                  )}
                </div>

                <Button onClick={addLogo} className="w-full">
                  <Plus className="w-4 h-4 mr-1" /> Add Logo
                </Button>
              </div>
            </div>

            {/* Current Logos */}
            <div className="bg-muted rounded-xl p-4">
              <h3 className="font-semibold mb-4">Current Provider Logos ({providerLogos.length})</h3>
              
              {providerLogos.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No provider logos added yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {providerLogos.map((logo) => (
                    <div
                      key={logo.id}
                      className="flex items-center gap-3 p-3 bg-background rounded-lg"
                    >
                      <img src={logo.url} alt={logo.name} className="h-8 w-16 object-contain" />
                      <span className="flex-1 font-medium text-sm">{logo.name}</span>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeLogo(logo.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminProvidersCustomize;