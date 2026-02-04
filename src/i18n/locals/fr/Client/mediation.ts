export const mediation = {
    // General
    none: "Aucun",
    profileNotFound: "Profil non trouvé pour l'ID: {id}",
    disputeNotFound: "Litige introuvable",
    loadError: "Erreur lors du chargement du litige",
    loadingMediation: "Chargement de la médiation...",
    confirmExit: "Êtes-vous sûr de vouloir quitter ? Vous devrez accepter les règles à nouveau.",
    unknownClient: "Client inconnu",
    unknownProvider: "Prestataire inconnu",

    // Auth errors
    authId: "ID d'authentification",
    clientInOrder: "Client dans la commande",
    providerInOrder: "Prestataire dans la commande",

    // Roles
    roles: {
        client: "Client",
        provider: "Prestataire",
        admin: "Médiateur",
    },

    // Errors
    errors: {
        default: "Une erreur est survenue",
        authFailed: "Échec de l'autorisation. Vous n'êtes pas autorisé à accéder à cette médiation.",
        details: "Détails",
        connection: "Erreur de connexion",
    },

    // Waiting Room
    waitingRoom: {
        title: "Salle d'attente de médiation",
        subtitle: "Veuillez patienter pendant que nous préparons la session",
        connecting: "Connexion en cours...",
        mediator: "Médiateur Anylibre",
        supervisor: "Superviseur de session",
        present: "Présent",
        waiting: "En attente",
        checkingPresence: "Vérification de la présence...",
        waitingForOther: "En attente de l'autre partie...",
        bothPresent: "Les deux parties sont présentes",
        startingSession: "Lancement de la session...",
        clientPresent: "Client présent",
        providerPresent: "Prestataire présent",
        adminPresent: "Médiateur présent",
        waitingForProvider: "En attente du prestataire...",
        waitingForClient: "En attente du client...",
        waitingForBoth: "En attente des deux parties...",
        waitingMessage: "Veuillez patienter pendant que nous vérifions que toutes les parties sont présentes.",
        waitingTime: "Temps d'attente : {time}",
        prolongedWaitingTitle: "Attente prolongée",
        prolongedWaitingDesc: "L'autre partie semble mettre du temps à arriver. Vous pouvez rester ici ou revenir plus tard.",
        starting: "Démarrage...",
        errors: {
            connection: "Erreur de connexion au serveur",
            presenceCheck: "Erreur lors de la vérification de la présence",
            join: "Impossible de rejoindre la salle d'attente",
            presence: "Erreur de mise à jour de présence",
            verification: "Erreur de vérification des participants",
        },
    },

    // Chat
    chat: {
        title: "Médiation en cours",
        activeSession: "Session active : {client} ⚖️ {provider}",
        officialTransmission: "Transmission Officielle",
        replyingTo: "Réponse à {name}",
        recordingInProgress: "Enregistrement en cours...",
        muteSpeaker: "Rendre muet",
        unmuteSpeaker: "Rétablir la voix",
        takeDecision: "Prendre une décision",
        placeholder: "Écrivez votre message...",
        pausedNotice: "Session en pause par le médiateur",
        pausedNoticeShort: "Session en pause",
        mutedNotice: "Vous avez été rendu(e) muet(te) par le médiateur",

        // Media
        media: {
            photo: "Photo",
            video: "Vidéo",
            voice: "Message vocal",
            audio: "Audio",
            document: "Document",
            imageLabel: "Image",
            videoLabel: "Vidéo",
            audioLabel: "Audio",
            documentLabel: "Document",
        },

        // Errors
        errors: {
            load: "Erreur lors du chargement des messages",
            send: "Erreur lors de l'envoi du message",
            upload: "Erreur lors du téléchargement du fichier",
            mic: "Erreur d'accès au microphone",
            audioPlayback: "Erreur lors de la lecture audio",
            muteToggle: "Erreur lors du changement du statut muet",
        },
    },

    // Resolution
    resolution: {
        title: "Clôturer la médiation",
        chooseOutcome: "Choisissez le résultat de la médiation :",
        agreement: "✅ Accord trouvé",
        agreementFound: "Accord trouvé",
        agreementSubtitle: "Nous avons trouvé une solution",
        noAgreement: "❌ Aucun accord",
        noAgreementSubtitle: "Impossible de parvenir à un accord",
        congrats: "Félicitations ! Vous avez trouvé un accord.",
        sorryNoSolution: "Désolé, aucune solution n'a été trouvée.",
        noteLabel: "Résumé de l'accord (optionnel)",
        notePlaceholder: "Décrivez brièvement l'accord trouvé...",
        mainProblemLabel: "Quel était le principal problème ?",
        problemPlaceholder: "Expliquez pourquoi aucun accord n'a été trouvé...",
        refundRequest: "Je souhaite demander un remboursement",
        back: "Retour",
        processing: "Traitement...",
        confirmResolution: "Confirmer la résolution",
        confirmation: "Confirmation",
        closedTitle: "Médiation clôturée",
        thanksAgreement: "Merci pour votre participation. L'accord a été enregistré et sera traité par notre équipe.",
        thanksNoAgreement: "Merci pour votre participation. Votre demande a été enregistrée.",
        refundNextSteps: "Votre demande de remboursement sera examinée par notre équipe.",
        leaveRoom: "Quitter et retourner à l'accueil",
        warningFinal: "Vous êtes sur le point de clôturer cette médiation. Cette action est définitive.",
    },

    // Detail
    detail: {
        back: "Retour",
    },
    bot: {
        assistantTitle: "Assistant de Médiation",
        assistantSubtitle: "Préparation de la séance",
        welcome: "Bonjour {name} 👋",
        intro: "Je suis votre assistant de médiation Anylibre. Je vais vous guider avant d'accéder à la salle de médiation.",
        reminderTitle: "📋 Rappel du litige",
        reasonLabel: "Motif :",
        rulesIntro: "Avant de commencer, vous devez prendre connaissance des règles de médiation.",
        rulesAccepted: "✅ Parfait ! Maintenant, veuillez accepter les conditions d'utilisation de la médiation.",
        acceptRequired: "Vous devez accepter les règles et les conditions pour continuer.",
        rulesTitle: "Règles de Médiation",
        acceptRulesCheckbox: "J'ai lu et j'accepte de respecter ces règles de médiation",
        conditionsTitle: "Conditions d'Utilisation",
        condition1: "La médiation est enregistrée et une transcription sera générée",
        condition2: "Tout comportement abusif entraînera une exclusion immédiate",
        condition3: "La décision du médiateur est finale et exécutoire",
        condition4: "Vous disposez d'un maximum de 60 minutes pour la séance",
        condition5: "Les deux parties doivent être présentes pour commencer",
        acceptConditionsCheckbox: "J'accepte les conditions d'utilisation de la médiation Anylibre",
        verifying: "Vérification...",
        accessMediation: "Accéder à la Médiation",
        rules: [
            {
                title: "Respect mutuel obligatoire",
                desc: "Communiquez de manière courtoise et professionnelle"
            },
            {
                title: "Communication claire et factuelle",
                desc: "Présentez des faits vérifiables, évitez les accusations"
            },
            {
                title: "Temps de réponse raisonnable",
                desc: "Restez actif pendant la séance de médiation"
            },
            {
                title: "Preuves acceptées",
                desc: "Captures d'écran, documents, fichiers pertinents"
            },
            {
                title: "Décision finale de l'administrateur",
                desc: "Le médiateur Anylibre a le dernier mot"
            }
        ]
    },
};
