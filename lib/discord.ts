import axios from 'axios';
import { Sale, getMetadata, saveMetadata } from './data';

const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || '';

function getProductCost(name: string): number {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('infinity')) return 250;
  if (lowerName.includes('fw pro')) return 430;
  return 0; // Unknown product, assume 0 cost or handle as needed
}

function formatTable(sales: Sale[]): string {
  if (sales.length === 0) return 'Nenhum registro.';
  
  // Adjusted formatting with padding
  // Name (15) | Buyer (15) | Value (8)
  const header = 'PRODUTO'.padEnd(15) + 'COMPRADOR'.padEnd(15) + 'VALOR';
  const separator = '-'.repeat(15) + ' ' + '-'.repeat(15) + ' ' + '-'.repeat(10);
  
  const rows = sales.map(s => {
    let name = s.name;
    if (name.length > 13) {
      name = name.substring(0, 12) + '…';
    }
    
    let buyer = s.buyer || '-';
    if (buyer.length > 13) {
      buyer = buyer.substring(0, 12) + '…';
    }

    return `${name.padEnd(15)} ${buyer.padEnd(15)} R$ ${s.value.toFixed(2).padStart(8)}`;
  }).join('\n');
  
  return `\`\`\`text\n${header}\n${separator}\n${rows}\n\`\`\``;
}

export async function notifyDiscord(sales: Sale[]) {
  if (!WEBHOOK_URL) {
    console.warn('DISCORD_WEBHOOK_URL is not defined');
    return;
  }

  const pending = sales.filter(s => s.status === 'pending');
  const delivered = sales.filter(s => s.status === 'delivered');
  const cancelled = sales.filter(s => s.status === 'cancelled');

  const totalValue = sales.reduce((acc, curr) => acc + curr.value, 0);
  const pendingValue = pending.reduce((acc, curr) => acc + curr.value, 0);

  // Calculate Real Profit (only for delivered items)
  const realProfit = delivered.reduce((acc, curr) => {
    const cost = getProductCost(curr.name);
    return acc + (curr.value - cost);
  }, 0);

  const embed = {
    title: '📊 Painel de Vendas',
    color: 0x2b2d31, // Dark background
    description: `**Resumo Financeiro**\n💰 Total Geral: **R$ ${totalValue.toFixed(2)}**\n✅ Lucro Líquido (Entregues): **R$ ${realProfit.toFixed(2)}**\n⏳ Em Aberto: **R$ ${pendingValue.toFixed(2)}**`,
    fields: [
      {
        name: `⏳ Pendentes (${pending.length})`,
        value: formatTable(pending),
        inline: false,
      },
      {
        name: `✅ Últimas 5 Entregas`,
        value: formatTable(delivered.slice(-5).reverse()), // Show newest first
        inline: false,
      }
    ],
    footer: {
      text: `Última atualização: ${new Date().toLocaleString('pt-BR')}`
    },
    timestamp: new Date().toISOString(),
  };

  const metadata = getMetadata();
  let messageId = metadata.discordMessageId;

  try {
    if (messageId) {
      // Try to edit existing message
      try {
        await axios.patch(`${WEBHOOK_URL}/messages/${messageId}`, {
          embeds: [embed],
        });
        return; // Success, we are done
      } catch (error: any) {
        // If 404, message was deleted, so we proceed to create a new one
        if (error.response && error.response.status === 404) {
          console.log('Previous Discord message not found, creating new one.');
          messageId = undefined;
        } else {
          throw error; // Other errors should be reported
        }
      }
    }

    // Create new message if no ID or edit failed
    if (!messageId) {
      const response = await axios.post(`${WEBHOOK_URL}?wait=true`, {
        embeds: [embed],
      });
      
      if (response.data && response.data.id) {
        saveMetadata({ ...metadata, discordMessageId: response.data.id });
      }
    }
  } catch (error) {
    console.error('Failed to send/update Discord webhook', error);
  }
}
