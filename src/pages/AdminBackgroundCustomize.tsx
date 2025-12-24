import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ImageIcon, ArrowLeft, Menu, Home, Users, Wallet, Key, LogOut, Save, RotateCcw, Upload, FileCheck, Palette, Layers, Volume2 } from 'lucide-react';
import heroBg from '@/assets/hero-bg.jpg';
import SnowEffect from '@/components/SnowEffect';
import SnowToggle from '@/components/SnowToggle';
import { useSnowEffect } from '@/hooks/useSnowEffect';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BackgroundSettings {
  type: 'default' | 'color' | 'gradient' | 'image';
  color: string;
  gradient: string;
  imageUrl: string;
  overlay: number;
}

const presetGradients = [
  'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
  'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
  'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
  'linear-gradient(135deg, #134e5e 0%, #71b280 100%)',
  'linear-gradient(135deg, #232526 0%, #414345 100%)',
  'linear-gradient(135deg, #1d2b64 0%, #f8cdda 100%)',
];

const AdminBackgroundCustomize = () => {
  const { isAdmin, signOut } = useAuth();
  const { snowEnabled, toggleSnow } = useSnowEffect();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settings, setSettings] = useState<BackgroundSettings>({
    type: 'default',
    color: '#0f1220',
    gradient: presetGradients[0],
    imageUrl: '',
    overlay: 85,
  });
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const { data } = await supabase
      .from('site_settings')
      .select('background_settings')
      .eq('id', 'default')
      .maybeSingle();
    
    if (data?.background_settings && typeof data.background_settings === 'object') {
      setSettings(prev => ({ ...prev, ...(data.background_settings as unknown as BackgroundSettings) }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image must be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setSettings({ ...settings, imageUrl: event.target?.result as string, type: 'image' });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('site_settings')
        .update({ background_settings: JSON.parse(JSON.stringify(settings)), updated_at: new Date().toISOString() })
        .eq('id', 'default');
      
      if (error) throw error;
      toast.success('Background settings saved!');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const sidebarItems = [
    { icon: Home, label: 'Dashboard', path: '/admin' },
    { icon: Users, label: 'All Users', path: '/admin/users' },
    { icon: Wallet, label: 'Withdraw', path: '/admin/withdraw' },
    { icon: FileCheck, label: 'Completed Offers', path: '/admin/offers' },
    { icon: Palette, label: 'Logo Customize', path: '/admin/logo' },
    { icon: Layers, label: 'Offerwall', path: '/admin/offerwall' },
    { icon: Volume2, label: 'Sound', path: '/admin/sound' },
    { icon: ImageIcon, label: 'Background', path: '/admin/background', active: true },
    { icon: Key, label: 'Password Reset', path: '/admin/password' },
  ];

  if (!isAdmin) return <div className="min-h-screen flex items-center justify-center text-xs">Access Denied</div>;

  return (
    <>
      {snowEnabled && <SnowEffect />}
      <div className={`fixed inset-0 bg-black/70 z-40 transition-opacity ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setSidebarOpen(false)} />

      <aside className={`fixed top-0 left-0 h-full w-48 bg-background border-r border-border z-50 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-3 pt-14">
          <div className="text-center mb-4 pb-3 border-b border-border">
            <div className="logo-3d text-sm">BILLUCASH</div>
          </div>
          <nav className="space-y-0.5">
            {sidebarItems.map((item, i) => (
              <Link key={i} to={item.path} onClick={() => setSidebarOpen(false)}
                className={`w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] transition-colors ${
                  item.active ? 'bg-primary/20 text-primary font-medium' : 'hover:bg-muted text-muted-foreground'
                }`}
              >
                <item.icon className="w-3 h-3" /> {item.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-border mt-2">
              <button onClick={() => signOut()} className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-destructive hover:bg-destructive/10 text-[10px]">
                <LogOut className="w-3 h-3" /> Logout
              </button>
            </div>
          </nav>
        </div>
      </aside>

      <div className="min-h-screen" style={{ background: `linear-gradient(rgba(0,0,0,0.85), rgba(0,0,0,0.85)), url(${heroBg}) no-repeat center center fixed`, backgroundSize: 'cover' }}>
        <header className="sticky top-0 z-30 px-3 py-2 bg-background/95 backdrop-blur-lg border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 hover:bg-muted rounded-lg"><Menu className="w-4 h-4" /></button>
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center font-bold text-[10px]">B</div>
            <span className="logo-3d text-xs">Background</span>
          </div>
          <div className="flex items-center gap-1.5">
            <SnowToggle enabled={snowEnabled} onToggle={toggleSnow} />
            <Link to="/admin" className="p-1.5 hover:bg-muted rounded-lg text-primary"><ArrowLeft className="w-4 h-4" /></Link>
          </div>
        </header>

        <main className="p-3 md:px-[5%] max-w-md mx-auto">
          <div className="glass-card p-4">
            <h2 className="text-sm font-bold text-primary flex items-center gap-1.5 mb-4">
              <ImageIcon className="w-4 h-4" /> Background Customize
            </h2>

            {/* Type Selection */}
            <div className="grid grid-cols-4 gap-1.5 mb-4">
              {(['default', 'color', 'gradient', 'image'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setSettings({ ...settings, type })}
                  className={`px-2 py-1.5 rounded-lg text-[9px] font-medium capitalize ${
                    settings.type === type ? 'bg-primary text-white' : 'bg-muted border border-border'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* Color Picker */}
            {settings.type === 'color' && (
              <div className="mb-4">
                <label className="text-[10px] text-muted-foreground block mb-1">Background Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={settings.color}
                    onChange={(e) => setSettings({ ...settings, color: e.target.value })}
                    className="w-10 h-8 rounded border-0 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settings.color}
                    onChange={(e) => setSettings({ ...settings, color: e.target.value })}
                    className="flex-1 px-2 py-1 bg-muted border border-border rounded text-xs"
                  />
                </div>
              </div>
            )}

            {/* Gradient Presets */}
            {settings.type === 'gradient' && (
              <div className="mb-4">
                <label className="text-[10px] text-muted-foreground block mb-1">Select Gradient</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {presetGradients.map((g, i) => (
                    <button
                      key={i}
                      onClick={() => setSettings({ ...settings, gradient: g })}
                      className={`h-10 rounded-lg border-2 ${settings.gradient === g ? 'border-primary' : 'border-transparent'}`}
                      style={{ background: g }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Image Upload */}
            {settings.type === 'image' && (
              <div className="mb-4">
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-3 bg-muted border border-dashed border-border rounded-lg text-[10px] hover:border-primary"
                >
                  <Upload className="w-4 h-4" />
                  {settings.imageUrl ? 'Change Image' : 'Upload Image'}
                </button>
                {settings.imageUrl && (
                  <div className="mt-2 rounded-lg overflow-hidden h-20">
                    <img src={settings.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            )}

            {/* Overlay Slider */}
            <div className="mb-4">
              <label className="text-[10px] text-muted-foreground block mb-1">Overlay Darkness: {settings.overlay}%</label>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.overlay}
                onChange={(e) => setSettings({ ...settings, overlay: Number(e.target.value) })}
                className="w-full h-1.5 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
              />
            </div>

            <div className="flex gap-1.5">
              <button onClick={handleSave} disabled={isSaving}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-gradient-to-r from-primary to-secondary text-white font-semibold text-[10px] disabled:opacity-50">
                <Save className="w-3 h-3" /> {isSaving ? 'Saving...' : 'Save'}
              </button>
              <button onClick={loadSettings}
                className="flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-muted border border-border text-muted-foreground font-semibold text-[10px]">
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default AdminBackgroundCustomize;
