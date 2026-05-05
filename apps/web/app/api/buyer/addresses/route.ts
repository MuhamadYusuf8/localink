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
    const token = req.cookies.get('es_auth_token')?.value;
    if (!token) return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });

    const res = await fetch(`${apiUrl}/buyer/addresses`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store'
    });
    const json = await res.json();
    if (!res.ok) return NextResponse.json({ success: false, error: { message: json.message || 'Gagal memuat alamat' } }, { status: res.status });

    // Map fields: full_address -> address, is_default -> is_primary
    const mappedData = (json.data ?? []).map((addr: any) => ({
      ...addr,
      address: addr.full_address,
      is_primary: addr.is_default
    }));

    return NextResponse.json({ success: true, data: mappedData });
  } catch (error) {
    return NextResponse.json({ success: false, error: { message: error instanceof Error ? error.message : 'Terjadi kesalahan' } }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('es_auth_token')?.value;
    if (!token) return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });

    const body = await req.json();
    const res = await fetch(`${apiUrl}/buyer/addresses`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) return NextResponse.json({ success: false, error: { message: json.message || 'Gagal menyimpan alamat' } }, { status: res.status });

    // Map fields for response
    const mappedAddress = {
      ...json.data,
      address: json.data.full_address,
      is_primary: json.data.is_default
    };

    return NextResponse.json({ success: true, data: mappedAddress });
  } catch (error) {
    return NextResponse.json({ success: false, error: { message: error instanceof Error ? error.message : 'Terjadi kesalahan' } }, { status: 500 });
  }
}
