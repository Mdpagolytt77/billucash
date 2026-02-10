import { useState, useEffect, useRef } from 'react';
import { ImageIcon, Menu, Save, RotateCcw, Upload, LinkIcon } from 'lucide-react';
import heroBg from '@/assets/hero-bg.jpg';
import SnowEffect from '@/components/SnowEffect';
import SnowToggle from '@/components/SnowToggle';
import AdminSidebar from '@/components/AdminSidebar';
import { useSnowEffect } from '@/hooks/useSnowEffect';
import { useAuth } from '@/contexts/AuthContext';
import { SiteLogo } from '@/contexts/SiteSettingsContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BackgroundSettings { type: 'default' | 'color' | 'gradient' | 'image'; color: string; gradient: string; imageUrl: string; overlay: number; }

const presetGradients = [
  'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
  'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
  'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
  'linear-gradient(135deg, #134e5e 0%, #71b280 100%)',
  'linear-gradient(135deg, #232526 0%, #414345 100%)',
  'linear-gradient(135deg, #1d2b64 0%, #f8cdda 100%)',
];

const AdminBackgroundCustomize = () => {
  const { isAdmin, isModerator } = useAuth();
  const canAccess = isAdmin || isModerator;
  const { snowEnabled, toggleSnow } = useSnowEffect();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settings, setSettings] = useState<BackgroundSettings>({ type: 'default', color: '#0f1220', gradient: presetGradients[0], imageUrl: '', overlay: 85 });
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    const { data } = await supabase.from('site_settings').select('background_settings').eq('id', 'default').maybeSingle();
    if (data?.background_settings && typeof data.background_settings === 'object') {
      const bgData = data.background_settings as Record<string, unknown>;
      setSettings(prev => ({
        ...prev,
        type: (bgData.type as BackgroundSettings['type']) || prev.type,
        color: (bgData.color as string) || prev.color,
        gradient: (bgData.gradient as string) || prev.gradient,
        imageUrl: (bgData.imageUrl as string) || prev.imageUrl,
        overlay: typeof bgData.overlay === 'number' ? bgData.overlay : prev.overlay,
      }));
      if (bgData.imageUrl) setImageUrlInput(bgData.imageUrl as string);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { toast.error('Max 2MB'); return; }
      const reader = new FileReader();
      reader.onload = (event) => { const url = event.target?.result as string; setSettings({ ...settings, imageUrl: url, type: 'image' }); setImageUrlInput(url); };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUrlApply = () => { if (!imageUrlInput.trim()) { toast.error('Enter URL'); return; } setSettings({ ...settings, imageUrl: imageUrlInput, type: 'image' }); toast.success('Applied!'); };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase.from('site_settings').update({ background_settings: JSON.parse(JSON.stringify(settings)), updated_at: new Date().toISOString() }).eq('id', 'default');
      if (error) throw error;
      toast.success('Saved!');
    } catch { toast.error('Failed'); }
    finally { setIsSaving(false); }
  };

  if (!canAccess) return <div className="min-h-screen flex items-center justify-center text-xs">Access Denied</div>;

  return (
    <>
      {snowEnabled && <SnowEffect />}
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="min-h-screen" style={{ background: `linear-gradient(rgba(0,0,0,0.85), rgba(0,0,0,0.85)), url(${heroBg}) no-repeat center center fixed`, backgroundSize: 'cover' }}>
        <header className="sticky top-0 z-30 px-3 py-2 bg-background/95 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 hover:bg-muted rounded-lg"><Menu className="w-4 h-4" /></button>
            <SiteLogo size="sm" />
            <span className="text-xs text-muted-foreground">/ Background</span>
          </div>
          <SnowToggle enabled={snowEnabled} onToggle={toggleSnow} />
        </header>

        <main className="p-3 md:px-[5%] max-w-md mx-auto">
          <div className="glass-card p-4">
            <h2 className="text-sm font-bold text-primary flex items-center gap-1.5 mb-4"><ImageIcon className="w-4 h-4" /> Background Customize</h2>

            <div className="grid grid-cols-4 gap-1.5 mb-4">
              {(['default', 'color', 'gradient', 'image'] as const).map(type => (
                <button key={type} onClick={() => setSettings({ ...settings, type })} className={`px-2 py-1.5 rounded-lg text-[9px] font-medium capitalize ${settings.type === type ? 'bg-primary text-white' : 'bg-muted border border-border'}`}>{type}</button>
              ))}
            </div>

            {settings.type === 'color' && (
              <div className="mb-4">
                <label className="text-[10px] text-muted-foreground block mb-1">Color</label>
                <div className="flex gap-2">
                  <input type="color" value={settings.color} onChange={(e) => setSettings({ ...settings, color: e.target.value })} className="w-10 h-8 rounded border-0" />
                  <input type="text" value={settings.color} onChange={(e) => setSettings({ ...settings, color: e.target.value })} className="flex-1 px-2 py-1 bg-muted border border-border rounded text-xs" />
                </div>
              </div>
            )}

            {settings.type === 'gradient' && (
              <div className="mb-4">
                <label className="text-[10px] text-muted-foreground block mb-1">Select Gradient</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {presetGradients.map((g, i) => (
                    <button key={i} onClick={() => setSettings({ ...settings, gradient: g })} className={`h-10 rounded-lg border-2 ${settings.gradient === g ? 'border-primary' : 'border-transparent'}`} style={{ background: g }} />
                  ))}
                </div>
              </div>
            )}

            {settings.type === 'image' && (
              <div className="mb-4 space-y-3">
                <div>
                  <label className="text-[10px] text-muted-foreground block mb-1">Image URL</label>
                  <div className="flex gap-1.5">
                    <input type="text" value={imageUrlInput} onChange={(e) => setImageUrlInput(e.target.value)} placeholder="https://..." className="flex-1 px-2 py-1.5 bg-muted border border-border rounded text-xs" />
                    <button onClick={handleImageUrlApply} className="px-2 py-1.5 bg-primary text-white rounded text-[10px] flex items-center gap-1"><LinkIcon className="w-3 h-3" /> Apply</button>
                  </div>
                </div>
                <div className="flex items-center gap-2"><div className="flex-1 h-px bg-border" /><span className="text-[9px] text-muted-foreground">OR</span><div className="flex-1 h-px bg-border" /></div>
                <div>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center gap-1.5 px-3 py-3 bg-muted border border-dashed border-border rounded-lg text-[10px] hover:border-primary"><Upload className="w-4 h-4" /> Upload</button>
                </div>
                {settings.imageUrl && <div className="rounded-lg overflow-hidden h-16"><img src={settings.imageUrl} alt="Preview" className="w-full h-full object-cover" /></div>}
              </div>
            )}

            <div className="mb-4">
              <label className="text-[10px] text-muted-foreground block mb-1">Overlay: {settings.overlay}%</label>
              <input type="range" min="0" max="100" value={settings.overlay} onChange={(e) => setSettings({ ...settings, overlay: Number(e.target.value) })} className="w-full h-1.5 bg-muted rounded-full accent-primary" />
            </div>

            <div className="flex gap-1.5">
              <button onClick={handleSave} disabled={isSaving} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-gradient-to-r from-primary to-secondary text-white font-semibold text-[10px] disabled:opacity-50"><Save className="w-3 h-3" /> {isSaving ? 'Saving...' : 'Save'}</button>
              <button onClick={loadSettings} className="flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-muted border border-border text-muted-foreground font-semibold text-[10px]"><RotateCcw className="w-3 h-3" /> Reset</button>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default AdminBackgroundCustomize;
