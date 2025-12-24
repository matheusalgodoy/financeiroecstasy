'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { supabase } from '@/lib/supabase';
import { Trash2, Edit, Plus, RefreshCw, DollarSign, TrendingUp, Clock, ShoppingBag } from 'lucide-react';

interface Sale {
  id: string;
  name: string;
  value: number;
  buyer: string;
  status: 'pending' | 'delivered' | 'cancelled';
}

const PRODUCTS = [
  { name: 'Infinity', price: 500 },
  { name: 'FW PRO', price: 800 },
];

function getProductCost(name: string): number {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('infinity')) return 250;
  if (lowerName.includes('fw pro')) return 430;
  return 0;
}

export default function Home() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<{name: string, value: string, buyer: string, status: 'pending' | 'delivered' | 'cancelled'}>({ name: '', value: '', buyer: '', status: 'pending' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [productMode, setProductMode] = useState<string>('');

  // Financial Calculations
  const totalRevenue = sales.reduce((acc, curr) => acc + curr.value, 0);
  const pendingRevenue = sales.filter(s => s.status === 'pending').reduce((acc, curr) => acc + curr.value, 0);
  const deliveredSales = sales.filter(s => s.status === 'delivered');
  const netProfit = deliveredSales.reduce((acc, curr) => {
    const cost = getProductCost(curr.name);
    return acc + (curr.value - cost);
  }, 0);
  const salesCount = sales.length;

  const fetchSales = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/sales');
      setSales(res.data);
    } catch (error) {
      console.error('Error fetching sales', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();

    // Request Notification Permission
    if ('Notification' in window) {
      Notification.requestPermission();
    }

    // Subscribe to Supabase Realtime
    const channel = supabase
      .channel('sales_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'sales' },
        (payload) => {
          console.log('New sale received:', payload);
          fetchSales(); // Refresh list

          // Show Notification
          if (Notification.permission === 'granted') {
            const newSale = payload.new as Sale;
            new Notification('Nova Venda Recebida! 🤑', {
              body: `${newSale.name} - R$ ${newSale.value.toFixed(2)}\nComprador: ${newSale.buyer}`,
              icon: '/favicon.ico', // Tries to use favicon if available
              tag: 'new-sale', // Prevent stacking too many notifications
            });
            
            // Play a sound (optional, but cool)
            const audio = new Audio('/notification.mp3'); // We might not have this file, but logic is sound. 
            // Better to not break if file missing, so just notification for now.
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleProductSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    setProductMode(selected);
    
    if (selected === 'custom_input') {
      setFormData({ ...formData, name: '', value: '' });
    } else {
      const product = PRODUCTS.find(p => p.name === selected);
      if (product) {
        setFormData({ ...formData, name: product.name, value: product.price.toString() });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put('/api/sales', { ...formData, id: editingId });
      } else {
        await axios.post('/api/sales', formData);
      }
      setFormData({ name: '', value: '', buyer: '', status: 'pending' });
      setEditingId(null);
      setProductMode('');
      fetchSales();
    } catch (error) {
      console.error('Error saving sale', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir?')) return;
    try {
      await axios.delete(`/api/sales?id=${id}`);
      fetchSales();
    } catch (error) {
      console.error('Error deleting sale', error);
    }
  };

  const handleEdit = (sale: Sale) => {
    setFormData({ 
      name: sale.name, 
      value: sale.value.toString(), 
      buyer: sale.buyer || '',
      status: sale.status 
    });
    setEditingId(sale.id);
    setProductMode(PRODUCTS.some(p => p.name === sale.name) ? sale.name : 'custom_input');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20';
      case 'delivered': return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20';
      case 'cancelled': return 'bg-red-500/10 text-red-500 border border-red-500/20';
      default: return 'bg-zinc-800 text-zinc-400 border border-zinc-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'delivered': return 'Entregue';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  return (
    <main className="min-h-screen bg-black text-zinc-100 selection:bg-indigo-500/30">
      {/* Background Gradient */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto p-6 lg:p-12 font-sans">
        <header className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white">
              Financeiro<span className="text-indigo-500">Ecstasy</span>
            </h1>
            <p className="text-zinc-400 mt-2 text-lg">
              Painel de controle de vendas e performance.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-zinc-500 bg-zinc-900/50 px-3 py-1.5 rounded-full border border-zinc-800 backdrop-blur-sm">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Sistema Operacional
          </div>
        </header>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <div className="group bg-zinc-900/40 backdrop-blur-xl p-6 rounded-2xl border border-zinc-800/50 hover:border-indigo-500/30 transition-all duration-300 hover:shadow-[0_0_30px_-10px_rgba(99,102,241,0.2)]">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-zinc-800/50 rounded-xl text-indigo-400 group-hover:scale-110 transition-transform duration-300">
                <DollarSign size={24} />
              </div>
              <span className="text-sm font-medium text-zinc-400">Faturamento</span>
            </div>
            <div className="space-y-1">
              <span className="text-3xl font-bold text-white tracking-tight">R$ {totalRevenue.toFixed(2)}</span>
            </div>
          </div>

          <div className="group bg-zinc-900/40 backdrop-blur-xl p-6 rounded-2xl border border-zinc-800/50 hover:border-emerald-500/30 transition-all duration-300 hover:shadow-[0_0_30px_-10px_rgba(16,185,129,0.2)]">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-zinc-800/50 rounded-xl text-emerald-400 group-hover:scale-110 transition-transform duration-300">
                <TrendingUp size={24} />
              </div>
              <span className="text-sm font-medium text-zinc-400">Lucro Líquido</span>
            </div>
            <div className="space-y-1">
              <span className="text-3xl font-bold text-emerald-400 tracking-tight">R$ {netProfit.toFixed(2)}</span>
              <p className="text-xs text-zinc-500">Margem real após custos</p>
            </div>
          </div>

          <div className="group bg-zinc-900/40 backdrop-blur-xl p-6 rounded-2xl border border-zinc-800/50 hover:border-yellow-500/30 transition-all duration-300">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-zinc-800/50 rounded-xl text-yellow-400 group-hover:scale-110 transition-transform duration-300">
                <Clock size={24} />
              </div>
              <span className="text-sm font-medium text-zinc-400">Pendente</span>
            </div>
            <div className="space-y-1">
              <span className="text-3xl font-bold text-yellow-400 tracking-tight">R$ {pendingRevenue.toFixed(2)}</span>
              <p className="text-xs text-zinc-500">Aguardando entrega</p>
            </div>
          </div>

          <div className="group bg-zinc-900/40 backdrop-blur-xl p-6 rounded-2xl border border-zinc-800/50 hover:border-purple-500/30 transition-all duration-300">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-zinc-800/50 rounded-xl text-purple-400 group-hover:scale-110 transition-transform duration-300">
                <ShoppingBag size={24} />
              </div>
              <span className="text-sm font-medium text-zinc-400">Vendas</span>
            </div>
            <div className="space-y-1">
              <span className="text-3xl font-bold text-white tracking-tight">{salesCount}</span>
              <p className="text-xs text-zinc-500">Volume total</p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 bg-zinc-900/40 backdrop-blur-xl p-6 rounded-2xl border border-zinc-800/50 shadow-xl">
              <h2 className="text-xl font-bold mb-6 text-white flex items-center gap-2">
                {editingId ? <Edit className="w-5 h-5 text-indigo-400" /> : <Plus className="w-5 h-5 text-indigo-400" />}
                {editingId ? 'Editar Registro' : 'Nova Venda'}
              </h2>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1.5">Produto</label>
                  <select
                    value={productMode}
                    onChange={handleProductSelect}
                    className="w-full p-3 bg-zinc-950/50 border border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all text-zinc-100"
                  >
                    <option value="" disabled>Selecione...</option>
                    {PRODUCTS.map(p => (
                      <option key={p.name} value={p.name}>{p.name} - R$ {p.price}</option>
                    ))}
                    <option value="custom_input">Outro (Manual)</option>
                  </select>
                  
                  {productMode === 'custom_input' && (
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full mt-2 p-3 bg-zinc-950/50 border border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all text-zinc-100 placeholder-zinc-600"
                      placeholder="Nome do produto"
                    />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1.5">Valor (R$)</label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                      className="w-full p-3 bg-zinc-950/50 border border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all text-zinc-100 placeholder-zinc-600 font-mono"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1.5">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full p-3 bg-zinc-950/50 border border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all text-zinc-100"
                    >
                      <option value="pending">Pendente</option>
                      <option value="delivered">Entregue</option>
                      <option value="cancelled">Cancelado</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1.5">Comprador</label>
                  <input
                    type="text"
                    value={formData.buyer}
                    onChange={(e) => setFormData({ ...formData, buyer: e.target.value })}
                    className="w-full p-3 bg-zinc-950/50 border border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all text-zinc-100 placeholder-zinc-600"
                    placeholder="Nome ou Ticket (#1234)"
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-xl font-medium shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    {editingId ? <RefreshCw size={18} /> : <Plus size={18} />}
                    {editingId ? 'Salvar Alterações' : 'Registrar Venda'}
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null);
                        setFormData({ name: '', value: '', buyer: '', status: 'pending' });
                        setProductMode('');
                      }}
                      className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition-colors"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* List Section */}
          <div className="lg:col-span-2">
            <div className="bg-zinc-900/40 backdrop-blur-xl rounded-2xl border border-zinc-800/50 overflow-hidden shadow-xl">
              <div className="p-6 border-b border-zinc-800/50 flex justify-between items-center bg-zinc-900/50">
                <h2 className="text-xl font-bold text-white">Histórico de Vendas</h2>
                <span className="text-xs font-medium text-zinc-400 bg-zinc-800/80 px-3 py-1 rounded-full border border-zinc-700">
                  {sales.length} registros
                </span>
              </div>
              
              {loading ? (
                <div className="p-12 text-center text-zinc-500 animate-pulse flex flex-col items-center gap-3">
                  <RefreshCw className="animate-spin w-6 h-6" />
                  <p>Sincronizando dados...</p>
                </div>
              ) : sales.length === 0 ? (
                <div className="p-16 text-center text-zinc-500">
                  <div className="mb-4 mx-auto w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-800">
                    <ShoppingBag className="w-8 h-8 text-zinc-600" />
                  </div>
                  <h3 className="text-lg font-medium text-zinc-300 mb-1">Nenhuma venda ainda</h3>
                  <p className="text-sm">Comece registrando sua primeira venda ao lado.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-zinc-950/30 text-zinc-400 text-xs uppercase tracking-wider font-medium">
                        <th className="p-5">Produto</th>
                        <th className="p-5">Comprador</th>
                        <th className="p-5">Valor</th>
                        <th className="p-5">Status</th>
                        <th className="p-5 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                      {sales.map((sale) => (
                        <tr key={sale.id} className="group hover:bg-zinc-800/30 transition-colors">
                          <td className="p-5 font-medium text-zinc-200">{sale.name}</td>
                          <td className="p-5 text-zinc-400 text-sm">{sale.buyer || '-'}</td>
                          <td className="p-5 text-zinc-200 font-mono font-medium">R$ {sale.value.toFixed(2)}</td>
                          <td className="p-5">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(sale.status)}`}>
                              {getStatusLabel(sale.status)}
                            </span>
                          </td>
                          <td className="p-5 text-right">
                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleEdit(sale)}
                                className="p-2 text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
                                title="Editar"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(sale.id)}
                                className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                title="Excluir"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
