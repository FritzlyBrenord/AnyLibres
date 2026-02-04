export const reviewsPage = {
    title: "My Reviews",
    subtitle: "View all your client reviews and manage your responses",
    loading: "Loading your reviews...",
    error: {
        fetch: "Error loading reviews",
        generic: "Unable to load reviews",
    },
    stats: {
        averageRating: {
            title: "Average Rating",
            subtitle: "based on {count} reviews",
        },
        totalReviews: {
            title: "Total Reviews",
        },
        responseRate: {
            title: "Response Rate",
            subtitle: "({with}/{total})",
        },
        pendingResponse: {
            title: "Pending Response",
        },
        distribution: {
            title: "Rating Distribution",
        },
        criteria: {
            title: "Ratings by Criterion",
            communication: "Communication",
            quality: "Work Quality",
            deadline: "Deadline Respect",
        },
    },
    filters: {
        title: "Filters",
        searchPlaceholder: "Search...",
        rating: {
            all: "All ratings",
            stars: "{count} stars",
        },
        response: {
            all: "All reviews",
            responded: "With response",
            pending: "No response",
        },
        activeFilters: "Active filters:",
    },
    card: {
        anonymous: "Anonymous client",
        datePrefix: "on ",
        yourResponse: "Your response",
        replyButton: "Reply to this review",
        criteria: {
            communication: "Communication",
            quality: "Quality",
            deadline: "Deadline",
        },
    },
    empty: {
        filtered: {
            title: "No reviews match the filters",
            subtitle: "Try changing your search criteria",
        },
        none: {
            title: "No reviews yet",
            subtitle: "Your first reviews will appear here",
        },
    },
};
