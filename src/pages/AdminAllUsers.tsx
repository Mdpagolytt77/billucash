import { useState, useEffect } from 'react';
import { Users, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Menu, RefreshCw, Edit, Eye, Copy, Check, Calendar } from 'lucide-react';
import heroBg from '@/assets/hero-bg.jpg';
import SnowEffect from '@/components/SnowEffect';
import SnowToggle from '@/components/SnowToggle';
import AdminSidebar from '@/components/AdminSidebar';
import { useSnowEffect } from '@/hooks/useSnowEffect';
import { useAuth } from '@/contexts/AuthContext';
import { SiteLogo, useSiteSettings, getBackgroundStyle } from '@/contexts/SiteSettingsContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface UserProfile {
  id: string;
  username: string;
  email: string | null;
  balance: number | null;
  created_at: string | null;
  last_login_ip: string | null;
  device_info: string | null;
  status: string;
}

interface CompletedOffer {
  id: string;
  offerwall: string;
  offer_name: string;
  coin: number;
  created_at: string;
  transaction_id: string | null;
  country: string | null;
  ip: string | null;
}

const AdminAllUsers = () => {
  const { isAdmin, isModerator } = useAuth();
  const canAccess = isAdmin || isModerator;
  const { snowEnabled, toggleSnow } = useSnowEffect();
  const { backgrounds } = useSiteSettings();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 15;

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [editBalance, setEditBalance] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [userActivity, setUserActivity] = useState<CompletedOffer[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(false);

  // Details Modal State
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [detailsUser, setDetailsUser] = useState<UserProfile | null>(null);
  const [detailsActivity, setDetailsActivity] = useState<CompletedOffer[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, email, balance, created_at, last_login_ip, device_info, status')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserActivity = async (userId: string) => {
    setLoadingActivity(true);
    try {
      const { data, error } = await supabase
        .from('completed_offers')
        .select('id, offerwall, offer_name, coin, created_at, transaction_id, country, ip')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      setUserActivity(data || []);
    } catch (error) {
      console.error('Failed to load activity:', error);
      setUserActivity([]);
    } finally {
      setLoadingActivity(false);
    }
  };

  const fetchUserDetails = async (userId: string) => {
    setLoadingDetails(true);
    try {
      const { data, error } = await supabase
        .from('completed_offers')
        .select('id, offerwall, offer_name, coin, created_at, transaction_id, country, ip')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      setDetailsActivity(data || []);
    } catch (error) {
      console.error('Failed to load details:', error);
      setDetailsActivity([]);
    } finally {
      setLoadingDetails(false);
    }
  };

  const openDetailsModal = (user: UserProfile) => {
    setDetailsUser(user);
    setDetailsActivity([]);
    setDetailsModalOpen(true);
    fetchUserDetails(user.id);
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  useEffect(() => {
    if (canAccess) fetchUsers();
  }, [canAccess]);

  const openEditModal = (user: UserProfile) => {
    setSelectedUser(user);
    setEditBalance(String(user.balance || 0));
    setEditStatus(user.status || 'active');
    setUserActivity([]);
    setEditModalOpen(true);
    fetchUserActivity(user.id);
  };

  const handleSaveUser = async () => {
    if (!selectedUser) return;
    setIsSaving(true);
    try {
      const newBalance = parseFloat(editBalance) || 0;
      const currentBalance = selectedUser.balance || 0;
      
      // Use secure RPC function for balance changes with audit trail
      if (newBalance !== currentBalance) {
        const { data: balanceResult, error: balanceError } = await supabase
          .rpc('admin_adjust_balance', {
            _user_id: selectedUser.id,
            _new_balance: newBalance,
            _reason: `Admin manual adjustment via user management panel`
          });
        
        if (balanceError) throw balanceError;
        
        const result = balanceResult as { success: boolean; error?: string };
        if (!result.success) {
          throw new Error(result.error || 'Failed to adjust balance');
        }
      }
      
      // Update status separately (balance already updated via RPC)
      if (editStatus !== selectedUser.status) {
        const { error: statusError } = await supabase
          .from('profiles')
          .update({ status: editStatus })
          .eq('id', selectedUser.id);
        if (statusError) throw statusError;
      }
      
      toast.success(`Updated ${selectedUser.username}`);
      setEditModalOpen(false);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update user');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesDate = true;
    if (u.created_at) {
      const userDate = new Date(u.created_at).toISOString().split('T')[0];
      if (dateFrom && dateTo) {
        matchesDate = userDate >= dateFrom && userDate <= dateTo;
      } else if (dateFrom) {
        matchesDate = userDate >= dateFrom;
      } else if (dateTo) {
        matchesDate = userDate <= dateTo;
      }
    }
    
    return matchesSearch && matchesDate;
  });

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * usersPerPage, currentPage * usersPerPage);

  if (!canAccess) {
    return <div className="min-h-screen flex items-center justify-center">Access Denied</div>;
  }

  return (
    <>
      {snowEnabled && <SnowEffect />}
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="min-h-screen" style={getBackgroundStyle(backgrounds.admin, heroBg)}>
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
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-7 pr-2 py-1.5 bg-muted border border-border rounded-lg text-xs w-36" />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-muted-foreground">From:</span>
                  <div className="relative">
                    <Calendar className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input 
                      type="date" 
                      value={dateFrom} 
                      onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1); }} 
                      className="pl-7 pr-2 py-1.5 bg-muted border border-border rounded-lg text-xs w-32"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-muted-foreground">To:</span>
                  <div className="relative">
                    <Calendar className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input 
                      type="date" 
                      value={dateTo} 
                      onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1); }} 
                      className="pl-7 pr-2 py-1.5 bg-muted border border-border rounded-lg text-xs w-32"
                    />
                  </div>
                </div>
                {(dateFrom || dateTo) && (
                  <button 
                    onClick={() => { setDateFrom(''); setDateTo(''); setCurrentPage(1); }} 
                    className="px-2 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-[10px] hover:bg-red-500/30"
                  >
                    Clear
                  </button>
                )}
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
                    <th className="text-left py-1.5 px-2 font-semibold text-primary bg-primary/10">Last IP</th>
                    <th className="text-left py-1.5 px-2 font-semibold text-primary bg-primary/10">Device</th>
                    <th className="text-left py-1.5 px-2 font-semibold text-primary bg-primary/10">Status</th>
                    <th className="text-left py-1.5 px-2 font-semibold text-primary bg-primary/10">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.length === 0 ? (
                    <tr><td colSpan={9} className="text-center py-6 text-muted-foreground">{isLoading ? 'Loading...' : 'No users'}</td></tr>
                  ) : (
                    paginatedUsers.map((user, i) => (
                      <tr key={user.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-1.5 px-2">{(currentPage - 1) * usersPerPage + i + 1}</td>
                        <td className="py-1.5 px-2 text-muted-foreground">{user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</td>
                        <td className="py-1.5 px-2 font-medium">{user.username}</td>
                        <td className="py-1.5 px-2 text-muted-foreground">{user.email || 'N/A'}</td>
                        <td className="py-1.5 px-2 text-green-400 font-semibold">৳ {(user.balance || 0).toFixed(2)}</td>
                        <td className="py-1.5 px-2 text-muted-foreground text-[9px] max-w-[80px] truncate">{user.last_login_ip || 'N/A'}</td>
                        <td className="py-1.5 px-2 text-muted-foreground text-[9px] max-w-[100px] truncate" title={user.device_info || ''}>{user.device_info || 'N/A'}</td>
                        <td className="py-1.5 px-2">
                          <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-semibold uppercase ${user.status === 'active' ? 'bg-green-500/20 text-green-400' : user.status === 'banned' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                            {user.status || 'active'}
                          </span>
                        </td>
                        <td className="py-1.5 px-2 flex gap-1">
                          <button onClick={() => openDetailsModal(user)} className="p-1 bg-blue-500/20 rounded hover:bg-blue-500/30" title="View Details">
                            <Eye className="w-3 h-3 text-blue-400" />
                          </button>
                          <button onClick={() => openEditModal(user)} className="p-1 bg-primary/20 rounded hover:bg-primary/30" title="Edit User">
                            <Edit className="w-3 h-3 text-primary" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-3">
                <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="p-1 rounded bg-muted disabled:opacity-50" title="First Page">
                  <ChevronsLeft className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="p-1 rounded bg-muted disabled:opacity-50" title="Previous Page">
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] px-2 py-0.5 rounded bg-primary/20 text-primary font-medium">{currentPage} / {totalPages}</span>
                <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="p-1 rounded bg-muted disabled:opacity-50" title="Next Page">
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="p-1 rounded bg-muted disabled:opacity-50" title="Last Page">
                  <ChevronsRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Edit User Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-md bg-background border border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <Edit className="w-4 h-4" /> Edit User: {selectedUser?.username}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="edit" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="edit" className="text-xs">Edit Profile</TabsTrigger>
              <TabsTrigger value="activity" className="text-xs">Activity History</TabsTrigger>
            </TabsList>

            <TabsContent value="edit" className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Balance (৳)</label>
                <input
                  type="number"
                  value={editBalance}
                  onChange={(e) => setEditBalance(e.target.value)}
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm"
                  step="0.01"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm"
                >
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="banned">Banned</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px] text-muted-foreground bg-muted/50 p-2 rounded-lg">
                <div><strong>Last IP:</strong> {selectedUser?.last_login_ip || 'N/A'}</div>
                <div><strong>Device:</strong> {selectedUser?.device_info || 'N/A'}</div>
                <div><strong>Email:</strong> {selectedUser?.email || 'N/A'}</div>
                <div><strong>Joined:</strong> {selectedUser?.created_at ? new Date(selectedUser.created_at).toLocaleDateString() : 'N/A'}</div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleSaveUser}
                  disabled={isSaving}
                  className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-medium disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 bg-muted border border-border rounded-lg text-xs"
                >
                  Cancel
                </button>
              </div>
            </TabsContent>

            <TabsContent value="activity">
              <div className="max-h-64 overflow-y-auto">
                {loadingActivity ? (
                  <p className="text-center py-4 text-muted-foreground text-xs">Loading activity...</p>
                ) : userActivity.length === 0 ? (
                  <p className="text-center py-4 text-muted-foreground text-xs">No activity found</p>
                ) : (
                  <table className="w-full text-[10px]">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-1 px-2 text-primary">Date</th>
                        <th className="text-left py-1 px-2 text-primary">Offerwall</th>
                        <th className="text-left py-1 px-2 text-primary">Offer</th>
                        <th className="text-left py-1 px-2 text-primary">Coins</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userActivity.map((act) => (
                        <tr key={act.id} className="border-b border-border/50">
                          <td className="py-1 px-2 text-muted-foreground">{new Date(act.created_at).toLocaleDateString()}</td>
                          <td className="py-1 px-2">{act.offerwall}</td>
                          <td className="py-1 px-2 max-w-[100px] truncate" title={act.offer_name}>{act.offer_name}</td>
                          <td className="py-1 px-2 text-green-400 font-semibold">{act.coin}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* User Details Modal */}
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="max-w-2xl bg-background border border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-400">
              <Eye className="w-4 h-4" /> User Details: {detailsUser?.username}
            </DialogTitle>
          </DialogHeader>

          {/* User Info Section */}
          <div className="bg-muted/30 border border-border rounded-lg p-4 space-y-3">
            <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-3">Profile Information</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* User ID */}
              <div className="bg-background/50 rounded-lg p-2.5 border border-border/50">
                <div className="text-[10px] text-muted-foreground uppercase mb-1">User ID</div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono text-foreground truncate">{detailsUser?.id || 'N/A'}</span>
                  <button 
                    onClick={() => detailsUser?.id && copyToClipboard(detailsUser.id, 'userId')}
                    className="p-1 hover:bg-muted rounded shrink-0"
                  >
                    {copiedField === 'userId' ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                  </button>
                </div>
              </div>

              {/* Username */}
              <div className="bg-background/50 rounded-lg p-2.5 border border-border/50">
                <div className="text-[10px] text-muted-foreground uppercase mb-1">Username</div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-foreground">{detailsUser?.username || 'N/A'}</span>
                  <button 
                    onClick={() => detailsUser?.username && copyToClipboard(detailsUser.username, 'username')}
                    className="p-1 hover:bg-muted rounded shrink-0"
                  >
                    {copiedField === 'username' ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                  </button>
                </div>
              </div>

              {/* Email */}
              <div className="bg-background/50 rounded-lg p-2.5 border border-border/50">
                <div className="text-[10px] text-muted-foreground uppercase mb-1">Email</div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-foreground truncate">{detailsUser?.email || 'N/A'}</span>
                  <button 
                    onClick={() => detailsUser?.email && copyToClipboard(detailsUser.email, 'email')}
                    className="p-1 hover:bg-muted rounded shrink-0"
                  >
                    {copiedField === 'email' ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                  </button>
                </div>
              </div>

              {/* Balance */}
              <div className="bg-background/50 rounded-lg p-2.5 border border-border/50">
                <div className="text-[10px] text-muted-foreground uppercase mb-1">Balance</div>
                <span className="text-xs font-bold text-green-400">৳ {(detailsUser?.balance || 0).toFixed(2)}</span>
              </div>

              {/* Status */}
              <div className="bg-background/50 rounded-lg p-2.5 border border-border/50">
                <div className="text-[10px] text-muted-foreground uppercase mb-1">Status</div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${detailsUser?.status === 'active' ? 'bg-green-500/20 text-green-400' : detailsUser?.status === 'banned' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                  {detailsUser?.status || 'active'}
                </span>
              </div>

              {/* Join Date */}
              <div className="bg-background/50 rounded-lg p-2.5 border border-border/50">
                <div className="text-[10px] text-muted-foreground uppercase mb-1">Joined Date & Time</div>
                <span className="text-xs text-foreground">
                  {detailsUser?.created_at ? new Date(detailsUser.created_at).toLocaleString() : 'N/A'}
                </span>
              </div>

              {/* Last Login IP */}
              <div className="bg-background/50 rounded-lg p-2.5 border border-border/50">
                <div className="text-[10px] text-muted-foreground uppercase mb-1">Last Login IP</div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono text-foreground">{detailsUser?.last_login_ip || 'N/A'}</span>
                  {detailsUser?.last_login_ip && (
                    <button 
                      onClick={() => copyToClipboard(detailsUser.last_login_ip!, 'ip')}
                      className="p-1 hover:bg-muted rounded shrink-0"
                    >
                      {copiedField === 'ip' ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                    </button>
                  )}
                </div>
              </div>

              {/* Device Info */}
              <div className="bg-background/50 rounded-lg p-2.5 border border-border/50">
                <div className="text-[10px] text-muted-foreground uppercase mb-1">Device Info</div>
                <span className="text-[10px] text-foreground break-words">{detailsUser?.device_info || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Transaction History Section */}
          <div className="bg-muted/30 border border-border rounded-lg p-4 mt-4">
            <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-3">Transaction History ({detailsActivity.length})</h3>
            
            {loadingDetails ? (
              <p className="text-center py-4 text-muted-foreground text-xs">Loading transactions...</p>
            ) : detailsActivity.length === 0 ? (
              <p className="text-center py-4 text-muted-foreground text-xs">No transactions found</p>
            ) : (
              <div className="max-h-60 overflow-y-auto">
                <table className="w-full text-[10px]">
                  <thead className="sticky top-0 bg-muted">
                    <tr className="border-b border-border">
                      <th className="text-left py-1.5 px-2 text-primary font-semibold">Date/Time</th>
                      <th className="text-left py-1.5 px-2 text-primary font-semibold">Offerwall</th>
                      <th className="text-left py-1.5 px-2 text-primary font-semibold">Offer Name</th>
                      <th className="text-left py-1.5 px-2 text-primary font-semibold">Coins</th>
                      <th className="text-left py-1.5 px-2 text-primary font-semibold">Transaction ID</th>
                      <th className="text-left py-1.5 px-2 text-primary font-semibold">Country</th>
                      <th className="text-left py-1.5 px-2 text-primary font-semibold">IP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailsActivity.map((act) => (
                      <tr key={act.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-1.5 px-2 text-muted-foreground whitespace-nowrap">
                          {new Date(act.created_at).toLocaleString()}
                        </td>
                        <td className="py-1.5 px-2 font-medium">{act.offerwall}</td>
                        <td className="py-1.5 px-2 max-w-[120px] truncate" title={act.offer_name}>{act.offer_name}</td>
                        <td className="py-1.5 px-2 text-green-400 font-bold">{act.coin}</td>
                        <td className="py-1.5 px-2">
                          <div className="flex items-center gap-1">
                            <span className="font-mono text-[9px] max-w-[80px] truncate" title={act.transaction_id || ''}>
                              {act.transaction_id || 'N/A'}
                            </span>
                            {act.transaction_id && (
                              <button 
                                onClick={() => copyToClipboard(act.transaction_id!, `txn-${act.id}`)}
                                className="p-0.5 hover:bg-muted rounded shrink-0"
                              >
                                {copiedField === `txn-${act.id}` ? <Check className="w-2.5 h-2.5 text-green-400" /> : <Copy className="w-2.5 h-2.5 text-muted-foreground" />}
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="py-1.5 px-2 text-muted-foreground">{act.country || 'N/A'}</td>
                        <td className="py-1.5 px-2">
                          <div className="flex items-center gap-1">
                            <span className="font-mono text-[9px]">{act.ip || 'N/A'}</span>
                            {act.ip && (
                              <button 
                                onClick={() => copyToClipboard(act.ip!, `ip-${act.id}`)}
                                className="p-0.5 hover:bg-muted rounded shrink-0"
                              >
                                {copiedField === `ip-${act.id}` ? <Check className="w-2.5 h-2.5 text-green-400" /> : <Copy className="w-2.5 h-2.5 text-muted-foreground" />}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="flex justify-end mt-4">
            <button
              onClick={() => setDetailsModalOpen(false)}
              className="px-4 py-2 bg-muted border border-border rounded-lg text-xs hover:bg-muted/80"
            >
              Close
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminAllUsers;
