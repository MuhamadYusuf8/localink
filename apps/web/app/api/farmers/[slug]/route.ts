import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const slug = decodeURIComponent(params.slug).toLowerCase();
    const { data: mappings, error: slugError } = await supabase
      .from('farmer_slugs')
      .select('farmer_id, slug')
      .eq('slug', slug)
      .maybeSingle();

    if (slugError) {
      return NextResponse.json({ success: false, error: { message: slugError.message } }, { status: 500 });
    }

    let farmerId = mappings?.farmer_id ?? null;
    if (!farmerId) {
      const { data: allProfiles } = await supabase.from('public_farmer_profiles').select('*').limit(300);
      const found = (allProfiles ?? []).find((p: any) => String(p.slug_base ?? '').trim().replace(/\s+/g, '-').toLowerCase() === slug);
      farmerId = found?.farmer_id ?? null;
    }

    if (!farmerId) {
      return NextResponse.json({ success: false, error: { message: 'Profil petani tidak ditemukan' } }, { status: 404 });
    }

    const { data: profile, error: profileError } = await supabase
      .from('public_farmer_profiles')
      .select('*')
      .eq('farmer_id', farmerId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ success: false, error: { message: 'Profil petani tidak ditemukan' } }, { status: 404 });
    }

    // Fallback: jika view belum memuat koordinat, ambil dari farmer_profiles (Laravel schema)
    if (profile.latitude == null || profile.longitude == null) {
      const { data: fp } = await supabase
        .from('farmer_profiles')
        .select('latitude,longitude,location_label')
        .eq('id', profile.id)
        .maybeSingle();

      if (fp) {
        profile.latitude = fp.latitude ?? profile.latitude;
        profile.longitude = fp.longitude ?? profile.longitude;
        profile.location_label = fp.location_label ?? profile.location_label;
      }
    }

    return NextResponse.json({ success: true, data: profile });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { message: error instanceof Error ? error.message : 'Terjadi kesalahan' } },
      { status: 500 },
    );
  }
}
