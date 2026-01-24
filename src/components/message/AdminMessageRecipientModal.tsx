
"use client";

import { MessageSquare, User, X } from "lucide-react";

interface AdminMessageRecipientModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (recipient: "client" | "provider") => void;
  order: any; // Using any for simplicity as in original, but could be typed properly
  loading: boolean;
}

export const AdminMessageRecipientModal = ({
  open,
  onClose,
  onSelect,
  order,
  loading,
}: AdminMessageRecipientModalProps) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full animate-in fade-in-90 zoom-in-90">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-slate-600 text-sm">
                Choisissez le destinataire du message
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            {/* Option Client */}
            <button
              onClick={() => onSelect("client")}
              disabled={loading}
              className="w-full p-6 bg-gradient-to-r from-blue-50 to-cyan-50/80 border border-blue-200/60 rounded-2xl text-left hover:from-blue-100 hover:to-cyan-100 hover:border-blue-300 transition-all duration-300 group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900 text-lg mb-1 group-hover:text-blue-700">
                    Envoyer au Client
                  </h4>
                  <p className="text-slate-600 text-sm">
                    Message de l'administrateur vers le client
                  </p>
                </div>
                <div className="text-xs font-medium px-3 py-1 bg-blue-100 text-blue-800 rounded-lg">
                  ID: {order?.client_id?.slice(0, 8)}
                </div>
              </div>
            </button>

            {/* Option Prestataire */}
            <button
              onClick={() => onSelect("provider")}
              disabled={loading}
              className="w-full p-6 bg-gradient-to-r from-purple-50 to-pink-50/80 border border-purple-200/60 rounded-2xl text-left hover:from-purple-100 hover:to-pink-100 hover:border-purple-300 transition-all duration-300 group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900 text-lg mb-1 group-hover:text-purple-700">
                    Envoyer au Prestataire
                  </h4>
                  <p className="text-slate-600 text-sm">
                    Message de l'administrateur vers le prestataire
                  </p>
                </div>
                <div className="text-xs font-medium px-3 py-1 bg-purple-100 text-purple-800 rounded-lg">
                  ID: {order?.provider_id?.slice(0, 8)}
                </div>
              </div>
            </button>
          </div>

          <div className="flex gap-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
