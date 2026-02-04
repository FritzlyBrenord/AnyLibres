"use client";

import { useState } from "react";
import { Send, Mail, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useSafeLanguage } from "@/hooks/useSafeLanguage";

export function ContactForm() {
  const { t } = useSafeLanguage();
  const [object, setObject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [sendAsEmail, setSendAsEmail] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Envoi API (Création Ticket)
      const response = await fetch("/api/support/ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ object, message }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        // 2. Optionnel : Ouvrir client mail
        if (sendAsEmail) {
          const subject = encodeURIComponent(t.help.contact.emailParams.subject.replace("{object}", object));
          const body = encodeURIComponent(t.help.contact.emailParams.body.replace("{message}", message));
          window.location.href = `mailto:support@anylibre.com?subject=${subject}&body=${body}`;
        }
        
        // Reset form
        setTimeout(() => {
          setSuccess(false);
          setObject("");
          setMessage("");
        }, 3000);
      } else {
        alert("Erreur: " + data.error);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
          <Mail className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">{t.help.contact.title}</h3>
          <p className="text-slate-500 text-sm">{t.help.contact.desc}</p>
        </div>
      </div>

      {success ? (
        <div className="flex flex-col items-center justify-center py-8 text-center animate-fade-in">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h4 className="text-xl font-bold text-slate-900 mb-2">{t.help.contact.success}</h4>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t.help.contact.object}
            </label>
            <input
              type="text"
              required
              value={object}
              onChange={(e) => setObject(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
              placeholder={t.help.contact.object}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t.help.contact.message}
            </label>
            <textarea
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none resize-none"
              placeholder={t.help.contact.message}
            />
          </div>

          <div className="flex items-center gap-2 py-2">
            <input 
              type="checkbox" 
              id="sendAsEmail" 
              checked={sendAsEmail} 
              onChange={(e) => setSendAsEmail(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
            />
            <label htmlFor="sendAsEmail" className="text-sm text-slate-600 select-none cursor-pointer">
              {t.help.contact.sendEmail}
            </label>
          </div>

          <Button
            type="submit"
            variant="primary"
            isLoading={loading}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white"
          >
            <Send className="w-4 h-4 mr-2" />
            {t.help.contact.send}
          </Button>
        </form>
      )}
    </div>
  );
}
