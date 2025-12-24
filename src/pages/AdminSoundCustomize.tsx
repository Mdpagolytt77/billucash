import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Volume2, ArrowLeft, Menu, Home, Users, Wallet, Key, LogOut, Save, RotateCcw, VolumeX, FileCheck, Palette, Layers, Image } from 'lucide-react';
import heroBg from '@/assets/hero-bg.jpg';
import SnowEffect from '@/components/SnowEffect';
import SnowToggle from '@/components/SnowToggle';
import { useSnowEffect } from '@/hooks/useSnowEffect';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SoundSettings {
  enabled: boolean;
  clickSound: boolean;
  notificationSound: boolean;
  successSound: boolean;
  volume: number;
}

const AdminSoundCustomize = () => {
  const { isAdmin, signOut } = useAuth();
  const { snowEnabled, toggleSnow } = useSnowEffect();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settings, setSettings] = useState<SoundSettings>({
    enabled: true,
    clickSound: true,
    notificationSound: true,
    successSound: true,
    volume: 70,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const { data } = await supabase
      .from('site_settings')
      .select('sound_settings')
      .eq('id', 'default')
      .maybeSingle();
    
    if (data?.sound_settings && typeof data.sound_settings === 'object') {
      setSettings(prev => ({ ...prev, ...(data.sound_settings as unknown as SoundSettings) }));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('site_settings')
        .update({ sound_settings: JSON.parse(JSON.stringify(settings)), updated_at: new Date().toISOString() })
        .eq('id', 'default');
      
      if (error) throw error;
      toast.success('Sound settings saved!');
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
    { icon: Volume2, label: 'Sound', path: '/admin/sound', active: true },
    { icon: Image, label: 'Background', path: '/admin/background' },
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
            <span className="logo-3d text-xs">Sound</span>
          </div>
          <div className="flex items-center gap-1.5">
            <SnowToggle enabled={snowEnabled} onToggle={toggleSnow} />
            <Link to="/admin" className="p-1.5 hover:bg-muted rounded-lg text-primary"><ArrowLeft className="w-4 h-4" /></Link>
          </div>
        </header>

        <main className="p-3 md:px-[5%] max-w-md mx-auto">
          <div className="glass-card p-4">
            <h2 className="text-sm font-bold text-primary flex items-center gap-1.5 mb-4">
              <Volume2 className="w-4 h-4" /> Sound Customize
            </h2>

            {/* Master Toggle */}
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border mb-4">
              <div className="flex items-center gap-2">
                {settings.enabled ? <Volume2 className="w-4 h-4 text-primary" /> : <VolumeX className="w-4 h-4 text-muted-foreground" />}
                <span className="text-xs font-medium">Sound Effects</span>
              </div>
              <button
                onClick={() => setSettings({ ...settings, enabled: !settings.enabled })}
                className={`px-3 py-1 rounded-full text-[10px] font-semibold ${settings.enabled ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'}`}
              >
                {settings.enabled ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* Volume Slider */}
            <div className="mb-4">
              <label className="text-[10px] text-muted-foreground block mb-2">Volume: {settings.volume}%</label>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.volume}
                onChange={(e) => setSettings({ ...settings, volume: Number(e.target.value) })}
                className="w-full h-1.5 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
              />
            </div>

            {/* Sound Options */}
            <div className="space-y-2 mb-4">
              {[
                { key: 'clickSound', label: 'Click Sound' },
                { key: 'notificationSound', label: 'Notification Sound' },
                { key: 'successSound', label: 'Success Sound' },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                  <span className="text-xs">{label}</span>
                  <button
                    onClick={() => setSettings({ ...settings, [key]: !settings[key as keyof SoundSettings] })}
                    className={`px-2 py-0.5 rounded text-[9px] font-semibold ${settings[key as keyof SoundSettings] ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}
                  >
                    {settings[key as keyof SoundSettings] ? 'ON' : 'OFF'}
                  </button>
                </div>
              ))}
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

export default AdminSoundCustomize;
