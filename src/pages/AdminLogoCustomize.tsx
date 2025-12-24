import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Palette, ArrowLeft, Menu, Home, Users, Wallet, Key, LogOut, Save, RotateCcw, Eye, Upload, FileCheck, Image } from 'lucide-react';
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
  const [logoImage, setLogoImage] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [logoType, setLogoType] = useState<'text' | 'image'>('text');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedText = localStorage.getItem('siteLogo');
    const savedImage = localStorage.getItem('siteLogoImage');
    const savedType = localStorage.getItem('siteLogoType') as 'text' | 'image' | null;
    
    if (savedText) {
      setLogoText(savedText);
      setPreviewText(savedText);
    }
    if (savedImage) {
      setLogoImage(savedImage);
      setPreviewImage(savedImage);
    }
    if (savedType) {
      setLogoType(savedType);
    }
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image must be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setLogoImage(base64);
        setPreviewImage(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    localStorage.setItem('siteLogo', logoText);
    localStorage.setItem('siteLogoType', logoType);
    if (logoImage) {
      localStorage.setItem('siteLogoImage', logoImage);
    }
    setPreviewText(logoText);
    setPreviewImage(logoImage);
    toast.success('Logo updated! Refresh other pages to see changes.');
  };

  const handleReset = () => {
    const defaultLogo = 'BILLUCASH';
    setLogoText(defaultLogo);
    setPreviewText(defaultLogo);
    setLogoImage(null);
    setPreviewImage(null);
    setLogoType('text');
    localStorage.setItem('siteLogo', defaultLogo);
    localStorage.setItem('siteLogoType', 'text');
    localStorage.removeItem('siteLogoImage');
    toast.success('Logo reset to default');
  };

  const sidebarItems = [
    { icon: Home, label: 'Dashboard', path: '/admin' },
    { icon: Users, label: 'All Users', path: '/admin/users' },
    { icon: Wallet, label: 'Withdraw', path: '/admin/withdraw' },
    { icon: FileCheck, label: 'Completed Offers', path: '/admin/offers' },
    { icon: Palette, label: 'Logo Customize', path: '/admin/logo', active: true },
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
            <span className="logo-3d text-xs">Logo</span>
          </div>
          <div className="flex items-center gap-1.5">
            <SnowToggle enabled={snowEnabled} onToggle={toggleSnow} />
            <Link to="/admin" className="p-1.5 hover:bg-muted rounded-lg text-primary"><ArrowLeft className="w-4 h-4" /></Link>
          </div>
        </header>

        <main className="p-3 md:px-[5%] max-w-md mx-auto">
          <div className="glass-card p-4">
            <h2 className="text-sm font-bold text-primary flex items-center gap-1.5 mb-4">
              <Palette className="w-4 h-4" /> Logo Customize
            </h2>

            {/* Preview */}
            <div className="mb-4 p-4 bg-muted/50 rounded-lg text-center border border-border">
              <p className="text-[9px] text-muted-foreground mb-2 flex items-center justify-center gap-1">
                <Eye className="w-2.5 h-2.5" /> Preview
              </p>
              {logoType === 'image' && previewImage ? (
                <img src={previewImage} alt="Logo" className="max-h-12 mx-auto object-contain" />
              ) : (
                <div className="logo-3d text-2xl">{previewText}</div>
              )}
            </div>

            {/* Logo Type Toggle */}
            <div className="flex gap-1.5 mb-3">
              <button
                onClick={() => setLogoType('text')}
                className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-medium transition-colors ${
                  logoType === 'text' ? 'bg-primary text-white' : 'bg-muted border border-border'
                }`}
              >
                Text Logo
              </button>
              <button
                onClick={() => setLogoType('image')}
                className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-medium transition-colors ${
                  logoType === 'image' ? 'bg-primary text-white' : 'bg-muted border border-border'
                }`}
              >
                <Image className="w-3 h-3" /> Image Logo
              </button>
            </div>

            <div className="space-y-3">
              {logoType === 'text' ? (
                <div>
                  <label className="text-[9px] text-muted-foreground block mb-1">Logo Text</label>
                  <input
                    type="text"
                    value={logoText}
                    onChange={(e) => setLogoText(e.target.value.toUpperCase())}
                    placeholder="Enter logo text"
                    className="w-full px-2.5 py-1.5 bg-muted border border-border rounded-lg text-xs uppercase font-bold"
                    maxLength={15}
                  />
                  <p className="text-[8px] text-muted-foreground mt-0.5">{logoText.length}/15</p>
                </div>
              ) : (
                <div>
                  <label className="text-[9px] text-muted-foreground block mb-1">Upload PNG Logo</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-muted border border-dashed border-border rounded-lg text-[10px] hover:border-primary transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {logoImage ? 'Change Image' : 'Upload PNG Image'}
                  </button>
                  <p className="text-[8px] text-muted-foreground mt-1">Max 2MB, PNG/JPG</p>
                </div>
              )}

              <div className="flex gap-1.5">
                <button
                  onClick={handleSave}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-gradient-to-r from-primary to-secondary text-white font-semibold text-[10px]"
                >
                  <Save className="w-3 h-3" /> Save
                </button>
                <button
                  onClick={handleReset}
                  className="flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-muted border border-border text-muted-foreground font-semibold text-[10px] hover:bg-muted/80"
                >
                  <RotateCcw className="w-3 h-3" /> Reset
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
