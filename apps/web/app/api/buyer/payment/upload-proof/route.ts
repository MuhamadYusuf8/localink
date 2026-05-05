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
    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) return NextResponse.json({ success: false, error: { message: 'File tidak ditemukan' } }, { status: 400 });
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      return NextResponse.json({ success: false, error: { message: 'Format file harus JPG/PNG/WEBP' } }, { status: 400 });
    }
    const ext = file.type.split('/')[1] ?? 'jpg';
    const path = `${user.id}/${Date.now()}.${ext}`;
    const buffer = await file.arrayBuffer();
    const { error } = await supabase.storage.from('payment-proofs').upload(path, buffer, { contentType: file.type, upsert: true });
    if (error) return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
    const { data } = supabase.storage.from('payment-proofs').getPublicUrl(path);
    return NextResponse.json({ success: true, data: { url: data.publicUrl, path } });
  } catch (error) {
    return NextResponse.json({ success: false, error: { message: error instanceof Error ? error.message : 'Terjadi kesalahan' } }, { status: 500 });
  }
}
