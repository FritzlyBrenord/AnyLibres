export const help = {
    title: "Help Center",
    subtitle: "How can we help you?",
    searchPlaceholder: "Search help...",

    tabs: {
        general: "General",
        client: "Client",
        provider: "Provider"
    },

    general: {
        title: "About AnyLibre",
        description: "AnyLibre is an innovative platform connecting clients with specific needs to qualified providers. We secure payments and guarantee service quality.",
        features: [
            {
                title: "For Clients",
                desc: "Find experts, pay securely, and get guaranteed results."
            },
            {
                title: "For Providers",
                desc: "Offer your services, gain new clients, and get paid quickly."
            },
            {
                title: "Security",
                desc: "Your data and transactions are protected by the highest standards."
            }
        ]
    },

    client: {
        title: "Client Guide",
        steps: [
            { title: "1. Search", desc: "Use our search engine to find the perfect service." },
            { title: "2. Order", desc: "Place an order describing your needs and pay via a secure account." },
            { title: "3. Collaborate", desc: "Communicate with the provider via our integrated messaging." },
            { title: "4. Validate", desc: "Approve the delivery to release the payment to the provider." }
        ]
    },

    provider: {
        title: "Provider Guide",
        steps: [
            { title: "1. Profile", desc: "Create a complete and attractive profile to reassure clients." },
            { title: "2. Services", desc: "Publish your offers with clear descriptions and fair prices." },
            { title: "3. Delivery", desc: "Deliver quality work within the agreed deadlines." },
            { title: "4. Payment", desc: "Receive your earnings as soon as the client validates the order." },
            { title: "Become a Provider", desc: "Have a talent? Join us!", button: "Become a Provider" }
        ]
    },

    faq: {
        title: "Frequently Asked Questions",
        items: [
            { q: "Is it free?", a: "Registration is free. Service fees apply when placing orders." },
            { q: "How to pay?", a: "We accept credit cards, MonCash, and other local methods." },
            { q: "Can I cancel?", a: "Yes, under certain conditions before the order starts." }
        ]
    },

    chat: {
        title: "AnyLibre Assistant",
        welcome: "Hello! I am the AnyLibre virtual assistant. How can I help you today?",
        inputPlaceholder: "Ask your question...",
        send: "Send",
        suggested: "Suggestions",
        talkToAgent: "Talk to a human agent",
        agentButton: "Contact Support",
        topics: {
            order: "Order issue",
            payment: "Payment question",
            account: "My account",
            other: "Other"
        }
    },

    contact: {
        title: "Contact Us",
        desc: "Our team is here to help you.",
        object: "Subject",
        message: "Message",
        sendEmail: "Send via email",
        send: "Send Message",
        success: "Message sent successfully!",
        emailParams: {
            subject: "AnyLibre Support: {object}",
            body: "Hello,\n\n{message}\n\nBest regards,"
        }
    }
};
