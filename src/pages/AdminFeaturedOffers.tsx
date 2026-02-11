import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Save, GripVertical, Image, Link, ToggleLeft, ToggleRight, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import heroBg from '@/assets/hero-bg.jpg';
import { useSiteSettings, getBackgroundStyle } from '@/contexts/SiteSettingsContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AdminSidebar from '@/components/AdminSidebar';

interface FeaturedOffer {
  id: string;
  name: string;
  description: string | null;
  coins: number;
  image_url: string | null;
  color: string | null;
  link_url: string | null;
  is_active: boolean;
  sort_order: number;
}

const AdminFeaturedOffers = () => {
  const navigate = useNavigate();
  const { background: siteBackground } = useSiteSettings();
  const [offers, setOffers] = useState<FeaturedOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingOffer, setEditingOffer] = useState<FeaturedOffer | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    loadOffers();
  }, []);

  const loadOffers = async () => {
    const { data, error } = await supabase
      .from('featured_offers')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      toast.error('Failed to load offers');
      console.error(error);
    } else {
      setOffers(data || []);
    }
    setLoading(false);
  };

  const handleAddOffer = async () => {
    const newOffer = {
      name: 'New Offer',
      description: 'Description here...',
      coins: 1000,
      color: '#1a1a2e',
      is_active: true,
      sort_order: offers.length,
    };

    const { data, error } = await supabase
      .from('featured_offers')
      .insert(newOffer)
      .select()
      .single();

    if (error) {
      toast.error('Failed to add offer');
      console.error(error);
    } else {
      setOffers([...offers, data]);
      setEditingOffer(data);
      toast.success('Offer added!');
    }
  };

  const handleSaveOffer = async () => {
    if (!editingOffer) return;
    setSaving(true);

    const { error } = await supabase
      .from('featured_offers')
      .update({
        name: editingOffer.name,
        description: editingOffer.description,
        coins: editingOffer.coins,
        image_url: editingOffer.image_url,
        color: editingOffer.color,
        link_url: editingOffer.link_url,
        is_active: editingOffer.is_active,
        sort_order: editingOffer.sort_order,
      })
      .eq('id', editingOffer.id);

    if (error) {
      toast.error('Failed to save');
      console.error(error);
    } else {
      setOffers(offers.map(o => o.id === editingOffer.id ? editingOffer : o));
      toast.success('Saved!');
    }
    setSaving(false);
  };

  const handleDeleteOffer = async (id: string) => {
    if (!confirm('Delete this offer?')) return;

    const { error } = await supabase
      .from('featured_offers')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete');
      console.error(error);
    } else {
      setOffers(offers.filter(o => o.id !== id));
      if (editingOffer?.id === id) setEditingOffer(null);
      toast.success('Deleted!');
    }
  };

  const handleToggleActive = async (offer: FeaturedOffer) => {
    const { error } = await supabase
      .from('featured_offers')
      .update({ is_active: !offer.is_active })
      .eq('id', offer.id);

    if (error) {
      toast.error('Failed to update');
    } else {
      setOffers(offers.map(o => o.id === offer.id ? { ...o, is_active: !o.is_active } : o));
      if (editingOffer?.id === offer.id) {
        setEditingOffer({ ...editingOffer, is_active: !editingOffer.is_active });
      }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !editingOffer) return;
    
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `featured-${editingOffer.id}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('site-assets')
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      toast.error('Upload failed');
      console.error(uploadError);
      return;
    }

    const { data } = supabase.storage
      .from('site-assets')
      .getPublicUrl(fileName);

    setEditingOffer({ ...editingOffer, image_url: data.publicUrl });
  };

  return (
    <div className="min-h-screen" style={getBackgroundStyle(siteBackground, heroBg)}>
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="p-4 md:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-muted rounded-lg">
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-display font-bold">Featured Offers</h1>
          </div>
          <Button onClick={handleAddOffer} size="sm">
            <Plus className="w-4 h-4 mr-1" /> Add Offer
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Offers List */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground mb-2">
              All Offers ({offers.length})
            </h2>
            
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : offers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-xl">
                <p>No featured offers yet</p>
                <Button onClick={handleAddOffer} variant="outline" size="sm" className="mt-2">
                  <Plus className="w-4 h-4 mr-1" /> Add First Offer
                </Button>
              </div>
            ) : (
              offers.map((offer) => (
                <div
                  key={offer.id}
                  onClick={() => setEditingOffer(offer)}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    editingOffer?.id === offer.id 
                      ? 'border-primary bg-primary/10' 
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <GripVertical className="w-4 h-4 text-muted-foreground" />
                  
                  {/* Preview */}
                  <div 
                    className="w-12 h-16 rounded-lg flex-shrink-0 flex items-center justify-center"
                    style={{ background: offer.color || '#1a1a2e' }}
                  >
                    {offer.image_url ? (
                      <img src={offer.image_url} alt="" className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <span className="text-xl">🎮</span>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate">{offer.name}</h3>
                    <p className="text-xs text-muted-foreground truncate">{offer.description}</p>
                    <p className="text-xs text-primary font-bold">{offer.coins.toLocaleString()} coins</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleToggleActive(offer); }}
                      className={`p-1 rounded ${offer.is_active ? 'text-green-500' : 'text-muted-foreground'}`}
                    >
                      {offer.is_active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteOffer(offer.id); }}
                      className="p-1 rounded text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Edit Panel */}
          <div className="bg-card border border-border rounded-xl p-4">
            {editingOffer ? (
              <div className="space-y-4">
                <h2 className="font-semibold text-lg">Edit Offer</h2>
                
                <div className="space-y-3">
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={editingOffer.name}
                      onChange={(e) => setEditingOffer({ ...editingOffer, name: e.target.value })}
                      placeholder="Offer name"
                    />
                  </div>
                  
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={editingOffer.description || ''}
                      onChange={(e) => setEditingOffer({ ...editingOffer, description: e.target.value })}
                      placeholder="Short description"
                      rows={2}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Coins Reward</Label>
                      <Input
                        type="number"
                        value={editingOffer.coins}
                        onChange={(e) => setEditingOffer({ ...editingOffer, coins: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <Label>Sort Order</Label>
                      <Input
                        type="number"
                        value={editingOffer.sort_order}
                        onChange={(e) => setEditingOffer({ ...editingOffer, sort_order: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label>Background Color</Label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={editingOffer.color || '#1a1a2e'}
                        onChange={(e) => setEditingOffer({ ...editingOffer, color: e.target.value })}
                        className="w-12 h-10 rounded border border-border cursor-pointer"
                      />
                      <Input
                        value={editingOffer.color || ''}
                        onChange={(e) => setEditingOffer({ ...editingOffer, color: e.target.value })}
                        placeholder="#1a1a2e"
                        className="flex-1"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label>Link URL (optional)</Label>
                    <div className="flex gap-2">
                      <Link className="w-4 h-4 mt-3 text-muted-foreground" />
                      <Input
                        value={editingOffer.link_url || ''}
                        onChange={(e) => setEditingOffer({ ...editingOffer, link_url: e.target.value })}
                        placeholder="https://..."
                        className="flex-1"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label>Image</Label>
                    <div className="flex gap-3 items-start">
                      <div 
                        className="w-20 h-28 rounded-xl flex items-center justify-center border border-dashed border-border"
                        style={{ background: editingOffer.color || '#1a1a2e' }}
                      >
                        {editingOffer.image_url ? (
                          <img src={editingOffer.image_url} alt="" className="w-full h-full object-cover rounded-xl" />
                        ) : (
                          <Image className="w-6 h-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="text-xs"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Or paste image URL:
                        </p>
                        <Input
                          value={editingOffer.image_url || ''}
                          onChange={(e) => setEditingOffer({ ...editingOffer, image_url: e.target.value })}
                          placeholder="https://..."
                          className="mt-1 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <Button onClick={handleSaveOffer} disabled={saving} className="w-full">
                  <Save className="w-4 h-4 mr-1" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground py-12">
                <p>Select an offer to edit</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminFeaturedOffers;
