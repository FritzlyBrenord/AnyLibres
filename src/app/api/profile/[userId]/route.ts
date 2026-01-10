import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params;
    const supabase = await createClient();

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Missing user id' }, { status: 400 });
    }

    console.log('🔍 Recherche du profil pour userId:', userId);

    // Récupérer le profil public de l'utilisateur demandé
    // userId peut être soit un user_id (UUID auth) soit un profile id
    let profile = null;
    let error = null;

    // D'abord essayer avec user_id (UUID Supabase Auth)
    const { data: profileByUserId, error: errorByUserId } = await supabase
      .from('profiles')
      .select(`id, user_id, display_name, first_name, last_name, avatar_url, bio, location, website, created_at`)
      .eq('user_id', userId)
      .maybeSingle();

    if (profileByUserId) {
      profile = profileByUserId;
      console.log('✅ Profil trouvé par user_id:', profile.id);
    } else {
      // Si pas trouvé, essayer avec l'id du profil directement
      const { data: profileById, error: errorById } = await supabase
        .from('profiles')
        .select(`id, user_id, display_name, first_name, last_name, avatar_url, bio, location, website, created_at`)
        .eq('id', userId)
        .maybeSingle();

      if (profileById) {
        profile = profileById;
        console.log('✅ Profil trouvé par profile id:', profile.id);
      } else {
        error = errorById || errorByUserId;
        console.log('❌ Profil non trouvé');
      }
    }

    if (error || !profile) {
      console.error('❌ Erreur profil:', error);
      return NextResponse.json({ success: false, error: 'Profile not found' }, { status: 404 });
    }

    // Ne pas exposer de données sensibles (email, phone)
    const publicProfile = {
      id: profile.id,
      user_id: profile.user_id,
      display_name: profile.display_name,
      first_name: profile.first_name,
      last_name: profile.last_name,
      avatar_url: profile.avatar_url,
      bio: profile.bio,
      location: profile.location,
      website: profile.website,
      created_at: profile.created_at,
    };

    console.log('✅ Profil retourné:', publicProfile.display_name || publicProfile.first_name);

    return NextResponse.json({ success: true, profile: publicProfile });
  } catch (err: any) {
    console.error('Error GET /api/profile/[userId]:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
