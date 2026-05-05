import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const SettingsSchema = z.object({
  store_name: z.string().min(3, 'Nama toko minimal 3 karakter').max(100),
  store_description: z.string().max(2000).optional().nullable(),
  store_avatar: z.string().max(5).optional().nullable(),
  store_tagline: z.string().max(200).optional().nullable(),
  established_year: z.string().regex(/^\d{4}$/).optional().nullable(),
  phone: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  province: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  district: z.string().optional().nullable(),
  full_address: z.string().optional().nullable(),
  pickup_available: z.boolean().optional(),
  pickup_notes: z.string().optional().nullable(),
  delivery_radius_km: z.number().min(1).max(500).optional(),
  min_order_value: z.number().min(0).optional(),
  free_shipping_min: z.number().min(0).optional(),
  supported_couriers: z.array(z.string()).optional(),
  open_days: z.array(z.string()).optional(),
  open_hour: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  close_hour: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  auto_reply_message: z.string().max(500).optional().nullable(),
  product_categories: z.array(z.string()).optional(),
  farming_methods: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),
  bank_name: z.string().optional().nullable(),
  bank_account: z.string().optional().nullable(),
  bank_holder: z.string().optional().nullable(),
  payment_methods: z.array(z.string()).optional(),
  notif_new_order: z.boolean().optional(),
  notif_new_message: z.boolean().optional(),
  notif_review: z.boolean().optional(),
  notif_promotion: z.boolean().optional(),
  notif_email: z.boolean().optional(),
  notif_whatsapp: z.boolean().optional(),
  logo_url: z.string().optional().nullable(),
});

type SettingsResponse = Record<string, string | number | boolean | string[]>;
type AuthUser = { id: string; email?: string | null; role?: string };

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

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user?.id) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Silakan login terlebih dahulu',
        },
      },
      { status: 401 },
    );
  }

  const { data: profile, error: dbError } = await supabase
    .from('farmer_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (dbError?.code === 'PGRST116') {
    return NextResponse.json({
      success: true,
      data: getDefaultSettings(user.email ?? ''),
      isNew: true,
    });
  }

  if (dbError) {
    console.error('[GET /api/farmer/settings]', dbError);
    return NextResponse.json(
      { success: false, error: { code: 'DB_ERROR', message: 'Gagal memuat data' } },
      { status: 500 },
    );
  }

  const safeProfile = {
    ...profile,
    bank_account: profile.bank_account ? `**** **** ${String(profile.bank_account).slice(-4)}` : '',
    email: profile.email || user.email,
  };

  return NextResponse.json({
    success: true,
    data: mapDbToSettings(safeProfile),
  });
}

export async function PUT(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user?.id) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Silakan login terlebih dahulu' },
      },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_JSON', message: 'Body tidak valid' } },
      { status: 400 },
    );
  }

  const parsed = SettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Data tidak valid',
          fields: parsed.error.flatten().fieldErrors,
        },
      },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const isNewBankAccount = Boolean(data.bank_account && !data.bank_account.includes('*'));

  const upsertData = {
    user_id: user.id,
    store_name: data.store_name,
    store_description: data.store_description ?? null,
    store_avatar: data.store_avatar ?? null,
    store_tagline: data.store_tagline ?? null,
    established_year: data.established_year ?? null,
    phone: data.phone ?? null,
    whatsapp: data.whatsapp ?? null,
    email: data.email ?? user.email ?? null,
    province: data.province ?? null,
    city: data.city ?? null,
    district: data.district ?? null,
    full_address: data.full_address ?? null,
    pickup_available: data.pickup_available ?? false,
    pickup_notes: data.pickup_notes ?? null,
    delivery_radius_km: data.delivery_radius_km ?? 50,
    min_order_value: data.min_order_value ?? 0,
    free_shipping_min: data.free_shipping_min ?? 0,
    supported_couriers: data.supported_couriers ?? [],
    open_days: data.open_days ?? [],
    open_hour: data.open_hour ?? '06:00',
    close_hour: data.close_hour ?? '17:00',
    auto_reply_message: data.auto_reply_message ?? null,
    product_categories: data.product_categories ?? [],
    farming_methods: data.farming_methods ?? [],
    certifications: data.certifications ?? [],
    bank_name: data.bank_name ?? null,
    bank_holder: data.bank_holder ?? null,
    ...(isNewBankAccount ? { bank_account: data.bank_account } : {}),
    payment_methods: data.payment_methods ?? [],
    notif_new_order: data.notif_new_order ?? true,
    notif_new_message: data.notif_new_message ?? true,
    notif_review: data.notif_review ?? true,
    notif_promotion: data.notif_promotion ?? false,
    notif_email: data.notif_email ?? true,
    notif_whatsapp: data.notif_whatsapp ?? true,
    ...(data.logo_url !== undefined ? { logo_url: data.logo_url } : {}),
  };

  const { data: saved, error: saveError } = await supabase
    .from('farmer_profiles')
    .upsert(upsertData, { onConflict: 'user_id' })
    .select()
    .single();

  if (saveError) {
    console.error('[PUT /api/farmer/settings]', saveError);
    return NextResponse.json(
      { success: false, error: { code: 'DB_ERROR', message: 'Gagal menyimpan data' } },
      { status: 500 },
    );
  }

  const safeResult = {
    ...saved,
    bank_account: saved.bank_account ? `**** **** ${String(saved.bank_account).slice(-4)}` : '',
  };

  return NextResponse.json({
    success: true,
    data: mapDbToSettings(safeResult),
    message: 'Pengaturan berhasil disimpan',
  });
}

function mapDbToSettings(row: Record<string, unknown>): SettingsResponse {
  const getArray = (value: unknown): string[] => (Array.isArray(value) ? value.map(String) : []);
  const getString = (value: unknown, fallback = ''): string =>
    typeof value === 'string' ? value : fallback;
  const getNumber = (value: unknown, fallback: number): number =>
    typeof value === 'number' ? value : fallback;
  const getBoolean = (value: unknown, fallback: boolean): boolean =>
    typeof value === 'boolean' ? value : fallback;

  return {
    store_name: getString(row.store_name),
    store_description: getString(row.store_description),
    store_avatar: getString(row.store_avatar, 'TS'),
    store_tagline: getString(row.store_tagline),
    established_year: getString(row.established_year),
    phone: getString(row.phone),
    whatsapp: getString(row.whatsapp),
    email: getString(row.email),
    province: getString(row.province),
    city: getString(row.city),
    district: getString(row.district),
    full_address: getString(row.full_address),
    pickup_available: getBoolean(row.pickup_available, false),
    pickup_notes: getString(row.pickup_notes),
    delivery_radius_km: getNumber(row.delivery_radius_km, 50),
    min_order_value: getNumber(row.min_order_value, 0),
    free_shipping_min: getNumber(row.free_shipping_min, 0),
    supported_couriers: getArray(row.supported_couriers),
    open_days: getArray(row.open_days),
    open_hour: getString(row.open_hour, '06:00'),
    close_hour: getString(row.close_hour, '17:00'),
    auto_reply_message: getString(row.auto_reply_message),
    product_categories: getArray(row.product_categories),
    farming_methods: getArray(row.farming_methods),
    certifications: getArray(row.certifications),
    bank_name: getString(row.bank_name),
    bank_account: getString(row.bank_account),
    bank_holder: getString(row.bank_holder),
    payment_methods: getArray(row.payment_methods),
    notif_new_order: getBoolean(row.notif_new_order, true),
    notif_new_message: getBoolean(row.notif_new_message, true),
    notif_review: getBoolean(row.notif_review, true),
    notif_promotion: getBoolean(row.notif_promotion, false),
    notif_email: getBoolean(row.notif_email, true),
    notif_whatsapp: getBoolean(row.notif_whatsapp, true),
    logo_url: getString(row.logo_url),
  };
}

function getDefaultSettings(email: string): SettingsResponse {
  return {
    store_name: '',
    store_description: '',
    store_avatar: 'TS',
    store_tagline: '',
    established_year: '',
    phone: '',
    whatsapp: '',
    email,
    province: '',
    city: '',
    district: '',
    full_address: '',
    pickup_available: false,
    pickup_notes: '',
    delivery_radius_km: 50,
    min_order_value: 0,
    free_shipping_min: 0,
    supported_couriers: [],
    open_days: [],
    open_hour: '06:00',
    close_hour: '17:00',
    auto_reply_message: '',
    product_categories: [],
    farming_methods: [],
    certifications: [],
    bank_name: '',
    bank_account: '',
    bank_holder: '',
    payment_methods: [],
    notif_new_order: true,
    notif_new_message: true,
    notif_review: true,
    notif_promotion: false,
    notif_email: true,
    notif_whatsapp: true,
    logo_url: '',
  };
}
