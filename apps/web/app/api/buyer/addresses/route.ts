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

export async function GET(req: NextRequest) {
  try {
    const user = await getUser(req);
    if (!user?.id) return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    const { data, error } = await supabase.from('buyer_addresses').select('*').eq('buyer_id', user.id).order('is_primary', { ascending: false });
    if (error) return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
    return NextResponse.json({ success: true, data: data ?? [] });
  } catch (error) {
    return NextResponse.json({ success: false, error: { message: error instanceof Error ? error.message : 'Terjadi kesalahan' } }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUser(req);
    if (!user?.id) return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    const body = await req.json();
    const required = ['label', 'recipient_name', 'phone', 'province', 'city', 'district', 'address'];
    for (const key of required) {
      if (!String(body[key] ?? '').trim()) return NextResponse.json({ success: false, error: { message: `Field ${key} wajib diisi` } }, { status: 400 });
    }
    if (body.is_primary) await supabase.from('buyer_addresses').update({ is_primary: false }).eq('buyer_id', user.id);
    const { data, error } = await supabase
      .from('buyer_addresses')
      .insert({
        buyer_id: user.id,
        label: body.label,
        recipient_name: body.recipient_name,
        phone: body.phone,
        province: body.province,
        city: body.city,
        district: body.district,
        address: body.address,
        postal_code: body.postal_code ?? null,
        is_primary: Boolean(body.is_primary),
      })
      .select('*')
      .single();
    if (error) return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: { message: error instanceof Error ? error.message : 'Terjadi kesalahan' } }, { status: 500 });
  }
}
