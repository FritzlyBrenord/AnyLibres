"use client";

import { useEffect, useState } from "react";

interface StatsData {
    providers: string;
    projects: string;
    satisfaction: string;
    successRate: string;
    rating: string;
    users: string;
    clients: string;
}

export function useLiveStats() {
    const [stats, setStats] = useState<StatsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/stats/public');
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (error) {
                console.error("Failed to fetch public stats", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    return { stats, loading };
}
