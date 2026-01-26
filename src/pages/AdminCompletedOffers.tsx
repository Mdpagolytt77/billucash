import { useState, useEffect } from 'react';
import { CheckCircle, Menu, Search, Loader2, Trash2, AlertTriangle, Pencil, Calendar, ChevronsLeft, ChevronsRight } from 'lucide-react';
import heroBg from '@/assets/hero-bg.jpg';
import SnowEffect from '@/components/SnowEffect';
import SnowToggle from '@/components/SnowToggle';
import AdminSidebar from '@/components/AdminSidebar';
import { useSnowEffect } from '@/hooks/useSnowEffect';
import { useAuth } from '@/contexts/AuthContext';
import { SiteLogo } from '@/contexts/SiteSettingsContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CompletedOffer {
  id: string;
  user_id: string;
  username: string;
  offerwall: string;
  offer_name: string;
  coin: number;
  transaction_id: string | null;
  ip: string | null;
  country: string | null;
  created_at: string;
}

const AdminCompletedOffers = () => {
  const { isAdmin } = useAuth();
  const { snowEnabled, toggleSnow } = useSnowEffect();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [currentPage, setCurrentPage] = useState(1);
  const [offers, setOffers] = useState<CompletedOffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Edit dialog state
  const [editOffer, setEditOffer] = useState<CompletedOffer | null>(null);
  const [editForm, setEditForm] = useState({
    username: '',
    offerwall: '',
    offer_name: '',
    coin: 0,
    transaction_id: '',
    ip: '',
    country: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  // Calculate amount and revenue
  // 400 coin = $0.40 (coin / 1000)
  // Revenue = amount * 2 (so $0.80)
  const calculateAmount = (coin: number) => (coin / 1000).toFixed(2);
  const calculateRevenue = (coin: number) => ((coin / 1000) * 2).toFixed(2);

  // Load completed offers from database
  useEffect(() => {
    const loadOffers = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('completed_offers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading offers:', error);
      } else {
        setOffers(data || []);
      }
      setIsLoading(false);
    };

    loadOffers();

    // Real-time subscription
    const channel = supabase
      .channel('completed-offers-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'completed_offers',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setOffers(prev => [payload.new as CompletedOffer, ...prev]);
          } else if (payload.eventType === 'DELETE') {
            setOffers(prev => prev.filter(o => o.id !== (payload.old as { id: string }).id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredData = offers.filter(row => {
    const matchesSearch = row.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.offerwall.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (row.country || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesDate = true;
    if (row.created_at) {
      const offerDate = new Date(row.created_at).toISOString().split('T')[0];
      if (dateFrom && dateTo) {
        matchesDate = offerDate >= dateFrom && offerDate <= dateTo;
      } else if (dateFrom) {
        matchesDate = offerDate >= dateFrom;
      } else if (dateTo) {
        matchesDate = offerDate <= dateTo;
      }
    }
    
    return matchesSearch && matchesDate;
  });

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const pageData = filteredData.slice(startIndex, startIndex + rowsPerPage);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, dateFrom, dateTo, rowsPerPage]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get unique usernames for filter dropdown
  const uniqueUsernames = [...new Set(offers.map(o => o.username))].sort();

  // Open edit dialog
  const openEditDialog = (offer: CompletedOffer) => {
    setEditOffer(offer);
    setEditForm({
      username: offer.username,
      offerwall: offer.offerwall,
      offer_name: offer.offer_name,
      coin: offer.coin,
      transaction_id: offer.transaction_id || '',
      ip: offer.ip || '',
      country: offer.country || '',
    });
  };

  // Save edit
  const handleSaveEdit = async () => {
    if (!editOffer) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('completed_offers')
        .update({
          username: editForm.username,
          offerwall: editForm.offerwall,
          offer_name: editForm.offer_name,
          coin: editForm.coin,
          transaction_id: editForm.transaction_id || null,
          ip: editForm.ip || null,
          country: editForm.country || null,
        })
        .eq('id', editOffer.id);

      if (error) throw error;
      
      // Update local state
      setOffers(prev => prev.map(o => 
        o.id === editOffer.id 
          ? { ...o, ...editForm, transaction_id: editForm.transaction_id || null, ip: editForm.ip || null, country: editForm.country || null }
          : o
      ));
      
      toast.success('Offer updated successfully');
      setEditOffer(null);
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Failed to update offer');
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle selection
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Select all on current page
  const toggleSelectAll = () => {
    if (selectedIds.size === pageData.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pageData.map(o => o.id)));
    }
  };

  // Delete selected offers
  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('completed_offers')
        .delete()
        .in('id', Array.from(selectedIds));

      if (error) throw error;
      
      toast.success(`Deleted ${selectedIds.size} offer(s)`);
      setSelectedIds(new Set());
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete offers');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isAdmin) return <div className="min-h-screen flex items-center justify-center text-xs">Access Denied</div>;

  return (
    <>
      {snowEnabled && <SnowEffect />}
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="min-h-screen" style={{ background: `linear-gradient(rgba(0,0,0,0.85), rgba(0,0,0,0.85)), url(${heroBg}) no-repeat center center fixed`, backgroundSize: 'cover' }}>
        <header className="sticky top-0 z-30 px-3 py-2 bg-background/95 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 hover:bg-muted rounded-lg"><Menu className="w-4 h-4" /></button>
            <SiteLogo size="sm" />
            <span className="text-xs text-muted-foreground">/ Offers</span>
          </div>
          <SnowToggle enabled={snowEnabled} onToggle={toggleSnow} />
        </header>

        <main className="p-3 md:px-[3%]">
          {/* Delete Confirmation Dialog */}
          <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  Delete {selectedIds.size} Offer(s)?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. The selected completed offers will be permanently deleted.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteSelected}
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <div className="glass-card p-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
              <h2 className="text-sm font-bold text-primary flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" /> Completed Offers <span className="text-[10px] text-muted-foreground">({filteredData.length})</span>
              </h2>
              <div className="flex gap-2 items-center">
                {selectedIds.size > 0 && (
                  <button
                    onClick={() => setShowDeleteDialog(true)}
                    className="px-2 py-1.5 bg-destructive/20 text-destructive rounded-lg text-[10px] flex items-center gap-1 hover:bg-destructive/30"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete ({selectedIds.size})
                  </button>
                )}
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                  <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search user..." className="w-full pl-6 pr-2 py-1.5 bg-muted border border-border rounded-lg text-[10px]" />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-muted-foreground">From:</span>
                  <div className="relative">
                    <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                    <input 
                      type="date" 
                      value={dateFrom} 
                      onChange={(e) => setDateFrom(e.target.value)} 
                      className="pl-6 pr-2 py-1.5 bg-muted border border-border rounded-lg text-[10px] w-32"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-muted-foreground">To:</span>
                  <div className="relative">
                    <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                    <input 
                      type="date" 
                      value={dateTo} 
                      onChange={(e) => setDateTo(e.target.value)} 
                      className="pl-6 pr-2 py-1.5 bg-muted border border-border rounded-lg text-[10px] w-32"
                    />
                  </div>
                </div>
                {(dateFrom || dateTo) && (
                  <button 
                    onClick={() => { setDateFrom(''); setDateTo(''); }} 
                    className="px-2 py-1.5 bg-destructive/20 text-destructive rounded-lg text-[10px] hover:bg-destructive/30"
                  >
                    Clear
                  </button>
                )}
                <select value={rowsPerPage} onChange={(e) => setRowsPerPage(Number(e.target.value))} className="px-2 py-1.5 bg-muted border border-border rounded-lg text-[10px]">
                  {[10, 15, 25, 50].map(n => <option key={n} value={n}>{n} rows</option>)}
                </select>
              </div>
            </div>

            {isLoading ? (
              <div className="h-40 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : filteredData.length === 0 ? (
              <div className="h-40 flex flex-col items-center justify-center text-muted-foreground">
                <CheckCircle className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-xs">No completed offers yet</p>
              </div>
            ) : (
              <>
                <div className="overflow-auto max-h-[55vh] border border-border rounded-lg">
                  <table className="w-full text-[9px] min-w-[1200px]">
                    <thead className="sticky top-0 bg-muted/90">
                      <tr>
                        <th className="p-1.5 w-8">
                          <input
                            type="checkbox"
                            checked={selectedIds.size === pageData.length && pageData.length > 0}
                            onChange={toggleSelectAll}
                            className="w-3 h-3 rounded border-border"
                          />
                        </th>
                        <th className="text-center p-1.5 text-muted-foreground w-10">#</th>
                        <th className="text-left p-1.5 text-muted-foreground">User ID</th>
                        <th className="text-left p-1.5 text-muted-foreground">Username</th>
                        <th className="text-left p-1.5 text-muted-foreground">Offerwall</th>
                        <th className="text-left p-1.5 text-muted-foreground">Offer Name</th>
                        <th className="text-center p-1.5 text-muted-foreground">Coin</th>
                        <th className="text-center p-1.5 text-muted-foreground">Amount</th>
                        <th className="text-center p-1.5 text-muted-foreground">Revenue</th>
                        <th className="text-left p-1.5 text-muted-foreground">Transaction ID</th>
                        <th className="text-left p-1.5 text-muted-foreground">IP</th>
                        <th className="text-left p-1.5 text-muted-foreground">Date Time</th>
                        <th className="text-center p-1.5 text-muted-foreground">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageData.map((row, index) => (
                        <tr key={row.id} className={`border-t border-border/50 hover:bg-primary/5 ${selectedIds.has(row.id) ? 'bg-primary/10' : ''}`}>
                          <td className="p-1.5">
                            <input
                              type="checkbox"
                              checked={selectedIds.has(row.id)}
                              onChange={() => toggleSelect(row.id)}
                              className="w-3 h-3 rounded border-border"
                            />
                          </td>
                          <td className="p-1.5 text-center text-muted-foreground font-medium">{startIndex + index + 1}</td>
                          <td className="p-1.5 text-muted-foreground text-[8px] max-w-[80px] truncate" title={row.user_id}>{row.user_id.slice(0, 8)}...</td>
                          <td className="p-1.5 font-medium">{row.username}</td>
                          <td className="p-1.5 text-muted-foreground">{row.offerwall}</td>
                          <td className="p-1.5 max-w-[150px] truncate" title={row.offer_name}>{row.offer_name}</td>
                          <td className="p-1.5 text-center">{row.coin}</td>
                          <td className="p-1.5 text-center text-green-400">${calculateAmount(row.coin)}</td>
                          <td className="p-1.5 text-center text-primary">${calculateRevenue(row.coin)}</td>
                          <td className="p-1.5 text-muted-foreground text-[8px] max-w-[120px] truncate" title={row.transaction_id || ''}>{row.transaction_id || '-'}</td>
                          <td className="p-1.5 text-muted-foreground">{row.ip || '-'}</td>
                          <td className="p-1.5 text-muted-foreground whitespace-nowrap">{formatDate(row.created_at)}</td>
                          <td className="p-1.5 text-center">
                            <button
                              onClick={() => openEditDialog(row)}
                              className="p-1 rounded hover:bg-primary/20 text-primary"
                              title="Edit"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between mt-3 text-[10px]">
                  <span className="text-muted-foreground">Showing {startIndex + 1}-{Math.min(startIndex + rowsPerPage, filteredData.length)} of {filteredData.length}</span>
                  <div className="flex gap-1">
                    <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="px-2 py-1 rounded bg-muted disabled:opacity-40" title="First Page">
                      <ChevronsLeft className="w-3 h-3" />
                    </button>
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-2 py-1 rounded bg-muted disabled:opacity-40">← Prev</button>
                    <span className="px-2 py-1 rounded bg-primary text-white">{currentPage}</span>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-2 py-1 rounded bg-muted disabled:opacity-40">Next →</button>
                    <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="px-2 py-1 rounded bg-muted disabled:opacity-40" title="Last Page">
                      <ChevronsRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Edit Dialog */}
          <Dialog open={!!editOffer} onOpenChange={(open) => !open && setEditOffer(null)}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Pencil className="w-4 h-4" /> Edit Offer
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 py-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Username</Label>
                    <Input
                      value={editForm.username}
                      onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Offerwall</Label>
                    <Input
                      value={editForm.offerwall}
                      onChange={(e) => setEditForm(prev => ({ ...prev, offerwall: e.target.value }))}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Offer Name</Label>
                  <Input
                    value={editForm.offer_name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, offer_name: e.target.value }))}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Coin</Label>
                    <Input
                      type="number"
                      value={editForm.coin}
                      onChange={(e) => setEditForm(prev => ({ ...prev, coin: Number(e.target.value) }))}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Country</Label>
                    <Input
                      value={editForm.country}
                      onChange={(e) => setEditForm(prev => ({ ...prev, country: e.target.value }))}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Transaction ID</Label>
                  <Input
                    value={editForm.transaction_id}
                    onChange={(e) => setEditForm(prev => ({ ...prev, transaction_id: e.target.value }))}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">IP Address</Label>
                  <Input
                    value={editForm.ip}
                    onChange={(e) => setEditForm(prev => ({ ...prev, ip: e.target.value }))}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" size="sm" onClick={() => setEditOffer(null)} disabled={isSaving}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSaveEdit} disabled={isSaving}>
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Save
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </>
  );
};

export default AdminCompletedOffers;