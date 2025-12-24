'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Trash2, Edit, Plus, RefreshCw } from 'lucide-react';

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

export default function Home() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<{name: string, value: string, buyer: string, status: 'pending' | 'delivered' | 'cancelled'}>({ name: '', value: '', buyer: '', status: 'pending' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [productMode, setProductMode] = useState<string>('');

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
      case 'pending': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'delivered': return 'bg-green-100 text-green-800 border border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border border-red-200';
      default: return 'bg-gray-100 text-gray-800';
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
    <main className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8 text-center sm:text-left">
          <h1 className="text-3xl font-bold text-gray-900">Gerenciador de Vendas</h1>
          <p className="text-gray-500 mt-2">Controle suas vendas e atualize o Discord automaticamente.</p>
        </header>
        
        {/* Form */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
          <h2 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
            {editingId ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {editingId ? 'Editar Venda' : 'Nova Venda'}
          </h2>
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 w-full sm:w-auto">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome / Descrição</label>
              <select
                value={productMode}
                onChange={handleProductSelect}
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900 bg-white"
              >
                <option value="" disabled>Selecione um produto...</option>
                {PRODUCTS.map(p => (
                  <option key={p.name} value={p.name}>{p.name} - R$ {p.price}</option>
                ))}
                <option value="custom_input">Outro (Digitar manualmente)</option>
              </select>
              
              {productMode === 'custom_input' && (
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900 mt-2"
                  placeholder="Ex: Infinity"
                />
              )}
            </div>
            <div className="w-full sm:w-32">
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
              <input
                type="number"
                required
                step="0.01"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900"
                placeholder="0.00"
              />
            </div>
            <div className="w-full sm:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-1">Comprador (Ticket)</label>
              <input
                type="text"
                value={formData.buyer}
                onChange={(e) => setFormData({ ...formData, buyer: e.target.value })}
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900"
                placeholder="Ex: #1234 ou Nome"
              />
            </div>
            <div className="w-full sm:w-40">
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900 bg-white"
              >
                <option value="pending">Pendente</option>
                <option value="delivered">Entregue</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                type="submit"
                className="flex-1 sm:flex-none px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-medium"
              >
                {editingId ? <RefreshCw size={18} /> : <Plus size={18} />}
                {editingId ? 'Atualizar' : 'Adicionar'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setFormData({ name: '', value: '', buyer: '', status: 'pending' });
                    setProductMode('');
                  }}
                  className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        {/* List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">Vendas Recentes</h2>
            <span className="text-sm font-medium text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">
              Total: {sales.length}
            </span>
          </div>
          
          {loading ? (
            <div className="p-12 text-center text-gray-500 animate-pulse">Carregando dados...</div>
          ) : sales.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <div className="mb-3 mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <Plus className="w-6 h-6 text-gray-400" />
              </div>
              <p>Nenhuma venda registrada.</p>
              <p className="text-sm mt-1">Adicione sua primeira venda acima.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50 text-gray-600 text-sm border-b border-gray-100">
                    <th className="p-4 font-semibold">Nome</th>
                    <th className="p-4 font-semibold">Comprador</th>
                    <th className="p-4 font-semibold">Valor</th>
                    <th className="p-4 font-semibold">Status</th>
                    <th className="p-4 font-semibold text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="p-4 font-medium text-gray-900">{sale.name}</td>
                      <td className="p-4 text-gray-600">{sale.buyer || '-'}</td>
                      <td className="p-4 text-gray-600 font-mono">R$ {sale.value.toFixed(2)}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(sale.status)}`}>
                          {getStatusLabel(sale.status)}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEdit(sale)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(sale.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Excluir"
                          >
                            <Trash2 size={18} />
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
    </main>
  );
}
