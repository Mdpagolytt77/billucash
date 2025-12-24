import { useState, useEffect } from 'react';
import { Layers, Menu, Save, RotateCcw, Plus, Trash2, Pencil, Link as LinkIcon, X } from 'lucide-react';
import heroBg from '@/assets/hero-bg.jpg';
import SnowEffect from '@/components/SnowEffect';
import SnowToggle from '@/components/SnowToggle';
import AdminSidebar from '@/components/AdminSidebar';
import { useSnowEffect } from '@/hooks/useSnowEffect';
import { useAuth } from '@/contexts/AuthContext';
import { SiteLogo } from '@/contexts/SiteSettingsContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Offer { id: string; name: string; reward: number; url: string; }
interface Offerwall { id: string; name: string; enabled: boolean; color: string; offers: Offer[]; }

const AdminOfferwallCustomize = () => {
  const { isAdmin } = useAuth();
  const { snowEnabled, toggleSnow } = useSnowEffect();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [offerwalls, setOfferwalls] = useState<Offerwall[]>([
    { id: '1', name: 'Adtowall', enabled: true, color: '#ffb020', offers: [] },
    { id: '2', name: 'Tapjoy', enabled: true, color: '#4a69bd', offers: [] },
    { id: '3', name: 'OfferToro', enabled: true, color: '#2bd96f', offers: [] },
    { id: '4', name: 'Adgate', enabled: false, color: '#ff9a9e', offers: [] },
  ]);
  const [newOfferwall, setNewOfferwall] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [editingWall, setEditingWall] = useState<string | null>(null);
  const [editingOffer, setEditingOffer] = useState<{ wallId: string; offer: Offer } | null>(null);
  const [newOffer, setNewOffer] = useState({ name: '', reward: 0, url: '' });

  useEffect(() => {
    loadSettings();
    const channel = supabase.channel('offerwall-settings-changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'site_settings', filter: 'id=eq.default' }, (payload) => {
        const newData = payload.new as Record<string, unknown>;
        if (newData.offerwall_settings && typeof newData.offerwall_settings === 'object') {
          const offerData = newData.offerwall_settings as Record<string, unknown>;
          if (Array.isArray(offerData.offerwalls)) setOfferwalls(offerData.offerwalls as Offerwall[]);
        }
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const loadSettings = async () => {
    const { data } = await supabase.from('site_settings').select('offerwall_settings').eq('id', 'default').maybeSingle();
    if (data?.offerwall_settings && typeof data.offerwall_settings === 'object') {
      const offerData = data.offerwall_settings as Record<string, unknown>;
      if (Array.isArray(offerData.offerwalls)) setOfferwalls(offerData.offerwalls as Offerwall[]);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase.from('site_settings').update({ offerwall_settings: JSON.parse(JSON.stringify({ offerwalls })), updated_at: new Date().toISOString() }).eq('id', 'default');
      if (error) throw error;
      toast.success('Saved!');
    } catch { toast.error('Failed'); }
    finally { setIsSaving(false); }
  };

  const addOfferwall = () => { if (!newOfferwall.trim()) return; setOfferwalls([...offerwalls, { id: Date.now().toString(), name: newOfferwall, enabled: true, color: '#2bd96f', offers: [] }]); setNewOfferwall(''); };
  const toggleOfferwall = (id: string) => { setOfferwalls(offerwalls.map(o => o.id === id ? { ...o, enabled: !o.enabled } : o)); };
  const removeOfferwall = (id: string) => { setOfferwalls(offerwalls.filter(o => o.id !== id)); };
  const updateWallColor = (id: string, color: string) => { setOfferwalls(offerwalls.map(o => o.id === id ? { ...o, color } : o)); };
  const updateWallName = (id: string, name: string) => { setOfferwalls(offerwalls.map(o => o.id === id ? { ...o, name } : o)); };

  const addOffer = (wallId: string) => {
    if (!newOffer.name.trim() || !newOffer.url.trim()) { toast.error('Fill name & URL'); return; }
    setOfferwalls(offerwalls.map(o => o.id === wallId ? { ...o, offers: [...o.offers, { id: Date.now().toString(), ...newOffer }] } : o));
    setNewOffer({ name: '', reward: 0, url: '' });
    toast.success('Added!');
  };
  const removeOffer = (wallId: string, offerId: string) => { setOfferwalls(offerwalls.map(o => o.id === wallId ? { ...o, offers: o.offers.filter(of => of.id !== offerId) } : o)); };
  const updateOffer = (wallId: string, offerId: string, updates: Partial<Offer>) => { setOfferwalls(offerwalls.map(o => o.id === wallId ? { ...o, offers: o.offers.map(of => of.id === offerId ? { ...of, ...updates } : of) } : o)); };

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
            <span className="text-xs text-muted-foreground">/ Offerwall</span>
          </div>
          <SnowToggle enabled={snowEnabled} onToggle={toggleSnow} />
        </header>

        <main className="p-3 md:px-[5%] max-w-2xl mx-auto">
          <div className="glass-card p-4">
            <h2 className="text-sm font-bold text-primary flex items-center gap-1.5 mb-4"><Layers className="w-4 h-4" /> Offerwall Customize</h2>

            <div className="flex gap-2 mb-4">
              <input type="text" value={newOfferwall} onChange={(e) => setNewOfferwall(e.target.value)} placeholder="Add new..." className="flex-1 px-2.5 py-1.5 bg-muted border border-border rounded-lg text-xs" />
              <button onClick={addOfferwall} className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-medium flex items-center gap-1"><Plus className="w-3 h-3" /> Add</button>
            </div>

            <div className="space-y-3 mb-4 max-h-[55vh] overflow-y-auto">
              {offerwalls.map(o => (
                <div key={o.id} className="p-3 bg-muted/50 rounded-lg border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <input type="color" value={o.color} onChange={(e) => updateWallColor(o.id, e.target.value)} className="w-5 h-5 rounded cursor-pointer border-0" />
                    {editingWall === o.id ? (
                      <input type="text" value={o.name} onChange={(e) => updateWallName(o.id, e.target.value)} onBlur={() => setEditingWall(null)} autoFocus className="flex-1 px-2 py-1 bg-background border border-border rounded text-xs" />
                    ) : (
                      <span className="flex-1 text-xs font-medium cursor-pointer" onClick={() => setEditingWall(o.id)}>{o.name} <Pencil className="w-2.5 h-2.5 inline ml-1 opacity-50" /></span>
                    )}
                    <button onClick={() => toggleOfferwall(o.id)} className={`px-2 py-0.5 rounded text-[9px] font-semibold ${o.enabled ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{o.enabled ? 'ON' : 'OFF'}</button>
                    <button onClick={() => removeOfferwall(o.id)} className="p-1 text-destructive hover:bg-destructive/10 rounded"><Trash2 className="w-3 h-3" /></button>
                  </div>

                  <div className="space-y-1.5 mb-2">
                    {o.offers.map(offer => (
                      <div key={offer.id} className="flex items-center gap-2 p-1.5 bg-background/50 rounded text-[10px]">
                        {editingOffer?.offer.id === offer.id ? (
                          <>
                            <input type="text" value={editingOffer.offer.name} onChange={(e) => setEditingOffer({ ...editingOffer, offer: { ...editingOffer.offer, name: e.target.value } })} className="flex-1 px-1.5 py-0.5 bg-muted border border-border rounded text-[10px]" />
                            <input type="number" value={editingOffer.offer.reward} onChange={(e) => setEditingOffer({ ...editingOffer, offer: { ...editingOffer.offer, reward: Number(e.target.value) } })} className="w-12 px-1.5 py-0.5 bg-muted border border-border rounded text-[10px]" />
                            <button onClick={() => { updateOffer(editingOffer.wallId, offer.id, editingOffer.offer); setEditingOffer(null); }} className="px-1.5 py-0.5 bg-green-500 text-white rounded text-[9px]">Save</button>
                            <button onClick={() => setEditingOffer(null)} className="p-0.5 text-muted-foreground"><X className="w-3 h-3" /></button>
                          </>
                        ) : (
                          <>
                            <span className="flex-1">{offer.name}</span>
                            <span className="text-primary font-medium">${offer.reward}</span>
                            <a href={offer.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary"><LinkIcon className="w-3 h-3" /></a>
                            <button onClick={() => setEditingOffer({ wallId: o.id, offer })} className="p-0.5 text-muted-foreground hover:text-primary"><Pencil className="w-3 h-3" /></button>
                            <button onClick={() => removeOffer(o.id, offer.id)} className="p-0.5 text-destructive"><Trash2 className="w-3 h-3" /></button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5 pt-2 border-t border-border/50">
                    <input type="text" value={newOffer.name} onChange={(e) => setNewOffer({ ...newOffer, name: e.target.value })} placeholder="Offer" className="flex-1 px-2 py-1 bg-background border border-border rounded text-[10px]" />
                    <input type="number" value={newOffer.reward || ''} onChange={(e) => setNewOffer({ ...newOffer, reward: Number(e.target.value) })} placeholder="$" className="w-12 px-2 py-1 bg-background border border-border rounded text-[10px]" />
                    <input type="text" value={newOffer.url} onChange={(e) => setNewOffer({ ...newOffer, url: e.target.value })} placeholder="URL" className="flex-1 px-2 py-1 bg-background border border-border rounded text-[10px]" />
                    <button onClick={() => addOffer(o.id)} className="px-2 py-1 bg-primary text-white rounded text-[9px]"><Plus className="w-3 h-3" /></button>
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

export default AdminOfferwallCustomize;
