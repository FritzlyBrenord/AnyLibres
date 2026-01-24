
"use client";

import React, { useState, useEffect, useRef } from "react";
import { Send, X, Shield, Bot, User, Loader2, Calendar, AlertTriangle } from "lucide-react";

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

const SCENARIOS: Record<string, { label: string; question: string; placeholder: string }> = {
  quality: {
    label: "Qualité du travail insuffisante",
    question: "Je comprends votre déception. Pouvez-vous préciser ce qui ne correspond pas à vos attentes dans le travail livré ? (Style, finitions, bugs...)",
    placeholder: "Ex: Le design ne respecte pas la charte, il y a des erreurs..."
  },
  deadline: {
    label: "Délais non respectés",
    question: "C'est ennuyeux, je comprends. De combien de temps estimez-vous le retard et quel est l'impact sur votre projet ?",
    placeholder: "Ex: Livraison prévue hier, cela bloque mon lancement..."
  },
  incomplete: {
    label: "Livraison incomplète",
    question: "Je vois. Quels éléments précis sont manquants par rapport à ce qui était convenu ?",
    placeholder: "Ex: Il manque les fichiers sources et la version mobile..."
  },
  no_response: {
    label: "Plus de réponse du prestataire",
    question: "Je comprends votre inquiétude. Depuis combien de temps n'avez-vous pas eu de nouvelles ?",
    placeholder: "Ex: Aucun message depuis 3 jours malgré mes relances..."
  },
  not_as_described: {
    label: "Produit non conforme à la description",
    question: "C'est problématique. En quoi le produit final diffère-t-il de la description du service commandé ?",
    placeholder: "Ex: J'ai commandé X mais j'ai reçu Y..."
  },
  other: {
    label: "Autre raison",
    question: "D'accord. Pouvez-vous m'expliquer la situation en quelques détails ?",
    placeholder: "Décrivez le problème..."
  }
};

export default function DisputeChatWizard({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}: DisputeChatWizardProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [step, setStep] = useState<"reason" | "details" | "solution_choice" | "meeting" | "confirm">("reason");
  const [formData, setFormData] = useState({
    reason: "",
    details: "",
    meetingRequest: "",
    solutionType: "" 
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Message d'accueil initial
      setTimeout(() => {
        addBotMessage("Bonjour. Je suis l'assistant intelligent de résolution de litiges Anylibre.");
      }, 500);
      setTimeout(() => {
        addBotMessage(
          "Je suis là pour analyser la situation avec vous. Pour commencer, quelle est la cause principale du problème ?",
          "options",
          Object.entries(SCENARIOS).map(([key, val]) => ({ value: key, label: val.label }))
        );
      }, 1500);
    }
  }, [isOpen]);

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
      setFormData((prev) => ({ ...prev, reason: label }));
      setStep("details");
      
      const scenario = SCENARIOS[value] || SCENARIOS["other"];
      
      setTimeout(() => {
        addBotMessage(scenario.question);
      }, 800);

    } else if (step === "solution_choice") {
        setFormData((prev) => ({ ...prev, solutionType: value }));

        if (value === "refund") {
            // CHEMIN REMBOURSEMENT / ANNULATION
            setStep("confirm");
            setTimeout(() => {
                addBotMessage("C'est bien noté. Vous souhaitez une annulation car le résultat ne correspond pas à votre commande.");
            }, 600);
            setTimeout(() => {
                addBotMessage("Un agent Anylibre va personnellement examiner votre dossier et le travail livré. Nous vous contacterons sous 24h.");
            }, 1500);
            setTimeout(() => {
                addBotMessage(
                  "Voulez-vous confirmer l'ouverture du litige pour examen par nos services ?",
                  "options",
                  [
                     { value: "confirm", label: "✅ Confirmer la demande d'intervention" },
                     { value: "cancel", label: "Non, annuler" } 
                  ]
                );
            }, 2500);
        } else {
            // CHEMIN MEDIATION
            setStep("meeting");
            setTimeout(() => {
                addBotMessage("Très bien. Une réunion de médiation est souvent la solution la plus rapide. Quelles sont vos disponibilités (Date et Heure) ?", "input");
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
        addBotMessage("Merci pour ces détails précis."); 
      }, 500);

      setTimeout(() => {
        addBotMessage(
          "Quelle issue préférez-vous pour le moment ?",
          "options",
          [
            { value: "meeting", label: "📅 Médiation / Réunion avec le prestataire" },
            { value: "refund", label: "💸 Je ne veux pas continuer (Demande de remboursement)" },
          ]
        );
      }, 1200);

    } else if (step === "meeting") {
        setFormData((prev) => ({ ...prev, meetingRequest: text }));
        setStep("confirm");
        setTimeout(() => {
            addBotMessage("Parfait, c'est noté.");
        }, 500);
        setTimeout(() => {
            addBotMessage(
              "En confirmant, le litige sera ouvert et un administrateur organisera la médiation. Confirmez-vous ?",
              "options",
              [
                 { value: "confirm", label: "✅ Confirmer le litige" },
                 { value: "cancel", label: "Annuler" } 
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
              finalData.details += "\n\n[NOTE SYSTEME] Le client refuse la médiation et demande un remboursement pour non-conformité. Agent requis.";
          }
          onSubmit(finalData);
      } else {
          onClose();
      }
  };

  const getCurrentPlaceholder = () => {
      if (step === "details") {
          // Trouver la clé du scénario basé sur le label stocké (un peu hacky mais évite de stocker la key separément pour l'instant, ou on cherche)
          const scenarioKey = Object.keys(SCENARIOS).find(key => SCENARIOS[key].label === formData.reason);
          return scenarioKey ? SCENARIOS[scenarioKey].placeholder : "Détaillez le problème...";
      }
      return "Écrivez votre réponse...";
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
              <h3 className="text-white font-bold text-lg">Assistant Litige IA</h3>
              <p className="text-indigo-100 text-xs flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Support Intelligent Anylibre
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
                    <span className="text-xs font-medium">L'assistant réfléchit...</span>
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
