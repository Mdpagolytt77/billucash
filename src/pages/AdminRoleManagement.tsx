import { useState, useEffect } from 'react';
import { Shield, Menu, RefreshCw, UserPlus, UserMinus, Search, Crown, Users } from 'lucide-react';
import heroBg from '@/assets/hero-bg.jpg';
import SnowEffect from '@/components/SnowEffect';
import SnowToggle from '@/components/SnowToggle';
import AdminSidebar from '@/components/AdminSidebar';
import { useSnowEffect } from '@/hooks/useSnowEffect';
import { useAuth } from '@/contexts/AuthContext';
import { SiteLogo, useSiteSettings, getBackgroundStyle } from '@/contexts/SiteSettingsContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
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

type AppRole = 'admin' | 'moderator' | 'user';

interface UserWithRole {
  id: string;
  username: string;
  email: string;
  role: AppRole;
}

const MAX_ADMINS = 1;
const MAX_MODERATORS = 3;

const AdminRoleManagement = () => {
  const { isAdmin, isModerator } = useAuth();
  const isReadOnly = isModerator && !isAdmin;
  const canAccess = isAdmin || isModerator;
  const { snowEnabled, toggleSnow } = useSnowEffect();
  const { background: siteBackground } = useSiteSettings();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [userToRemove, setUserToRemove] = useState<UserWithRole | null>(null);
  const [actionType, setActionType] = useState<'remove-admin' | 'remove-moderator' | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, email')
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');
      
      if (rolesError) throw rolesError;

      const usersWithRoles: UserWithRole[] = (data || []).map(user => {
        const userRole = roles?.find(r => r.user_id === user.id);
        return {
          ...user,
          role: (userRole?.role as AppRole) || 'user'
        };
      });

      setUsers(usersWithRoles);
    } catch (error: any) {
      toast.error('Failed to load users');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (canAccess) fetchUsers();
  }, [canAccess]);

  // Real-time subscription for user_roles changes
  useEffect(() => {
    if (!canAccess) return;
    const channel = supabase
      .channel('user-roles-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_roles'
        },
        () => {
          // Refresh the list when roles change
          fetchUsers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [canAccess]);

  const admins = users.filter(u => u.role === 'admin');
  const moderators = users.filter(u => u.role === 'moderator');

  const handleMakeAdmin = async (userId: string, username: string) => {
    if (admins.length >= MAX_ADMINS) {
      toast.error(`Maximum ${MAX_ADMINS} admin allowed! Remove existing admin first.`);
      return;
    }

    try {
      const { data: existing } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('user_roles')
          .update({ role: 'admin' })
          .eq('user_id', userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: 'admin' });
        if (error) throw error;
      }

      toast.success(`${username} is now an Admin!`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update role');
    }
  };

  const handleMakeModerator = async (userId: string, username: string) => {
    if (moderators.length >= MAX_MODERATORS) {
      toast.error(`Maximum ${MAX_MODERATORS} moderators allowed!`);
      return;
    }

    try {
      const { data: existing } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('user_roles')
          .update({ role: 'moderator' })
          .eq('user_id', userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: 'moderator' });
        if (error) throw error;
      }

      toast.success(`${username} is now a Moderator!`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update role');
    }
  };

  const handleRemoveRole = async (userId: string, username: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: 'user' })
        .eq('user_id', userId);
      
      if (error) throw error;
      toast.success(`${username} is now a regular user`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update role');
    }
  };

  const confirmRemove = () => {
    if (userToRemove) {
      handleRemoveRole(userToRemove.id, userToRemove.username);
      setUserToRemove(null);
      setActionType(null);
    }
  };

  const openRemoveDialog = (user: UserWithRole, type: 'remove-admin' | 'remove-moderator') => {
    setUserToRemove(user);
    setActionType(type);
  };

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const regularUsers = filteredUsers.filter(u => u.role === 'user');

  if (!canAccess) {
    return <div className="min-h-screen flex items-center justify-center">Access Denied</div>;
  }

  return (
    <>
      {snowEnabled && <SnowEffect />}
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="min-h-screen" style={getBackgroundStyle(siteBackground, heroBg)}>
        <header className="sticky top-0 z-30 px-3 py-2 bg-background/95 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 hover:bg-muted rounded-lg">
              <Menu className="w-4 h-4" />
            </button>
            <SiteLogo size="sm" />
            <span className="text-xs text-muted-foreground">/ Admin Roles</span>
          </div>
          <SnowToggle enabled={snowEnabled} onToggle={toggleSnow} />
        </header>

        <main className="p-3 md:px-[5%]">
          {/* Info Card */}
          <div className="glass-card p-3 mb-3 border-l-4 border-primary">
            <h3 className="text-xs font-bold text-primary mb-1">🔐 Admin & Moderator Management</h3>
            <p className="text-[10px] text-muted-foreground">
              1 জন Main Admin এবং সর্বোচ্চ 3 জন Moderator রাখতে পারবেন। Real-time আপডেট হয়।
            </p>
          </div>

          {/* Search & Refresh */}
          <div className="flex items-center gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input 
                placeholder="Search by username or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>
            <button 
              onClick={fetchUsers} 
              disabled={isLoading}
              className="p-2 bg-primary/20 rounded-lg hover:bg-primary/30"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-primary ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Main Admin Section */}
          <div className="glass-card p-3 mb-3 border border-yellow-500/30">
            <h2 className="text-sm font-bold text-yellow-500 flex items-center gap-1.5 mb-3">
              <Crown className="w-4 h-4" /> Main Admin
              <span className="text-[10px] bg-yellow-500/20 text-yellow-500 px-1.5 py-0.5 rounded-full">
                {admins.length}/{MAX_ADMINS}
              </span>
            </h2>

            <div className="space-y-1.5">
              {admins.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No admin assigned</p>
              ) : (
                admins.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                    <div className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-yellow-500" />
                      <div>
                        <p className="text-xs font-medium text-yellow-500">{user.username}</p>
                        <p className="text-[10px] text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    {!isReadOnly && (
                      <button
                        onClick={() => openRemoveDialog(user, 'remove-admin')}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-destructive/20 text-destructive text-[10px] font-medium hover:bg-destructive/30"
                      >
                        <UserMinus className="w-3 h-3" /> Remove
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Moderators Section */}
          <div className="glass-card p-3 mb-3 border border-blue-500/30">
            <h2 className="text-sm font-bold text-blue-500 flex items-center gap-1.5 mb-3">
              <Shield className="w-4 h-4" /> Moderators
              <span className="text-[10px] bg-blue-500/20 text-blue-500 px-1.5 py-0.5 rounded-full">
                {moderators.length}/{MAX_MODERATORS}
              </span>
            </h2>

            <div className="space-y-1.5">
              {moderators.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No moderators assigned</p>
              ) : (
                moderators.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-2 rounded-lg bg-blue-500/10 border border-blue-500/30">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-blue-500" />
                      <div>
                        <p className="text-xs font-medium text-blue-500">{user.username}</p>
                        <p className="text-[10px] text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    {!isReadOnly && (
                      <button
                        onClick={() => openRemoveDialog(user, 'remove-moderator')}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-destructive/20 text-destructive text-[10px] font-medium hover:bg-destructive/30"
                      >
                        <UserMinus className="w-3 h-3" /> Remove
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Regular Users Section */}
          <div className="glass-card p-3">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5 mb-3">
              <Users className="w-4 h-4" /> Regular Users
              <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">{regularUsers.length}</span>
            </h2>

            <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
              {regularUsers.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No users found</p>
              ) : (
                regularUsers.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border hover:bg-muted/50">
                    <div>
                      <p className="text-xs font-medium">{user.username}</p>
                      <p className="text-[10px] text-muted-foreground">{user.email}</p>
                    </div>
                    {!isReadOnly && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleMakeAdmin(user.id, user.username)}
                          disabled={admins.length >= MAX_ADMINS}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-yellow-500/20 text-yellow-500 text-[10px] font-medium hover:bg-yellow-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Crown className="w-3 h-3" /> Admin
                        </button>
                        <button
                          onClick={() => handleMakeModerator(user.id, user.username)}
                          disabled={moderators.length >= MAX_MODERATORS}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-500/20 text-blue-500 text-[10px] font-medium hover:bg-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Shield className="w-3 h-3" /> Mod
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </main>

        {/* Confirmation Dialog */}
        <AlertDialog open={!!userToRemove} onOpenChange={(open) => { if (!open) { setUserToRemove(null); setActionType(null); } }}>
          <AlertDialogContent className="max-w-sm">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-sm">
                {actionType === 'remove-admin' ? 'Remove Admin?' : 'Remove Moderator?'}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs">
                Are you sure you want to remove <strong>{userToRemove?.username}</strong> from {actionType === 'remove-admin' ? 'Admin' : 'Moderator'} role? 
                They will become a regular user.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="h-8 text-xs">Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmRemove}
                className="h-8 text-xs bg-destructive hover:bg-destructive/90"
              >
                Yes, Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
};

export default AdminRoleManagement;
