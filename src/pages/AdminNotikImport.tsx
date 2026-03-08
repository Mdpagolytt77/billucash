import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Upload, ArrowLeft, Menu, Trash2, RefreshCw, Download } from 'lucide-react';
import SnowEffect from '@/components/SnowEffect';
import SnowToggle from '@/components/SnowToggle';
import AdminSidebar from '@/components/AdminSidebar';
import { useSnowEffect } from '@/hooks/useSnowEffect';
import { useAuth } from '@/contexts/AuthContext';
import { SiteLogo } from '@/contexts/SiteSettingsContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const AdminNotikImport = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const { snowEnabled, toggleSnow } = useSnowEffect();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [importing, setImporting] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [lastResult, setLastResult] = useState<{ synced: number; errors: number } | null>(null);

  const NOTIK_API_URL = 'https://notik.me/api/v2/get-offers?api_key=UHG9XwxbMCe80St1fjdiFRZRh8fAqJhX&pub_id=R8Yo4E&app_id=3VgSKty9T9';

  const handleFetchFromAPI = async () => {
    setFetching(true);
    try {
      const res = await fetch(NOTIK_API_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      setJsonInput(text);
      toast.success('JSON fetched! এখন Import Offers চাপো');
    } catch (e: any) {
      toast.error('Fetch failed (CORS block হতে পারে) — browser এ URL open করে manually copy করো');
    } finally { setFetching(false); }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-xl font-bold mb-2">Access Denied</h1>
          <Link to="/dashboard" className="text-primary text-sm">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  const handleImport = async () => {
    if (!jsonInput.trim()) { toast.error('JSON paste করো আগে'); return; }
    setImporting(true);
    setLastResult(null);
    try {
      const parsed = JSON.parse(jsonInput.trim());
      let offers: any[] = [];
      if (parsed.offers?.data && Array.isArray(parsed.offers.data)) offers = parsed.offers.data;
      else if (parsed.offers && Array.isArray(parsed.offers)) offers = parsed.offers;
      else if (parsed.data && Array.isArray(parsed.data)) offers = parsed.data;
      else if (Array.isArray(parsed)) offers = parsed;
      else { toast.error('Valid offers array পাওয়া যায়নি'); setImporting(false); return; }

      if (offers.length === 0) { toast.error('কোনো offer নেই'); setImporting(false); return; }

      await supabase.from('notik_offers').update({ is_active: false, updated_at: new Date().toISOString() }).eq('is_active', true);

      let synced = 0, errors = 0;
      for (let i = 0; i < offers.length; i += 50) {
        const batch = offers.slice(i, i + 50).map((o: any) => {
          const payoutUsd = parseFloat(o.payout || o.amount || '0') || 0;
          const desc = o.description1 || o.offer_desc || o.description || '';
          const platforms = Array.isArray(o.devices) ? o.devices.join(',') : (o.platform || o.os || null);
          const os = Array.isArray(o.os) ? o.os.join(',') : null;
          const categories = Array.isArray(o.categories) ? o.categories.join(',') : (o.category || o.offer_type || null);
          const countryCode = o.country_code || o.country || o.countries || null;
          return {
            id: String(o.offer_id || o.id || `notik_${Date.now()}_${Math.random()}`),
            name: o.name || o.offer_name || 'Notik Offer',
            description: desc,
            image_url: o.image_url || o.icon_url || o.thumbnail || null,
            click_url: o.click_url || o.tracking_url || o.link || null,
            payout: payoutUsd,
            coins: Math.round(payoutUsd * 500),
            country: countryCode,
            platform: platforms || os,
            category: categories,
            is_active: true,
            updated_at: new Date().toISOString(),
          };
        });
        const { error } = await supabase.from('notik_offers').upsert(batch, { onConflict: 'id' });
        if (error) { console.error('Batch error:', error); errors += batch.length; }
        else synced += batch.length;
      }
      setLastResult({ synced, errors });
      toast.success(`${synced} offers imported!`);
      if (errors > 0) toast.error(`${errors} failed`);
    } catch (e: any) {
      toast.error('Invalid JSON: ' + (e.message || 'Parse error'));
    } finally { setImporting(false); }
  };

  const handleClearAll = async () => {
    setClearing(true);
    try {
      const { error } = await supabase.from('notik_offers').update({ is_active: false, updated_at: new Date().toISOString() }).eq('is_active', true);
      if (error) throw error;
      toast.success('All Notik offers cleared');
    } catch (e: any) { toast.error(e.message || 'Failed'); }
    finally { setClearing(false); }
  };

  return (
    <>
      {snowEnabled && <SnowEffect />}
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="min-h-screen" style={{ background: '#000000' }}>
        <header className="sticky top-0 z-30 px-3 py-2 border-b flex items-center justify-between" style={{ background: '#0a0a0a', borderColor: '#1a1a1a' }}>
          <div className="flex items-center gap-2">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 hover:bg-muted rounded-lg"><Menu className="w-4 h-4" /></button>
            <SiteLogo size="sm" />
          </div>
          <SnowToggle enabled={snowEnabled} onToggle={toggleSnow} />
        </header>

        <div className="px-3 md:px-[5%] py-4 max-w-3xl mx-auto">
          <button onClick={() => navigate('/admin')} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary mb-4">
            <ArrowLeft className="w-3 h-3" /> Back to Admin
          </button>
          <h1 className="text-lg font-bold text-primary mb-1">Notik Offers Import</h1>
          <p className="text-xs text-muted-foreground mb-4">
            নিচের "Fetch from API" বাটন চাপো — অটো JSON নিয়ে আসবে। যদি কাজ না করে, browser এ URL open করে manually paste করো।
          </p>

          <div className="p-4 rounded-xl mb-4" style={{ background: '#111111', border: '1px solid #1a1a1a' }}>
            <button onClick={handleFetchFromAPI} disabled={fetching}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent hover:bg-accent/80 text-accent-foreground text-xs font-semibold disabled:opacity-50 transition-colors mb-3 w-full justify-center">
              {fetching ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
              {fetching ? 'Fetching...' : '⚡ Fetch from API (Auto)'}
            </button>
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder='Auto fetch করো অথবা manually JSON paste করো...'
              className="w-full h-48 bg-background/50 border border-border rounded-lg p-3 text-xs font-mono text-foreground placeholder:text-muted-foreground resize-y focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <div className="flex gap-2 mt-3">
              <button onClick={handleImport} disabled={importing || !jsonInput.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold disabled:opacity-50 transition-colors">
                {importing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                {importing ? 'Importing...' : 'Import Offers'}
              </button>
              <button onClick={handleClearAll} disabled={clearing}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-destructive/20 hover:bg-destructive/30 text-destructive text-xs font-semibold disabled:opacity-50 transition-colors">
                <Trash2 className="w-3 h-3" /> {clearing ? 'Clearing...' : 'Clear All'}
              </button>
            </div>
          </div>

          {lastResult && (
            <div className="p-3 rounded-xl" style={{ background: '#111111', border: '1px solid #1a1a1a' }}>
              <p className="text-xs font-medium text-primary">
                ✅ {lastResult.synced} offers imported
                {lastResult.errors > 0 && <span className="text-destructive ml-2">❌ {lastResult.errors} failed</span>}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminNotikImport;
