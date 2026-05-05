import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const MAX_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
type AuthUser = { id: string; role?: string };

const apiUrl =
  (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1').replace(/\/+$/, '');
const authMeUrl = /\/api\/v1$/i.test(apiUrl) ? `${apiUrl}/auth/me` : `${apiUrl}/api/v1/auth/me`;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function getAuthenticatedUser(req: NextRequest): Promise<AuthUser | null> {
  const token = req.cookies.get('es_auth_token')?.value;
  if (!token) return null;

  try {
    const res = await fetch(authMeUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: AuthUser };
    return json.data ?? null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get('logo');

  if (!(file instanceof File)) {
    return NextResponse.json({ success: false, error: 'File tidak ada' }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ success: false, error: 'Maksimal 2MB' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { success: false, error: 'Format harus JPG/PNG/WEBP' },
      { status: 400 },
    );
  }

  const ext = file.type.split('/')[1] ?? 'jpg';
  const filename = `logos/${user.id}-${Date.now()}.${ext}`;
  const buffer = await file.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from('farm-assets')
    .upload(filename, buffer, { contentType: file.type, upsert: true });

  if (uploadError) {
    return NextResponse.json({ success: false, error: uploadError.message }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from('farm-assets').getPublicUrl(filename);

  const { error: updateError } = await supabase
    .from('farmer_profiles')
    .update({ logo_url: publicUrl })
    .eq('user_id', user.id);

  if (updateError) {
    return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: { logoUrl: publicUrl } });
}
