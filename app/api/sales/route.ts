import { NextResponse } from 'next/server';
import { getSales, saveSales, Sale } from '@/lib/data';
import { notifyDiscord } from '@/lib/discord';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  const sales = getSales();
  return NextResponse.json(sales);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, value, status, buyer } = body;
    
    if (!name || value === undefined) {
        return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const newSale: Sale = {
      id: uuidv4(),
      name,
      value: Number(value),
      buyer: buyer || 'Não informado',
      status: status || 'pending',
    };

    const sales = getSales();
    sales.push(newSale);
    saveSales(sales);
    
    // Trigger webhook in background (don't await to keep UI fast, or await if consistency is key)
    // We await to ensure we catch errors if needed, but for Discord we can just fire and forget or await.
    await notifyDiscord(sales);

    return NextResponse.json(newSale);
  } catch (error) {
    console.error('POST Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, value, status, buyer } = body;

    const sales = getSales();
    const index = sales.findIndex(s => s.id === id);
    
    if (index !== -1) {
      sales[index] = { ...sales[index], name, value: Number(value), status, buyer: buyer || sales[index].buyer || 'Não informado' };
      saveSales(sales);
      await notifyDiscord(sales);
      return NextResponse.json(sales[index]);
    }

    return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
  } catch (error) {
    console.error('PUT Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    let sales = getSales();
    sales = sales.filter(s => s.id !== id);
    saveSales(sales);
    await notifyDiscord(sales);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
