import { useState, useEffect } from 'react';
import { Volume2, Menu, Save, RotateCcw, VolumeX, Play } from 'lucide-react';
import heroBg from '@/assets/hero-bg.jpg';
import SnowEffect from '@/components/SnowEffect';
import SnowToggle from '@/components/SnowToggle';
import AdminSidebar from '@/components/AdminSidebar';
import { useSnowEffect } from '@/hooks/useSnowEffect';
import { useAuth } from '@/contexts/AuthContext';
import { SiteLogo } from '@/contexts/SiteSettingsContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SoundSettings { enabled: boolean; loginSound: boolean; signupSound: boolean; balanceSound: boolean; volume: number; }

const SOUND_URLS = {
  login: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
  signup: 'https://assets.mixkit.co/active_storage/sfx/2867/2867-preview.mp3',
  balance: 'https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3',
};

const AdminSoundCustomize = () => {
  const { isAdmin } = useAuth();
  const { snowEnabled, toggleSnow } = useSnowEffect();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settings, setSettings] = useState<SoundSettings>({ enabled: true, loginSound: true, signupSound: true, balanceSound: true, volume: 70 });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    const { data } = await supabase.from('site_settings').select('sound_settings').eq('id', 'default').maybeSingle();
    if (data?.sound_settings && typeof data.sound_settings === 'object') {
      const soundData = data.sound_settings as Record<string, unknown>;
      setSettings(prev => ({
        ...prev,
        enabled: soundData.enabled !== undefined ? Boolean(soundData.enabled) : prev.enabled,
        loginSound: soundData.loginSound !== undefined ? Boolean(soundData.loginSound) : prev.loginSound,
        signupSound: soundData.signupSound !== undefined ? Boolean(soundData.signupSound) : prev.signupSound,
        balanceSound: soundData.balanceSound !== undefined ? Boolean(soundData.balanceSound) : prev.balanceSound,
        volume: typeof soundData.volume === 'number' ? soundData.volume : prev.volume,
      }));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase.from('site_settings').update({ sound_settings: JSON.parse(JSON.stringify(settings)), updated_at: new Date().toISOString() }).eq('id', 'default');
      if (error) throw error;
      toast.success('Saved!');
    } catch { toast.error('Failed'); }
    finally { setIsSaving(false); }
  };

  const playTestSound = (type: 'login' | 'signup' | 'balance') => {
    const audio = new Audio(SOUND_URLS[type]);
    audio.volume = settings.volume / 100;
    audio.play().catch(err => console.log('Audio prevented:', err));
  };

  if (!isAdmin) return <div className="min-h-screen flex items-center justify-center text-xs">Access Denied</div>;

  return (
    <>
      {snowEnabled && <SnowEffect />}
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="min-h-screen" style={{ background: `linear-gradient(rgba(0,0,0,0.85), rgba(0,0,0,0.85)), url(${heroBg}) no-repeat center center fixed`, backgroundSize: 'cover' }}>
        <header className="sticky top-0 z-30 px-3 py-2 bg-background/95 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 hover:bg-muted rounded-lg"><Menu className="w-4 h-4" /></button>
            <SiteLogo size="sm" />
            <span className="text-xs text-muted-foreground">/ Sound</span>
          </div>
          <SnowToggle enabled={snowEnabled} onToggle={toggleSnow} />
        </header>

        <main className="p-3 md:px-[5%] max-w-md mx-auto">
          <div className="glass-card p-4">
            <h2 className="text-sm font-bold text-primary flex items-center gap-1.5 mb-4"><Volume2 className="w-4 h-4" /> Sound Customize</h2>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border mb-4">
              <div className="flex items-center gap-2">
                {settings.enabled ? <Volume2 className="w-4 h-4 text-primary" /> : <VolumeX className="w-4 h-4 text-muted-foreground" />}
                <span className="text-xs font-medium">Sound Effects</span>
              </div>
              <button onClick={() => setSettings({ ...settings, enabled: !settings.enabled })} className={`px-3 py-1 rounded-full text-[10px] font-semibold ${settings.enabled ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                {settings.enabled ? 'ON' : 'OFF'}
              </button>
            </div>

            <div className="mb-4">
              <label className="text-[10px] text-muted-foreground block mb-2">Volume: {settings.volume}%</label>
              <input type="range" min="0" max="100" value={settings.volume} onChange={(e) => setSettings({ ...settings, volume: Number(e.target.value) })} className="w-full h-1.5 bg-muted rounded-full accent-primary" />
            </div>

            <div className="space-y-2 mb-4">
              {[
                { key: 'loginSound', label: 'Login Sound', soundKey: 'login' as const },
                { key: 'signupSound', label: 'Signup Sound', soundKey: 'signup' as const },
                { key: 'balanceSound', label: 'Balance Sound (Coin)', soundKey: 'balance' as const },
              ].map(({ key, label, soundKey }) => (
                <div key={key} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                  <span className="text-xs">{label}</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => playTestSound(soundKey)} className="p-1 text-primary hover:bg-primary/10 rounded" title="Test"><Play className="w-3 h-3" /></button>
                    <button onClick={() => setSettings({ ...settings, [key]: !settings[key as keyof SoundSettings] })} className={`px-2 py-0.5 rounded text-[9px] font-semibold ${settings[key as keyof SoundSettings] ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {settings[key as keyof SoundSettings] ? 'ON' : 'OFF'}
                    </button>
                  </div>
                </div>
              ))}
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

export default AdminSoundCustomize;
