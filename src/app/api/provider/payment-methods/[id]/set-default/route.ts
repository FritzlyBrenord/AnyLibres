// ============================================================================
// API: Provider Payment Methods - Set Default
// ============================================================================

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * PATCH /api/provider/payment-methods/[id]/set-default
 * Set a payment method as default
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = await createClient();

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { success: false, error: 'Non authentifié' },
                { status: 401 }
            );
        }

        const methodId = params.id;

        // First, verify the method exists and belongs to the user
        const { data: method, error: checkError } = await supabase
            .from('provider_payment_methods')
            .select('id')
            .eq('id', methodId)
            .eq('provider_id', user.id)
            .is('deleted_at', null)
            .single();

        if (checkError || !method) {
            return NextResponse.json(
                { success: false, error: 'Méthode de paiement non trouvée' },
                { status: 404 }
            );
        }

        // Unset all other methods as default for this provider
        const { error: unsetError } = await supabase
            .from('provider_payment_methods')
            .update({ is_default: false })
            .eq('provider_id', user.id)
            .is('deleted_at', null);

        if (unsetError) {
            console.error('Error unsetting default methods:', unsetError);
            return NextResponse.json(
                { success: false, error: 'Erreur lors de la mise à jour' },
                { status: 500 }
            );
        }

        // Set this method as default
        const { data: updatedMethod, error: setError } = await supabase
            .from('provider_payment_methods')
            .update({ is_default: true })
            .eq('id', methodId)
            .select()
            .single();

        if (setError) {
            console.error('Error setting default method:', setError);
            return NextResponse.json(
                { success: false, error: 'Erreur lors de la mise à jour' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: updatedMethod,
            message: 'Méthode de paiement définie par défaut',
        });

    } catch (error) {
        console.error('Error in set-default API:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Erreur serveur: ' + (error instanceof Error ? error.message : 'Erreur inconnue')
            },
            { status: 500 }
        );
    }
}
