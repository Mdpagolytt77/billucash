import { useState, useEffect } from 'react';
import { Layers, Menu, Save, RotateCcw, Plus, Trash2, Pencil, Link as LinkIcon, X, Key, Globe, Hash, Shield, Eye, EyeOff } from 'lucide-react';
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

// Provider-specific credential types
type OfferwallProvider = 'adgem' | 'offertoro' | 'adgate' | 'wannads' | 'custom';

interface OfferwallCredentials {
  // AdGem
  appId?: string;
  apiKey?: string;
  postbackUrl?: string;
  // OfferToro
  publicKey?: string;
  secretKey?: string;
  // AdGate
  publisherId?: string;
  campaignId?: string;
  // Wannads
  hashKey?: string;
}

interface Offerwall {
  id: string;
  name: string;
  enabled: boolean;
  color: string;
  provider: OfferwallProvider;
  credentials: OfferwallCredentials;
  iframeUrl: string;
  offers: Offer[];
}

const PROVIDER_FIELDS: Record<OfferwallProvider, { key: keyof OfferwallCredentials; label: string; placeholder: string; secret?: boolean }[]> = {
  adgem: [
    { key: 'appId', label: 'App ID', placeholder: 'Enter App ID...' },
    { key: 'apiKey', label: 'API Key', placeholder: 'Enter API Key...', secret: true },
    { key: 'postbackUrl', label: 'Postback URL', placeholder: 'https://your-postback-url...' },
  ],
  offertoro: [
    { key: 'publicKey', label: 'Public Key', placeholder: 'Enter Public Key...' },
    { key: 'secretKey', label: 'Secret Key', placeholder: 'Enter Secret Key...', secret: true },
    { key: 'appId', label: 'App ID', placeholder: 'Enter App ID...' },
  ],
  adgate: [
    { key: 'apiKey', label: 'API Key', placeholder: 'Enter API Key...', secret: true },
    { key: 'publisherId', label: 'Publisher ID', placeholder: 'Enter Publisher ID...' },
    { key: 'campaignId', label: 'Campaign ID', placeholder: 'Enter Campaign ID...' },
  ],
  wannads: [
    { key: 'apiKey', label: 'API Key', placeholder: 'Enter API Key...', secret: true },
    { key: 'hashKey', label: 'Hash Key (Security)', placeholder: 'Enter Hash Key...', secret: true },
  ],
  custom: [
    { key: 'apiKey', label: 'API Key', placeholder: 'Enter API Key...', secret: true },
  ],
};

const PROVIDER_OPTIONS: { value: OfferwallProvider; label: string }[] = [
  { value: 'adgem', label: 'AdGem' },
  { value: 'offertoro', label: 'OfferToro' },
  { value: 'adgate', label: 'AdGate' },
  { value: 'wannads', label: 'Wannads' },
  { value: 'custom', label: 'Custom' },
];

const AdminOfferwallCustomize = () => {
  const { isAdmin } = useAuth();
  const { snowEnabled, toggleSnow } = useSnowEffect();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [offerwalls, setOfferwalls] = useState<Offerwall[]>([
    { id: '1', name: 'AdGem', enabled: true, color: '#ffb020', provider: 'adgem', credentials: {}, iframeUrl: '', offers: [] },
    { id: '2', name: 'OfferToro', enabled: true, color: '#2bd96f', provider: 'offertoro', credentials: {}, iframeUrl: '', offers: [] },
    { id: '3', name: 'AdGate', enabled: false, color: '#4a69bd', provider: 'adgate', credentials: {}, iframeUrl: '', offers: [] },
    { id: '4', name: 'Wannads', enabled: false, color: '#ff9a9e', provider: 'wannads', credentials: {}, iframeUrl: '', offers: [] },
  ]);
  const [newOfferwall, setNewOfferwall] = useState('');
  const [newProvider, setNewProvider] = useState<OfferwallProvider>('custom');
  const [isSaving, setIsSaving] = useState(false);
  const [editingWall, setEditingWall] = useState<string | null>(null);
  const [editingOffer, setEditingOffer] = useState<{ wallId: string; offer: Offer } | null>(null);
  const [newOffer, setNewOffer] = useState({ name: '', reward: 0, url: '' });
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadSettings();
    const channel = supabase.channel('offerwall-settings-changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'site_settings', filter: 'id=eq.default' }, (payload) => {
        const newData = payload.new as Record<string, unknown>;
        if (newData.offerwall_settings && typeof newData.offerwall_settings === 'object') {
          const offerData = newData.offerwall_settings as Record<string, unknown>;
          if (Array.isArray(offerData.offerwalls)) {
            const walls = offerData.offerwalls as Offerwall[];
            // Migrate old format to new format
            setOfferwalls(walls.map(w => ({
              ...w,
              provider: w.provider || 'custom',
              credentials: w.credentials || { apiKey: (w as any).apiKey || '' },
            })));
          }
        }
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const loadSettings = async () => {
    const { data } = await supabase.from('site_settings').select('offerwall_settings').eq('id', 'default').maybeSingle();
    if (data?.offerwall_settings && typeof data.offerwall_settings === 'object') {
      const offerData = data.offerwall_settings as Record<string, unknown>;
      if (Array.isArray(offerData.offerwalls)) {
        const walls = offerData.offerwalls as Offerwall[];
        // Migrate old format to new format
        setOfferwalls(walls.map(w => ({
          ...w,
          provider: w.provider || 'custom',
          credentials: w.credentials || { apiKey: (w as any).apiKey || '' },
        })));
      }
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

  const addOfferwall = () => {
    if (!newOfferwall.trim()) return;
    setOfferwalls([...offerwalls, {
      id: Date.now().toString(),
      name: newOfferwall,
      enabled: true,
      color: '#2bd96f',
      provider: newProvider,
      credentials: {},
      iframeUrl: '',
      offers: []
    }]);
    setNewOfferwall('');
    setNewProvider('custom');
  };

  const toggleOfferwall = (id: string) => { setOfferwalls(offerwalls.map(o => o.id === id ? { ...o, enabled: !o.enabled } : o)); };
  const removeOfferwall = (id: string) => { setOfferwalls(offerwalls.filter(o => o.id !== id)); };
  const updateWallColor = (id: string, color: string) => { setOfferwalls(offerwalls.map(o => o.id === id ? { ...o, color } : o)); };
  const updateWallName = (id: string, name: string) => { setOfferwalls(offerwalls.map(o => o.id === id ? { ...o, name } : o)); };
  const updateWallProvider = (id: string, provider: OfferwallProvider) => { setOfferwalls(offerwalls.map(o => o.id === id ? { ...o, provider, credentials: {} } : o)); };
  const updateWallCredential = (id: string, key: keyof OfferwallCredentials, value: string) => {
    setOfferwalls(offerwalls.map(o => o.id === id ? { ...o, credentials: { ...o.credentials, [key]: value } } : o));
  };
  const updateWallIframeUrl = (id: string, iframeUrl: string) => { setOfferwalls(offerwalls.map(o => o.id === id ? { ...o, iframeUrl } : o)); };

  const addOffer = (wallId: string) => {
    if (!newOffer.name.trim() || !newOffer.url.trim()) { toast.error('Fill name & URL'); return; }
    setOfferwalls(offerwalls.map(o => o.id === wallId ? { ...o, offers: [...o.offers, { id: Date.now().toString(), ...newOffer }] } : o));
    setNewOffer({ name: '', reward: 0, url: '' });
    toast.success('Added!');
  };
  const removeOffer = (wallId: string, offerId: string) => { setOfferwalls(offerwalls.map(o => o.id === wallId ? { ...o, offers: o.offers.filter(of => of.id !== offerId) } : o)); };
  const updateOffer = (wallId: string, offerId: string, updates: Partial<Offer>) => { setOfferwalls(offerwalls.map(o => o.id === wallId ? { ...o, offers: o.offers.map(of => of.id === offerId ? { ...of, ...updates } : of) } : o)); };

  const toggleSecretVisibility = (fieldKey: string) => {
    setShowSecrets(prev => ({ ...prev, [fieldKey]: !prev[fieldKey] }));
  };

  const getFieldIcon = (key: keyof OfferwallCredentials) => {
    if (key === 'apiKey' || key === 'secretKey' || key === 'hashKey') return <Key className="w-3 h-3" />;
    if (key === 'postbackUrl') return <Globe className="w-3 h-3" />;
    if (key === 'publicKey') return <Shield className="w-3 h-3" />;
    return <Hash className="w-3 h-3" />;
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
            <span className="text-xs text-muted-foreground">/ Offerwall</span>
          </div>
          <SnowToggle enabled={snowEnabled} onToggle={toggleSnow} />
        </header>

        <main className="p-3 md:px-[5%] max-w-2xl mx-auto">
          <div className="glass-card p-4">
            <h2 className="text-sm font-bold text-primary flex items-center gap-1.5 mb-4"><Layers className="w-4 h-4" /> Offerwall Customize</h2>

            {/* Add new offerwall */}
            <div className="flex gap-2 mb-4">
              <input type="text" value={newOfferwall} onChange={(e) => setNewOfferwall(e.target.value)} placeholder="Name..." className="flex-1 px-2.5 py-1.5 bg-muted border border-border rounded-lg text-xs" />
              <select value={newProvider} onChange={(e) => setNewProvider(e.target.value as OfferwallProvider)} className="px-2 py-1.5 bg-muted border border-border rounded-lg text-xs">
                {PROVIDER_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
              <button onClick={addOfferwall} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium flex items-center gap-1"><Plus className="w-3 h-3" /> Add</button>
            </div>

            <div className="space-y-3 mb-4 max-h-[55vh] overflow-y-auto">
              {offerwalls.map(o => (
                <div key={o.id} className="p-3 bg-muted/50 rounded-lg border border-border">
                  {/* Header row */}
                  <div className="flex items-center gap-2 mb-2">
                    <input type="color" value={o.color} onChange={(e) => updateWallColor(o.id, e.target.value)} className="w-5 h-5 rounded cursor-pointer border-0" />
                    {editingWall === o.id ? (
                      <input type="text" value={o.name} onChange={(e) => updateWallName(o.id, e.target.value)} onBlur={() => setEditingWall(null)} autoFocus className="flex-1 px-2 py-1 bg-background border border-border rounded text-xs" />
                    ) : (
                      <span className="flex-1 text-xs font-medium cursor-pointer" onClick={() => setEditingWall(o.id)}>{o.name} <Pencil className="w-2.5 h-2.5 inline ml-1 opacity-50" /></span>
                    )}
                    <select value={o.provider} onChange={(e) => updateWallProvider(o.id, e.target.value as OfferwallProvider)} className="px-1.5 py-0.5 bg-background border border-border rounded text-[9px]">
                      {PROVIDER_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </select>
                    <button onClick={() => toggleOfferwall(o.id)} className={`px-2 py-0.5 rounded text-[9px] font-semibold ${o.enabled ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{o.enabled ? 'ON' : 'OFF'}</button>
                    <button onClick={() => removeOfferwall(o.id)} className="p-1 text-destructive hover:bg-destructive/10 rounded"><Trash2 className="w-3 h-3" /></button>
                  </div>

                  {/* Provider-specific credential fields */}
                  <div className="space-y-1.5 mb-2 p-2 bg-background/30 rounded-lg border border-border/50">
                    <div className="text-[9px] text-muted-foreground mb-1.5 flex items-center gap-1">
                      <Key className="w-3 h-3" />
                      {PROVIDER_OPTIONS.find(p => p.value === o.provider)?.label} Credentials
                    </div>
                    {PROVIDER_FIELDS[o.provider].map(field => {
                      const fieldKey = `${o.id}-${field.key}`;
                      const isSecret = field.secret;
                      const isVisible = showSecrets[fieldKey];
                      return (
                        <div key={field.key} className="flex items-center gap-2">
                          <span className="text-[9px] text-muted-foreground w-20 flex items-center gap-1">
                            {getFieldIcon(field.key)}
                            {field.label}:
                          </span>
                          <div className="flex-1 relative">
                            <input
                              type={isSecret && !isVisible ? 'password' : 'text'}
                              value={o.credentials[field.key] || ''}
                              onChange={(e) => updateWallCredential(o.id, field.key, e.target.value)}
                              placeholder={field.placeholder}
                              className="w-full px-2 py-1 pr-7 bg-background border border-border rounded text-[10px]"
                            />
                            {isSecret && (
                              <button
                                type="button"
                                onClick={() => toggleSecretVisibility(fieldKey)}
                                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              >
                                {isVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    <div className="flex items-center gap-2 mt-1.5 pt-1.5 border-t border-border/30">
                      <span className="text-[9px] text-muted-foreground w-20 flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        Iframe URL:
                      </span>
                      <input
                        type="text"
                        value={o.iframeUrl}
                        onChange={(e) => updateWallIframeUrl(o.id, e.target.value)}
                        placeholder="https://offerwall.example.com/..."
                        className="flex-1 px-2 py-1 bg-background border border-border rounded text-[10px]"
                      />
                    </div>
                  </div>

                  {/* Offers list */}
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

                  {/* Add offer form */}
                  <div className="flex items-center gap-1.5 pt-2 border-t border-border/50">
                    <input type="text" value={newOffer.name} onChange={(e) => setNewOffer({ ...newOffer, name: e.target.value })} placeholder="Offer" className="flex-1 px-2 py-1 bg-background border border-border rounded text-[10px]" />
                    <input type="number" value={newOffer.reward || ''} onChange={(e) => setNewOffer({ ...newOffer, reward: Number(e.target.value) })} placeholder="$" className="w-12 px-2 py-1 bg-background border border-border rounded text-[10px]" />
                    <input type="text" value={newOffer.url} onChange={(e) => setNewOffer({ ...newOffer, url: e.target.value })} placeholder="URL" className="flex-1 px-2 py-1 bg-background border border-border rounded text-[10px]" />
                    <button onClick={() => addOffer(o.id)} className="px-2 py-1 bg-primary text-primary-foreground rounded text-[9px]"><Plus className="w-3 h-3" /></button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-1.5">
              <button onClick={handleSave} disabled={isSaving} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-gradient-to-r from-primary to-secondary text-primary-foreground font-semibold text-[10px] disabled:opacity-50"><Save className="w-3 h-3" /> {isSaving ? 'Saving...' : 'Save'}</button>
              <button onClick={loadSettings} className="flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-muted border border-border text-muted-foreground font-semibold text-[10px]"><RotateCcw className="w-3 h-3" /> Reset</button>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default AdminOfferwallCustomize;
