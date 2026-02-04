import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const body = await request.json();
        const { object, message, email } = body;

        // 1. Get User (Optional)
        const { data: { user } } = await supabase.auth.getUser();

        // 2. Validate input
        if (!object || !message) {
            return NextResponse.json(
                { success: false, error: 'Sujet et message requis' },
                { status: 400 }
            );
        }

        // 3. Insert Ticket
        const { data, error } = await supabase
            .from('support_tickets')
            .insert({
                user_id: user?.id || null, // Can be null for guests
                email: user?.email || email || null, // Use auth email or provided email
                subject: object,
                message: message,
                status: 'open',
                priority: 'normal'
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating ticket:', error);
            return NextResponse.json(
                { success: false, error: 'Erreur lors de la création du ticket' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Ticket créé avec succès',
            data: data
        });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json(
            { success: false, error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}
