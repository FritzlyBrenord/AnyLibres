"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Shield,
  Clock,
  CheckCircle,
  Loader2,
  AlertCircle,
  Users,
  Play,
} from "lucide-react";

interface PresenceVerificationProps {
  disputeId: string;
  currentUserId: string;
  currentUserRole: "client" | "provider" | "admin";
  clientName: string;
  providerName: string;
  onBothPresent: () => void;
  isDark?: boolean;
}

interface PresenceStatus {
  client: boolean;
  provider: boolean;
  admin: boolean;
}

export default function PresenceVerification({
  disputeId,
  currentUserId,
  currentUserRole,
  clientName,
  providerName,
  onBothPresent,
  isDark = false,
}: PresenceVerificationProps) {
  const [presence, setPresence] = useState<PresenceStatus>({
    client: false,
    provider: false,
    admin: false,
  });
  const [waitingTime, setWaitingTime] = useState(0);
  const [heartbeatInterval, setHeartbeatInterval] =
    useState<NodeJS.Timeout | null>(null);
  const [checkInterval, setCheckInterval] = useState<NodeJS.Timeout | null>(
    null,
  );
  const [isJoining, setIsJoining] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [presenceDebug, setPresenceDebug] = useState<any>(null);

  // Join the mediation session
  useEffect(() => {
    console.log("PresenceVerification: Joining session...");
    joinSession();
    return () => {
      console.log("PresenceVerification: Cleaning up...");
      // leaveSession(); // Disabled to prevent flickering on re-renders/strict mode. Reliance on heartbeat timeout instead.
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      if (checkInterval) clearInterval(checkInterval);
    };
  }, []);

  // Start heartbeat - every 30 seconds
  useEffect(() => {
    if (!isJoining) {
      console.log("PresenceVerification: Starting heartbeat...");

      // Send initial heartbeat
      sendHeartbeat();

      const interval = setInterval(() => {
        console.log("PresenceVerification: Sending heartbeat");
        sendHeartbeat();
      }, 30000); // Every 30 seconds

      setHeartbeatInterval(interval);

      return () => clearInterval(interval);
    }
  }, [isJoining]);

  // Check presence status - every 3 seconds
  useEffect(() => {
    if (!isJoining) {
      console.log("PresenceVerification: Starting presence check...");

      // Initial check
      checkPresence();

      const interval = setInterval(() => {
        console.log("PresenceVerification: Checking presence");
        checkPresence();
      }, 3000); // Every 3 seconds (more frequent for better UX)

      setCheckInterval(interval);

      return () => clearInterval(interval);
    }
  }, [isJoining]);

  // Waiting time counter
  useEffect(() => {
    const timer = setInterval(() => {
      setWaitingTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Check if both parties are present
  useEffect(() => {
    if (presence.client && presence.provider) {
      console.log(
        "PresenceVerification: Both parties present! Starting chat in 2 seconds...",
      );
      // Both present! Start the session
      setTimeout(() => {
        onBothPresent();
      }, 2000);
    }
  }, [presence, onBothPresent]);

  const joinSession = async () => {
    try {
      console.log("PresenceVerification: Calling join endpoint...");
      const response = await fetch(`/api/disputes/${disputeId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: currentUserRole,
        }),
      });

      const data = await response.json();
      console.log("PresenceVerification: Join response:", data);

      if (data.success) {
        setIsJoining(false);
        setError(null);
        // Initial presence check
        checkPresence();
      } else {
        // Afficher l'erreur avec détails si disponibles
        let errorMessage = data.error || "Erreur lors de la connexion";
        if (data.debugInfo) {
          console.error("Debug Info:", data.debugInfo);
          errorMessage += `\n\nDétails:\n${JSON.stringify(data.debugInfo, null, 2)}`;
        }
        setError(errorMessage);
      }
    } catch (error) {
      console.error("Error joining session:", error);
      setError(error instanceof Error ? error.message : "Erreur de connexion");
    }
  };

  const leaveSession = async () => {
    try {
      console.log("PresenceVerification: Leaving session...");
      await fetch(`/api/disputes/${disputeId}/presence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_present: false,
        }),
      });
    } catch (error) {
      console.error("Error leaving session:", error);
    }
  };

  const sendHeartbeat = async () => {
    try {
      const response = await fetch(`/api/disputes/${disputeId}/presence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_present: true,
        }),
      });

      const data = await response.json();
      if (!data.success) {
        console.error("Heartbeat failed:", data.error);
      }
    } catch (error) {
      console.error("Error sending heartbeat:", error);
    }
  };

  const checkPresence = async () => {
    try {
      const response = await fetch(`/api/disputes/${disputeId}/presence`);
      const data = await response.json();

      if (data.success) {
        console.log("PresenceVerification: Presence data:", data.presence);
        setPresence(data.presence);
        setPresenceDebug(data.presence);
        setError(null);
      } else {
        console.error("Presence check failed:", data.error);
        setError(data.error || "Erreur de vérification de présence");
      }
    } catch (error) {
      console.error("Error checking presence:", error);
      setError(
        error instanceof Error ? error.message : "Erreur de vérification",
      );
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getWaitingMessage = () => {
    if (presence.client && presence.provider) {
      return "🎉 Les deux parties sont présentes !";
    }

    if (currentUserRole === "client") {
      return presence.provider
        ? "✅ Le prestataire est présent. Démarrage imminent..."
        : "⏳ En attente du prestataire...";
    } else if (currentUserRole === "provider") {
      return presence.client
        ? "✅ Le client est présent. Démarrage imminent..."
        : "⏳ En attente du client...";
    } else {
      // Admin
      if (!presence.client && !presence.provider) {
        return "⏳ En attente des deux parties...";
      } else if (!presence.client) {
        return "⏳ En attente du client...";
      } else if (!presence.provider) {
        return "⏳ En attente du prestataire...";
      }
    }
  };

  if (isJoining) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${isDark ? "bg-gray-900" : "bg-gradient-to-br from-slate-50 via-purple-50 to-slate-50"}`}
      >
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-purple-600 mx-auto mb-4" />
          <p
            className={`text-lg ${isDark ? "text-gray-300" : "text-gray-700"}`}
          >
            Connexion à la salle de médiation...
          </p>
          {error && <p className="text-red-600 mt-4 text-sm">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 ${isDark ? "bg-gray-900" : "bg-gradient-to-br from-slate-50 via-purple-50 to-slate-50"}`}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden ${isDark ? "bg-gray-800 border border-gray-700" : "bg-white"}`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-8 text-white text-center">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Salle d'Attente</h1>
          <p className="text-purple-100">
            Vérification de la présence des participants
          </p>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8">
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200`}
            >
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-red-800 mb-1">Erreur</p>
                <p className="text-red-700">{error}</p>
              </div>
            </motion.div>
          )}

          {/* Waiting Message */}
          <motion.div
            key={getWaitingMessage()}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-center p-6 rounded-2xl ${isDark ? "bg-gray-700" : "bg-gradient-to-br from-purple-50 to-indigo-50"}`}
          >
            <p
              className={`text-xl font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
            >
              {getWaitingMessage()}
            </p>
          </motion.div>

          {/* Participants Status */}
          <div className="space-y-4">
            {/* Client */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex items-center justify-between p-6 rounded-2xl ${isDark ? "bg-gray-700" : "bg-gray-50"}`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center ${presence.client ? "bg-green-100" : "bg-gray-200"}`}
                >
                  <User
                    className={`w-7 h-7 ${presence.client ? "text-green-600" : "text-gray-400"}`}
                  />
                </div>
                <div>
                  <p
                    className={`font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                  >
                    {clientName}
                  </p>
                  <p
                    className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}
                  >
                    Client
                  </p>
                </div>
              </div>
              <div>
                {presence.client ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-6 h-6" />
                    <span className="font-semibold">Présent</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-gray-400">
                    <Clock className="w-6 h-6 animate-pulse" />
                    <span className="font-semibold">En attente</span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Provider */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className={`flex items-center justify-between p-6 rounded-2xl ${isDark ? "bg-gray-700" : "bg-gray-50"}`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center ${presence.provider ? "bg-green-100" : "bg-gray-200"}`}
                >
                  <User
                    className={`w-7 h-7 ${presence.provider ? "text-green-600" : "text-gray-400"}`}
                  />
                </div>
                <div>
                  <p
                    className={`font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                  >
                    {providerName}
                  </p>
                  <p
                    className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}
                  >
                    Prestataire
                  </p>
                </div>
              </div>
              <div>
                {presence.provider ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-6 h-6" />
                    <span className="font-semibold">Présent</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-gray-400">
                    <Clock className="w-6 h-6 animate-pulse" />
                    <span className="font-semibold">En attente</span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Admin (Optional) */}
            {presence.admin && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className={`flex items-center justify-between p-6 rounded-2xl border-2 ${isDark ? "bg-amber-900/20 border-amber-600" : "bg-amber-50 border-amber-300"}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center">
                    <Shield className="w-7 h-7 text-amber-600" />
                  </div>
                  <div>
                    <p
                      className={`font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                    >
                      Médiateur Anylibre
                    </p>
                    <p
                      className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}
                    >
                      Administrateur
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-amber-600">
                  <Shield className="w-6 h-6" />
                  <span className="font-semibold">Superviseur</span>
                </div>
              </motion.div>
            )}
          </div>

          {/* Timer */}
          <div
            className={`text-center p-4 rounded-xl ${isDark ? "bg-gray-700" : "bg-gray-100"}`}
          >
            <p
              className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"} mb-1`}
            >
              Temps d'attente
            </p>
            <p
              className={`text-2xl font-mono font-bold ${isDark ? "text-white" : "text-gray-900"}`}
            >
              {formatTime(waitingTime)}
            </p>
          </div>

          {/* Info Message */}
          {waitingTime > 300 && (!presence.client || !presence.provider) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`flex items-start gap-3 p-4 rounded-xl ${isDark ? "bg-yellow-900/20 border border-yellow-600" : "bg-yellow-50 border border-yellow-200"}`}
            >
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p
                  className={`font-semibold ${isDark ? "text-yellow-400" : "text-yellow-800"} mb-1`}
                >
                  Attente prolongée
                </p>
                <p className={isDark ? "text-yellow-300" : "text-yellow-700"}>
                  Si l'autre partie ne rejoint pas dans les 15 minutes, la
                  session sera automatiquement annulée.
                </p>
              </div>
            </motion.div>
          )}

          {/* Both Present Animation */}
          <AnimatePresence>
            {presence.client && presence.provider && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center"
              >
                <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                  <Play className="w-12 h-12 text-white" />
                </div>
                <p
                  className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                >
                  Démarrage de la médiation...
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
