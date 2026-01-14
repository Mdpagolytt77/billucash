import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Activity, Play, Pause, Gauge, Hand } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import AdminSidebar from '@/components/AdminSidebar';
import SnowEffect from '@/components/SnowEffect';
import SnowToggle from '@/components/SnowToggle';
import { useSnowEffect } from '@/hooks/useSnowEffect';
import { useAuth } from '@/contexts/AuthContext';
import { SiteLogo } from '@/contexts/SiteSettingsContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import heroBg from '@/assets/hero-bg.jpg';
import { Menu } from 'lucide-react';

interface TrackerSettings {
  enabled: boolean;
  speed: number;
  manualScrollEnabled: boolean;
}

const AdminLiveTrackerCustomize = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const { snowEnabled, toggleSnow } = useSnowEffect();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settings, setSettings] = useState<TrackerSettings>({
    enabled: true,
    speed: 25,
    manualScrollEnabled: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase.rpc('get_public_site_settings');
      if (error) throw error;
      
      if (data && data.length > 0 && data[0].offerwall_settings) {
        const offerwallSettings = data[0].offerwall_settings as any;
        if (offerwallSettings.trackerSettings) {
          setSettings(offerwallSettings.trackerSettings);
        }
      }
    } catch (err) {
      console.error('Failed to load tracker settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      // First get existing offerwall_settings
      const { data: existingData, error: fetchError } = await supabase
        .from('site_settings')
        .select('offerwall_settings')
        .eq('id', 'default')
        .single();
      
      if (fetchError) throw fetchError;
      
      const existingOfferwallSettings = (existingData?.offerwall_settings as any) || {};
      
      // Update with new tracker settings
      const updatedSettings = {
        ...existingOfferwallSettings,
        trackerSettings: settings,
      };
      
      const { error } = await supabase
        .from('site_settings')
        .update({ offerwall_settings: updatedSettings })
        .eq('id', 'default');
      
      if (error) throw error;
      toast.success('Tracker settings saved!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-xl font-bold mb-2">Access Denied</h1>
          <button onClick={() => navigate('/dashboard')} className="text-primary text-sm">Back to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <>
      {snowEnabled && <SnowEffect />}
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div 
        className="min-h-screen"
        style={{
          background: `linear-gradient(rgba(0,0,0,0.85), rgba(0,0,0,0.85)), url(${heroBg}) no-repeat center center fixed`,
          backgroundSize: 'cover',
        }}
      >
        {/* Header */}
        <header className="sticky top-0 z-30 px-3 py-2 bg-background/95 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 hover:bg-muted rounded-lg">
              <Menu className="w-4 h-4" />
            </button>
            <SiteLogo size="sm" />
          </div>
          <SnowToggle enabled={snowEnabled} onToggle={toggleSnow} />
        </header>

        {/* Content */}
        <div className="px-3 md:px-[5%] py-4">
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-4"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Admin Panel
          </button>

          <div className="glass-card p-6 rounded-xl max-w-2xl mx-auto">
            <h1 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5" /> Live Tracker Settings
            </h1>

            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : (
              <div className="space-y-8">
                {/* Auto Scroll Toggle */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border">
                  <div className="flex items-center gap-3">
                    {settings.enabled ? (
                      <Play className="w-5 h-5 text-green-500" />
                    ) : (
                      <Pause className="w-5 h-5 text-muted-foreground" />
                    )}
                    <div>
                      <Label className="text-sm font-medium">Auto Scroll</Label>
                      <p className="text-xs text-muted-foreground">
                        Enable/disable automatic scrolling animation
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.enabled}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enabled: checked }))}
                  />
                </div>

                {/* Speed Slider */}
                <div className="p-4 rounded-lg bg-muted/30 border border-border">
                  <div className="flex items-center gap-3 mb-4">
                    <Gauge className="w-5 h-5 text-primary" />
                    <div>
                      <Label className="text-sm font-medium">Scroll Speed</Label>
                      <p className="text-xs text-muted-foreground">
                        Adjust how fast the tracker scrolls (lower = faster)
                      </p>
                    </div>
                  </div>
                  <div className="px-2">
                    <Slider
                      value={[settings.speed]}
                      onValueChange={(value) => setSettings(prev => ({ ...prev, speed: value[0] }))}
                      min={5}
                      max={60}
                      step={1}
                      disabled={!settings.enabled}
                    />
                    <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                      <span>Fast (5s)</span>
                      <span className="text-primary font-medium">{settings.speed}s</span>
                      <span>Slow (60s)</span>
                    </div>
                  </div>
                </div>

                {/* Manual Scroll Toggle */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border">
                  <div className="flex items-center gap-3">
                    <Hand className="w-5 h-5 text-orange-500" />
                    <div>
                      <Label className="text-sm font-medium">Manual Scroll</Label>
                      <p className="text-xs text-muted-foreground">
                        Allow users to manually scroll the tracker left/right
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.manualScrollEnabled}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, manualScrollEnabled: checked }))}
                  />
                </div>

                {/* Save Button */}
                <button
                  onClick={saveSettings}
                  disabled={isSaving}
                  className="w-full py-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-colors disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminLiveTrackerCustomize;
