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

export async function POST(req: NextRequest) {
  try {
    const user = await getUser(req);
    if (!user?.id) return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    const body = await req.json();
    const orderId = String(body.order_id ?? '');
    if (!orderId) return NextResponse.json({ success: false, error: { message: 'order_id wajib diisi' } }, { status: 400 });

    const { data: order } = await supabase.from('orders').select('*').eq('id', orderId).eq('buyer_id', user.id).single();
    if (!order) return NextResponse.json({ success: false, error: { message: 'Order tidak ditemukan' } }, { status: 404 });

    await supabase.from('payment_attempts').insert({
      order_id: orderId,
      method: body.method ?? order.payment_method,
      amount: order.total_amount,
      status: 'success',
      proof_url: body.proof_url ?? null,
      notes: body.notes ?? null,
    });

    const { data, error } = await supabase
      .from('orders')
      .update({
        payment_method: body.method ?? order.payment_method,
        payment_bank: body.payment_bank ?? order.payment_bank,
        payment_status: 'paid',
        status: 'pembayaran_dikonfirmasi',
        paid_at: new Date().toISOString(),
        payment_proof: body.proof_url ?? order.payment_proof,
      })
      .eq('id', orderId)
      .eq('buyer_id', user.id)
      .select('*')
      .single();

    if (error) return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: { message: error instanceof Error ? error.message : 'Terjadi kesalahan' } }, { status: 500 });
  }
}
