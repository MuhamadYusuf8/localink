import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function resolveFarmerId(slug: string) {
  const { data: mapping } = await supabase.from('farmer_slugs').select('farmer_id').eq('slug', slug).maybeSingle();
  if (mapping?.farmer_id) return mapping.farmer_id;
  const { data: allProfiles } = await supabase.from('public_farmer_profiles').select('farmer_id,slug_base').limit(300);
  const found = (allProfiles ?? []).find((p: any) => String(p.slug_base ?? '').trim().replace(/\s+/g, '-').toLowerCase() === slug);
  return found?.farmer_id ?? null;
}

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const slug = decodeURIComponent(params.slug).toLowerCase();
    const farmerId = await resolveFarmerId(slug);
    if (!farmerId) return NextResponse.json({ success: false, error: { message: 'Petani tidak ditemukan' } }, { status: 404 });

    const page = Number(req.nextUrl.searchParams.get('page') ?? '1');
    const rating = Number(req.nextUrl.searchParams.get('rating') ?? '0');
    const perPage = 10;
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    let query = supabase
      .from('farmer_reviews')
      .select('*', { count: 'exact' })
      .eq('farmer_id', farmerId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (rating >= 1 && rating <= 5) query = query.eq('rating', rating);

    const { data, error, count } = await query;
    if (error) return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });

    return NextResponse.json({
      success: true,
      data: data ?? [],
      pagination: { page, perPage, total: count ?? 0, totalPages: Math.max(1, Math.ceil((count ?? 0) / perPage)) },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: { message: error instanceof Error ? error.message : 'Terjadi kesalahan' } }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const slug = decodeURIComponent(params.slug).toLowerCase();
    const farmerId = await resolveFarmerId(slug);
    if (!farmerId) return NextResponse.json({ success: false, error: { message: 'Petani tidak ditemukan' } }, { status: 404 });

    const body = await req.json();
    const buyerId = String(body.buyer_id ?? '');
    const buyerName = String(body.buyer_name ?? '').trim();
    const buyerAvatar = String(body.buyer_avatar ?? '🧑');
    const rating = Number(body.rating ?? 0);
    const comment = String(body.comment ?? '').trim();
    const isVerified = Boolean(body.is_verified ?? false);
    const orderId = body.order_id ? String(body.order_id) : null;

    if (!buyerId || !buyerName || rating < 1 || rating > 5) {
      return NextResponse.json({ success: false, error: { message: 'Data ulasan tidak valid' } }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('farmer_reviews')
      .insert({
        farmer_id: farmerId,
        buyer_id: buyerId,
        buyer_name: buyerName,
        buyer_avatar: buyerAvatar,
        rating,
        comment,
        is_verified: isVerified,
        order_id: orderId,
      })
      .select('*')
      .single();

    if (error) return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: { message: error instanceof Error ? error.message : 'Terjadi kesalahan' } }, { status: 500 });
  }
}
