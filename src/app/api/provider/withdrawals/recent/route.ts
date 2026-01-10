// app/api/provider/withdrawals/recent/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // ┌─────────────────────────────────────────────────────────────────────────────┐
    // │ 1. RÉCUPÉRER LA LIMITE APPLICABLE (CUSTOM PUIS GLOBAL)                      │
    // └─────────────────────────────────────────────────────────────────────────────┘

    // Récupérer la limite globale
    const { data: platformSettings } = await supabase
      .from('platform_settings')
      .select('withdra_qty')
      .single();

    // Récupérer la limite personnalisée
    const { data: balance } = await supabase
      .from('provider_balance')
      .select('custom_withdra_qty')
      .eq('provider_id', user.id)
      .single();

    const globalLimit = Number(platformSettings?.withdra_qty || 1);
    const customLimit = balance?.custom_withdra_qty;

    // Priorité: Custom > Global
    const maxWithdrawalsPerDay = (customLimit !== null && customLimit !== undefined)
      ? customLimit
      : globalLimit;

    // ┌─────────────────────────────────────────────────────────────────────────────┐
    // │ 2. RÉCUPÉRER ET FILTRER LES RETRAITS RÉCENTS                                │
    // └─────────────────────────────────────────────────────────────────────────────┘
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);

    const { data: recentWithdrawals, error } = await supabase
      .from('provider_withdrawals')
      .select('id, created_at, status, admin_notes')
      .eq('provider_id', user.id)
      .gte('created_at', oneDayAgo.toISOString())
      .in('status', ['pending', 'processing', 'completed'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error checking recent withdrawals:', error);
      return NextResponse.json({ success: false, error: 'Erreur verification' }, { status: 500 });
    }

    // Filtrer les retraits réinitialisés par l'admin
    const validWithdrawals = recentWithdrawals?.filter(w => {
      if (w.admin_notes && typeof w.admin_notes === 'string' && w.admin_notes.includes('Timer réinitialisé')) {
        return false;
      }
      return true;
    }) || [];

    // ┌─────────────────────────────────────────────────────────────────────────────┐
    // │ 3. CALCULER LE TEMPS RESTANT                                                │
    // └─────────────────────────────────────────────────────────────────────────────┘
    // On ne bloque QUE si on a atteint ou dépassé la limite
    let timeRemaining = 0;
    let lastWithdrawalTime = null;

    if (validWithdrawals.length >= maxWithdrawalsPerDay) {
      // Le prochain créneau se libère quand le retraits le plus vieux (dans la limite) expire
      // Exemple: si limite=3, on regarde quand le 3ème retrait le plus récent fête ses 24h
      const indexToFree = maxWithdrawalsPerDay - 1;
      const blockingWithdrawal = validWithdrawals[indexToFree];

      if (blockingWithdrawal) {
        lastWithdrawalTime = new Date(blockingWithdrawal.created_at).getTime();
        const currentTime = Date.now();
        const hoursSinceLast = (currentTime - lastWithdrawalTime) / (1000 * 60 * 60);
        timeRemaining = Math.max(0, 24 - hoursSinceLast);
      }
    }

    return NextResponse.json({
      success: true,
      canWithdraw: timeRemaining === 0,
      timeRemaining,
      maxLimit: maxWithdrawalsPerDay,
      currentCount: validWithdrawals.length,
      lastWithdrawalTime,
    });

  } catch (error) {
    console.error('Error in recent withdrawals API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur serveur'
      },
      { status: 500 }
    );
  }
}