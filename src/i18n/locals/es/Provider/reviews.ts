export const reviewsPage = {
    title: "Mis Reseñas",
    subtitle: "Consulte todas las reseñas de sus clientes y gestione sus respuestas",
    loading: "Cargando sus reseñas...",
    error: {
        fetch: "Error al cargar las reseñas",
        generic: "No se pudieron cargar las reseñas",
    },
    stats: {
        averageRating: {
            title: "Calificación promedio",
            subtitle: "basada en {count} reseñas",
        },
        totalReviews: {
            title: "Total de reseñas",
        },
        responseRate: {
            title: "Tasa de respuesta",
            subtitle: "({with}/{total})",
        },
        pendingResponse: {
            title: "Pendiente de respuesta",
        },
        distribution: {
            title: "Distribución de calificaciones",
        },
        criteria: {
            title: "Calificaciones por criterio",
            communication: "Comunicación",
            quality: "Calidad del trabajo",
            deadline: "Respeto de plazos",
        },
    },
    filters: {
        title: "Filtros",
        searchPlaceholder: "Buscar...",
        rating: {
            all: "Todas las notas",
            stars: "{count} estrellas",
        },
        response: {
            all: "Todas las reseñas",
            responded: "Con respuesta",
            pending: "Sin respuesta",
        },
        activeFilters: "Filtros activos:",
    },
    card: {
        anonymous: "Cliente anónimo",
        datePrefix: "el ",
        yourResponse: "Su respuesta",
        replyButton: "Responder a esta reseña",
        criteria: {
            communication: "Comunicación",
            quality: "Calidad",
            deadline: "Plazos",
        },
    },
    empty: {
        filtered: {
            title: "Ninguna reseña coincide con los filtros",
            subtitle: "Intente cambiar sus criterios de búsqueda",
        },
        none: {
            title: "Ninguna reseña por el momento",
            subtitle: "Sus primeras reseñas aparecerán aquí",
        },
    },
};
