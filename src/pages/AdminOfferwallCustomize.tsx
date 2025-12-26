import { useState, useEffect, useRef } from 'react';
import { Layers, Menu, Save, RotateCcw, Plus, Trash2, Pencil, X, Key, Globe, Hash, Shield, Eye, EyeOff, Copy, Check, Zap, Upload, Image, DollarSign, AlertCircle, Loader2 } from 'lucide-react';
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

// Universal credential types for all providers
interface OfferwallCredentials {
  secretKey?: string;
  hashKey?: string;
  apiKey?: string;
  appId?: string;
  publicKey?: string;
  publisherId?: string;
  campaignId?: string;
}

interface Offerwall {
  id: string;
  name: string;
  enabled: boolean;
  color: string;
  provider: string;
  credentials: OfferwallCredentials;
  iframeUrl: string;
  offers: Offer[];
  // New unified fields
  pointsConversionRate: number; // e.g., 1000 means $1 = 1000 points
  minimumPayout: number; // Minimum offer value to show
  logoUrl?: string;
}

const PROVIDER_OPTIONS = [
  { value: 'adgem', label: 'AdGem' },
  { value: 'offertoro', label: 'OfferToro' },
  { value: 'adgate', label: 'AdGate' },
  { value: 'wannads', label: 'Wannads' },
  { value: 'adtowall', label: 'Adtowall' },
  { value: 'vortexwall', label: 'Vortexwall' },
  { value: 'notik', label: 'Notik' },
  { value: 'pubscale', label: 'Pubscale' },
  { value: 'revtoo', label: 'Revtoo' },
  { value: 'upwall', label: 'Upwall' },
  { value: 'custom', label: 'Custom' },
];

const SUPABASE_PROJECT_ID = 'xqcelwxqavzmgaqcgqps';
const POSTBACK_BASE_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/offerwall-postback`;

const generatePostbackUrl = (wallName: string) => {
  const sanitizedName = wallName.toLowerCase().replace(/[^a-z0-9]/g, '');
  return `${POSTBACK_BASE_URL}?offerwall=${sanitizedName}&user_id={user_id}&payout={payout}&offer_name={offer_name}&transaction_id={transaction_id}&ip={ip}&country={country}`;
};

const generateDynamicIframeUrl = (baseUrl: string) => {
  if (!baseUrl) return '';
  const separator = baseUrl.includes('?') ? '&' : '?';
  // Add user_id placeholder if not present
  if (!baseUrl.includes('user_id=') && !baseUrl.includes('click_id=') && !baseUrl.includes('subid=')) {
    return `${baseUrl}${separator}user_id={uid}`;
  }
  return baseUrl;
};

const AdminOfferwallCustomize = () => {
  const { isAdmin, user } = useAuth();
  const { snowEnabled, toggleSnow } = useSnowEffect();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [offerwalls, setOfferwalls] = useState<Offerwall[]>([]);
  const [newOfferwall, setNewOfferwall] = useState('');
  const [newProvider, setNewProvider] = useState('custom');
  const [isSaving, setIsSaving] = useState(false);
  const [editingWall, setEditingWall] = useState<string | null>(null);
  const [editingOffer, setEditingOffer] = useState<{ wallId: string; offer: Offer } | null>(null);
  const [newOffer, setNewOffer] = useState({ name: '', reward: 0, url: '' });
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [testingWall, setTestingWall] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    loadSettings();
    const channel = supabase.channel('offerwall-settings-changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'site_settings', filter: 'id=eq.default' }, (payload) => {
        const newData = payload.new as Record<string, unknown>;
        if (newData.offerwall_settings && typeof newData.offerwall_settings === 'object') {
          const offerData = newData.offerwall_settings as Record<string, unknown>;
          if (Array.isArray(offerData.offerwalls)) {
            migrateAndSetOfferwalls(offerData.offerwalls as Offerwall[]);
          }
        }
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const migrateAndSetOfferwalls = (walls: Offerwall[]) => {
    setOfferwalls(walls.map(w => ({
      ...w,
      provider: w.provider || 'custom',
      credentials: w.credentials || {},
      pointsConversionRate: w.pointsConversionRate ?? 1000,
      minimumPayout: w.minimumPayout ?? 0,
    })));
  };

  const loadSettings = async () => {
    const { data } = await supabase.from('site_settings').select('offerwall_settings').eq('id', 'default').maybeSingle();
    if (data?.offerwall_settings && typeof data.offerwall_settings === 'object') {
      const offerData = data.offerwall_settings as Record<string, unknown>;
      if (Array.isArray(offerData.offerwalls)) {
        migrateAndSetOfferwalls(offerData.offerwalls as Offerwall[]);
      }
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase.from('site_settings').update({
        offerwall_settings: JSON.parse(JSON.stringify({ offerwalls })),
        updated_at: new Date().toISOString()
      }).eq('id', 'default');
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
      offers: [],
      pointsConversionRate: 1000,
      minimumPayout: 0,
    }]);
    setNewOfferwall('');
    setNewProvider('custom');
  };

  const toggleOfferwall = (id: string) => { setOfferwalls(offerwalls.map(o => o.id === id ? { ...o, enabled: !o.enabled } : o)); };
  const removeOfferwall = (id: string) => { setOfferwalls(offerwalls.filter(o => o.id !== id)); };
  const updateWallColor = (id: string, color: string) => { setOfferwalls(offerwalls.map(o => o.id === id ? { ...o, color } : o)); };
  const updateWallName = (id: string, name: string) => { setOfferwalls(offerwalls.map(o => o.id === id ? { ...o, name } : o)); };
  const updateWallProvider = (id: string, provider: string) => { setOfferwalls(offerwalls.map(o => o.id === id ? { ...o, provider } : o)); };
  const updateWallCredential = (id: string, key: keyof OfferwallCredentials, value: string) => {
    setOfferwalls(offerwalls.map(o => o.id === id ? { ...o, credentials: { ...o.credentials, [key]: value } } : o));
  };
  const updateWallIframeUrl = (id: string, iframeUrl: string) => { setOfferwalls(offerwalls.map(o => o.id === id ? { ...o, iframeUrl } : o)); };
  const updateWallPointsRate = (id: string, rate: number) => { setOfferwalls(offerwalls.map(o => o.id === id ? { ...o, pointsConversionRate: rate } : o)); };
  const updateWallMinPayout = (id: string, min: number) => { setOfferwalls(offerwalls.map(o => o.id === id ? { ...o, minimumPayout: min } : o)); };

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

  const copyPostbackUrl = async (wallId: string, wallName: string) => {
    const url = generatePostbackUrl(wallName);
    await navigator.clipboard.writeText(url);
    setCopiedUrl(wallId);
    toast.success('Postback URL copied!');
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const handleTestPostback = async (wall: Offerwall) => {
    if (!user?.id) {
      toast.error('You must be logged in to test');
      return;
    }
    
    setTestingWall(wall.id);
    try {
      const testParams = new URLSearchParams({
        user_id: user.id,
        offerwall: wall.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
        payout: '0.01',
        offer_name: 'Test Offer',
        transaction_id: `test_${Date.now()}`,
        ip: '127.0.0.1',
        country: 'TEST',
      });

      // Add API key for verification
      if (wall.credentials.secretKey) {
        testParams.append('api_key', wall.credentials.secretKey);
      } else if (wall.credentials.apiKey) {
        testParams.append('api_key', wall.credentials.apiKey);
      }

      const response = await fetch(`${POSTBACK_BASE_URL}?${testParams.toString()}`);
      const result = await response.json();
      
      if (response.ok && result.success) {
        toast.success(`Test passed! ${result.coins_awarded} coins credited.`);
      } else {
        toast.error(`Test failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      toast.error('Test failed: Network error');
    } finally {
      setTestingWall(null);
    }
  };

  const handleLogoUpload = async (wallId: string, file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    setUploadingLogo(wallId);
    try {
      const fileName = `offerwall-logos/${wallId}-${Date.now()}.${file.name.split('.').pop()}`;
      const { error: uploadError } = await supabase.storage
        .from('site-assets')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('site-assets')
        .getPublicUrl(fileName);

      setOfferwalls(offerwalls.map(o => o.id === wallId ? { ...o, logoUrl: publicUrl } : o));
      toast.success('Logo uploaded!');
    } catch (error) {
      toast.error('Upload failed');
    } finally {
      setUploadingLogo(null);
    }
  };

  const removeLogo = (wallId: string) => {
    setOfferwalls(offerwalls.map(o => o.id === wallId ? { ...o, logoUrl: undefined } : o));
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

        <main className="p-3 md:px-[5%] max-w-3xl mx-auto">
          <div className="glass-card p-4">
            <h2 className="text-sm font-bold text-primary flex items-center gap-1.5 mb-4"><Layers className="w-4 h-4" /> Universal Offerwall Management</h2>

            {/* Add new offerwall */}
            <div className="flex gap-2 mb-4">
              <input type="text" value={newOfferwall} onChange={(e) => setNewOfferwall(e.target.value)} placeholder="Name..." className="flex-1 px-2.5 py-1.5 bg-muted border border-border rounded-lg text-xs" />
              <select value={newProvider} onChange={(e) => setNewProvider(e.target.value)} className="px-2 py-1.5 bg-muted border border-border rounded-lg text-xs">
                {PROVIDER_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
              <button onClick={addOfferwall} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium flex items-center gap-1"><Plus className="w-3 h-3" /> Add</button>
            </div>

            <div className="space-y-4 mb-4 max-h-[60vh] overflow-y-auto pr-1">
              {offerwalls.map(o => (
                <div key={o.id} className="p-3 bg-muted/50 rounded-lg border border-border">
                  {/* Header row */}
                  <div className="flex items-center gap-2 mb-3">
                    {o.logoUrl ? (
                      <div className="relative group">
                        <img src={o.logoUrl} alt={o.name} className="w-8 h-8 rounded object-cover border border-border" />
                        <button
                          onClick={() => removeLogo(o.id)}
                          className="absolute -top-1 -right-1 p-0.5 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-2 h-2" />
                        </button>
                      </div>
                    ) : (
                      <input type="color" value={o.color} onChange={(e) => updateWallColor(o.id, e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0" />
                    )}
                    {editingWall === o.id ? (
                      <input type="text" value={o.name} onChange={(e) => updateWallName(o.id, e.target.value)} onBlur={() => setEditingWall(null)} autoFocus className="flex-1 px-2 py-1 bg-background border border-border rounded text-xs" />
                    ) : (
                      <span className="flex-1 text-xs font-medium cursor-pointer" onClick={() => setEditingWall(o.id)}>{o.name} <Pencil className="w-2.5 h-2.5 inline ml-1 opacity-50" /></span>
                    )}
                    <select value={o.provider} onChange={(e) => updateWallProvider(o.id, e.target.value)} className="px-1.5 py-0.5 bg-background border border-border rounded text-[9px]">
                      {PROVIDER_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </select>
                    <button onClick={() => toggleOfferwall(o.id)} className={`px-2 py-0.5 rounded text-[9px] font-semibold ${o.enabled ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{o.enabled ? 'ON' : 'OFF'}</button>
                    <button onClick={() => removeOfferwall(o.id)} className="p-1 text-destructive hover:bg-destructive/10 rounded"><Trash2 className="w-3 h-3" /></button>
                  </div>

                  {/* Logo upload */}
                  <div className="flex items-center gap-2 mb-2 p-2 bg-background/30 rounded border border-border/50">
                    <span className="text-[9px] text-muted-foreground flex items-center gap-1"><Image className="w-3 h-3" /> Network Logo:</span>
                    <input
                      type="file"
                      ref={el => fileInputRefs.current[o.id] = el}
                      onChange={(e) => e.target.files?.[0] && handleLogoUpload(o.id, e.target.files[0])}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRefs.current[o.id]?.click()}
                      disabled={uploadingLogo === o.id}
                      className="px-2 py-0.5 bg-muted border border-border rounded text-[9px] flex items-center gap-1 hover:bg-background disabled:opacity-50"
                    >
                      {uploadingLogo === o.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                      {o.logoUrl ? 'Change' : 'Upload'}
                    </button>
                    {o.logoUrl && <span className="text-[8px] text-green-400">✓ Uploaded</span>}
                  </div>

                  {/* Unified credential fields */}
                  <div className="space-y-2 mb-3 p-2 bg-background/30 rounded-lg border border-border/50">
                    <div className="text-[9px] text-muted-foreground mb-2 flex items-center gap-1">
                      <Key className="w-3 h-3" />
                      Security & Verification
                    </div>
                    
                    {/* Secret Key / Hash Key */}
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-muted-foreground w-24 flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        Secret/Hash Key:
                      </span>
                      <div className="flex-1 relative">
                        <input
                          type={showSecrets[`${o.id}-secret`] ? 'text' : 'password'}
                          value={o.credentials.secretKey || o.credentials.hashKey || ''}
                          onChange={(e) => updateWallCredential(o.id, 'secretKey', e.target.value)}
                          placeholder="For signature verification..."
                          className="w-full px-2 py-1 pr-7 bg-background border border-border rounded text-[10px]"
                        />
                        <button
                          type="button"
                          onClick={() => toggleSecretVisibility(`${o.id}-secret`)}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showSecrets[`${o.id}-secret`] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>

                    {/* Points Conversion Rate */}
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-muted-foreground w-24 flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        $1 = Points:
                      </span>
                      <input
                        type="number"
                        value={o.pointsConversionRate || 1000}
                        onChange={(e) => updateWallPointsRate(o.id, Number(e.target.value))}
                        placeholder="1000"
                        className="w-24 px-2 py-1 bg-background border border-border rounded text-[10px]"
                      />
                      <span className="text-[8px] text-muted-foreground">points</span>
                    </div>

                    {/* Minimum Payout */}
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-muted-foreground w-24 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Min Payout:
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        value={o.minimumPayout || 0}
                        onChange={(e) => updateWallMinPayout(o.id, Number(e.target.value))}
                        placeholder="0.00"
                        className="w-24 px-2 py-1 bg-background border border-border rounded text-[10px]"
                      />
                      <span className="text-[8px] text-muted-foreground">$ (offers below this hidden)</span>
                    </div>

                    {/* Postback URL (Read-only) */}
                    <div className="flex items-center gap-2 pt-2 border-t border-border/30">
                      <span className="text-[9px] text-muted-foreground w-24 flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        Postback URL:
                      </span>
                      <input
                        type="text"
                        value={generatePostbackUrl(o.name)}
                        readOnly
                        className="flex-1 px-2 py-1 bg-background/50 border border-border rounded text-[10px] text-muted-foreground cursor-default"
                      />
                      <button
                        onClick={() => copyPostbackUrl(o.id, o.name)}
                        className="p-1 hover:bg-background rounded"
                        title="Copy URL"
                      >
                        {copiedUrl === o.id ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                      </button>
                    </div>

                    {/* Iframe URL with dynamic user ID */}
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-muted-foreground w-24 flex items-center gap-1">
                        <Hash className="w-3 h-3" />
                        Iframe URL:
                      </span>
                      <input
                        type="text"
                        value={o.iframeUrl}
                        onChange={(e) => updateWallIframeUrl(o.id, e.target.value)}
                        placeholder="https://offerwall.example.com/?subid={uid}"
                        className="flex-1 px-2 py-1 bg-background border border-border rounded text-[10px]"
                      />
                    </div>
                    <div className="text-[8px] text-muted-foreground ml-26 pl-1">
                      Use <code className="bg-background px-1 rounded">{'{uid}'}</code> or <code className="bg-background px-1 rounded">{'{user_id}'}</code> for dynamic user ID
                    </div>

                    {/* Test Postback Button */}
                    <div className="flex items-center gap-2 pt-2 border-t border-border/30">
                      <button
                        onClick={() => handleTestPostback(o)}
                        disabled={testingWall === o.id}
                        className="px-3 py-1 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded text-[9px] font-medium flex items-center gap-1 hover:bg-orange-500/30 disabled:opacity-50"
                      >
                        {testingWall === o.id ? (
                          <><Loader2 className="w-3 h-3 animate-spin" /> Testing...</>
                        ) : (
                          <><Zap className="w-3 h-3" /> Test Postback</>
                        )}
                      </button>
                      <span className="text-[8px] text-muted-foreground">Simulate a $0.01 conversion to verify setup</span>
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
