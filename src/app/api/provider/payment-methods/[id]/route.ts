// ============================================================================
// API: Provider Payment Methods - Update/Delete specific method
// ============================================================================

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * PUT /api/provider/payment-methods/[id]
 * Update a payment method
 */
export async function PUT(
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
        const body = await request.json();
        const { label, details, type } = body;

        // Validation
        if (!label && !details && !type) {
            return NextResponse.json(
                { success: false, error: 'Au moins un champ à modifier requis' },
                { status: 400 }
            );
        }

        // Build update object
        const updateData: any = {};
        if (label) updateData.label = label;
        if (details) updateData.details = details;
        if (type) {
            const validTypes = ['paypal', 'bank', 'payoneer', 'moncash'];
            if (!validTypes.includes(type)) {
                return NextResponse.json(
                    { success: false, error: 'Type de méthode invalide' },
                    { status: 400 }
                );
            }
            updateData.type = type;
        }

        // Update the payment method
        const { data: method, error } = await supabase
            .from('provider_payment_methods')
            .update(updateData)
            .eq('id', methodId)
            .eq('provider_id', user.id) // Security: ensure it's the provider's method
            .is('deleted_at', null)
            .select()
            .single();

        if (error) {
            console.error('Error updating payment method:', error);
            return NextResponse.json(
                { success: false, error: 'Erreur lors de la mise à jour' },
                { status: 500 }
            );
        }

        if (!method) {
            return NextResponse.json(
                { success: false, error: 'Méthode de paiement non trouvée' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: method,
        });

    } catch (error) {
        console.error('Error in payment method PUT API:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Erreur serveur: ' + (error instanceof Error ? error.message : 'Erreur inconnue')
            },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/provider/payment-methods/[id]
 * Delete a specific payment method (soft delete)
 */
export async function DELETE(
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

        // Soft delete (mark as deleted)
        const { error } = await supabase
            .from('provider_payment_methods')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', methodId)
            .eq('provider_id', user.id); // Security: ensure it's the provider's method

        if (error) {
            console.error('Error deleting payment method:', error);
            return NextResponse.json(
                { success: false, error: 'Erreur lors de la suppression' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Méthode de paiement supprimée',
        });

    } catch (error) {
        console.error('Error in payment method DELETE API:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Erreur serveur: ' + (error instanceof Error ? error.message : 'Erreur inconnue')
            },
            { status: 500 }
        );
    }
}
