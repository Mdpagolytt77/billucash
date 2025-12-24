import { useState, useEffect } from 'react';
import { Shield, Menu, RefreshCw, UserPlus, UserMinus, Search } from 'lucide-react';
import heroBg from '@/assets/hero-bg.jpg';
import SnowEffect from '@/components/SnowEffect';
import SnowToggle from '@/components/SnowToggle';
import AdminSidebar from '@/components/AdminSidebar';
import { useSnowEffect } from '@/hooks/useSnowEffect';
import { useAuth } from '@/contexts/AuthContext';
import { SiteLogo } from '@/contexts/SiteSettingsContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';

interface UserWithRole {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
}

const AdminRoleManagement = () => {
  const { isAdmin } = useAuth();
  const { snowEnabled, toggleSnow } = useSnowEffect();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, email')
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      // Get roles for all users
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');
      
      if (rolesError) throw rolesError;

      const usersWithRoles: UserWithRole[] = (data || []).map(user => {
        const userRole = roles?.find(r => r.user_id === user.id);
        return {
          ...user,
          role: (userRole?.role as 'admin' | 'user') || 'user'
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
    if (isAdmin) fetchUsers();
  }, [isAdmin]);

  const handleMakeAdmin = async (userId: string, username: string) => {
    try {
      // Check if user already has a role entry
      const { data: existing } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        // Update existing role
        const { error } = await supabase
          .from('user_roles')
          .update({ role: 'admin' })
          .eq('user_id', userId);
        if (error) throw error;
      } else {
        // Insert new role
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: 'admin' });
        if (error) throw error;
      }

      toast.success(`${username} is now an Admin!`);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update role');
    }
  };

  const handleRemoveAdmin = async (userId: string, username: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: 'user' })
        .eq('user_id', userId);
      
      if (error) throw error;
      toast.success(`${username} is no longer an Admin`);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update role');
    }
  };

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const admins = filteredUsers.filter(u => u.role === 'admin');
  const regularUsers = filteredUsers.filter(u => u.role === 'user');

  if (!isAdmin) {
    return <div className="min-h-screen flex items-center justify-center">Access Denied</div>;
  }

  return (
    <>
      {snowEnabled && <SnowEffect />}
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="min-h-screen" style={{ background: `linear-gradient(rgba(0,0,0,0.85), rgba(0,0,0,0.85)), url(${heroBg}) no-repeat center center fixed`, backgroundSize: 'cover' }}>
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
            <h3 className="text-xs font-bold text-primary mb-1">🔐 Admin Role Management</h3>
            <p className="text-[10px] text-muted-foreground">
              এখান থেকে যেকোনো user কে Admin বানাতে বা Admin role remove করতে পারবেন। 
              Site sell করার সময় নতুন owner কে Admin বানিয়ে নিজের Admin role remove করুন।
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

          {/* Admins Section */}
          <div className="glass-card p-3 mb-3">
            <h2 className="text-sm font-bold text-primary flex items-center gap-1.5 mb-3">
              <Shield className="w-4 h-4" /> Current Admins
              <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">{admins.length}</span>
            </h2>

            <div className="space-y-1.5">
              {admins.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No admins found</p>
              ) : (
                admins.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-2 rounded-lg bg-primary/10 border border-primary/20">
                    <div>
                      <p className="text-xs font-medium">{user.username}</p>
                      <p className="text-[10px] text-muted-foreground">{user.email}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveAdmin(user.id, user.username)}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-destructive/20 text-destructive text-[10px] font-medium hover:bg-destructive/30"
                    >
                      <UserMinus className="w-3 h-3" /> Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Regular Users Section */}
          <div className="glass-card p-3">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5 mb-3">
              👤 Regular Users
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
                    <button
                      onClick={() => handleMakeAdmin(user.id, user.username)}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/20 text-primary text-[10px] font-medium hover:bg-primary/30"
                    >
                      <UserPlus className="w-3 h-3" /> Make Admin
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default AdminRoleManagement;
