export const mediation = {
    // General
    none: "Ninguno",
    profileNotFound: "Perfil no encontrado para ID: {id}",
    disputeNotFound: "Disputa no encontrada",
    loadError: "Error al cargar la disputa",
    loadingMediation: "Cargando mediación...",
    confirmExit: "¿Está seguro de que desea salir? Deberá aceptar las reglas nuevamente.",
    unknownClient: "Cliente desconocido",
    unknownProvider: "Proveedor desconocido",

    // Auth errors
    authId: "ID de autenticación",
    clientInOrder: "Cliente en el pedido",
    providerInOrder: "Proveedor en el pedido",

    // Roles
    roles: {
        client: "Cliente",
        provider: "Proveedor",
        admin: "Mediador",
    },

    // Errors
    errors: {
        default: "Ocurrió un error",
        authFailed: "Autorización fallida. No está autorizado para acceder a esta mediación.",
        details: "Detalles",
        connection: "Error de conexión",
    },

    // Waiting Room
    waitingRoom: {
        title: "Sala de espera de mediación",
        mediator: "Mediador Anylibre",
        checkingPresence: "Verificando presencia...",
        waitingForOther: "Esperando a la otra parte...",
        bothPresent: "Ambas partes están presentes",
        startingSession: "Iniciando sesión...",
        clientPresent: "Cliente presente",
        providerPresent: "Proveedor presente",
        adminPresent: "Mediador presente",
        waitingMessage: "Por favor espere mientras verificamos que todas las partes estén presentes.",
        errors: {
            connection: "Error de conexión al servidor",
            presenceCheck: "Error al verificar la presencia",
        },
    },

    // Chat
    chat: {
        title: "Mediación en curso",
        activeSession: "Sesión activa: {client} ⚖️ {provider}",
        placeholder: "Escriba su mensaje...",
        pausedNotice: "Sesión pausada por el mediador",
        pausedNoticeShort: "Sesión pausada",
        mutedNotice: "Ha sido silenciado por el mediador",

        // Media
        media: {
            photo: "Foto",
            video: "Video",
            voice: "Mensaje de voz",
            audio: "Audio",
            document: "Documento",
            imageLabel: "Imagen",
            videoLabel: "Video",
            audioLabel: "Audio",
            documentLabel: "Documento",
        },

        // Errors
        errors: {
            load: "Error al cargar mensajes",
            send: "Error al enviar mensaje",
            upload: "Error al subir archivo",
            mic: "Error de acceso al micrófono",
            audioPlayback: "Error de reproducción de audio",
            muteToggle: "Error al cambiar el estado de silencio",
        },
    },

    // Resolution
    resolution: {
        title: "Cerrar mediación",
        chooseOutcome: "Elija el resultado de la mediación:",
        agreement: "✅ Acuerdo alcanzado",
        noAgreement: "❌ Sin acuerdo",
        congrats: "¡Felicidades! Han alcanzado un acuerdo.",
        sorryNoSolution: "Lo sentimos, no se encontró ninguna solución.",
        noteLabel: "Resumen del acuerdo (opcional)",
        notePlaceholder: "Describa brevemente el acuerdo...",
        mainProblemLabel: "¿Cuál fue el problema principal?",
        problemPlaceholder: "Explique por qué no se alcanzó un acuerdo...",
        refundRequest: "Deseo solicitar un reembolso",
        back: "Atrás",
        processing: "Procesando...",
        confirmResolution: "Confirmar resolución",
        closedTitle: "Mediación cerrada",
        thanksAgreement: "Gracias por su participación. El acuerdo ha sido registrado y será procesado por nuestro equipo.",
        thanksNoAgreement: "Gracias por su participación. Su solicitud ha sido registrada.",
        refundNextSteps: "Su solicitud de reembolso será revisada por nuestro equipo.",
        leaveRoom: "Salir y volver al inicio",
    },

    // Detail
    detail: {
        back: "Atrás",
    },
};
