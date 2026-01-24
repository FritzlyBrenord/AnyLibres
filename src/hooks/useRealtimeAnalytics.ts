import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

/**
 * Hook pour écouter les changements en temps réel des commandes
 */
export function useOrdersRealtime(
  onOrderChange: (order: any) => void,
  enabled: boolean = true
) {
  const [subscription, setSubscription] = useState<RealtimeChannel | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!enabled) return;

    const channel = supabase
      .channel("orders_realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          onOrderChange(payload);
        }
      )
      .subscribe();

    setSubscription(channel);

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, onOrderChange]);

  return subscription;
}

/**
 * Hook pour écouter les changements en temps réel des utilisateurs
 */
export function useUsersRealtime(
  onUserChange: (user: any) => void,
  enabled: boolean = true
) {
  const [subscription, setSubscription] = useState<RealtimeChannel | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!enabled) return;

    const channel = supabase
      .channel("users_realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_activity_log",
        },
        (payload) => {
          onUserChange(payload);
        }
      )
      .subscribe();

    setSubscription(channel);

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, onUserChange]);

  return subscription;
}

/**
 * Hook pour écouter les présences en temps réel (utilisateurs en ligne)
 */
export function usePresenceRealtime(
  onPresenceChange: (presences: any[]) => void,
  enabled: boolean = true
) {
  const [subscription, setSubscription] = useState<RealtimeChannel | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!enabled) return;

    const channel = supabase.channel("users_presence", {
      config: {
        broadcast: {
          self: true,
        },
      },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const presences = channel.presenceState() as Record<string, any>;
        const presenceList = Object.entries(presences).flat();
        onPresenceChange(presenceList);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            userId: Math.random().toString(),
            timestamp: new Date().toISOString(),
          });
        }
      });

    setSubscription(channel);

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, onPresenceChange]);

  return subscription;
}
