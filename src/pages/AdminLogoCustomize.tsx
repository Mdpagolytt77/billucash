import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Palette, ArrowLeft, Menu, Home, Users, Wallet, Key, LogOut, Save, RotateCcw, Eye } from 'lucide-react';
import heroBg from '@/assets/hero-bg.jpg';
import SnowEffect from '@/components/SnowEffect';
import SnowToggle from '@/components/SnowToggle';
import { useSnowEffect } from '@/hooks/useSnowEffect';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const AdminLogoCustomize = () => {
  const { isAdmin, signOut } = useAuth();
  const { snowEnabled, toggleSnow } = useSnowEffect();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logoText, setLogoText] = useState('BILLUCASH');
  const [previewText, setPreviewText] = useState('BILLUCASH');

  useEffect(() => {
    const saved = localStorage.getItem('siteLogo');
    if (saved) {
      setLogoText(saved);
      setPreviewText(saved);
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('siteLogo', logoText);
    setPreviewText(logoText);
    toast.success('Logo updated successfully! Refresh other pages to see changes.');
  };

  const handleReset = () => {
    const defaultLogo = 'BILLUCASH';
    setLogoText(defaultLogo);
    setPreviewText(defaultLogo);
    localStorage.setItem('siteLogo', defaultLogo);
    toast.success('Logo reset to default');
  };

  const sidebarItems = [
    { icon: Home, label: 'Dashboard', path: '/admin' },
    { icon: Users, label: 'All Users', path: '/admin/users' },
    { icon: Wallet, label: 'Withdraw', path: '/admin/withdraw' },
    { icon: Palette, label: 'Logo Customize', path: '/admin/logo', active: true },
    { icon: Key, label: 'Password Reset', path: '/admin/password' },
  ];

  if (!isAdmin) return <div className="min-h-screen flex items-center justify-center">Access Denied</div>;

  return (
    <>
      {snowEnabled && <SnowEffect />}
      
      <div className={`fixed inset-0 bg-black/70 z-40 transition-opacity ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setSidebarOpen(false)} />

      <aside className={`fixed top-0 left-0 h-full w-56 bg-background border-r border-border z-50 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 pt-20">
          <div className="text-center mb-6 pb-4 border-b border-border">
            <div className="logo-3d text-lg">BILLUCASH</div>
          </div>
          <nav className="space-y-1">
            {sidebarItems.map((item, i) => (
              <Link key={i} to={item.path} onClick={() => setSidebarOpen(false)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  item.active ? 'bg-primary/20 text-primary font-medium' : 'hover:bg-muted text-muted-foreground'
                }`}
              >
                <item.icon className="w-4 h-4" /> {item.label}
              </Link>
            ))}
            <div className="pt-3 border-t border-border mt-3">
              <button onClick={() => signOut()} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-destructive hover:bg-destructive/10 text-sm">
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          </nav>
        </div>
      </aside>

      <div className="min-h-screen" style={{ background: `linear-gradient(rgba(0,0,0,0.85), rgba(0,0,0,0.85)), url(${heroBg}) no-repeat center center fixed`, backgroundSize: 'cover' }}>
        <header className="sticky top-0 z-30 px-4 py-3 bg-background/95 backdrop-blur-lg border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-muted rounded-lg"><Menu className="w-5 h-5" /></button>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center font-bold text-sm">B</div>
            <span className="logo-3d text-base">Logo</span>
          </div>
          <div className="flex items-center gap-2">
            <SnowToggle enabled={snowEnabled} onToggle={toggleSnow} />
            <Link to="/admin" className="p-2 hover:bg-muted rounded-lg text-primary"><ArrowLeft className="w-5 h-5" /></Link>
          </div>
        </header>

        <main className="p-4 md:px-[5%] max-w-lg mx-auto">
          <div className="glass-card p-6">
            <h2 className="text-lg font-bold text-primary flex items-center gap-2 mb-6">
              <Palette className="w-5 h-5" /> Logo Customize
            </h2>

            {/* Preview */}
            <div className="mb-6 p-6 bg-muted/50 rounded-xl text-center border border-border">
              <p className="text-xs text-muted-foreground mb-3 flex items-center justify-center gap-1">
                <Eye className="w-3 h-3" /> Preview
              </p>
              <div className="logo-3d text-3xl">{previewText}</div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Logo Text</label>
                <input
                  type="text"
                  value={logoText}
                  onChange={(e) => setLogoText(e.target.value.toUpperCase())}
                  placeholder="Enter logo text"
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm uppercase font-bold"
                  maxLength={15}
                />
                <p className="text-[10px] text-muted-foreground mt-1">{logoText.length}/15 characters</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-primary to-secondary text-white font-semibold text-sm"
                >
                  <Save className="w-4 h-4" /> Save Logo
                </button>
                <button
                  onClick={handleReset}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-muted border border-border text-muted-foreground font-semibold text-sm hover:bg-muted/80"
                >
                  <RotateCcw className="w-4 h-4" /> Reset
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default AdminLogoCustomize;
