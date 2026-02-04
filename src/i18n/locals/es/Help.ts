export const help = {
    title: "Centro de Ayuda",
    subtitle: "¿Cómo podemos ayudarte?",
    searchPlaceholder: "Buscar ayuda...",

    tabs: {
        general: "General",
        client: "Cliente",
        provider: "Proveedor"
    },

    general: {
        title: "Sobre AnyLibre",
        description: "AnyLibre es una plataforma innovadora que conecta clientes con necesidades específicas con proveedores calificados. Aseguramos los pagos y garantizamos la calidad del servicio.",
        features: [
            {
                title: "Para Clientes",
                desc: "Encuentra expertos, paga de forma segura y obtén resultados garantizados."
            },
            {
                title: "Para Proveedores",
                desc: "Ofrece tus servicios, gana nuevos clientes y recibe pagos rápidamente."
            },
            {
                title: "Seguridad",
                desc: "Tus datos y transacciones están protegidos por los más altos estándares."
            }
        ]
    },

    client: {
        title: "Guía del Cliente",
        steps: [
            { title: "1. Buscar", desc: "Utiliza nuestro motor de búsqueda para encontrar el servicio ideal." },
            { title: "2. Ordenar", desc: "Realiza un pedido describiendo tus necesidades y paga a través de una cuenta segura." },
            { title: "3. Colaborar", desc: "Comunícate con el proveedor a través de nuestra mensajería integrada." },
            { title: "4. Validar", desc: "Aprueba la entrega para liberar el pago al proveedor." }
        ]
    },

    provider: {
        title: "Guía del Proveedor",
        steps: [
            { title: "1. Perfil", desc: "Crea un perfil completo y atractivo para dar confianza a los clientes." },
            { title: "2. Servicios", desc: "Publica tus ofertas con descripciones claras y precios justos." },
            { title: "3. Realización", desc: "Entrega un trabajo de calidad dentro de los plazos acordados." },
            { title: "4. Pago", desc: "Recibe tus ganancias tan pronto como el cliente valide el pedido." },
            { title: "Ser Proveedor", desc: "¿Tieñes un talento? ¡Únete a nosotros!", button: "Convertirse en Proveedor" }
        ]
    },

    faq: {
        title: "Preguntas Frecuentes",
        items: [
            { q: "¿Es gratis?", a: "El registro es gratuito. Se aplican tarifas de servicio al realizar pedidos." },
            { q: "¿Cómo pagar?", a: "Aceptamos tarjetas de crédito, MonCash y otros métodos locales." },
            { q: "¿Puedo cancelar?", a: "Sí, bajo ciertas condiciones antes de que comience el pedido." }
        ]
    },

    chat: {
        title: "Asistente AnyLibre",
        welcome: "¡Hola! Soy el asistente virtual de AnyLibre. ¿Cómo puedo ayudarte hoy?",
        inputPlaceholder: "Escribe tu pregunta...",
        send: "Enviar",
        suggested: "Sugerencias",
        talkToAgent: "Hablar con un agente humano",
        agentButton: "Contactar Soporte",
        topics: {
            order: "Problema de pedido",
            payment: "Pregunta de pago",
            account: "Mi cuenta",
            other: "Otro"
        }
    },

    contact: {
        title: "Contáctanos",
        desc: "Nuestro equipo está aquí para ayudarte.",
        object: "Asunto",
        message: "Mensaje",
        sendEmail: "Enviar por correo",
        send: "Enviar Mensaje",
        success: "¡Mensaje enviado con éxito!",
        emailParams: {
            subject: "Soporte AnyLibre: {subject}",
            body: "Hola,\n\n{message}\n\nAtentamente,"
        }
    }
};
