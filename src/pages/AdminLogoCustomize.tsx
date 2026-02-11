import { useState, useEffect, useRef } from 'react';
import { Palette, Menu, Save, RotateCcw, Eye, Upload, Image, Loader2, Coins } from 'lucide-react';
import heroBg from '@/assets/hero-bg.jpg';
import SnowEffect from '@/components/SnowEffect';
import SnowToggle from '@/components/SnowToggle';
import AdminSidebar from '@/components/AdminSidebar';
import { useSnowEffect } from '@/hooks/useSnowEffect';
import { useAuth } from '@/contexts/AuthContext';
import { SiteLogo, useSiteSettings, getBackgroundStyle } from '@/contexts/SiteSettingsContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const AdminLogoCustomize = () => {
  const { isAdmin, isModerator } = useAuth();
  const canAccess = isAdmin || isModerator;
  const { snowEnabled, toggleSnow } = useSnowEffect();
  const { background: siteBackground } = useSiteSettings();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logoText, setLogoText] = useState('WALLSCASH');
  const [previewText, setPreviewText] = useState('WALLSCASH');
  const [logoImage, setLogoImage] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [logoType, setLogoType] = useState<'text' | 'image'>('text');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Icon states
  const [coinIconUrl, setCoinIconUrl] = useState<string | null>(null);
  const [previewIconUrl, setPreviewIconUrl] = useState<string | null>(null);
  const [selectedIconFile, setSelectedIconFile] = useState<File | null>(null);
  const [isUploadingIcon, setIsUploadingIcon] = useState(false);
  const iconInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    const { data } = await supabase.from('site_settings').select('logo_type, logo_text, logo_image_url, coin_icon_url').eq('id', 'default').maybeSingle();
    if (data) {
      if (data.logo_text) { setLogoText(data.logo_text); setPreviewText(data.logo_text); }
      if (data.logo_image_url) { setLogoImage(data.logo_image_url); setPreviewImage(data.logo_image_url); }
      if (data.logo_type) setLogoType(data.logo_type as 'text' | 'image');
      if (data.coin_icon_url) { setCoinIconUrl(data.coin_icon_url); setPreviewIconUrl(data.coin_icon_url); }
    }
  };

  // Allowed file types for security (no SVG to prevent XSS)
  const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
  const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
  
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Security: Validate file size
    if (file.size > MAX_FILE_SIZE) { 
      toast.error('Max file size is 2MB'); 
      return; 
    }
    
    // Security: Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      toast.error('Only JPG, PNG, and WebP images are allowed');
      return;
    }
    
    // Security: Validate file extension
    const fileName = file.name.toLowerCase();
    const hasValidExtension = ALLOWED_EXTENSIONS.some(ext => fileName.endsWith(ext));
    if (!hasValidExtension) {
      toast.error('Invalid file extension');
      return;
    }
    
    // Store the file for later upload
    setSelectedFile(file);
    
    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setPreviewImage(previewUrl);
  };

  const handleIconSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > MAX_FILE_SIZE) { 
      toast.error('Max file size is 2MB'); 
      return; 
    }
    
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      toast.error('Only JPG, PNG, and WebP images are allowed');
      return;
    }
    
    const fileName = file.name.toLowerCase();
    const hasValidExtension = ALLOWED_EXTENSIONS.some(ext => fileName.endsWith(ext));
    if (!hasValidExtension) {
      toast.error('Invalid file extension');
      return;
    }
    
    setSelectedIconFile(file);
    const previewUrl = URL.createObjectURL(file);
    setPreviewIconUrl(previewUrl);
  };

  const uploadToStorage = async (file: File, folder: string = 'logos'): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${folder === 'icons' ? 'icon' : 'logo'}-${Date.now()}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      // Delete old file if exists
      const existingUrl = folder === 'icons' ? coinIconUrl : logoImage;
      if (existingUrl && existingUrl.includes('site-assets')) {
        const oldPath = existingUrl.split('/site-assets/')[1];
        if (oldPath) {
          await supabase.storage.from('site-assets').remove([oldPath]);
        }
      }

      // Upload new file
      const { error: uploadError } = await supabase.storage
        .from('site-assets')
        .upload(filePath, file, { 
          cacheControl: '3600',
          upsert: true 
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('site-assets')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Failed to upload:', error);
      return null;
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let imageUrl = logoImage;
      let iconUrl = coinIconUrl;

      // If there's a new logo file selected, upload it
      if (selectedFile && logoType === 'image') {
        setIsUploading(true);
        const uploadedUrl = await uploadToStorage(selectedFile, 'logos');
        if (!uploadedUrl) {
          toast.error('Failed to upload logo');
          setIsSaving(false);
          setIsUploading(false);
          return;
        }
        imageUrl = uploadedUrl;
        setIsUploading(false);
      }

      // If there's a new icon file selected, upload it
      if (selectedIconFile) {
        setIsUploadingIcon(true);
        const uploadedIconUrl = await uploadToStorage(selectedIconFile, 'icons');
        if (!uploadedIconUrl) {
          toast.error('Failed to upload icon');
          setIsSaving(false);
          setIsUploadingIcon(false);
          return;
        }
        iconUrl = uploadedIconUrl;
        setIsUploadingIcon(false);
      }

      const { error } = await supabase
        .from('site_settings')
        .update({ 
          logo_type: logoType, 
          logo_text: logoText, 
          logo_image_url: logoType === 'image' ? imageUrl : null,
          coin_icon_url: iconUrl,
          updated_at: new Date().toISOString() 
        })
        .eq('id', 'default');
      
      if (error) throw error;
      
      setLogoImage(imageUrl);
      setCoinIconUrl(iconUrl);
      setPreviewText(logoText); 
      setPreviewImage(imageUrl);
      setPreviewIconUrl(iconUrl);
      setSelectedFile(null);
      setSelectedIconFile(null);
      toast.success('Settings saved!');
    } catch (err) { 
      console.error(err);
      toast.error('Failed to save'); 
    }
    finally { setIsSaving(false); }
  };

  const handleReset = async () => {
    // Delete current logo from storage if exists
    if (logoImage && logoImage.includes('site-assets')) {
      const oldPath = logoImage.split('/site-assets/')[1];
      if (oldPath) {
        await supabase.storage.from('site-assets').remove([oldPath]);
      }
    }

    setLogoText('WALLSCASH'); 
    setPreviewText('WALLSCASH');
    setLogoImage(null); 
    setPreviewImage(null); 
    setLogoType('text');
    setSelectedFile(null);
    
    await supabase.from('site_settings').update({ 
      logo_type: 'text', 
      logo_text: 'WALLSCASH', 
      logo_image_url: null, 
      updated_at: new Date().toISOString() 
    }).eq('id', 'default');
    
    toast.success('Logo reset to default!');
  };

  const handleResetIcon = async () => {
    // Delete current icon from storage if exists
    if (coinIconUrl && coinIconUrl.includes('site-assets')) {
      const oldPath = coinIconUrl.split('/site-assets/')[1];
      if (oldPath) {
        await supabase.storage.from('site-assets').remove([oldPath]);
      }
    }

    setCoinIconUrl(null);
    setPreviewIconUrl(null);
    setSelectedIconFile(null);
    
    await supabase.from('site_settings').update({ 
      coin_icon_url: null, 
      updated_at: new Date().toISOString() 
    }).eq('id', 'default');
    
    toast.success('Icon reset to default!');
  };

  if (!canAccess) return <div className="min-h-screen flex items-center justify-center text-xs">Access Denied</div>;

  return (
    <>
      {snowEnabled && <SnowEffect />}
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="min-h-screen" style={getBackgroundStyle(siteBackground, heroBg)}>
        <header className="sticky top-0 z-30 px-3 py-2 bg-background/95 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 hover:bg-muted rounded-lg"><Menu className="w-4 h-4" /></button>
            <SiteLogo size="sm" />
            <span className="text-xs text-muted-foreground">/ Logo & Icon</span>
          </div>
          <SnowToggle enabled={snowEnabled} onToggle={toggleSnow} />
        </header>

        <main className="p-3 md:px-[5%] max-w-md mx-auto space-y-4">
          {/* Logo Customize */}
          <div className="glass-card p-4">
            <h2 className="text-sm font-bold text-primary flex items-center gap-1.5 mb-4">
              <Palette className="w-4 h-4" /> Logo Customize
            </h2>

            <div className="mb-4 p-4 bg-muted/50 rounded-lg text-center border border-border">
              <p className="text-[9px] text-muted-foreground mb-2 flex items-center justify-center gap-1"><Eye className="w-2.5 h-2.5" /> Preview</p>
              {logoType === 'image' && previewImage ? (
                <img src={previewImage} alt="Logo" className="max-h-12 mx-auto object-contain" />
              ) : (
                <div className="logo-3d text-2xl">{previewText}</div>
              )}
            </div>

            <div className="flex gap-1.5 mb-3">
              <button onClick={() => setLogoType('text')} className={`flex-1 px-2 py-1.5 rounded-lg text-[10px] font-medium ${logoType === 'text' ? 'bg-primary text-white' : 'bg-muted border border-border'}`}>Text</button>
              <button onClick={() => setLogoType('image')} className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-medium ${logoType === 'image' ? 'bg-primary text-white' : 'bg-muted border border-border'}`}><Image className="w-3 h-3" /> Image</button>
            </div>

            <div className="space-y-3">
              {logoType === 'text' ? (
                <div>
                  <label className="text-[9px] text-muted-foreground block mb-1">Logo Text</label>
                  <input type="text" value={logoText} onChange={(e) => setLogoText(e.target.value.toUpperCase())} className="w-full px-2.5 py-1.5 bg-muted border border-border rounded-lg text-xs uppercase font-bold" maxLength={15} />
                </div>
              ) : (
                <div>
                  <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleImageSelect} className="hidden" />
                  <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-muted border border-dashed border-border rounded-lg text-[10px] hover:border-primary">
                    <Upload className="w-3.5 h-3.5" /> {previewImage ? 'Change Image' : 'Upload Logo (PNG/JPG)'}
                  </button>
                  {selectedFile && (
                    <p className="text-[9px] text-primary mt-1 text-center">
                      New file selected: {selectedFile.name}
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-1.5">
                <button onClick={handleReset} className="flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-muted border border-border text-muted-foreground font-semibold text-[10px]">
                  <RotateCcw className="w-3 h-3" /> Reset Logo
                </button>
              </div>
            </div>
          </div>

          {/* Coin Icon Customize */}
          <div className="glass-card p-4">
            <h2 className="text-sm font-bold text-primary flex items-center gap-1.5 mb-4">
              <Coins className="w-4 h-4" /> Coin Icon Customize
            </h2>
            <p className="text-[10px] text-muted-foreground mb-3">
              This icon will appear in Live Tracker, Balance display, and other places.
            </p>

            <div className="mb-4 p-4 bg-muted/50 rounded-lg text-center border border-border">
              <p className="text-[9px] text-muted-foreground mb-2 flex items-center justify-center gap-1"><Eye className="w-2.5 h-2.5" /> Preview</p>
              <div className="flex items-center justify-center gap-3">
                {previewIconUrl ? (
                  <img src={previewIconUrl} alt="Coin Icon" className="w-10 h-10 object-contain rounded-lg" />
                ) : (
                  <img src="https://cdn-icons-png.flaticon.com/512/2173/2173478.png" alt="Default Coin" className="w-10 h-10 object-contain" />
                )}
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 border border-white/20 text-sm">
                  {previewIconUrl ? (
                    <img src={previewIconUrl} alt="Coin" className="w-4 h-4 object-contain" />
                  ) : (
                    <img src="https://cdn-icons-png.flaticon.com/512/2173/2173478.png" alt="Coin" className="w-4 h-4" />
                  )}
                  <span className="font-semibold">1,234.50</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <input ref={iconInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleIconSelect} className="hidden" />
                <button onClick={() => iconInputRef.current?.click()} className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-muted border border-dashed border-border rounded-lg text-[10px] hover:border-primary">
                  <Upload className="w-3.5 h-3.5" /> {previewIconUrl ? 'Change Icon' : 'Upload Icon (PNG/JPG)'}
                </button>
                {selectedIconFile && (
                  <p className="text-[9px] text-primary mt-1 text-center">
                    New icon selected: {selectedIconFile.name}
                  </p>
                )}
              </div>

              <button onClick={handleResetIcon} className="w-full flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-muted border border-border text-muted-foreground font-semibold text-[10px]">
                <RotateCcw className="w-3 h-3" /> Reset to Default
              </button>
            </div>
          </div>

          {/* Save Button */}
          <button onClick={handleSave} disabled={isSaving || isUploading || isUploadingIcon} className="w-full flex items-center justify-center gap-1 px-3 py-3 rounded-lg bg-gradient-to-r from-primary to-secondary text-white font-semibold text-sm disabled:opacity-50">
            {isSaving || isUploading || isUploadingIcon ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> {isUploading || isUploadingIcon ? 'Uploading...' : 'Saving...'}</>
            ) : (
              <><Save className="w-4 h-4" /> Save All Changes</>
            )}
          </button>
        </main>
      </div>
    </>
  );
};

export default AdminLogoCustomize;