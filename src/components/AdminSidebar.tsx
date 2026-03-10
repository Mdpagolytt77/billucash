import { Link, useLocation } from 'react-router-dom';
import { 
  Home, Users, Wallet, FileCheck, Palette, Layers, 
  Volume2, Image, Key, LogOut, X, ArrowLeft, Share2, Shield, Building2, Star, CreditCard, Activity, Upload, AlertTriangle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { SiteLogo } from '@/contexts/SiteSettingsContext';
import { toast } from 'sonner';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const AdminSidebar = ({ isOpen, onClose }: AdminSidebarProps) => {
  const location = useLocation();
  const { signOut, isAdmin, isModerator } = useAuth();
  const isReadOnly = isModerator && !isAdmin;
  
  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    await signOut();
    toast.success('Logged out');
  };

  const allNavItems = [
    { icon: Home, label: 'Dashboard', path: '/admin' },
    { icon: Users, label: 'All Users', path: '/admin/users' },
    { icon: FileCheck, label: 'Completed', path: '/admin/offers' },
    { icon: Shield, label: 'Admin Roles', path: '/admin/roles' },
    { icon: Wallet, label: 'Withdraw', path: '/admin/withdraw' },
    { icon: CreditCard, label: 'Payment Methods', path: '/admin/payment-methods' },
    
    { icon: Palette, label: 'Logo', path: '/admin/logo' },
    { icon: Layers, label: 'Offerwall', path: '/admin/offerwall' },
    { icon: Star, label: 'Featured Offers', path: '/admin/featured-offers' },
    { icon: Building2, label: 'Providers', path: '/admin/providers' },
    { icon: Activity, label: 'Live Tracker', path: '/admin/live-tracker' },
    { icon: Share2, label: 'Social Links', path: '/admin/social' },
    { icon: Volume2, label: 'Sound', path: '/admin/sound' },
    { icon: Image, label: 'Background', path: '/admin/background' },
    { icon: Image, label: 'Homepage Images', path: '/admin/homepage-images' },
    { icon: Upload, label: 'Notik Import', path: '/admin/notik-import' },
    { icon: AlertTriangle, label: 'Chargeback', path: '/admin/chargeback' },
    { icon: Key, label: 'Password', path: '/admin/password' },
  ];

  // Moderators can only see All Users and Completed Offers
  const navItems = isReadOnly
    ? allNavItems.filter(item => ['/admin/users'].includes(item.path))
    : allNavItems;

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black/70 z-40 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-44 bg-background border-r border-border z-50 transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-2.5">
          <div className="flex items-center justify-between mb-2">
            <SiteLogo size="sm" />
            <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          
          {isReadOnly && (
            <div className="mb-2 px-2 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
              <p className="text-[10px] text-yellow-500 font-medium">👁️ Read-Only Mode</p>
              <p className="text-[9px] text-muted-foreground">You can view but not edit</p>
            </div>
          )}
          
          <nav className="space-y-0.5">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] transition-colors ${
                  isActive(item.path)
                    ? 'bg-primary/20 text-primary font-medium'
                    : 'hover:bg-muted text-muted-foreground'
                }`}
              >
                <item.icon className="w-3 h-3" /> {item.label}
              </Link>
            ))}
            
            <div className="pt-1.5 border-t border-border mt-1.5">
              <Link
                to="/dashboard"
                onClick={onClose}
                className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] text-primary hover:bg-muted"
              >
                <ArrowLeft className="w-3 h-3" /> Back
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] text-destructive hover:bg-destructive/10"
              >
                <LogOut className="w-3 h-3" /> Logout
              </button>
            </div>
          </nav>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
