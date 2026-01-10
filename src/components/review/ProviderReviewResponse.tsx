"use client";

import { useState } from "react";
import { Send, Loader2, CheckCircle2, AlertCircle, Edit2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ProviderReviewResponseProps {
  reviewId: string;
  existingResponse?: string;
  onSuccess?: () => void;
}

export default function ProviderReviewResponse({
  reviewId,
  existingResponse,
  onSuccess,
}: ProviderReviewResponseProps) {
  const [isEditing, setIsEditing] = useState(!existingResponse);
  const [response, setResponse] = useState(existingResponse || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (response.trim().length < 10) {
      setError("Votre réponse doit contenir au moins 10 caractères");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/reviews/${reviewId}/response`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          response: response.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de l'envoi de la réponse");
      }

      setSuccess(true);
      setIsEditing(false);
      setTimeout(() => {
        setSuccess(false);
        onSuccess?.();
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (existingResponse && !isEditing) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
        <div className="flex items-start justify-between mb-3">
          <h4 className="font-semibold text-blue-900">Votre réponse</h4>
          <button
            onClick={() => setIsEditing(true)}
            className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
          >
            <Edit2 className="w-4 h-4" />
            Modifier
          </button>
        </div>
        <p className="text-blue-900 leading-relaxed">{existingResponse}</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="bg-white rounded-xl border-2 border-purple-200 overflow-hidden"
    >
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-white">
            {existingResponse ? "Modifier votre réponse" : "Répondre à cet avis"}
          </h3>
          {existingResponse && (
            <button
              onClick={() => {
                setIsEditing(false);
                setResponse(existingResponse);
              }}
              className="text-white/80 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Votre réponse <span className="text-red-500">*</span>
          </label>
          <textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Remerciez votre client, clarifiez un point ou partagez votre expérience..."
            rows={5}
            required
            minLength={10}
            maxLength={500}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all resize-none"
          />
          <p className="text-xs text-gray-500 mt-1">
            {response.length}/500 caractères
          </p>
        </div>

        {/* Success Message */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3"
            >
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-800">
                Votre réponse a été publiée avec succès !
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {existingResponse && (
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setResponse(existingResponse);
              }}
              disabled={isSubmitting}
              className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all font-medium disabled:opacity-50"
            >
              Annuler
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting || response.trim().length < 10}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Envoi...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                {existingResponse ? "Modifier" : "Publier"} ma réponse
              </>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
