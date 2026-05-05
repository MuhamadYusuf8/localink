import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const apiUrl = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1').replace(/\/+$/, '');
const authMeUrl = /\/api\/v1$/i.test(apiUrl) ? `${apiUrl}/auth/me` : `${apiUrl}/api/v1/auth/me`;

async function getUser(req: NextRequest) {
  const token = req.cookies.get('es_auth_token')?.value;
  if (!token) return null;
  const res = await fetch(authMeUrl, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
  if (!res.ok) return null;
  const json = await res.json();
  return json?.data ?? null;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUser(req);
    if (!user?.id) return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    let { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', params.id)
      .eq('buyer_id', user.id)
      .single();

    // Fallback: If not found, try searching by the first 12 characters (prefix)
    if (!order && params.id.length >= 13) {
      const prefix = params.id.substring(0, 13); // e.g. "ff2d03c3-6370"
      const { data: allUserOrders } = await supabase
        .from('orders')
        .select('*')
        .eq('buyer_id', user.id);
      
      const matched = allUserOrders?.find(o => o.id.startsWith(prefix));
      if (matched) order = matched;
    }

    if (!order) {
      return NextResponse.json({ success: false, error: { message: 'Order tidak ditemukan' } }, { status: 404 });
    }

    // Fetch farmer profile separately
    let farmer = null;
    if (order.farmer_id) {
      const { data: farmerData } = await supabase
        .from('farmer_profiles')
        .select('id, store_name, slug')
        .eq('id', order.farmer_id) // It currently stores Profile ID
        .single();
      farmer = farmerData;
    }

    const { data: items } = await supabase.from('order_items').select('*').eq('order_id', order.id);
    return NextResponse.json({ success: true, data: { ...order, farmer, items: items ?? [] } });
  } catch (error) {
    return NextResponse.json({ success: false, error: { message: error instanceof Error ? error.message : 'Terjadi kesalahan' } }, { status: 500 });
  }
}
