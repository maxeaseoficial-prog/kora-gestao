import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Product {
  id: string;
  name: string;
  description?: string;
  costPrice: number;
  salePrice: number;
  productType: 'fisico' | 'digital';
  isActive: boolean;
  registrationDate: string;
  imageUrl?: string;
  createdAt: Date;
}

export type ProductInput = Omit<Product, 'id' | 'createdAt'>;

function mapRow(row: any): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description || undefined,
    costPrice: Number(row.cost_price),
    salePrice: Number(row.sale_price),
    productType: (row.product_type as 'fisico' | 'digital') || 'fisico',
    isActive: !!row.is_active,
    registrationDate: row.registration_date,
    imageUrl: row.image_url || undefined,
    createdAt: new Date(row.created_at),
  };
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) { setProducts([]); setLoading(false); return; }
    (async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        setProducts((data || []).map(mapRow));
      } catch (e) {
        console.error(e);
        toast.error('Erro ao carregar produtos');
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const addProduct = async (input: ProductInput) => {
    if (!user) return;
    try {
      const { data, error } = await supabase.from('products').insert({
        user_id: user.id,
        name: input.name,
        description: input.description || null,
        cost_price: input.costPrice,
        sale_price: input.salePrice,
        product_type: input.productType,
        is_active: input.isActive,
        registration_date: input.registrationDate,
        image_url: input.imageUrl || null,
      }).select().single();
      if (error) throw error;
      setProducts(prev => [mapRow(data), ...prev]);
      toast.success('Produto cadastrado');
    } catch (e) {
      console.error(e); toast.error('Erro ao cadastrar produto');
    }
  };

  const updateProduct = async (id: string, input: ProductInput) => {
    if (!user) return;
    try {
      const { error } = await supabase.from('products').update({
        name: input.name,
        description: input.description || null,
        cost_price: input.costPrice,
        sale_price: input.salePrice,
        product_type: input.productType,
        is_active: input.isActive,
        registration_date: input.registrationDate,
        image_url: input.imageUrl || null,
      }).eq('id', id);
      if (error) throw error;
      setProducts(prev => prev.map(p => p.id === id ? { ...p, ...input } : p));
      toast.success('Produto atualizado');
    } catch (e) {
      console.error(e); toast.error('Erro ao atualizar produto');
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    if (!user) return;
    try {
      const { error } = await supabase.from('products').update({ is_active: isActive }).eq('id', id);
      if (error) throw error;
      setProducts(prev => prev.map(p => p.id === id ? { ...p, isActive } : p));
    } catch (e) {
      console.error(e); toast.error('Erro ao alterar status');
    }
  };

  const deleteProduct = async (id: string) => {
    if (!user) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      setProducts(prev => prev.filter(p => p.id !== id));
      toast.success('Produto removido');
    } catch (e) {
      console.error(e); toast.error('Erro ao remover produto');
    }
  };

  return { products, loading, addProduct, updateProduct, toggleActive, deleteProduct };
}