import React, { useState, useEffect } from 'react';
import { Plus, Package } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { useConfirm } from '../context/ConfirmContext';
import { formatCurrency } from '../utils/formatters';
import { useAuthStore } from '../store/authStore';
import api from '../api/client';

export function Products() {
  const [products, setProducts] = useState([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [form, setForm] = useState({
    sku: '',
    name: '',
    category: 'Software',
    unit_price: 25000,
    tax_rate: 18.0,
  });
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'administrator';
  const confirm = useConfirm();

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products', { params: { include_inactive: true } });
      setProducts(res.data);
    } catch (err) {
      console.error('Failed to load products:', err);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    confirm({
      title: 'Confirm Add Product',
      message: `Are you sure you want to add product "${form.name}" (SKU: ${form.sku}) to the catalog?`,
      confirmText: 'Add Product',
      cancelText: 'Cancel',
      variant: 'primary',
      operation: 'CREATE',
      onConfirm: async () => {
        await api.post('/products', form);
        setIsAddOpen(false);
        setForm({ sku: '', name: '', category: 'Software', unit_price: 25000, tax_rate: 18.0 });
        fetchProducts();
      },
    });
  };

  const handleDeactivate = (id, name) => {
    confirm({
      title: 'Confirm Deactivate Product',
      message: `Are you sure you want to deactivate product "${name || id}"? It will no longer be available for new quotations.`,
      confirmText: 'Deactivate',
      cancelText: 'Cancel',
      variant: 'danger',
      operation: 'UPDATE',
      onConfirm: async () => {
        await api.post(`/products/${id}/deactivate`);
        fetchProducts();
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-[#1A2E4A]">Product Catalog</h2>
          <p className="text-xs text-[#6B7C93] mt-0.5">Manage pricing tiers, SKUs, and GST tax classifications</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setIsAddOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Add Product
          </Button>
        )}
      </div>

      <Card className="p-0 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#F5F7FA] border-b text-xs font-semibold text-[#1A2E4A]">
            <tr>
              <th className="py-3 px-4">SKU</th>
              <th className="py-3 px-4">Product Name</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Unit Price</th>
              <th className="py-3 px-4">Tax Rate</th>
              <th className="py-3 px-4">Status</th>
              {isAdmin && <th className="py-3 px-4 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EEF2F7]">
            {products.map((p) => (
              <tr key={p.id} className={!p.active ? 'opacity-50 bg-[#F9FAFB]' : 'hover:bg-[#F5F7FA]'}>
                <td className="py-3 px-4 font-mono text-xs font-bold text-[#2B5FAD]">{p.sku}</td>
                <td className="py-3 px-4 font-semibold text-[#1A2E4A]">{p.name}</td>
                <td className="py-3 px-4 text-xs text-[#6B7C93]">{p.category}</td>
                <td className="py-3 px-4 font-mono font-bold text-xs">{formatCurrency(p.unit_price)}</td>
                <td className="py-3 px-4 text-xs">{p.tax_rate}% GST</td>
                <td className="py-3 px-4">
                  <Badge status={p.active ? 'Qualified' : 'Disqualified'} label={p.active ? 'Active' : 'Inactive'} />
                </td>
                {isAdmin && (
                  <td className="py-3 px-4 text-right">
                    {p.active && (
                      <button
                        onClick={() => handleDeactivate(p.id, p.name)}
                        className="text-xs text-[#EF4444] hover:underline font-semibold"
                      >
                        Deactivate
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add Product to Catalog">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Product SKU *" required value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="PROD-CRM-05" />
          <Input label="Product Name *" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Cloud Sync Addon" />
          <Input label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <Input label="Standard Unit Price (₹) *" type="number" required value={form.unit_price} onChange={(e) => setForm({ ...form, unit_price: e.target.value })} />
          <Input label="Tax Rate (%)" type="number" value={form.tax_rate} onChange={(e) => setForm({ ...form, tax_rate: e.target.value })} />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button type="submit">Save Product</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
