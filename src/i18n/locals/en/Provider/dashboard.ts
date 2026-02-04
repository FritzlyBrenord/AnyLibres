export const providerDashboard = {
    loading: "Loading your profile...",
    redirecting: "Redirecting to login...",
    notProvider: {
        title: "You are not a provider yet",
        description:
            "You must complete your provider registration to access this dashboard.",
        button: "Become a provider now",
    },
    welcome: "Welcome, {name}",
    subtitle:
        "Here is your professional dashboard to manage your activity",
    sellerLevel: "New Seller",
    stats: {
        availableBalance: "Available Balance",
        withdraw: "Withdraw",
        totalEarned: "Total Earned",
        pending: "Pending:",
        activeOrders: "Active Orders",
        viewAll: "View All",
        rating: "Rating",
        responseRate: "Response Rate:",
    },
    activeOrders: {
        title: "Orders Overview",
        subtitle: "Manage your active orders and meet your deadlines",
        viewAll: "View All",
        loading: "Loading...",
        stats: {
            inProgress: "In Progress",
            late: "Late",
            urgent: "Urgent",
            delivered: "Delivered",
            actionRequired: "⚠️ Action Required",
            waitingValidation: "Pending Validation",
            urgentTiming: "⏰ < 48h",
        },
        priority: {
            title: "Priority Orders ({count})",
            lateLabel: "LATE",
            timeRemaining: {
                late: "Late",
                lessThan1h: "< 1h",
                hours: "{count}h",
                days: "{count}d",
            },
        },
        empty: {
            noOrders: {
                title: "No orders yet",
                description:
                    "Create your first services to start receiving orders",
                button: "Create a service",
            },
            noActive: {
                title: "No active orders",
                description: "You have no active orders at the moment",
                history: "View order history",
            },
            allGood: {
                title: "Everything is under control! 🎉",
                description: "No urgent or late orders",
                viewAll: "View all orders",
            },
        },
    },
    recentMessages: {
        title: "Recent Messages",
        viewAll: "View All",
        noMessages: "No recent messages",
        viewAllButton: "View all messages",
        relativeTime: {
            justNow: "Just now",
            minutes: "{count} min ago",
            hours: "{count}h ago",
            days: "{count}d ago",
        },
        fallbackUser: "User",
        noMessageText: "No message",
    },
    quickActions: {
        title: "Quick Actions",
        analytics: {
            title: "View Analytics",
            subtitle: "Performance & stats",
        },
        services: {
            title: "Manage Services",
            subtitle: "Create & edit",
        },
        messages: {
            title: "Messages",
            subtitle: "Communicate with clients",
        },
        withdrawGains: {
            title: "Withdraw Earnings",
            available: "{amount} available",
        },
    },
    withdrawal: {
        errors: {
            invalidAmount: "Please enter a valid amount",
            minAmount: "Minimum amount is {amount}",
            maxAmount: "Maximum amount is {amount}",
            insufficientFunds: "Maximum available amount is {amount}",
            selectMethod: "Please select a payment method",
            wait24h: "You must wait 24h between withdrawals",
            general: "Error requesting withdrawal",
            server: "Server error requesting withdrawal",
        },
        success: "Withdrawal of {amount} successful!",
    },
    withdrawalModal: {
        title: "Withdraw Your Earnings",
        subtitle: "Transfer your earnings to your account",
        frozenTitle: "Account Frozen",
        frozenMessage:
            "Your account has been temporarily frozen. All withdrawals are blocked.",
        frozenSupport:
            "Please contact support for more information and to unlock your account.",
        timerWarning: "Next withdrawal available in",
        availableBalance: "Available Balance",
        insufficientBalance: "Insufficient balance to withdraw",
        insufficientBalanceDetail:
            "Minimum required: {min} • Your balance: {balance}",
        limitsAndFees: "ⓘ Minimum: {min} • Maximum: {max} • Fees: {fees}%",
        paymentMethod: "Payment Method",
        addMethod: "Add",
        noMethodsTitle: "No payment methods",
        noMethodsDesc: "Add your first payment method to start",
        addFirstMethod: "Add a payment method",
        amountLabel: "Amount to withdraw ({symbol})",
        amountPlaceholder: "0.00",
        minBtn: "Min ({amount})",
        maxBtn: "Max ({amount})",
        summaryTitle: "Summary",
        amountRequested: "Amount requested",
        fees: "Fees ({percent}%)",
        youWillReceive: "You will receive",
        cancel: "Cancel",
        confirm: "Confirm Withdrawal",
        processing: "Processing...",
        info: "Withdrawals are processed within 2-5 business days. Only one withdrawal allowed every 24h.",
        errors: {
            accountFrozen:
                "🔒 Account frozen - Withdrawals blocked. Contact support.",
            insufficientBalance:
                "Insufficient balance. Minimum required: {min} • Your balance: {balance}",
            minAmount: "Minimum amount is {amount}",
            maxAmount: "Maximum amount is {amount}",
            selectMethod: "Please select a payment method",
            wait24h: "You must wait 24h between withdrawals",
            generalError: "Withdrawal error",
        },
    },
};
