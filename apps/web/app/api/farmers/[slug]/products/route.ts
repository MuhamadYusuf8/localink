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

    const sort = req.nextUrl.searchParams.get('sort') ?? 'terbaru';
    // Gunakan 'is_published' sesuai migrasi, bukan 'is_available'
    let query = supabase.from('products').select('*').eq('farmer_id', farmerId).eq('is_published', true);

    if (sort === 'harga_asc') query = query.order('retail_price', { ascending: true });
    else if (sort === 'harga_desc') query = query.order('retail_price', { ascending: false });
    else if (sort === 'rating') query = query.order('average_rating', { ascending: false });
    else query = query.order('created_at', { ascending: false });

    const { data, error } = await query.limit(60);
    if (error) return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });

    // Map fields to match frontend expectations
    const mappedData = (data ?? []).map(p => ({
      ...p,
      price: p.retail_price,
      stock: p.stock_qty,
      rating: p.average_rating,
      product_emoji: p.product_emoji || p.emoji || '🥬'
    }));

    return NextResponse.json({ success: true, data: mappedData });
  } catch (error) {
    return NextResponse.json({ success: false, error: { message: error instanceof Error ? error.message : 'Terjadi kesalahan' } }, { status: 500 });
  }
}
