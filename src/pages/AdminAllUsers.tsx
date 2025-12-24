import { useState, useEffect } from 'react';
import { Users, Search, ChevronLeft, ChevronRight, Menu, RefreshCw } from 'lucide-react';
import heroBg from '@/assets/hero-bg.jpg';
import SnowEffect from '@/components/SnowEffect';
import SnowToggle from '@/components/SnowToggle';
import AdminSidebar from '@/components/AdminSidebar';
import { useSnowEffect } from '@/hooks/useSnowEffect';
import { useAuth } from '@/contexts/AuthContext';
import { SiteLogo } from '@/contexts/SiteSettingsContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  username: string;
  email: string | null;
  balance: number | null;
  created_at: string | null;
}

const AdminAllUsers = () => {
  const { isAdmin } = useAuth();
  const { snowEnabled, toggleSnow } = useSnowEffect();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 15;

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) fetchUsers();
  }, [isAdmin]);

  const filteredUsers = users.filter(u => 
    u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * usersPerPage, currentPage * usersPerPage);

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
            <span className="text-xs text-muted-foreground">/ Users</span>
          </div>
          <SnowToggle enabled={snowEnabled} onToggle={toggleSnow} />
        </header>

        <main className="p-3 md:px-[5%]">
          <div className="glass-card p-3">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h2 className="text-sm font-bold text-primary flex items-center gap-1.5">
                <Users className="w-4 h-4" /> All Users ({filteredUsers.length})
              </h2>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-7 pr-2 py-1.5 bg-muted border border-border rounded-lg text-xs w-36" />
                </div>
                <button onClick={fetchUsers} disabled={isLoading} className="p-1.5 bg-primary/20 rounded-lg hover:bg-primary/30">
                  <RefreshCw className={`w-3.5 h-3.5 text-primary ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-1.5 px-2 font-semibold text-primary bg-primary/10">#</th>
                    <th className="text-left py-1.5 px-2 font-semibold text-primary bg-primary/10">Date</th>
                    <th className="text-left py-1.5 px-2 font-semibold text-primary bg-primary/10">Username</th>
                    <th className="text-left py-1.5 px-2 font-semibold text-primary bg-primary/10">Email</th>
                    <th className="text-left py-1.5 px-2 font-semibold text-primary bg-primary/10">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-6 text-muted-foreground">{isLoading ? 'Loading...' : 'No users'}</td></tr>
                  ) : (
                    paginatedUsers.map((user, i) => (
                      <tr key={user.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-1.5 px-2">{(currentPage - 1) * usersPerPage + i + 1}</td>
                        <td className="py-1.5 px-2 text-muted-foreground">{user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</td>
                        <td className="py-1.5 px-2 font-medium">{user.username}</td>
                        <td className="py-1.5 px-2 text-muted-foreground">{user.email || 'N/A'}</td>
                        <td className="py-1.5 px-2 text-green-400 font-semibold">৳ {(user.balance || 0).toFixed(2)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-3">
                <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="p-1 rounded bg-muted disabled:opacity-50">
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] px-2 py-0.5 rounded bg-primary/20 text-primary font-medium">{currentPage} / {totalPages}</span>
                <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="p-1 rounded bg-muted disabled:opacity-50">
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
};

export default AdminAllUsers;

      <div 
        className="min-h-screen"
        style={{
          background: `linear-gradient(rgba(0,0,0,0.85), rgba(0,0,0,0.85)), url(${heroBg}) no-repeat center center fixed`,
          backgroundSize: 'cover',
        }}
      >
        <header className="sticky top-0 z-30 px-4 py-3 bg-background/95 backdrop-blur-lg border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-muted rounded-lg">
              <Menu className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center font-bold text-sm">B</div>
            <span className="logo-3d text-base">Admin</span>
          </div>
          <div className="flex items-center gap-2">
            <SnowToggle enabled={snowEnabled} onToggle={toggleSnow} />
            <Link to="/admin" className="p-2 hover:bg-muted rounded-lg text-primary">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </div>
        </header>

        <main className="p-4 md:px-[5%]">
          <div className="glass-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h2 className="text-lg font-bold text-primary flex items-center gap-2">
                <Users className="w-5 h-5" /> All Users ({filteredUsers.length})
              </h2>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-3 py-2 bg-muted border border-border rounded-lg text-sm w-48"
                  />
                </div>
                <button onClick={fetchUsers} disabled={isLoading} className="p-2 bg-primary/20 rounded-lg hover:bg-primary/30">
                  <RefreshCw className={`w-4 h-4 text-primary ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-2 font-semibold text-primary bg-primary/10">#</th>
                    <th className="text-left py-2 px-2 font-semibold text-primary bg-primary/10">Date</th>
                    <th className="text-left py-2 px-2 font-semibold text-primary bg-primary/10">Username</th>
                    <th className="text-left py-2 px-2 font-semibold text-primary bg-primary/10">Email</th>
                    <th className="text-left py-2 px-2 font-semibold text-primary bg-primary/10">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-muted-foreground">
                        {isLoading ? 'Loading...' : 'No users found'}
                      </td>
                    </tr>
                  ) : (
                    paginatedUsers.map((user, i) => (
                      <tr key={user.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-2 px-2">{(currentPage - 1) * usersPerPage + i + 1}</td>
                        <td className="py-2 px-2 text-muted-foreground">
                          {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="py-2 px-2 font-medium">{user.username}</td>
                        <td className="py-2 px-2 text-muted-foreground">{user.email || 'N/A'}</td>
                        <td className="py-2 px-2 text-green-400 font-semibold">৳ {(user.balance || 0).toFixed(2)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-4">
                <button 
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded bg-muted disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs px-3 py-1 rounded bg-primary/20 text-primary font-medium">
                  {currentPage} / {totalPages}
                </span>
                <button 
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded bg-muted disabled:opacity-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
};

export default AdminAllUsers;
