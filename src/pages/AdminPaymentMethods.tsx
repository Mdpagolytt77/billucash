import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Upload, Save, CreditCard, Image, Menu } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import LoadingScreen from '@/components/LoadingScreen';
import AdminSidebar from '@/components/AdminSidebar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

interface PaymentMethod {
  id: string;
  name: string;
  icon_url: string | null;
  gradient: string;
  category: 'crypto' | 'giftcard' | 'cash';
  min_amount: number;
  is_active: boolean;
  sort_order: number;
}

const gradientOptions = [
  { value: 'from-yellow-600 to-yellow-800', label: 'Gold' },
  { value: 'from-gray-500 to-gray-700', label: 'Silver' },
  { value: 'from-red-500 to-red-700', label: 'Red' },
  { value: 'from-amber-500 to-amber-700', label: 'Amber' },
  { value: 'from-green-600 to-blue-600', label: 'Green-Blue' },
  { value: 'from-blue-500 to-blue-700', label: 'Blue' },
  { value: 'from-blue-400 to-blue-600', label: 'Light Blue' },
  { value: 'from-green-400 to-teal-600', label: 'Teal' },
  { value: 'from-orange-500 to-red-600', label: 'Orange-Red' },
  { value: 'from-blue-500 to-cyan-600', label: 'Cyan' },
  { value: 'from-pink-600 to-pink-800', label: 'Pink' },
  { value: 'from-orange-500 to-orange-700', label: 'Orange' },
  { value: 'from-purple-500 to-purple-700', label: 'Purple' },
  { value: 'from-indigo-500 to-indigo-700', label: 'Indigo' },
];

const AdminPaymentMethods = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Form states
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<'crypto' | 'giftcard' | 'cash'>('crypto');
  const [formGradient, setFormGradient] = useState('from-gray-500 to-gray-700');
  const [formMinAmount, setFormMinAmount] = useState('1');
  const [formIconUrl, setFormIconUrl] = useState('');

  useEffect(() => {
    checkAdmin();
  }, [user]);

  const checkAdmin = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    const { data } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
    setIsAdmin(!!data);
    if (data) fetchMethods();
    setLoading(false);
  };

  const fetchMethods = async () => {
    const { data } = await supabase
      .from('payment_methods')
      .select('*')
      .order('sort_order', { ascending: true });
    if (data) setMethods(data as PaymentMethod[]);
  };

  const handleUploadIcon = async (file: File, methodId?: string) => {
    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${methodId || 'temp'}-${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('payment-icons')
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      toast.error('Failed to upload icon');
      setUploading(false);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('payment-icons')
      .getPublicUrl(fileName);
    
    setUploading(false);
    return publicUrl;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const url = await handleUploadIcon(file);
    if (url) {
      setFormIconUrl(url);
      toast.success('Icon uploaded!');
    }
  };

  const handleAdd = async () => {
    if (!formName.trim()) {
      toast.error('Name is required');
      return;
    }

    const { error } = await supabase.from('payment_methods').insert({
      name: formName,
      category: formCategory,
      gradient: formGradient,
      min_amount: parseFloat(formMinAmount) || 1,
      icon_url: formIconUrl || null,
      sort_order: methods.length + 1,
    });

    if (error) {
      toast.error('Failed to add payment method');
    } else {
      toast.success('Payment method added!');
      resetForm();
      setShowAddDialog(false);
      fetchMethods();
    }
  };

  const handleUpdate = async () => {
    if (!editingMethod) return;

    const { error } = await supabase
      .from('payment_methods')
      .update({
        name: formName,
        category: formCategory,
        gradient: formGradient,
        min_amount: parseFloat(formMinAmount) || 1,
        icon_url: formIconUrl || null,
      })
      .eq('id', editingMethod.id);

    if (error) {
      toast.error('Failed to update payment method');
    } else {
      toast.success('Payment method updated!');
      resetForm();
      setEditingMethod(null);
      fetchMethods();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this payment method?')) return;
    
    const { error } = await supabase.from('payment_methods').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete');
    } else {
      toast.success('Payment method deleted!');
      fetchMethods();
    }
  };

  const handleToggleActive = async (method: PaymentMethod) => {
    const { error } = await supabase
      .from('payment_methods')
      .update({ is_active: !method.is_active })
      .eq('id', method.id);
    
    if (!error) {
      fetchMethods();
      toast.success(`${method.name} ${!method.is_active ? 'enabled' : 'disabled'}`);
    }
  };

  const resetForm = () => {
    setFormName('');
    setFormCategory('crypto');
    setFormGradient('from-gray-500 to-gray-700');
    setFormMinAmount('1');
    setFormIconUrl('');
  };

  const openEditDialog = (method: PaymentMethod) => {
    setFormName(method.name);
    setFormCategory(method.category);
    setFormGradient(method.gradient);
    setFormMinAmount(method.min_amount.toString());
    setFormIconUrl(method.icon_url || '');
    setEditingMethod(method);
  };

  if (authLoading || loading) {
    return <LoadingScreen isLoading={true} />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-destructive">Access Denied</p>
      </div>
    );
  }

  const cryptoMethods = methods.filter(m => m.category === 'crypto');
  const giftcardMethods = methods.filter(m => m.category === 'giftcard');
  const cashMethods = methods.filter(m => m.category === 'cash');

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Header */}
      <header className="sticky top-0 z-30 px-4 py-3 bg-background/95 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-muted rounded-lg">
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-primary flex items-center gap-2">
            <CreditCard className="w-5 h-5" /> Payment Methods
          </h1>
        </div>
        <button
          onClick={() => { resetForm(); setShowAddDialog(true); }}
          className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add
        </button>
      </header>

      <main className="p-4 md:p-6 max-w-5xl mx-auto">
        {/* Crypto Section */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-foreground mb-3">Crypto ({cryptoMethods.length})</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {cryptoMethods.map((method) => (
              <MethodCard 
                key={method.id} 
                method={method} 
                onEdit={() => openEditDialog(method)}
                onDelete={() => handleDelete(method.id)}
                onToggle={() => handleToggleActive(method)}
              />
            ))}
          </div>
        </section>

        {/* Gift Card Section */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-foreground mb-3">Gift Card ({giftcardMethods.length})</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {giftcardMethods.map((method) => (
              <MethodCard 
                key={method.id} 
                method={method} 
                onEdit={() => openEditDialog(method)}
                onDelete={() => handleDelete(method.id)}
                onToggle={() => handleToggleActive(method)}
              />
            ))}
          </div>
        </section>

        {/* Cash Section */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-foreground mb-3">Cash ({cashMethods.length})</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {cashMethods.map((method) => (
              <MethodCard 
                key={method.id} 
                method={method} 
                onEdit={() => openEditDialog(method)}
                onDelete={() => handleDelete(method.id)}
                onToggle={() => handleToggleActive(method)}
              />
            ))}
          </div>
        </section>
      </main>

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog || !!editingMethod} onOpenChange={(open) => {
        if (!open) {
          setShowAddDialog(false);
          setEditingMethod(null);
          resetForm();
        }
      }}>
        <DialogContent className="sm:max-w-md bg-background border-border">
          <DialogHeader>
            <DialogTitle>
              {editingMethod ? 'Edit Payment Method' : 'Add Payment Method'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {/* Preview */}
            <div className="flex justify-center">
              <div className={`w-20 h-20 rounded-xl bg-gradient-to-br ${formGradient} flex items-center justify-center`}>
                {formIconUrl ? (
                  <img src={formIconUrl} alt="Icon" className="w-12 h-12 object-contain" />
                ) : (
                  <Image className="w-8 h-8 text-white/50" />
                )}
              </div>
            </div>

            {/* Icon Upload */}
            <div>
              <label className="text-xs text-muted-foreground block mb-1.5">Icon Image</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formIconUrl}
                  onChange={(e) => setFormIconUrl(e.target.value)}
                  placeholder="Image URL or upload"
                  className="flex-1 px-3 py-2 bg-muted border border-border rounded-lg text-sm"
                />
                <label className="px-3 py-2 bg-muted border border-border rounded-lg cursor-pointer hover:bg-muted/80 transition-colors flex items-center gap-1">
                  <Upload className="w-4 h-4" />
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>
              </div>
              {uploading && <p className="text-xs text-muted-foreground mt-1">Uploading...</p>}
            </div>

            {/* Name */}
            <div>
              <label className="text-xs text-muted-foreground block mb-1.5">Name</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Bitcoin"
                className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm"
              />
            </div>

            {/* Category */}
            <div>
              <label className="text-xs text-muted-foreground block mb-1.5">Category</label>
              <Select value={formCategory} onValueChange={(v) => setFormCategory(v as any)}>
                <SelectTrigger className="bg-muted border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="crypto">Crypto</SelectItem>
                  <SelectItem value="giftcard">Gift Card</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Gradient */}
            <div>
              <label className="text-xs text-muted-foreground block mb-1.5">Card Color</label>
              <Select value={formGradient} onValueChange={setFormGradient}>
                <SelectTrigger className="bg-muted border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {gradientOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded bg-gradient-to-r ${opt.value}`} />
                        {opt.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Min Amount */}
            <div>
              <label className="text-xs text-muted-foreground block mb-1.5">Minimum Amount ($)</label>
              <input
                type="number"
                value={formMinAmount}
                onChange={(e) => setFormMinAmount(e.target.value)}
                min="0.01"
                step="0.01"
                className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm"
              />
            </div>

            {/* Save Button */}
            <button
              onClick={editingMethod ? handleUpdate : handleAdd}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-primary to-secondary text-white font-semibold text-sm"
            >
              <Save className="w-4 h-4" />
              {editingMethod ? 'Update' : 'Add'} Payment Method
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Method Card Component
const MethodCard = ({ 
  method, 
  onEdit, 
  onDelete, 
  onToggle 
}: { 
  method: PaymentMethod; 
  onEdit: () => void; 
  onDelete: () => void;
  onToggle: () => void;
}) => (
  <div className={`relative rounded-xl bg-gradient-to-br ${method.gradient} p-3 transition-all ${!method.is_active && 'opacity-50'}`}>
    <div className="flex flex-col items-center justify-center gap-2 min-h-[80px]">
      {method.icon_url ? (
        <img src={method.icon_url} alt={method.name} className="w-10 h-10 object-contain" />
      ) : (
        <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
          <CreditCard className="w-5 h-5 text-white" />
        </div>
      )}
      <span className="text-xs font-medium text-white text-center">{method.name}</span>
      <span className="text-[10px] text-white/70">Min: ${method.min_amount}</span>
    </div>
    
    {/* Actions */}
    <div className="absolute top-2 right-2 flex items-center gap-1">
      <Switch 
        checked={method.is_active} 
        onCheckedChange={onToggle}
        className="scale-75"
      />
    </div>
    <div className="absolute bottom-2 right-2 flex gap-1">
      <button onClick={onEdit} className="p-1 bg-white/20 rounded hover:bg-white/30 transition-colors">
        <Upload className="w-3 h-3 text-white" />
      </button>
      <button onClick={onDelete} className="p-1 bg-red-500/50 rounded hover:bg-red-500/70 transition-colors">
        <Trash2 className="w-3 h-3 text-white" />
      </button>
    </div>
  </div>
);

export default AdminPaymentMethods;
