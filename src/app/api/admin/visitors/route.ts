import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);
        const timeframe = searchParams.get('timeframe') || '7j';

        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Calculer les périodes (Simplifié pour la démo)
        const now = new Date();
        let startDate = new Date();
        if (timeframe === '24h') startDate.setHours(now.getHours() - 24);
        else if (timeframe === '7j') startDate.setDate(now.getDate() - 7);
        else if (timeframe === '30j') startDate.setDate(now.getDate() - 30);
        else if (timeframe === '90j') startDate.setDate(now.getDate() - 90);

        // 1. Stats globales (Total visites sur la période)
        const { count: totalVisits, error: countError } = await supabase
            .from('visitor_logs')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', startDate.toISOString());

        if (countError) throw countError;

        // 2. Visiteurs uniques (IPs uniques)
        const { data: uniqueIps, error: ipError } = await supabase
            .from('visitor_logs')
            .select('ip_address')
            .gte('created_at', startDate.toISOString());

        if (ipError) throw ipError;
        const uniqueCount = new Set(uniqueIps.map(v => v.ip_address)).size;

        // 3. Derniers logs détaillés
        const { data: logs, error: logsError } = await supabase
            .from('visitor_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);

        if (logsError) throw logsError;

        return NextResponse.json({
            success: true,
            data: {
                totalVisits,
                uniqueVisitors: uniqueCount,
                logs: logs || []
            }
        });
    } catch (error: any) {
        console.error('Admin Visitor API Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        // Support either single id in query or array of ids in body
        let idsToRemove: string[] = [];

        if (id) {
            idsToRemove = [id];
        } else {
            const body = await request.json();
            idsToRemove = body.ids || [];
        }

        if (idsToRemove.length === 0) {
            return NextResponse.json({ error: 'IDs are required' }, { status: 400 });
        }

        const { error } = await supabase
            .from('visitor_logs')
            .delete()
            .in('id', idsToRemove);

        if (error) throw error;

        return NextResponse.json({ success: true, removedCount: idsToRemove.length });
    } catch (error: any) {
        console.error('Delete Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
