import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layers, ArrowLeft, Menu, Home, Users, Wallet, Key, LogOut, Save, RotateCcw, Plus, Trash2, FileCheck, Palette, Volume2, Image } from 'lucide-react';
import heroBg from '@/assets/hero-bg.jpg';
import SnowEffect from '@/components/SnowEffect';
import SnowToggle from '@/components/SnowToggle';
import { useSnowEffect } from '@/hooks/useSnowEffect';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Offerwall {
  id: string;
  name: string;
  enabled: boolean;
  color: string;
}

const AdminOfferwallCustomize = () => {
  const { isAdmin, signOut } = useAuth();
  const { snowEnabled, toggleSnow } = useSnowEffect();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [offerwalls, setOfferwalls] = useState<Offerwall[]>([
    { id: '1', name: 'Adtowall', enabled: true, color: '#ffb020' },
    { id: '2', name: 'Tapjoy', enabled: true, color: '#4a69bd' },
    { id: '3', name: 'OfferToro', enabled: true, color: '#2bd96f' },
    { id: '4', name: 'Adgate', enabled: false, color: '#ff9a9e' },
  ]);
  const [newOfferwall, setNewOfferwall] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const { data } = await supabase
      .from('site_settings')
      .select('offerwall_settings')
      .eq('id', 'default')
      .maybeSingle();
    
    if (data?.offerwall_settings && Array.isArray((data.offerwall_settings as any).offerwalls)) {
      setOfferwalls((data.offerwall_settings as any).offerwalls);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('site_settings')
        .update({ offerwall_settings: JSON.parse(JSON.stringify({ offerwalls })), updated_at: new Date().toISOString() })
        .eq('id', 'default');
      
      if (error) throw error;
      toast.success('Offerwall settings saved!');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const addOfferwall = () => {
    if (!newOfferwall.trim()) return;
    setOfferwalls([...offerwalls, { id: Date.now().toString(), name: newOfferwall, enabled: true, color: '#2bd96f' }]);
    setNewOfferwall('');
  };

  const toggleOfferwall = (id: string) => {
    setOfferwalls(offerwalls.map(o => o.id === id ? { ...o, enabled: !o.enabled } : o));
  };

  const removeOfferwall = (id: string) => {
    setOfferwalls(offerwalls.filter(o => o.id !== id));
  };

  const sidebarItems = [
    { icon: Home, label: 'Dashboard', path: '/admin' },
    { icon: Users, label: 'All Users', path: '/admin/users' },
    { icon: Wallet, label: 'Withdraw', path: '/admin/withdraw' },
    { icon: FileCheck, label: 'Completed Offers', path: '/admin/offers' },
    { icon: Palette, label: 'Logo Customize', path: '/admin/logo' },
    { icon: Layers, label: 'Offerwall', path: '/admin/offerwall', active: true },
    { icon: Volume2, label: 'Sound', path: '/admin/sound' },
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
            <span className="logo-3d text-xs">Offerwall</span>
          </div>
          <div className="flex items-center gap-1.5">
            <SnowToggle enabled={snowEnabled} onToggle={toggleSnow} />
            <Link to="/admin" className="p-1.5 hover:bg-muted rounded-lg text-primary"><ArrowLeft className="w-4 h-4" /></Link>
          </div>
        </header>

        <main className="p-3 md:px-[5%] max-w-lg mx-auto">
          <div className="glass-card p-4">
            <h2 className="text-sm font-bold text-primary flex items-center gap-1.5 mb-4">
              <Layers className="w-4 h-4" /> Offerwall Customize
            </h2>

            {/* Add New */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newOfferwall}
                onChange={(e) => setNewOfferwall(e.target.value)}
                placeholder="Add new offerwall..."
                className="flex-1 px-2.5 py-1.5 bg-muted border border-border rounded-lg text-xs"
              />
              <button onClick={addOfferwall} className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-medium flex items-center gap-1">
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>

            {/* Offerwalls List */}
            <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
              {offerwalls.map(o => (
                <div key={o.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg border border-border">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: o.color }} />
                  <span className="flex-1 text-xs font-medium">{o.name}</span>
                  <button
                    onClick={() => toggleOfferwall(o.id)}
                    className={`px-2 py-0.5 rounded text-[9px] font-semibold ${o.enabled ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}
                  >
                    {o.enabled ? 'ON' : 'OFF'}
                  </button>
                  <button onClick={() => removeOfferwall(o.id)} className="p-1 text-destructive hover:bg-destructive/10 rounded">
                    <Trash2 className="w-3 h-3" />
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

export default AdminOfferwallCustomize;
