import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function GET(req: NextRequest) {
  try {
    const q = (req.nextUrl.searchParams.get('q') ?? '').toLowerCase();
    const category = req.nextUrl.searchParams.get('category') ?? 'Semua';
    const location = req.nextUrl.searchParams.get('location') ?? 'Nasional';

    let query = supabase.from('market_prices').select('*').order('recorded_at', { ascending: false }).limit(500);
    if (category !== 'Semua') query = query.eq('category', category);
    if (location !== 'Nasional') query = query.eq('province', location);
    const { data, error } = await query;
    if (error) return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });

    const grouped = new Map<string, any[]>();
    (data ?? []).forEach((row) => {
      if (q && !String(row.commodity).toLowerCase().includes(q)) return;
      const key = `${row.commodity}-${row.location}-${row.province ?? 'nasional'}`;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(row);
    });

    const latest = Array.from(grouped.values()).map((rows) => {
      const sorted = rows.sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime());
      const today = sorted[0];
      const yesterday = sorted[1] ?? null;
      const prices = sorted.slice(0, 30).map((r) => Number(r.price));
      const highest = Math.max(...prices);
      const lowest = Math.min(...prices);
      const diff = Number(today.price) - Number(yesterday?.price ?? today.price);
      return { ...today, previous_price: yesterday?.price ?? today.price, diff, highest, lowest, history: sorted.slice(0, 7).reverse() };
    });

    return NextResponse.json({ success: true, data: latest, updated_at: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json({ success: false, error: { message: error instanceof Error ? error.message : 'Terjadi kesalahan' } }, { status: 500 });
  }
}
