
"use client";

import React, { useState, useEffect, useRef } from "react";
import { Send, X, Shield, Bot, User, Loader2, Calendar, AlertTriangle } from "lucide-react";
import { useSafeLanguage } from "@/hooks/useSafeLanguage";

interface DisputeChatWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { reason: string; details: string; meetingRequest?: string }) => Promise<void>;
  isLoading: boolean;
}

interface Message {
  id: string;
  sender: "bot" | "user";
  text: React.ReactNode;
  type?: "text" | "options" | "input" | "date";
  options?: { value: string; label: string }[];
}


interface Scenario {
  label: string;
  question: string;
  placeholder: string;
}

export default function DisputeChatWizard({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}: DisputeChatWizardProps) {
  const { t, language } = useSafeLanguage();

  const scenarios: Record<string, Scenario> = {
    quality: t("orders.disputeChat.scenarios.quality", { returnObjects: true }) as Scenario,
    deadline: t("orders.disputeChat.scenarios.deadline", { returnObjects: true }) as Scenario,
    incomplete: t("orders.disputeChat.scenarios.incomplete", { returnObjects: true }) as Scenario,
    no_response: t("orders.disputeChat.scenarios.no_response", { returnObjects: true }) as Scenario,
    not_as_described: t("orders.disputeChat.scenarios.not_as_described", { returnObjects: true }) as Scenario,
    other: t("orders.disputeChat.scenarios.other", { returnObjects: true }) as Scenario,
  };

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [step, setStep] = useState<"reason" | "details" | "solution_choice" | "meeting" | "confirm">("reason");
  const [formData, setFormData] = useState({
    reason: "",
    details: "",
    meetingRequest: "",
    solutionType: "",
    scenarioKey: "" 
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    let t1: NodeJS.Timeout;
    let t2: NodeJS.Timeout;

    if (isOpen) {
      setMessages([]); // Start fresh on open or language change
      addBotMessage(t("orders.disputeChat.welcome"));

      // Premier message après 1s
      t1 = setTimeout(() => {
        addBotMessage(t("orders.disputeChat.scenarioIntro"));
      }, 1000);

      // Options après 2.5s (plus naturel)
      t2 = setTimeout(() => {
        const scenarios = t("orders.disputeChat.scenarios", { returnObjects: true });
        addBotMessage(
          t("orders.disputeChat.introCause") || "Veuillez choisir la raison du litige :",
          "options",
          Object.entries(scenarios).map(([key, anyValue]) => {
            const val = anyValue as { label: string };
            return { value: key, label: val.label };
          })
        );
      }, 2500);
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [isOpen, language, t]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addBotMessage = (
    text: string,
    type: Message["type"] = "text",
    options?: Message["options"]
  ) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: "bot",
        text,
        type,
        options,
      },
    ]);
  };

  const addUserMessage = (text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: "user",
        text,
      },
    ]);
  };

  const handleOptionClick = (value: string, label: string) => {
    addUserMessage(label);
    
    // Logique de progression des étapes
    if (step === "reason") {
      setFormData((prev) => ({ ...prev, reason: label, scenarioKey: value }));
      setStep("details");
      
      const scenario = scenarios[value] || scenarios["other"];
      
      setTimeout(() => {
        addBotMessage(scenario.question);
      }, 800);

    } else if (step === "solution_choice") {
        setFormData((prev) => ({ ...prev, solutionType: value }));

        if (value === "refund") {
            // CHEMIN REMBOURSEMENT / ANNULATION
            setStep("confirm");
            setTimeout(() => {
                addBotMessage(t("orders.disputeChat.refundPath.noted"));
            }, 600);
            setTimeout(() => {
                addBotMessage(t("orders.disputeChat.refundPath.agentReview"));
            }, 1500);
            setTimeout(() => {
                addBotMessage(
                  t("orders.disputeChat.refundPath.confirmPrompt"),
                  "options",
                  [
                     { value: "confirm", label: t("orders.disputeChat.options.confirmIntervention") },
                     { value: "cancel", label: t("orders.disputeChat.options.cancel") } 
                  ]
                );
            }, 2500);
        } else {
            // CHEMIN MEDIATION
            setStep("meeting");
            setTimeout(() => {
                addBotMessage(t("orders.disputeChat.mediationPath.noted"), "input");
            }, 800);
        }
    }
  };

  const handleSendInput = () => {
    if (!inputText.trim()) return;
    
    addUserMessage(inputText);
    const text = inputText;
    setInputText("");

    if (step === "details") {
      setFormData((prev) => ({ ...prev, details: text }));
      setStep("solution_choice");
      
      setTimeout(() => {
        addBotMessage(t("orders.disputeChat.thanksDetails")); 
      }, 500);

      setTimeout(() => {
        addBotMessage(
          t("orders.disputeChat.preferredOutcome"),
          "options",
          [
            { value: "meeting", label: t("orders.disputeChat.options.mediation") },
            { value: "refund", label: t("orders.disputeChat.options.refund") },
          ]
        );
      }, 1200);

    } else if (step === "meeting") {
        setFormData((prev) => ({ ...prev, meetingRequest: text }));
        setStep("confirm");
        setTimeout(() => {
            addBotMessage(t("orders.disputeChat.mediationPath.thanks"));
        }, 500);
        setTimeout(() => {
            addBotMessage(
              t("orders.disputeChat.mediationPath.confirmPrompt"),
              "options",
              [
                 { value: "confirm", label: t("orders.disputeChat.options.confirmDispute") },
                 { value: "cancel", label: t("orders.disputeChat.options.cancelShort") } 
              ]
            );
        }, 1200);
    }
  };
  
  const handleConfirmAction = (value: string) => {
      if (value === "confirm") {
          // Si c'est un remboursement direct, on ajoute cette précision dans les détails envoyés
          const finalData = { ...formData };
          if (formData.solutionType === 'refund') {
              finalData.details += t("orders.disputeChat.systemNoteRefund");
          }
          onSubmit(finalData);
      } else {
          onClose();
      }
  };

  const getCurrentPlaceholder = () => {
      if (step === "details") {
          const scenario = scenarios[formData.scenarioKey] || scenarios["other"];
          return scenario.placeholder;
      }
      return t("orders.disputeChat.inputPlaceholder");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full h-[650px] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200">
        
        {/* En-tête Assistant */}
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-4 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">{t("orders.disputeChat.botName")}</h3>
              <p className="text-indigo-100 text-xs flex items-center gap-1">
                <Shield className="w-3 h-3" />
                {t("orders.disputeChat.botSubtitle")}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Zone de conversation */}
        <div className="flex-1 bg-slate-50 p-4 overflow-y-auto space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom-2 fade-in duration-300`}
            >
              {msg.sender === "bot" && (
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center mr-2 flex-shrink-0 mt-1 shadow-sm">
                  <Bot className="w-4 h-4 text-indigo-600" />
                </div>
              )}
              
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                  msg.sender === "user"
                    ? "bg-violet-600 text-white rounded-tr-none"
                    : "bg-white text-slate-800 border border-slate-200 rounded-tl-none"
                }`}
              >
                <div className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</div>
                
                {/* Options (Boutons) */}
                {msg.type === "options" && msg.options && (
                  <div className="mt-3 flex flex-col sm:flex-row flex-wrap gap-2">
                    {msg.options.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => {
                            if (step === "confirm") handleConfirmAction(opt.value);
                            else handleOptionClick(opt.value, opt.label);
                        }}
                        className="text-xs text-left bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium px-4 py-3 rounded-xl border border-indigo-200 transition-all hover:shadow-md active:scale-95"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {msg.sender === "user" && (
                <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center ml-2 flex-shrink-0 mt-1 shadow-sm">
                  <User className="w-4 h-4 text-violet-600" />
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-center py-4">
                <div className="flex items-center gap-2 text-indigo-600 bg-white px-4 py-2 rounded-full shadow-sm border border-indigo-100">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-xs font-medium">{t("orders.disputeChat.thinking")}</span>
                </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Zone de saisie (si pas d'options actives) */}
        {step !== "confirm" && messages[messages.length - 1]?.type !== "options" && !isLoading && (
          <div className="p-4 bg-white border-t border-slate-200">
            <div className="flex items-center gap-2">
              <input
                type={step === "meeting" ? "datetime-local" : "text"}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendInput()}
                placeholder={step === "meeting" ? "" : getCurrentPlaceholder()}
                className="flex-1 border border-slate-300 rounded-full px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all font-medium placeholder:text-slate-400"
                autoFocus
              />
              <button
                onClick={handleSendInput}
                disabled={!inputText.trim()}
                className="p-3 bg-violet-600 text-white rounded-full hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-95"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
