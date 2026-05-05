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

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUser(req);
    if (!user?.id) return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    const { data, error } = await supabase
      .from('orders')
      .update({ status: 'selesai' })
      .eq('id', params.id)
      .eq('buyer_id', user.id)
      .select('*')
      .single();
    if (error) return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: { message: error instanceof Error ? error.message : 'Terjadi kesalahan' } }, { status: 500 });
  }
}
