import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Lock, Save, RotateCcw, Trash2, Camera, Award, Menu } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import LoadingScreen from '@/components/LoadingScreen';
import AppSidebar from '@/components/AppSidebar';
import { SiteLogo } from '@/contexts/SiteSettingsContext';
import heroBg from '@/assets/hero-bg.jpg';

const ProfileSettings = () => {
  const navigate = useNavigate();
  const { user, profile, isLoading, signOut } = useAuth();
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

  if (isLoading || showLoading) {
    return <LoadingScreen isLoading={true} />;
  }

  return (
    <>
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div 
        className="min-h-screen"
        style={{
          background: `linear-gradient(rgba(0,0,0,0.8), rgba(0,0,0,0.8)), url(${heroBg}) no-repeat center center fixed`,
          backgroundSize: 'cover',
        }}
      >
        <header className="sticky top-0 z-30 px-3 md:px-[5%] py-2 bg-background/95 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)} 
              className="p-1.5 hover:bg-muted rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <SiteLogo size="sm" />
          </div>
        </header>

        <main className="px-3 md:px-[5%] py-6 max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-[240px_1fr] gap-4">
            
            {/* Profile Card */}
            <div className="bg-background/90 border border-border rounded-xl p-4 h-fit">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-2xl font-bold mb-3">
                  {profile?.username?.charAt(0).toUpperCase() || 'U'}
                </div>
                <h2 className="text-base font-bold mb-0.5">{profile?.username || 'User'}</h2>
                <p className="text-xs text-muted-foreground mb-3">{profile?.email || user?.email}</p>
                
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-muted rounded-lg p-2 text-center">
                    <div className="text-sm font-bold text-primary">0</div>
                    <div className="text-[9px] text-muted-foreground">Tasks</div>
                  </div>
                  <div className="bg-muted rounded-lg p-2 text-center">
                    <div className="text-sm font-bold text-primary flex items-center justify-center gap-1">
                      <Award className="w-3 h-3" /> Bronze
                    </div>
                    <div className="text-[9px] text-muted-foreground">Level</div>
                  </div>
                </div>

                <p className="text-[9px] text-muted-foreground mb-3">
                  Member since {new Date().getFullYear()}
                </p>

                <button className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-xs">
                  <Camera className="w-3.5 h-3.5" /> Change Picture
                </button>
              </div>
            </div>

            {/* Form Section */}
            <div className="bg-background/90 border border-border rounded-xl p-4">
              <h2 className="text-base font-bold text-primary mb-4 flex items-center gap-2">
                <User className="w-4 h-4" /> Edit Profile
              </h2>

              <div className="grid sm:grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5">Username *</label>
                  <div className="relative">
                    <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      className="w-full pl-8 pr-3 py-2 rounded-lg bg-muted border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Your username"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5">Email *</label>
                  <div className="relative">
                    <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled
                      className="w-full pl-8 pr-3 py-2 rounded-lg bg-muted/50 border border-border text-xs text-muted-foreground cursor-not-allowed"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5">Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full pl-8 pr-3 py-2 rounded-lg bg-muted border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Your phone number"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5">Country</label>
                  <div className="relative">
                    <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      className="w-full pl-8 pr-3 py-2 rounded-lg bg-muted border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Your country"
                    />
                  </div>
                </div>
              </div>

              {/* Password Section */}
              <div className="bg-muted/50 rounded-lg p-3 mb-4">
                <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" /> Change Password
                </h3>
                <div className="grid sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1.5">Current</label>
                    <input
                      type="password"
                      name="currentPassword"
                      value={formData.currentPassword}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="••••••"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5">New</label>
                    <input
                      type="password"
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="••••••"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5">Confirm</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="••••••"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 justify-end">
                <button 
                  onClick={handleReset}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset
                </button>
                <button 
                  onClick={handleDeleteAccount}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors text-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-secondary text-white font-semibold text-xs hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" /> {isSaving ? 'Saving...' : 'Save'}
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
