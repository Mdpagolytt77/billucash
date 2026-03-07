import { useState, useEffect, useRef } from 'react';
import { Layers, Menu, Save, RotateCcw, Plus, Trash2, X, Globe, Copy, Check, Zap, Upload, Loader2, Lock, Settings, Eye, EyeOff, Percent, Link2, Tag, ToggleLeft, ToggleRight } from 'lucide-react';
import heroBg from '@/assets/hero-bg.jpg';
import SnowEffect from '@/components/SnowEffect';
import SnowToggle from '@/components/SnowToggle';
import AdminSidebar from '@/components/AdminSidebar';
import { useSnowEffect } from '@/hooks/useSnowEffect';
import { useAuth } from '@/contexts/AuthContext';
import { SiteLogo, useSiteSettings, getBackgroundStyle } from '@/contexts/SiteSettingsContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Offer { 
  id: string; 
  name: string; 
  reward: number; 
  url: string; 
  whitelisted?: boolean; // Offer whitelisting
}

interface Offerwall {
  id: string;
  name: string;
  enabled: boolean;
  color: string;
  provider: string;
  iframeUrl: string;
  offers: Offer[];
  // API credentials
  apiKey?: string;
  secretKey?: string;
  // Conversion settings
  pointsConversionRate: number; // e.g., 1000 means $1 = 1000 points
  profitMargin: number; // Percentage to deduct (e.g., 20 = 20% profit margin)
  minimumPayout: number;
  // Sub-ID tracking
  subIdParam: string; // e.g., 'subid', 'aff_sub', 'uid'
  // Logo
  logoUrl?: string;
  // Popup size settings
  popupWidth?: string; // e.g., 'sm', 'md', 'lg', 'xl', 'full'
  popupHeight?: string; // e.g., '50vh', '60vh', '70vh', '80vh', '90vh'
  // Popup animation
  popupAnimation?: 'fade' | 'slide' | 'scale';
  // Popup border
  popupBorderColor?: string;
  popupBorderWidth?: string; // e.g., '0', '1', '2', '3', '4'
}

const PROVIDER_OPTIONS = [
  { value: 'adgem', label: 'AdGem' },
  { value: 'offertoro', label: 'OfferToro' },
  { value: 'adgate', label: 'AdGate' },
  { value: 'wannads', label: 'Wannads' },
  { value: 'adtowall', label: 'Adtowall' },
  { value: 'vortexwall', label: 'Vortexwall' },
  { value: 'notik', label: 'Notik' },
  { value: 'offery', label: 'Offery' },
  { value: 'pubscale', label: 'Pubscale' },
  { value: 'revtoo', label: 'Revtoo' },
  { value: 'upwall', label: 'Upwall' },
  { value: 'radientwall', label: 'RadientWall' },
  { value: 'tplayad', label: 'Tplayad' },
  { value: 'timewall', label: 'Timewall' },
  { value: 'bitlab', label: 'BitLab' },
  { value: 'pdavenue', label: 'PD Avenue' },
  { value: 'playtimeads', label: 'PlaytimeAds' },
  { value: 'custom', label: 'Custom' },
];

const SUPABASE_PROJECT_ID = 'xqcelwxqavzmgaqcgqps';
const SUPABASE_FUNCTIONS_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1`;

// Provider-specific postback endpoints
const PROVIDER_POSTBACK_ENDPOINTS: Record<string, string> = {
  vortexwall: 'vortexwall-postback',
  primewall: 'primewall-postback',
  notik: 'notik-postback',
  offery: 'offery-postback',
  radientwall: 'radientwall-postback',
  tplayad: 'tplayad-postback',
  timewall: 'timewall-postback',
  bitlab: 'bitlab-postback',
};

// Provider-specific postback URL templates with their unique parameter formats
const PROVIDER_POSTBACK_TEMPLATES: Record<string, (baseUrl: string, wallName: string) => string> = {
  // Notik uses: user_id from {user_id}, txn_id for transaction, offer_name, amount/payout for points
  notik: (baseUrl, wallName) => 
    `${baseUrl}?user_id={user_id}&txn_id={txn_id}&offer_name={offer_name}&amount={amount}&payout={payout}&ip={ip}&country={country_code}&offerwall=${wallName}`,
  
  // Offery S2S Postback - all parameters from their API docs
  offery: (baseUrl, wallName) => 
    `${baseUrl}?subid={subId}&transid={transId}&offer_id={offer_id}&offer_name={offer_name}&offer_type={offer_type}&reward={reward}&reward_name={reward_name}&reward_value={reward_value}&payout={payout}&ip={userIp}&country={country}&status={status}&debug={debug}&signature={signature}&offerwall=${wallName}`,
  
  // AdGem uses player_id for user_id, amount for payout
  adgem: (baseUrl, wallName) => 
    `${baseUrl}?user_id={player_id}&payout={amount}&offer_name={offer_name}&transaction_id={transaction_id}&ip={ip}&country={country_code}&offerwall=${wallName}`,
  
  // OfferToro uses user_id, amount for payout, oid for offer_name
  offertoro: (baseUrl, wallName) => 
    `${baseUrl}?user_id={user_id}&payout={amount}&offer_name={oid}&transaction_id={trans_id}&ip={ip}&country={cnt}&offerwall=${wallName}&sig={sig}`,
  
  // AdGate uses s1 for user_id, point_value for payout
  adgate: (baseUrl, wallName) => 
    `${baseUrl}?user_id={s1}&payout={point_value}&offer_name={offer_name}&transaction_id={transaction_id}&ip={ip}&country={country}&offerwall=${wallName}&sig={sig}`,
  
  // Wannads uses subid for user_id, reward for payout
  wannads: (baseUrl, wallName) => 
    `${baseUrl}?user_id={subid}&payout={reward}&offer_name={campaign_name}&transaction_id={transaction_id}&ip={ip}&country={country_code}&offerwall=${wallName}`,
  
  // Adtowall uses aff_sub for user_id
  adtowall: (baseUrl, wallName) => 
    `${baseUrl}?user_id={aff_sub}&payout={payout}&offer_name={offer_name}&transaction_id={click_id}&ip={ip}&country={country}&offerwall=${wallName}`,
  
  // Vortexwall standard format
  vortexwall: (baseUrl, wallName) => 
    `${baseUrl}?user_id={user_id}&payout={payout}&offer_name={offer_name}&transaction_id={transaction_id}&ip={ip}&country={country}&offerwall=${wallName}&sig={sig}`,
  
  // Primewall standard format
  primewall: (baseUrl, wallName) => 
    `${baseUrl}?user_id={user_id}&payout={payout}&offer_name={offer_name}&transaction_id={transaction_id}&ip={ip}&country={country}&offerwall=${wallName}&sig={sig}`,
  
  // Pubscale uses sub_id for user_id, revenue for payout
  pubscale: (baseUrl, wallName) => 
    `${baseUrl}?user_id={sub_id}&payout={revenue}&offer_name={offer_name}&transaction_id={click_id}&ip={user_ip}&country={country}&offerwall=${wallName}`,
  
  // Revtoo uses userid for user_id, currency for payout
  revtoo: (baseUrl, wallName) => 
    `${baseUrl}?user_id={userid}&payout={currency}&offer_name={offername}&transaction_id={transid}&ip={ip}&country={geo}&offerwall=${wallName}&sig={sig}`,
  
  // Upwall uses uid for user_id
  upwall: (baseUrl, wallName) => 
    `${baseUrl}?user_id={uid}&payout={payout}&offer_name={offer_name}&transaction_id={txn_id}&ip={ip}&country={country}&offerwall=${wallName}`,
  
  // RadientWall uses user_id, payout, offer_name, transaction_id
  radientwall: (baseUrl, wallName) => 
    `${baseUrl}?user_id={user_id}&payout={payout}&offer_name={offer_name}&transaction_id={transaction_id}&ip={ip}&country={country}&offerwall=${wallName}`,
  
  // Tplayad uses userid, amount
  tplayad: (baseUrl, wallName) => 
    `${baseUrl}?userid={user_id}&amount={points}&offer_name={offer_name}&transaction_id={transaction_id}&country={country}&offerwall=${wallName}`,
  
  // Timewall uses userid, revenue, hash for SHA256 verification, site_id for identification
  timewall: (baseUrl, wallName) => 
    `${baseUrl}?userid={userid}&revenue={revenue}&offer_name={offer_name}&transaction_id={transaction_id}&country={country_code}&hash={hash}&site_id=2869b7172a8a1b32&offerwall=${wallName}`,
  
  // BitLab uses uid (USER:ID), tx (TX), val (VALUE:CURRENCY), hash for verification
  bitlab: (baseUrl, wallName) => 
    `${baseUrl}?uid={USER:ID}&tx={TX}&val={VALUE:CURRENCY}&offer_name={OFFER:TASK:ID}&country={USER:COUNTRY}&hash={HASH}&offerwall=${wallName}`,

  // PD Avenue uses user_id, offer_id, payout, amount, signature for HMAC verification
  pdavenue: (baseUrl, wallName) => 
    `${baseUrl}?user_id={user_id}&offer_name={offer_name}&payout={payout}&amount={amount}&transaction_id={offer_id}&signature={signature}&event={event}&offerwall=${wallName}`,

  // PlaytimeAds uses user_id, offer_id, payout, offer_name, signature
  playtimeads: (baseUrl, wallName) => 
    `${baseUrl}?user_id={user_id}&offer_name={offer_name}&payout={payout}&amount={amount}&transaction_id={offer_id}&signature={signature}&event={event}&offerwall=${wallName}`,
};

const generatePostbackUrl = (wallName: string, provider: string) => {
  const sanitizedName = wallName.toLowerCase().replace(/[^a-z0-9]/g, '');
  // Use provider-specific endpoint if available, otherwise use generic
  const endpoint = PROVIDER_POSTBACK_ENDPOINTS[provider] || 'offerwall-postback';
  const baseUrl = `${SUPABASE_FUNCTIONS_URL}/${endpoint}`;
  
  // Use provider-specific template if available
  const templateFn = PROVIDER_POSTBACK_TEMPLATES[provider];
  if (templateFn) {
    return templateFn(baseUrl, sanitizedName);
  }
  
  // Default template for custom/generic offerwalls
  return `${baseUrl}?offerwall=${sanitizedName}&user_id={user_id}&payout={payout}&offer_name={offer_name}&transaction_id={transaction_id}&ip={ip}&country={country}&sig={sig}`;
};

// Apply macros to iframe URL
const applyMacros = (url: string, userId: string, userIp?: string, deviceId?: string) => {
  if (!url) return '';
  return url
    .replace(/{uid}/g, userId)
    .replace(/{user_id}/g, userId)
    .replace(/{ip}/g, userIp || '')
    .replace(/{device_id}/g, deviceId || '')
    .replace(/{subid}/g, userId);
};

const AdminOfferwallCustomize = () => {
  const { isAdmin, isModerator, user } = useAuth();
  const canAccess = isAdmin || isModerator;
  const { snowEnabled, toggleSnow } = useSnowEffect();
  const { backgrounds } = useSiteSettings();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [offerwalls, setOfferwalls] = useState<Offerwall[]>([]);
   const [cardHeight, setCardHeight] = useState(280);
   const [cardColumns, setCardColumns] = useState(5);
   const [cardGap, setCardGap] = useState(12);
   const [cardBorderRadius, setCardBorderRadius] = useState(20);
   const [mobileCardHeight, setMobileCardHeight] = useState(160);
   const [cardPadding, setCardPadding] = useState(16);
  const [newOfferwall, setNewOfferwall] = useState('');
  const [newProvider, setNewProvider] = useState('custom');
  const [isSaving, setIsSaving] = useState(false);
  const [selectedWall, setSelectedWall] = useState<Offerwall | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [testingWall, setTestingWall] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [newOffer, setNewOffer] = useState({ name: '', reward: 0, url: '' });
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [deleteConfirmWall, setDeleteConfirmWall] = useState<Offerwall | null>(null);

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
      pointsConversionRate: w.pointsConversionRate ?? 1000,
      profitMargin: w.profitMargin ?? 0,
      minimumPayout: w.minimumPayout ?? 0,
      subIdParam: w.subIdParam || 'subid',
      apiKey: w.apiKey || '',
      secretKey: w.secretKey || '',
      offers: (w.offers || []).map(o => ({ ...o, whitelisted: o.whitelisted ?? true })),
      popupWidth: w.popupWidth || 'lg',
      popupHeight: w.popupHeight || '60vh',
      popupAnimation: w.popupAnimation || 'fade',
      popupBorderColor: w.popupBorderColor || '#ffffff',
      popupBorderWidth: w.popupBorderWidth || '1',
    })));
  };

  const loadSettings = async () => {
    const { data } = await supabase.rpc('get_public_site_settings');
    if (data && data.length > 0 && data[0].offerwall_settings && typeof data[0].offerwall_settings === 'object') {
      const offerData = data[0].offerwall_settings as Record<string, unknown>;
      if (Array.isArray(offerData.offerwalls)) {
        migrateAndSetOfferwalls(offerData.offerwalls as Offerwall[]);
      }
      if (typeof offerData.cardHeight === 'number') setCardHeight(offerData.cardHeight);
      if (typeof offerData.cardColumns === 'number') setCardColumns(offerData.cardColumns);
      if (typeof offerData.cardGap === 'number') setCardGap(offerData.cardGap);
      if (typeof offerData.cardBorderRadius === 'number') setCardBorderRadius(offerData.cardBorderRadius);
      if (typeof offerData.mobileCardHeight === 'number') setMobileCardHeight(offerData.mobileCardHeight);
      if (typeof offerData.cardPadding === 'number') setCardPadding(offerData.cardPadding);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Auto-sync enabled offerwall names to provider_logos
      const enabledWalls = offerwalls.filter(w => w.enabled);
      
      // Get existing provider logos
      const { data: settingsData } = await supabase.rpc('get_public_site_settings');
      const existingLogos = (settingsData?.[0]?.provider_logos as unknown as { id: string; name: string; url: string }[]) || [];
      
      // Merge: keep existing logos, add new offerwalls that aren't already there
      const existingNames = new Set(existingLogos.map(l => l.name.toLowerCase()));
      const newProviderLogos = [...existingLogos];
      
      for (const wall of enabledWalls) {
        if (!existingNames.has(wall.name.toLowerCase())) {
          newProviderLogos.push({
            id: `auto_${wall.id}`,
            name: wall.name,
            url: wall.logoUrl || '',
          });
        }
      }

      const { error } = await supabase.from('site_settings').update({
        offerwall_settings: JSON.parse(JSON.stringify({ offerwalls, cardHeight, cardColumns, cardGap, cardBorderRadius, mobileCardHeight, cardPadding })),
        provider_logos: JSON.parse(JSON.stringify(newProviderLogos)),
        updated_at: new Date().toISOString()
      }).eq('id', 'default');
      if (error) throw error;
      toast.success('Settings saved!');
    } catch { toast.error('Failed to save'); }
    finally { setIsSaving(false); }
  };

  const addOfferwall = () => {
    if (!newOfferwall.trim()) return;
    const newWall: Offerwall = {
      id: Date.now().toString(),
      name: newOfferwall,
      enabled: true,
      color: '#2bd96f',
      provider: newProvider,
      iframeUrl: '',
      offers: [],
      apiKey: '',
      secretKey: '',
      pointsConversionRate: 1000,
      profitMargin: 0,
      minimumPayout: 0,
      subIdParam: 'subid',
      popupWidth: 'lg',
      popupHeight: '60vh',
      popupAnimation: 'fade',
      popupBorderColor: '#ffffff',
      popupBorderWidth: '1',
    };
    setOfferwalls([...offerwalls, newWall]);
    setNewOfferwall('');
    setNewProvider('custom');
    // Open popup for new wall
    setSelectedWall(newWall);
  };

  const updateWall = (id: string, updates: Partial<Offerwall>) => {
    setOfferwalls(offerwalls.map(o => o.id === id ? { ...o, ...updates } : o));
    if (selectedWall?.id === id) {
      setSelectedWall({ ...selectedWall, ...updates });
    }
  };

  const toggleOfferwall = (id: string) => {
    setOfferwalls(offerwalls.map(o => o.id === id ? { ...o, enabled: !o.enabled } : o));
  };

  const removeOfferwall = (wall: Offerwall) => {
    setDeleteConfirmWall(wall);
  };

  const confirmDeleteOfferwall = () => {
    if (deleteConfirmWall) {
      setOfferwalls(offerwalls.filter(o => o.id !== deleteConfirmWall.id));
      if (selectedWall?.id === deleteConfirmWall.id) setSelectedWall(null);
      toast.success(`${deleteConfirmWall.name} deleted!`);
      setDeleteConfirmWall(null);
    }
  };

  const addOffer = (wallId: string) => {
    if (!newOffer.name.trim()) { toast.error('Enter offer name'); return; }
    const offer: Offer = { id: Date.now().toString(), ...newOffer, whitelisted: true };
    updateWall(wallId, { offers: [...(offerwalls.find(o => o.id === wallId)?.offers || []), offer] });
    setNewOffer({ name: '', reward: 0, url: '' });
    toast.success('Offer added!');
  };

  const removeOffer = (wallId: string, offerId: string) => {
    const wall = offerwalls.find(o => o.id === wallId);
    if (wall) {
      updateWall(wallId, { offers: wall.offers.filter(o => o.id !== offerId) });
    }
  };

  const toggleOfferWhitelist = (wallId: string, offerId: string) => {
    const wall = offerwalls.find(o => o.id === wallId);
    if (wall) {
      updateWall(wallId, { 
        offers: wall.offers.map(o => o.id === offerId ? { ...o, whitelisted: !o.whitelisted } : o) 
      });
    }
  };

  const copyPostbackUrl = async (wallId: string, wallName: string, provider: string) => {
    const url = generatePostbackUrl(wallName, provider);
    await navigator.clipboard.writeText(url);
    setCopiedUrl(wallId);
    toast.success('Postback URL copied!');
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const handleTestPostback = async (wall: Offerwall) => {
    if (!user?.id) { toast.error('Login required'); return; }
    setTestingWall(wall.id);
    try {
      const endpoint = PROVIDER_POSTBACK_ENDPOINTS[wall.provider] || 'offerwall-postback';
      const postbackUrl = `${SUPABASE_FUNCTIONS_URL}/${endpoint}`;
      const testParams = new URLSearchParams({
        user_id: user.id,
        offerwall: wall.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
        payout: '0.01',
        offer_name: 'Test Offer',
        transaction_id: `test_${Date.now()}`,
        ip: '127.0.0.1',
        country: 'TEST',
        test_mode: 'true',
      });
      const response = await fetch(`${postbackUrl}?${testParams.toString()}`);
      const result = await response.json();
      if (response.ok && result.success) {
        toast.success(`Test passed! ${result.coins_awarded} coins credited.`);
      } else {
        toast.error(`Test failed: ${result.error || 'Unknown error'}`);
      }
    } catch { toast.error('Test failed: Network error'); }
    finally { setTestingWall(null); }
  };

  const handleTestTracker = async (wall: Offerwall) => {
    if (!user?.id) { toast.error('Login required'); return; }
    setTestingWall(`tracker_${wall.id}`);
    try {
      const { data: profile } = await supabase.from('profiles').select('username').eq('id', user.id).maybeSingle();
      if (!profile) { toast.error('Profile not found'); return; }
      const testCoin = Math.floor(Math.random() * 500) + 100;
      const { error } = await supabase.from('completed_offers').insert({
        user_id: user.id,
        username: profile.username,
        offerwall: wall.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
        offer_name: `Test ${wall.name} Offer`,
        coin: testCoin,
        transaction_id: `tracker_test_${Date.now()}`,
        ip: '127.0.0.1',
        country: 'TEST',
      });
      if (error) throw error;
      toast.success(`Tracker test added! ${testCoin} coins`);
    } catch { toast.error('Tracker test failed'); }
    finally { setTestingWall(null); }
  };

  const handleLogoUpload = async (wallId: string, file: File) => {
    if (!file.type.startsWith('image/')) { toast.error('Upload image only'); return; }
    setUploadingLogo(wallId);
    try {
      const fileName = `offerwall-logos/${wallId}-${Date.now()}.${file.name.split('.').pop()}`;
      const { error: uploadError } = await supabase.storage.from('site-assets').upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('site-assets').getPublicUrl(fileName);
      updateWall(wallId, { logoUrl: publicUrl });
      toast.success('Logo uploaded!');
    } catch { toast.error('Upload failed'); }
    finally { setUploadingLogo(null); }
  };

  if (!canAccess) return <div className="min-h-screen flex items-center justify-center text-xs">Access Denied</div>;

  // Calculate user payout with profit margin
  const calculateUserPayout = (payout: number, rate: number, margin: number) => {
    const totalPoints = payout * rate;
    const userPoints = totalPoints * (1 - margin / 100);
    return Math.round(userPoints);
  };

  return (
    <>
      {snowEnabled && <SnowEffect />}
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmWall} onOpenChange={() => setDeleteConfirmWall(null)}>
        <AlertDialogContent className="bg-background border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Offerwall?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-semibold text-foreground">{deleteConfirmWall?.name}</span>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteOfferwall} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Yes, Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Settings Popup */}
      <Dialog open={!!selectedWall} onOpenChange={() => setSelectedWall(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-background border-border">
          {selectedWall && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-lg">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold" style={{ backgroundColor: selectedWall.color }}>
                    {selectedWall.name.charAt(0)}
                  </div>
                  {selectedWall.name} Settings
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Name</label>
                    <input
                      type="text"
                      value={selectedWall.name}
                      onChange={(e) => updateWall(selectedWall.id, { name: e.target.value })}
                      className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Provider</label>
                    <select
                      value={selectedWall.provider}
                      onChange={(e) => updateWall(selectedWall.id, { provider: e.target.value })}
                      className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm"
                    >
                      {PROVIDER_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </select>
                  </div>
                </div>

                {/* Color & Logo */}
                <div className="flex items-center gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Color</label>
                    <input type="color" value={selectedWall.color} onChange={(e) => updateWall(selectedWall.id, { color: e.target.value })} className="w-12 h-10 rounded cursor-pointer" />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground mb-1 block">Logo</label>
                    <div className="flex items-center gap-2">
                      {selectedWall.logoUrl && <img src={selectedWall.logoUrl} alt="" className="w-10 h-10 rounded object-cover" />}
                      <input type="file" ref={fileInputRef} onChange={(e) => e.target.files?.[0] && handleLogoUpload(selectedWall.id, e.target.files[0])} accept="image/*" className="hidden" />
                      <button onClick={() => fileInputRef.current?.click()} disabled={uploadingLogo === selectedWall.id} className="px-3 py-2 bg-muted border border-border rounded-lg text-xs flex items-center gap-1">
                        {uploadingLogo === selectedWall.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                        {selectedWall.logoUrl ? 'Change' : 'Upload'}
                      </button>
                      {selectedWall.logoUrl && <button onClick={() => updateWall(selectedWall.id, { logoUrl: undefined })} className="text-destructive text-xs">Remove</button>}
                    </div>
                  </div>
                </div>

                {/* API Credentials */}
                <div className="p-3 bg-muted/50 rounded-lg border border-border space-y-3">
                  <h4 className="text-xs font-semibold text-primary flex items-center gap-1"><Lock className="w-3 h-3" /> API Credentials</h4>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Tag className="w-3 h-3" /> API Key</label>
                    <div className="flex gap-2">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        value={selectedWall.apiKey || ''}
                        onChange={(e) => updateWall(selectedWall.id, { apiKey: e.target.value })}
                        placeholder="Enter API key..."
                        className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono"
                      />
                      <button onClick={() => setShowApiKey(!showApiKey)} className="px-3 py-2 bg-background border border-border rounded-lg">
                        {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Lock className="w-3 h-3" /> Secret Key (for signature verification)</label>
                    <div className="flex gap-2">
                      <input
                        type={showSecretKey ? 'text' : 'password'}
                        value={selectedWall.secretKey || ''}
                        onChange={(e) => updateWall(selectedWall.id, { secretKey: e.target.value })}
                        placeholder="Enter secret key..."
                        className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono"
                      />
                      <button onClick={() => setShowSecretKey(!showSecretKey)} className="px-3 py-2 bg-background border border-border rounded-lg">
                        {showSecretKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">Used to verify postback signatures (HMAC-SHA256/MD5)</p>
                  </div>
                </div>

                {/* Conversion Settings */}
                <div className="p-3 bg-muted/50 rounded-lg border border-border space-y-3">
                  <h4 className="text-xs font-semibold text-primary flex items-center gap-1"><Percent className="w-3 h-3" /> Currency & Payout Settings</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">$1 USD = Points</label>
                      <input
                        type="number"
                        value={selectedWall.pointsConversionRate}
                        onChange={(e) => updateWall(selectedWall.id, { pointsConversionRate: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Profit Margin %</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={selectedWall.profitMargin}
                        onChange={(e) => updateWall(selectedWall.id, { profitMargin: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Min Payout $</label>
                      <input
                        type="number"
                        step="0.01"
                        value={selectedWall.minimumPayout}
                        onChange={(e) => updateWall(selectedWall.id, { minimumPayout: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                      />
                    </div>
                  </div>
                  <div className="p-2 bg-green-500/10 border border-green-500/30 rounded text-xs text-green-400">
                    Example: $1.00 payout → User gets {calculateUserPayout(1, selectedWall.pointsConversionRate, selectedWall.profitMargin)} points (after {selectedWall.profitMargin}% margin)
                  </div>
                </div>

                {/* Sub-ID Tracking */}
                <div className="p-3 bg-muted/50 rounded-lg border border-border">
                  <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Link2 className="w-3 h-3" /> Sub-ID Parameter</label>
                  <select
                    value={selectedWall.subIdParam}
                    onChange={(e) => updateWall(selectedWall.id, { subIdParam: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                  >
                    <option value="subid">subid</option>
                    <option value="sub_id">sub_id</option>
                    <option value="aff_sub">aff_sub</option>
                    <option value="click_id">click_id</option>
                    <option value="uid">uid</option>
                    <option value="user_id">user_id</option>
                  </select>
                  <p className="text-[10px] text-muted-foreground mt-1">Parameter name the network uses for user tracking</p>
                </div>

                {/* Popup Size & Animation Settings */}
                <div className="p-3 bg-muted/50 rounded-lg border border-border space-y-3">
                  <h4 className="text-xs font-semibold text-primary flex items-center gap-1"><Layers className="w-3 h-3" /> Popup Size & Animation</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Popup Width</label>
                      <select
                        value={selectedWall.popupWidth || 'lg'}
                        onChange={(e) => updateWall(selectedWall.id, { popupWidth: e.target.value })}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                      >
                        <option value="sm">Small</option>
                        <option value="md">Medium</option>
                        <option value="lg">Large</option>
                        <option value="xl">Extra Large</option>
                        <option value="2xl">2XL</option>
                        <option value="3xl">3XL</option>
                        <option value="full">Full Width</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Iframe Height</label>
                      <select
                        value={selectedWall.popupHeight || '60vh'}
                        onChange={(e) => updateWall(selectedWall.id, { popupHeight: e.target.value })}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                      >
                        <option value="40vh">40%</option>
                        <option value="50vh">50%</option>
                        <option value="60vh">60%</option>
                        <option value="70vh">70%</option>
                        <option value="80vh">80%</option>
                        <option value="90vh">90%</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Animation</label>
                      <select
                        value={selectedWall.popupAnimation || 'fade'}
                        onChange={(e) => updateWall(selectedWall.id, { popupAnimation: e.target.value as 'fade' | 'slide' | 'scale' })}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                      >
                        <option value="fade">Fade</option>
                        <option value="slide">Slide Up</option>
                        <option value="scale">Scale</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Border Color</label>
                      <input
                        type="color"
                        value={selectedWall.popupBorderColor || '#ffffff'}
                        onChange={(e) => updateWall(selectedWall.id, { popupBorderColor: e.target.value })}
                        className="w-12 h-10 rounded cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Border Width</label>
                      <select
                        value={selectedWall.popupBorderWidth || '1'}
                        onChange={(e) => updateWall(selectedWall.id, { popupBorderWidth: e.target.value })}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                      >
                        <option value="0">None</option>
                        <option value="1">Thin (1px)</option>
                        <option value="2">Medium (2px)</option>
                        <option value="3">Thick (3px)</option>
                        <option value="4">Extra (4px)</option>
                      </select>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Controls popup size, animation, and border style</p>
                </div>

                {/* Iframe URL with Macros */}
                <div className="p-3 bg-muted/50 rounded-lg border border-border">
                  <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Globe className="w-3 h-3" /> Iframe URL (with macros)</label>
                  <input
                    type="text"
                    value={selectedWall.iframeUrl}
                    onChange={(e) => updateWall(selectedWall.id, { iframeUrl: e.target.value })}
                    placeholder="https://offerwall.com/?subid={uid}&ip={ip}&device_id={device_id}"
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono"
                  />
                  <div className="flex flex-wrap gap-1 mt-2">
                    <span className="px-2 py-0.5 bg-primary/20 text-primary rounded text-[10px]">{'{uid}'} = User ID</span>
                    <span className="px-2 py-0.5 bg-primary/20 text-primary rounded text-[10px]">{'{ip}'} = User IP</span>
                    <span className="px-2 py-0.5 bg-primary/20 text-primary rounded text-[10px]">{'{device_id}'} = Device ID</span>
                  </div>
                </div>

                {/* Postback URL */}
                <div className="p-3 bg-muted/50 rounded-lg border border-border">
                  <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Globe className="w-3 h-3" /> Postback URL (copy to network)</label>
                  <div className="flex gap-2">
                    <input type="text" value={generatePostbackUrl(selectedWall.name, selectedWall.provider)} readOnly className="flex-1 px-3 py-2 bg-background/50 border border-border rounded-lg text-xs font-mono text-muted-foreground" />
                    <button onClick={() => copyPostbackUrl(selectedWall.id, selectedWall.name, selectedWall.provider)} className="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-xs flex items-center gap-1">
                      {copiedUrl === selectedWall.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      Copy
                    </button>
                  </div>
                </div>

                {/* Test Buttons */}
                <div className="flex gap-2">
                  <button onClick={() => handleTestPostback(selectedWall)} disabled={testingWall === selectedWall.id} className="flex-1 px-3 py-2 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-lg text-xs flex items-center justify-center gap-1">
                    {testingWall === selectedWall.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />} Test Postback
                  </button>
                  <button onClick={() => handleTestTracker(selectedWall)} disabled={testingWall === `tracker_${selectedWall.id}`} className="flex-1 px-3 py-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg text-xs flex items-center justify-center gap-1">
                    {testingWall === `tracker_${selectedWall.id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />} Test Tracker
                  </button>
                </div>

                {/* Offers with Whitelisting */}
                <div className="p-3 bg-muted/50 rounded-lg border border-border">
                  <h4 className="text-xs font-semibold text-primary mb-2">Manual Offers (Whitelisting)</h4>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto mb-3">
                    {selectedWall.offers.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-2">No offers added</p>
                    ) : (
                      selectedWall.offers.map(offer => (
                        <div key={offer.id} className="flex items-center gap-2 p-2 bg-background rounded text-xs">
                          <button onClick={() => toggleOfferWhitelist(selectedWall.id, offer.id)} className={`p-1 rounded ${offer.whitelisted ? 'text-green-400' : 'text-red-400'}`}>
                            {offer.whitelisted ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                          </button>
                          <span className={`flex-1 ${!offer.whitelisted ? 'line-through opacity-50' : ''}`}>{offer.name}</span>
                          <span className="text-primary font-medium">${offer.reward}</span>
                          <button onClick={() => removeOffer(selectedWall.id, offer.id)} className="p-1 text-destructive hover:bg-destructive/10 rounded"><Trash2 className="w-3 h-3" /></button>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input type="text" value={newOffer.name} onChange={(e) => setNewOffer({ ...newOffer, name: e.target.value })} placeholder="Offer name" className="flex-1 px-2 py-1.5 bg-background border border-border rounded text-xs" />
                    <input type="number" value={newOffer.reward || ''} onChange={(e) => setNewOffer({ ...newOffer, reward: Number(e.target.value) })} placeholder="$" className="w-16 px-2 py-1.5 bg-background border border-border rounded text-xs" />
                    <button onClick={() => addOffer(selectedWall.id)} className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-xs"><Plus className="w-3 h-3" /></button>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex gap-2 pt-4 border-t border-border mt-4">
                  <button
                    onClick={() => setSelectedWall(null)}
                    className="flex-1 px-3 py-2 bg-muted border border-border rounded-lg text-xs font-medium hover:bg-muted/80"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      await handleSave();
                      setSelectedWall(null);
                    }}
                    disabled={isSaving}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-gradient-to-r from-primary to-secondary text-primary-foreground font-semibold text-xs disabled:opacity-50"
                  >
                    <Save className="w-3 h-3" /> {isSaving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <div className="min-h-screen" style={getBackgroundStyle(backgrounds.admin, heroBg)}>
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

            {/* Card Layout Settings */}
            <div className="p-3 bg-muted/50 rounded-lg border border-border mb-4 space-y-3">
              <h4 className="text-xs font-semibold text-primary flex items-center gap-1"><Layers className="w-3 h-3" /> Card Layout Settings</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Card Height (px)</label>
                  <input type="number" min="100" max="500" value={cardHeight} onChange={(e) => setCardHeight(Number(e.target.value))} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Mobile Height (px)</label>
                  <input type="number" min="80" max="400" value={mobileCardHeight} onChange={(e) => setMobileCardHeight(Number(e.target.value))} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Cards Per Row (Desktop)</label>
                  <select value={cardColumns} onChange={(e) => setCardColumns(Number(e.target.value))} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm">
                    <option value={3}>3 columns</option>
                    <option value={4}>4 columns</option>
                    <option value={5}>5 columns</option>
                    <option value={6}>6 columns</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Card Gap (px)</label>
                  <input type="number" min="0" max="40" value={cardGap} onChange={(e) => setCardGap(Number(e.target.value))} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Border Radius (px)</label>
                  <input type="number" min="0" max="50" value={cardBorderRadius} onChange={(e) => setCardBorderRadius(Number(e.target.value))} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Card Padding (px)</label>
                  <input type="number" min="0" max="40" value={cardPadding} onChange={(e) => setCardPadding(Number(e.target.value))} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm" />
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {[140, 180, 220, 280, 350].map(h => (
                  <button key={h} onClick={() => setCardHeight(h)} className={`px-3 py-1.5 rounded-lg text-[10px] font-medium border transition-colors ${cardHeight === h ? 'bg-primary/20 text-primary border-primary/40' : 'bg-muted border-border text-muted-foreground hover:bg-muted/80'}`}>
                    {h}px
                  </button>
                ))}
              </div>
            </div>

            {/* Add new offerwall */}
            <div className="flex gap-2 mb-4">
              <input type="text" value={newOfferwall} onChange={(e) => setNewOfferwall(e.target.value)} placeholder="Name..." className="flex-1 px-2.5 py-1.5 bg-muted border border-border rounded-lg text-xs" />
              <select value={newProvider} onChange={(e) => setNewProvider(e.target.value)} className="px-2 py-1.5 bg-muted border border-border rounded-lg text-xs">
                {PROVIDER_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
              <button onClick={addOfferwall} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium flex items-center gap-1"><Plus className="w-3 h-3" /> Add</button>
            </div>

            {/* Serial List of Offerwalls */}
            <div className="space-y-2 mb-4 max-h-[55vh] overflow-y-auto pr-1">
              {offerwalls.length === 0 ? (
                <p className="text-center text-muted-foreground text-xs py-8">No offerwalls added yet</p>
              ) : (
                offerwalls.map((o, index) => (
                  <div
                    key={o.id}
                    className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border hover:bg-muted/70 transition-colors"
                  >
                    {/* Serial Number */}
                    <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {index + 1}
                    </div>

                    {/* Logo/Color */}
                    {o.logoUrl ? (
                      <img src={o.logoUrl} alt={o.name} className="w-8 h-8 rounded object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded flex items-center justify-center text-white font-bold text-xs flex-shrink-0" style={{ backgroundColor: o.color }}>
                        {o.name.charAt(0)}
                      </div>
                    )}

                    {/* Name & Provider */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{o.name}</div>
                      <div className="text-[10px] text-muted-foreground">{PROVIDER_OPTIONS.find(p => p.value === o.provider)?.label || 'Custom'}</div>
                    </div>

                    {/* Status Badge */}
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${o.enabled ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {o.enabled ? 'ON' : 'OFF'}
                    </span>

                    {/* Toggle */}
                    <button onClick={() => toggleOfferwall(o.id)} className="p-1.5 hover:bg-muted rounded">
                      {o.enabled ? <ToggleRight className="w-5 h-5 text-green-400" /> : <ToggleLeft className="w-5 h-5 text-red-400" />}
                    </button>

                    {/* Settings Button */}
                    <button
                      onClick={() => setSelectedWall(o)}
                      className="px-3 py-1.5 bg-primary/20 text-primary border border-primary/30 rounded-lg text-xs flex items-center gap-1 hover:bg-primary/30"
                    >
                      <Settings className="w-3 h-3" /> Settings
                    </button>

                    {/* Delete */}
                    <button onClick={() => removeOfferwall(o)} className="p-1.5 text-destructive hover:bg-destructive/10 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-1.5">
              <button onClick={handleSave} disabled={isSaving} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-gradient-to-r from-primary to-secondary text-primary-foreground font-semibold text-xs disabled:opacity-50">
                <Save className="w-3 h-3" /> {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
              <button onClick={loadSettings} className="flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-muted border border-border text-muted-foreground font-semibold text-xs">
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
