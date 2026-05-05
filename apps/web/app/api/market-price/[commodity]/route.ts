import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function GET(_req: NextRequest, { params }: { params: { commodity: string } }) {
  try {
    const commodity = decodeURIComponent(params.commodity);
    const { data, error } = await supabase
      .from('market_prices')
      .select('*')
      .eq('commodity', commodity)
      .order('recorded_at', { ascending: true })
      .limit(30);
    if (error) return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
    const prices = (data ?? []).map((d) => Number(d.price));
    const avg = prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;
    const volatility = prices.length ? Math.max(...prices) - Math.min(...prices) : 0;
    const trend = prices.length > 1 ? (prices[prices.length - 1] >= prices[0] ? 'naik' : 'turun') : 'stabil';
    return NextResponse.json({ success: true, data: data ?? [], stats: { avg, volatility, trend } });
  } catch (error) {
    return NextResponse.json({ success: false, error: { message: error instanceof Error ? error.message : 'Terjadi kesalahan' } }, { status: 500 });
  }
}
