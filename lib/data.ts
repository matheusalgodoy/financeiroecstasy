import { supabase } from './supabase';

export interface Sale {
  id: string;
  name: string;
  value: number;
  buyer: string;
  status: 'pending' | 'delivered' | 'cancelled';
  created_at?: string;
}

export interface Metadata {
  discordMessageId?: string;
}

export async function getSales(): Promise<Sale[]> {
  const { data, error } = await supabase
    .from('sales')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching sales:', error);
    return [];
  }

  return data || [];
}

export async function createSale(sale: Sale) {
  const { error } = await supabase
    .from('sales')
    .insert([sale]);
  
  if (error) throw error;
}

export async function updateSale(sale: Sale) {
  const { error } = await supabase
    .from('sales')
    .update({
      name: sale.name,
      value: sale.value,
      buyer: sale.buyer,
      status: sale.status
    })
    .eq('id', sale.id);

  if (error) throw error;
}

export async function deleteSale(id: string) {
  const { error } = await supabase
    .from('sales')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getMetadata(): Promise<Metadata> {
  const { data, error } = await supabase
    .from('app_metadata')
    .select('value')
    .eq('key', 'discord_message_id')
    .single();

  if (error || !data) {
    return {};
  }

  return { discordMessageId: data.value };
}

export async function saveMetadata(metadata: Metadata) {
  if (metadata.discordMessageId) {
    const { error } = await supabase
      .from('app_metadata')
      .upsert({ 
        key: 'discord_message_id', 
        value: metadata.discordMessageId 
      }, { onConflict: 'key' });
      
    if (error) console.error('Error saving metadata:', error);
  }
}
