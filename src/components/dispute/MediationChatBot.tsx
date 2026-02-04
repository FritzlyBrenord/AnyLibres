"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertTriangle,
  FileText,
  Scale,
  Users,
  ArrowRight,
  Loader2
} from "lucide-react";
import { useSafeLanguage } from "@/hooks/useSafeLanguage";

interface MediationChatBotProps {
  disputeReason: string;
  disputeDetails: string;
  userRole: "client" | "provider" | "admin";
  userName: string;
  onAccept: () => void;
  onReject: () => void;
  isDark?: boolean;
}

interface BotMessage {
  id: number;
  text: string | React.ReactNode;
  type: "text" | "rules" | "conditions" | "action";
  delay: number;
}

const MEDIATION_RULES = [
  {
    icon: Users,
    title: "Respect mutuel obligatoire",
    description: "Communiquez de manière courtoise et professionnelle"
  },
  {
    icon: MessageSquare,
    title: "Communication claire et factuelle",
    description: "Présentez des faits vérifiables, évitez les accusations"
  },
  {
    icon: Clock,
    title: "Réponses dans un délai raisonnable",
    description: "Restez actif pendant la session de médiation"
  },
  {
    icon: FileText,
    title: "Preuves acceptées",
    description: "Captures d'écran, documents, fichiers pertinents"
  },
  {
    icon: Scale,
    title: "Décision finale de l'administrateur",
    description: "Le médiateur Anylibre a le dernier mot"
  }
];

export default function MediationChatBot({
  disputeReason,
  disputeDetails,
  userRole,
  userName,
  onAccept,
  onReject,
  isDark = false
}: MediationChatBotProps) {
  const { t } = useSafeLanguage();
  const [currentStep, setCurrentStep] = useState(0);
  const [messages, setMessages] = useState<BotMessage[]>([]);
  const [showRules, setShowRules] = useState(false);
  const [showConditions, setShowConditions] = useState(false);
  const [acceptedRules, setAcceptedRules] = useState(false);
  const [acceptedConditions, setAcceptedConditions] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const translatedRules = t('mediation.bot.rules') as any[];

  const botMessages: BotMessage[] = [
    {
      id: 1,
      text: t('mediation.bot.welcome', { name: userName }),
      type: "text",
      delay: 500
    },
    {
      id: 2,
      text: t('mediation.bot.intro'),
      type: "text",
      delay: 1500
    },
    {
      id: 3,
      text: (
        <div className="space-y-3">
          <p className="font-bold text-lg">{t('mediation.bot.reminderTitle')}</p>
          <div className={`p-4 rounded-xl ${isDark ? "bg-gray-800" : "bg-red-50 border border-red-200"}`}>
            <p className="font-semibold mb-2">{t('mediation.bot.reasonLabel')} {disputeReason}</p>
            <p className="text-sm opacity-90 whitespace-pre-wrap">{disputeDetails}</p>
          </div>
        </div>
      ),
      type: "text",
      delay: 2500
    },
    {
      id: 4,
      text: t('mediation.bot.rulesIntro'),
      type: "text",
      delay: 3500
    },
    {
      id: 5,
      text: null,
      type: "rules",
      delay: 4000
    }
  ];

  useEffect(() => {
    if (currentStep < botMessages.length) {
      const timer = setTimeout(() => {
        setMessages(prev => [...prev, botMessages[currentStep]]);
        setCurrentStep(prev => prev + 1);
        
        if (botMessages[currentStep].type === "rules") {
          setShowRules(true);
        }
      }, botMessages[currentStep].delay);

      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  const handleAcceptRules = () => {
    setAcceptedRules(true);
    setShowConditions(true);
    setMessages(prev => [...prev, {
      id: 99,
      text: t('mediation.bot.rulesAccepted'),
      type: "text",
      delay: 0
    }]);
  };

  const handleFinalAccept = async () => {
    if (!acceptedRules || !acceptedConditions) {
      alert(t('mediation.bot.acceptRequired'));
      return;
    }

    setIsProcessing(true);
    // Simuler un délai de traitement
    setTimeout(() => {
      onAccept();
    }, 1000);
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${isDark ? "bg-gray-900" : "bg-gradient-to-br from-slate-50 via-purple-50 to-slate-50"}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden ${isDark ? "bg-gray-800 border border-gray-700" : "bg-white"}`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{t('mediation.bot.assistantTitle')}</h1>
              <p className="text-purple-100 text-sm">{t('mediation.bot.assistantSubtitle')}</p>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isDark ? "bg-purple-900" : "bg-purple-100"}`}>
                  <Shield className={`w-5 h-5 ${isDark ? "text-purple-300" : "text-purple-600"}`} />
                </div>
                <div className={`flex-1 p-4 rounded-2xl rounded-tl-none ${isDark ? "bg-gray-700 text-gray-100" : "bg-gray-50 text-gray-900"}`}>
                  {message.text}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Rules Section */}
          {showRules && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className={`p-6 rounded-2xl ${isDark ? "bg-gray-700" : "bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200"}`}>
                <h3 className={`text-xl font-bold mb-4 flex items-center gap-2 ${isDark ? "text-white" : "text-purple-900"}`}>
                  <Scale className="w-6 h-6" />
                  {t('mediation.bot.rulesTitle')}
                </h3>
                <div className="space-y-3">
                  {MEDIATION_RULES.map((rule, index) => {
                    const Icon = rule.icon;
                    const translatedRule = translatedRules[index] || rule;
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`flex gap-3 p-3 rounded-xl ${isDark ? "bg-gray-800" : "bg-white"}`}
                      >
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Icon className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>{translatedRule.title}</p>
                          <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>{translatedRule.desc || translatedRule.description}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {!acceptedRules && (
                  <div className="mt-6 flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="accept-rules"
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleAcceptRules();
                        }
                      }}
                      className="mt-1 w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                    />
                    <label htmlFor="accept-rules" className={`text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                      {t('mediation.bot.acceptRulesCheckbox')}
                    </label>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Conditions Section */}
          {showConditions && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className={`p-6 rounded-2xl ${isDark ? "bg-gray-700" : "bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200"}`}>
                <h3 className={`text-xl font-bold mb-4 flex items-center gap-2 ${isDark ? "text-white" : "text-blue-900"}`}>
                  <FileText className="w-6 h-6" />
                  {t('mediation.bot.conditionsTitle')}
                </h3>
                <div className={`space-y-2 text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                  <p>• {t('mediation.bot.condition1')}</p>
                  <p>• {t('mediation.bot.condition2')}</p>
                  <p>• {t('mediation.bot.condition3')}</p>
                  <p>• {t('mediation.bot.condition4')}</p>
                  <p>• {t('mediation.bot.condition5')}</p>
                </div>

                <div className="mt-6 flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="accept-conditions"
                    checked={acceptedConditions}
                    onChange={(e) => setAcceptedConditions(e.target.checked)}
                    className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <label htmlFor="accept-conditions" className={`text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                    {t('mediation.bot.acceptConditionsCheckbox')}
                  </label>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Footer Actions */}
        {showConditions && (
          <div className={`p-6 border-t ${isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-50"}`}>
            <div className="flex gap-4 justify-end">
              <button
                onClick={onReject}
                disabled={isProcessing}
                className={`px-6 py-3 rounded-xl font-semibold transition-all ${isDark ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleFinalAccept}
                disabled={!acceptedRules || !acceptedConditions || isProcessing}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t('mediation.bot.verifying')}
                  </>
                ) : (
                  <>
                    {t('mediation.bot.accessMediation')}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
