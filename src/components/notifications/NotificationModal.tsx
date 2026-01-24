"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Info, AlertTriangle, CheckCircle, AlertCircle } from "lucide-react";
import { useAdminNotifications } from "@/contexts/NotificationContext";
import { useRouter } from "next/navigation";

export function NotificationModal() {
  const { currentModal, closeModal, markAsRead } = useAdminNotifications();
  const router = useRouter();

  useEffect(() => {
    if (currentModal && !currentModal.is_read) {
      markAsRead(currentModal.id);
    }
  }, [currentModal]);

  if (!currentModal) return null;

  const typeConfig = {
    info: {
      icon: Info,
      gradient: "from-blue-500 to-cyan-500",
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-900",
    },
    warning: {
      icon: AlertTriangle,
      gradient: "from-yellow-500 to-orange-500",
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      text: "text-yellow-900",
    },
    success: {
      icon: CheckCircle,
      gradient: "from-green-500 to-emerald-500",
      bg: "bg-green-50",
      border: "border-green-200",
      text: "text-green-900",
    },
    error: {
      icon: AlertCircle,
      gradient: "from-red-500 to-pink-500",
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-900",
    },
  };

  const config = typeConfig[currentModal.type];
  const Icon = config.icon;

  const handleAction = () => {
    if (currentModal.action_url) {
      router.push(currentModal.action_url);
    }
    closeModal();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeModal}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", duration: 0.5 }}
          className={`relative w-full max-w-md ${config.bg} border-2 ${config.border} rounded-2xl shadow-2xl overflow-hidden`}
        >
          {/* Header with gradient */}
          <div className={`bg-gradient-to-r ${config.gradient} p-6 text-white`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">{currentModal.title}</h3>
                  {currentModal.priority === "urgent" && (
                    <span className="inline-block mt-1 px-2 py-0.5 bg-white/30 rounded-full text-xs font-semibold">
                      URGENT
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <p className={`${config.text} text-sm leading-relaxed whitespace-pre-wrap`}>
              {currentModal.message}
            </p>

            {/* Actions */}
            <div className="mt-6 flex gap-3">
              {currentModal.action_url && (
                <button
                  onClick={handleAction}
                  className={`flex-1 px-4 py-2 bg-gradient-to-r ${config.gradient} text-white rounded-lg font-medium hover:shadow-lg transition-all`}
                >
                  Voir plus
                </button>
              )}
              <button
                onClick={closeModal}
                className={`${
                  currentModal.action_url ? "flex-1" : "w-full"
                } px-4 py-2 border-2 ${config.border} ${config.text} rounded-lg font-medium hover:bg-white transition-all`}
              >
                Fermer
              </button>
            </div>

            {/* Auto-dismiss indicator */}
            {(currentModal.priority === "low" || currentModal.priority === "normal") && (
              <p className="mt-3 text-xs text-center text-gray-500">
                Se fermera automatiquement dans 5 secondes
              </p>
            )}
            {currentModal.priority === "high" && (
              <p className="mt-3 text-xs text-center text-gray-500">
                Se fermera automatiquement dans 10 secondes
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
