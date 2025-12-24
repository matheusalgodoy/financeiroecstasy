import { NextResponse } from 'next/server';
import { getSales, createSale, updateSale, deleteSale, Sale } from '@/lib/data';
import { notifyDiscord } from '@/lib/discord';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  const sales = await getSales();
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
      created_at: new Date().toISOString(),
    };

    await createSale(newSale);
    
    // Fetch updated list for Discord
    const sales = await getSales();
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

    const updatedSale: Sale = {
      id,
      name,
      value: Number(value),
      buyer: buyer || 'Não informado',
      status,
    };
    
    await updateSale(updatedSale);

    const sales = await getSales();
    await notifyDiscord(sales);
    
    return NextResponse.json(updatedSale);
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

    await deleteSale(id);

    const sales = await getSales();
    await notifyDiscord(sales);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
