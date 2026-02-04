export const mediation = {
    // General
    none: "None",
    profileNotFound: "Profile not found for ID: {id}",
    disputeNotFound: "Dispute not found",
    loadError: "Error loading dispute",
    loadingMediation: "Loading mediation...",
    confirmExit: "Are you sure you want to leave? You will need to accept the rules again.",
    unknownClient: "Unknown client",
    unknownProvider: "Unknown provider",

    // Auth errors
    authId: "Authentication ID",
    clientInOrder: "Client in order",
    providerInOrder: "Provider in order",

    // Roles
    roles: {
        client: "Client",
        provider: "Provider",
        admin: "Mediator",
    },

    // Errors
    errors: {
        default: "An error occurred",
        authFailed: "Authorization failed. You are not authorized to access this mediation.",
        details: "Details",
        connection: "Connection error",
    },

    // Waiting Room
    waitingRoom: {
        title: "Mediation Waiting Room",
        subtitle: "Please wait while we prepare the session",
        connecting: "Connecting...",
        mediator: "Anylibre Mediator",
        supervisor: "Session Supervisor",
        present: "Present",
        waiting: "Waiting",
        checkingPresence: "Checking presence...",
        waitingForOther: "Waiting for the other party...",
        bothPresent: "Both parties are present",
        startingSession: "Starting session...",
        clientPresent: "Client present",
        providerPresent: "Provider present",
        adminPresent: "Mediator present",
        waitingForProvider: "Waiting for provider...",
        waitingForClient: "Waiting for client...",
        waitingForBoth: "Waiting for both parties...",
        waitingMessage: "Please wait while we verify that all parties are present.",
        waitingTime: "Waiting time: {time}",
        prolongedWaitingTitle: "Prolonged Waiting",
        prolongedWaitingDesc: "The other party seems to be taking time to arrive. You can stay here or come back later.",
        starting: "Starting...",
        errors: {
            connection: "Server connection error",
            presenceCheck: "Error checking presence",
            join: "Unable to join waiting room",
            presence: "Presence update error",
            verification: "Participant verification error",
        },
    },

    // Chat
    chat: {
        title: "Mediation in Progress",
        activeSession: "Active session: {client} ⚖️ {provider}",
        officialTransmission: "Official Transmission",
        replyingTo: "Replying to {name}",
        recordingInProgress: "Recording in progress...",
        muteSpeaker: "Mute",
        unmuteSpeaker: "Unmute",
        takeDecision: "Take a decision",
        placeholder: "Type your message...",
        pausedNotice: "Session paused by mediator",
        pausedNoticeShort: "Session paused",
        mutedNotice: "You have been muted by the mediator",

        // Media
        media: {
            photo: "Photo",
            video: "Video",
            voice: "Voice message",
            audio: "Audio",
            document: "Document",
            imageLabel: "Image",
            videoLabel: "Video",
            audioLabel: "Audio",
            documentLabel: "Document",
        },

        // Errors
        errors: {
            load: "Error loading messages",
            send: "Error sending message",
            upload: "Error uploading file",
            mic: "Microphone access error",
            audioPlayback: "Audio playback error",
            muteToggle: "Error toggling mute status",
        },
    },

    // Resolution
    resolution: {
        title: "Close Mediation",
        chooseOutcome: "Choose the mediation outcome:",
        agreement: "✅ Agreement reached",
        agreementFound: "Agreement reached",
        agreementSubtitle: "We have found a solution",
        noAgreement: "❌ No agreement",
        noAgreementSubtitle: "Unable to reach an agreement",
        congrats: "Congratulations! You have reached an agreement.",
        sorryNoSolution: "Sorry, no solution was found.",
        noteLabel: "Agreement summary (optional)",
        notePlaceholder: "Briefly describe the agreement...",
        mainProblemLabel: "What was the main problem?",
        problemPlaceholder: "Explain why no agreement was reached...",
        refundRequest: "I wish to request a refund",
        back: "Back",
        processing: "Processing...",
        confirmResolution: "Confirm resolution",
        confirmation: "Confirmation",
        closedTitle: "Mediation Closed",
        thanksAgreement: "Thank you for your participation. The agreement has been recorded and will be processed by our team.",
        thanksNoAgreement: "Thank you for your participation. Your request has been recorded.",
        refundNextSteps: "Your refund request will be reviewed by our team.",
        leaveRoom: "Leave and return home",
        warningFinal: "You are about to close this mediation. This action is definitive.",
    },

    // Detail
    detail: {
        back: "Back",
    },
};
