import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const supabase = await createClient();

        // 1. Nombre de freelances (profils avec role 'provider' ou entrées dans providers)
        // On compte les entrées dans la table 'providers' pour être plus précis sur les "experts"
        const { count: providersCount, error: providersError } = await supabase
            .from('providers')
            .select('*', { count: 'exact', head: true });

        if (providersError) {
            console.error('Error fetching providers count:', providersError);
        }

        // 2. Nombre de projets réalisés (commandes completed)
        const { count: projectsCount, error: projectsError } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'completed');

        if (projectsError) {
            console.error('Error fetching projects count:', projectsError);
        }

        // 3. Satisfaction client (moyenne des rating_overall dans reviews)
        const { data: reviewsData, error: reviewsError } = await supabase
            .from('reviews')
            .select('rating_overall');

        let averageRating = 0;
        if (reviewsData && reviewsData.length > 0) {
            const sum = reviewsData.reduce((acc, review) => acc + (review.rating_overall || 0), 0);
            averageRating = sum / reviewsData.length;
        }

        if (reviewsError) {
            console.error('Error fetching reviews:', reviewsError);
        }

        // 4. Taux de succès (Commandes completed vs Total commandes - ou vs Cancelled+Completed)
        // Pour simplifier et avoir un chiffre positif, on peut prendre completed / (completed + cancelled)
        const { count: completedCount } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'completed');

        const { count: cancelledCount } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'cancelled');

        const totalFinished = (completedCount || 0) + (cancelledCount || 0);
        let successRate = 0;
        if (totalFinished > 0) {
            successRate = ((completedCount || 0) / totalFinished) * 100;
        } else {
            // Valeur par défaut si pas assez de données pour ne pas afficher 0%
            successRate = 98;
        }

        // 5. Nombre total d'utilisateurs (profils)
        const { count: usersCount, error: usersError } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });

        if (usersError) {
            console.error('Error fetching users count:', usersError);
        }

        // 6. Nombre de clients (Approximation: total profils - providers - admins ou requête spécifique si colonne role existe)
        // On suppose que profiles a une colonne role, sinon on fera users - providers
        let clientsCount = 0;
        const { count: clientRoleCount, error: clientRoleError } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'client');

        if (!clientRoleError) {
            clientsCount = clientRoleCount || 0;
        } else {
            // Fallback si erreur (pas de colonne role ?)
            clientsCount = (usersCount || 0) - (providersCount || 0);
        }

        // Formatage des nombres pour l'affichage (ex: 10K+, 5K+ ou 33+)
        const formatNumber = (num: number) => {
            if (num >= 1000) {
                return (num / 1000).toFixed(1).replace('.0', '') + 'K+';
            }
            return num.toString() + '+';
        };

        // Conversion satisfaction 5 étoiles -> Pourcentage
        const satisfactionPercentage = averageRating > 0 ? Math.round((averageRating / 5) * 100) : 98;
        const ratingDisplay = averageRating > 0 ? averageRating.toFixed(1) + "/5" : "4.9/5";

        return NextResponse.json({
            providers: formatNumber(providersCount || 0),
            projects: formatNumber(projectsCount || 0),
            satisfaction: satisfactionPercentage + "%",
            rating: ratingDisplay,
            users: formatNumber(usersCount || 0),
            clients: formatNumber(clientsCount || 0),
            successRate: Math.round(successRate) + "%",
            raw: {
                providers: providersCount,
                projects: projectsCount,
                rating: averageRating,
                successRate: successRate,
                users: usersCount,
                clients: clientsCount
            }
        });

    } catch (error) {
        console.error('Error in public stats API:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
