import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Lock, Save, RotateCcw, Trash2, Camera, Award, Menu, X, Home, Trophy, Wallet, Shield, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import LoadingScreen from '@/components/LoadingScreen';
import heroBg from '@/assets/hero-bg.jpg';

const ProfileSettings = () => {
  const navigate = useNavigate();
  const { user, profile, isLoading, isAdmin, signOut } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLoading, setShowLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    username: profile?.username || '',
    email: profile?.email || user?.email || '',
    phone: '',
    country: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    const timer = setTimeout(() => setShowLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        username: profile.username || '',
        email: profile.email || user?.email || '',
      }));
    }
  }, [profile, user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!formData.username) {
      toast.error('Username is required');
      return;
    }

    if (formData.newPassword || formData.confirmPassword) {
      if (formData.newPassword !== formData.confirmPassword) {
        toast.error('New passwords do not match');
        return;
      }
      if (formData.newPassword.length < 6) {
        toast.error('Password must be at least 6 characters');
        return;
      }
    }

    setIsSaving(true);

    try {
      if (user) {
        const { error } = await supabase
          .from('profiles')
          .update({ username: formData.username })
          .eq('id', user.id);

        if (error) throw error;
      }

      if (formData.newPassword) {
        const { error } = await supabase.auth.updateUser({
          password: formData.newPassword
        });
        if (error) throw error;
        toast.success('Password updated successfully');
      }

      toast.success('Profile updated successfully');
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setFormData({
      username: profile?.username || '',
      email: profile?.email || user?.email || '',
      phone: '',
      country: '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    toast.success('Form reset to saved values');
  };

  const handleDeleteAccount = () => {
    toast.info('Account deletion feature coming soon');
  };

  const handleLogout = async () => {
    await signOut();
    toast.success('Logged out');
    navigate('/');
  };

  if (isLoading || showLoading) {
    return <LoadingScreen isLoading={true} />;
  }

  return (
    <>
      {/* Sidebar Overlay */}
      <div 
        className={`fixed inset-0 bg-black/70 z-40 transition-opacity ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-56 bg-background border-r border-border z-50 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 pt-20">
          <div className="text-center mb-6 pb-4 border-b border-border">
            <div className="logo-3d text-lg">BILLUCASH</div>
          </div>
          <nav className="space-y-2">
            <Link 
              to="/dashboard"
              onClick={() => setSidebarOpen(false)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted text-sm transition-colors"
            >
              <Home className="w-4 h-4 text-primary" /> Dashboard
            </Link>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/20 text-primary text-sm font-medium"
            >
              <User className="w-4 h-4" /> Profile Settings
            </button>
            <Link 
              to="/leaderboard"
              onClick={() => setSidebarOpen(false)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted text-sm transition-colors"
            >
              <Trophy className="w-4 h-4 text-primary" /> Leaderboard
            </Link>
            <Link 
              to="/withdraw"
              onClick={() => setSidebarOpen(false)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted text-sm transition-colors"
            >
              <Wallet className="w-4 h-4 text-primary" /> Withdraw
            </Link>
            {isAdmin && (
              <Link 
                to="/admin" 
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-500/20 text-yellow-400 text-sm font-medium"
              >
                <Shield className="w-4 h-4" /> Admin Panel
              </Link>
            )}
            <div className="pt-3 border-t border-border mt-3">
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-destructive hover:bg-destructive/10 text-sm transition-colors"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          </nav>
        </div>
      </aside>

      <div 
        className="min-h-screen"
        style={{
          background: `linear-gradient(rgba(0,0,0,0.8), rgba(0,0,0,0.8)), url(${heroBg}) no-repeat center center fixed`,
          backgroundSize: 'cover',
        }}
      >
        {/* Header */}
        <header className="sticky top-0 z-30 px-4 md:px-[5%] py-4 bg-background/95 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)} 
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center font-bold text-lg">B</div>
            <div className="logo-3d text-xl">BILLUCASH</div>
          </div>
        </header>

        {/* Main Content */}
        <main className="px-4 md:px-[5%] py-8 max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-[280px_1fr] gap-6">
            
            {/* Sidebar - Profile Card */}
            <div className="bg-background/90 border border-border rounded-xl p-6 h-fit">
              <div className="text-center">
                <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-3xl font-bold mb-4">
                  {profile?.username?.charAt(0).toUpperCase() || 'U'}
                </div>
                <h2 className="text-xl font-bold mb-1">{profile?.username || 'User'}</h2>
                <p className="text-sm text-muted-foreground mb-4">{profile?.email || user?.email}</p>
                
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-muted rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-primary">0</div>
                    <div className="text-xs text-muted-foreground">Tasks</div>
                  </div>
                  <div className="bg-muted rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-primary flex items-center justify-center gap-1">
                      <Award className="w-4 h-4" /> Bronze
                    </div>
                    <div className="text-xs text-muted-foreground">Level</div>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground mb-4">
                  Member since {new Date().getFullYear()}
                </p>

                <div className="space-y-2">
                  <button className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-sm">
                    <Camera className="w-4 h-4" /> Change Picture
                  </button>
                </div>
              </div>
            </div>

            {/* Form Section */}
            <div className="bg-background/90 border border-border rounded-xl p-6">
              <h2 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
                <User className="w-5 h-5" /> Edit Profile
              </h2>

              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Username *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Your username"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-muted/50 border border-border text-sm text-muted-foreground cursor-not-allowed"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Your phone number"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Country</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Your country"
                    />
                  </div>
                </div>
              </div>

              {/* Password Section */}
              <div className="bg-muted/50 rounded-lg p-4 mb-6">
                <h3 className="text-base font-semibold text-primary mb-4 flex items-center gap-2">
                  <Lock className="w-4 h-4" /> Change Password
                </h3>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Current Password</label>
                    <input
                      type="password"
                      name="currentPassword"
                      value={formData.currentPassword}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="••••••"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">New Password</label>
                    <input
                      type="password"
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="••••••"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Confirm Password</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="••••••"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3 justify-end">
                <button 
                  onClick={handleReset}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-sm"
                >
                  <RotateCcw className="w-4 h-4" /> Reset
                </button>
                <button 
                  onClick={handleDeleteAccount}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors text-sm"
                >
                  <Trash2 className="w-4 h-4" /> Delete Account
                </button>
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-primary to-secondary text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  <Save className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default ProfileSettings;