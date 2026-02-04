"use client";

import React, { useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Send,
  Paperclip,
  Mic,
  Image,
  FileText,
  X,
  Check,
  XCircle,
  CheckCircle,
  AlertCircle,
  Loader2,
  Pause,
  Play,
  Volume2,
  Download,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSafeLanguage } from "@/hooks/useSafeLanguage";

type UserRole = "client" | "provider" | "admin";

interface Message {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_role: UserRole;
  content: string;
  message_type: "text" | "image" | "document" | "voice";
  file_url?: string;
  file_name?: string;
  duration_seconds?: number;
  created_at: string;
}

interface MediationPresence {
  id: string;
  user_id: string;
  role: UserRole;
  is_present: boolean;
}

const MediationRoom = () => {
  const { t } = useSafeLanguage();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const disputeId = searchParams.get("dispute_id");

  const [presenceData, setPresenceData] = useState<MediationPresence[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [showMediaMenu, setShowMediaMenu] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState<UserRole | null>(null);
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Chargement initial
  useEffect(() => {
    if (!disputeId || !user) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [presenceRes, messagesRes] = await Promise.all([
          fetch(`/api/disputes/${disputeId}/presence`),
          fetch(`/api/mediation/${disputeId}/messages`),
        ]);

        if (presenceRes.ok) {
          const list = await presenceRes.json();
          setPresenceData(list);
          const userRole = list.find((p: MediationPresence) => p.user_id === user.id)?.role;
          if (userRole) setCurrentUserRole(userRole);
        }

        if (messagesRes.ok) {
          setMessages(await messagesRes.json());
        }
      } catch (error) {
        console.error("Error fetching:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [disputeId, user]);

  // Polling messages & presence
  useEffect(() => {
    if (!disputeId) return;

    const pollInterval = setInterval(async () => {
      try {
        const [presenceRes, messagesRes] = await Promise.all([
          fetch(`/api/disputes/${disputeId}/presence`),
          fetch(`/api/mediation/${disputeId}/messages`),
        ]);

        if (presenceRes.ok) setPresenceData(await presenceRes.json());
        if (messagesRes.ok) setMessages(await messagesRes.json());
      } catch (error) {
        console.error("Polling error:", error);
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [disputeId]);

  // Heartbeat
  useEffect(() => {
    if (!disputeId || !user || !currentUserRole) return;

    const sendHeartbeat = async () => {
      try {
        await fetch("/api/disputes/presence/heartbeat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dispute_id: disputeId,
            user_id: user.id,
            role: currentUserRole,
          }),
        });
      } catch (error) {
        console.error("Heartbeat error:", error);
      }
    };

    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 30000);

    return () => clearInterval(interval);
  }, [disputeId, user, currentUserRole]);

  // Enregistrement audio
  useEffect(() => {
    if (!isRecording) {
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
      setRecordingTime(0);
      return;
    }

    recordingIntervalRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);

    return () => {
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    };
  }, [isRecording]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Logique
  const clientPresent = presenceData.some((p) => p.role === "client" && p.is_present);
  const providerPresent = presenceData.some((p) => p.role === "provider" && p.is_present);
  const canSendMessage = clientPresent && providerPresent && !isPaused;
  const missingParty = !clientPresent ? t('mediation.roles.client') : !providerPresent ? t('mediation.roles.provider') : null;

  const getRoleStyles = (role: UserRole) => {
    const styles = {
      client: {
        bg: "bg-gradient-to-br from-blue-900/40 to-blue-800/30",
        border: "border-blue-500/50",
        text: "text-blue-100",
        badge: "bg-blue-600/80",
        font: "font-serif",
      },
      provider: {
        bg: "bg-gradient-to-br from-emerald-900/40 to-emerald-800/30",
        border: "border-emerald-500/50",
        text: "text-emerald-100",
        badge: "bg-emerald-600/80",
        font: "font-sans",
      },
      admin: {
        bg: "bg-gradient-to-br from-amber-900/40 to-amber-800/30",
        border: "border-amber-500/50",
        text: "text-amber-100",
        badge: "bg-amber-600/80",
        font: "font-mono",
      },
    };
    return styles[role];
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !canSendMessage || isSending || !disputeId || !user) return;

    setIsSending(true);
    try {
        const res = await fetch(`/api/mediation/${disputeId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender_id: user.id,
          sender_role: currentUserRole,
          sender_name: user ? `${user.first_name} ${user.last_name}` : t('mediation.none'),
          content: inputMessage,
          message_type: "text",
        }),
      });

      if (res.ok) {
        setInputMessage("");
        const messagesRes = await fetch(`/api/mediation/${disputeId}/messages`);
        if (messagesRes.ok) {
          setMessages(await messagesRes.json());
        }
      }
    } catch (error) {
      console.error("Error:", error);
      alert(t('mediation.errors.default'));
    } finally {
      setIsSending(false);
    }
  };

  const handleFileUpload = async (type: "image" | "document") => {
    if (!canSendMessage || isSending || !disputeId || !user) return;

    const accept = type === "image" ? "image/*" : ".pdf,.doc,.docx,.txt";
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;

    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      setIsSending(true);
      try {
        const formData = new FormData();
        formData.append("file", file);

        const uploadRes = await fetch(`/api/mediation/${disputeId}/upload/${type}`, {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) throw new Error("Upload failed");

        const { file_url, file_name, file_size_bytes } = await uploadRes.json();

          const messageRes = await fetch(`/api/mediation/${disputeId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sender_id: user.id,
            sender_role: currentUserRole,
            sender_name: user ? `${user.first_name} ${user.last_name}` : t('mediation.none'),
            content: null,
            message_type: type,
            file_url,
            file_name,
            file_size_bytes,
          }),
        });

        if (messageRes.ok) {
          const messagesRes = await fetch(`/api/mediation/${disputeId}/messages`);
          if (messagesRes.ok) {
            setMessages(await messagesRes.json());
          }
        }
      } catch (error) {
        console.error("Error:", error);
        alert(t('mediation.errors.default'));
      } finally {
        setIsSending(false);
        setShowMediaMenu(false);
      }
    };

    input.click();
  };

  const handleVoiceRecording = async () => {
    if (!canSendMessage || !disputeId || !user) return;

    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);

        mediaRecorder.onstop = async () => {
          setIsRecording(false);
          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });

          setIsSending(true);
          try {
            const formData = new FormData();
            formData.append("file", audioBlob, "voice.webm");

            const uploadRes = await fetch(`/api/mediation/${disputeId}/upload/voice`, {
              method: "POST",
              body: formData,
            });

            if (!uploadRes.ok) throw new Error("Upload failed");

            const { file_url, file_name } = await uploadRes.json();

              const messageRes = await fetch(`/api/mediation/${disputeId}/messages`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                sender_id: user.id,
                sender_role: currentUserRole,
                sender_name: user ? `${user.first_name} ${user.last_name}` : t('mediation.none'),
                content: null,
                message_type: "voice",
                file_url,
                file_name,
                duration_seconds: recordingTime,
              }),
            });

            if (messageRes.ok) {
              const messagesRes = await fetch(`/api/mediation/${disputeId}/messages`);
              if (messagesRes.ok) {
                setMessages(await messagesRes.json());
              }
            }
          } catch (error) {
            console.error("Error:", error);
            alert(t('mediation.errors.default'));
          } finally {
            setIsSending(false);
          }
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (error) {
        alert(t('mediation.errors.micNotAvailable'));
      }
    } else {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
    }
  };

  const handleDecision = async (agreed: boolean) => {
    if (!disputeId || currentUserRole !== "client" || !user) return;

    try {
      const res = await fetch(`/api/disputes/${disputeId}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, agreed: agreed }),
      });

      if (res.ok) {
        setShowDecisionModal(false);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const toggleAdminPause = async () => {
    if (currentUserRole !== "admin" || !disputeId) return;

    try {
      await fetch(`/api/disputes/${disputeId}/pause`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_paused: !isPaused }),
      });

      setIsPaused(!isPaused);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <Loader2 className="w-12 h-12 animate-spin text-amber-400" />
      </div>
    );
  }

  if (!user || !disputeId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="text-white">{t('mediation.accessDenied')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-600 to-amber-800 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-2xl">⚖️</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent">
                  {t('mediation.title')}
                </h1>
                <p className="text-sm text-slate-400">{t('mediation.activeSession')}</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              {/* Participants */}
              <div className="flex items-center gap-3">
                {presenceData.map((p) => (
                  <div key={p.id} className="relative group">
                    <div
                      className={`w-10 h-10 rounded-full ${getRoleStyles(p.role).bg} border-2 ${getRoleStyles(p.role).border} flex items-center justify-center`}
                    >
                      <span className="text-lg">
                        {p.role === "client" ? "👤" : p.role === "provider" ? "🔧" : "⚖️"}
                      </span>
                    </div>
                    {p.is_present && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900"></div>
                    )}
                  </div>
                ))}
              </div>

              {currentUserRole === "admin" && (
                <button
                   onClick={toggleAdminPause}
                  className={`px-4 py-2 rounded-lg font-medium ${isPaused ? "bg-green-600" : "bg-red-600"}`}
                >
                  {isPaused ? `▶️ ${t('mediation.resume')}` : `⏸️ ${t('mediation.pause')}`}
                </button>
              )}

              {currentUserRole === "client" && (
                 <button
                  onClick={() => setShowDecisionModal(true)}
                  className="px-6 py-2 bg-gradient-to-r from-amber-600 to-amber-700 rounded-lg font-semibold"
                >
                  {t('mediation.decision')}
                </button>
              )}
            </div>
          </div>

           {isPaused && (
            <div className="mt-3 px-4 py-2 bg-red-900/30 border border-red-500/50 rounded-lg text-sm text-red-300">
              ⏸️ {t('mediation.pausedDiscussion')}
            </div>
          )}

           {!canSendMessage && (
            <div className="mt-3 px-4 py-2 bg-yellow-900/30 border border-yellow-500/50 rounded-lg text-sm text-yellow-300">
              {t('mediation.waitingFor', { party: missingParty })}
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="bg-slate-900/50 rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden">
          <div className="h-[calc(100vh-300px)] overflow-y-auto px-6 py-6 space-y-4">
             {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-400">
                {t('mediation.noMessages')}
              </div>
            ) : (
              messages.map((msg) => {
                const styles = getRoleStyles(msg.sender_role);
                const isCurrentUser = msg.sender_id === user?.id;

                return (
                  <div key={msg.id} className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-2xl ${isCurrentUser ? "items-end" : "items-start"} flex flex-col gap-1`}>
                      {!isCurrentUser && (
                        <div className="flex items-center gap-2 px-2">
                          <span className="text-xl">
                            {msg.sender_role === "client" ? "👤" : msg.sender_role === "provider" ? "🔧" : "⚖️"}
                          </span>
                           <span className="text-sm text-slate-400">{msg.sender_name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded ${styles.badge}`}>
                            {msg.sender_role === "client" ? t('mediation.roles.client') : msg.sender_role === "provider" ? t('mediation.roles.provider') : t('mediation.roles.admin')}
                          </span>
                        </div>
                      )}

                      <div className={`${styles.bg} ${styles.border} border rounded-2xl px-5 py-3 ${isCurrentUser ? "rounded-tr-sm" : "rounded-tl-sm"}`}>
                        {msg.message_type === "text" && (
                          <p className={`${styles.text} leading-relaxed`}>{msg.content}</p>
                        )}

                        {msg.message_type === "image" && (
                          <div className="space-y-2">
                            <img src={msg.file_url} alt="image" className="rounded-lg max-w-md cursor-pointer" onClick={() => window.open(msg.file_url)} />
                            <p className={`${styles.text} text-sm`}>📷 {msg.file_name}</p>
                          </div>
                        )}

                        {msg.message_type === "document" && (
                          <a href={msg.file_url} target="_blank" className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg hover:bg-slate-700/50">
                            <FileText className="w-8 h-8 text-blue-400" />
                             <div className="flex-1">
                              <p className={`${styles.text} font-medium truncate`}>{msg.file_name}</p>
                              <p className="text-xs text-slate-400">{t('mediation.download')}</p>
                            </div>
                            <Download className="w-5 h-5" />
                          </a>
                        )}

                        {msg.message_type === "voice" && (
                          <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg min-w-[200px]">
                            <button className="w-10 h-10 bg-amber-600 rounded-full flex items-center justify-center" onClick={() => setPlayingAudio(playingAudio === msg.id ? null : msg.id)}>
                              {playingAudio === msg.id ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                            </button>
                            <div className="flex-1">
                              <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                                <div className="h-full bg-amber-500 w-1/3"></div>
                              </div>
                              <p className="text-xs text-slate-400 mt-1">{formatTime(msg.duration_seconds || 0)}</p>
                            </div>
                            <Volume2 className="w-5 h-5 text-slate-400" />
                          </div>
                        )}
                      </div>

                      <span className="text-xs text-slate-500 px-2">
                        {new Date(msg.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-slate-700/50 bg-slate-800/50 px-6 py-4">
            {isRecording && (
              <div className="mb-3 px-4 py-3 bg-red-900/30 border border-red-500/50 rounded-lg flex items-center justify-between">
                 <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-red-300">{t('mediation.recording')}</span>
                  <span className="text-red-400 font-mono">{formatTime(recordingTime)}</span>
                </div>
                <button onClick={handleVoiceRecording} className="text-red-400">
                  <Check className="w-6 h-6" />
                </button>
              </div>
            )}

            <div className="flex items-end gap-3">
              <div className="relative">
                <button
                  onClick={() => setShowMediaMenu(!showMediaMenu)}
                  disabled={!canSendMessage}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${!canSendMessage ? "bg-slate-700/30 text-slate-500 cursor-not-allowed" : "bg-slate-700 hover:bg-slate-600"}`}
                >
                  <Paperclip className="w-5 h-5" />
                </button>

                {showMediaMenu && canSendMessage && (
                  <div className="absolute bottom-full mb-2 left-0 bg-slate-800 border border-slate-700 rounded-xl shadow-xl p-2 space-y-1 z-10">
                    <button onClick={() => handleFileUpload("image")} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-700 rounded-lg">
                      <Image className="w-5 h-5 text-blue-400" />
                      <span className="text-sm">Image</span>
                    </button>
                    <button onClick={() => handleFileUpload("document")} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-700 rounded-lg">
                      <FileText className="w-5 h-5 text-green-400" />
                      <span className="text-sm">Document</span>
                    </button>
                  </div>
                )}
              </div>

              <input
                type="text"
                 value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                disabled={!canSendMessage}
                placeholder={isPaused ? t('mediation.placeholders.paused') : !canSendMessage ? t('mediation.placeholders.waiting', { party: missingParty }) : t('mediation.placeholders.message')}
                className={`flex-1 px-5 py-3 rounded-xl border focus:outline-none focus:ring-2 ${!canSendMessage ? "bg-slate-800/30 border-slate-700/50 text-slate-500 cursor-not-allowed" : "bg-slate-800 border-slate-600 text-white focus:ring-amber-500/50"}`}
              />

              <button
                onClick={handleVoiceRecording}
                disabled={!canSendMessage}
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${!canSendMessage ? "bg-slate-700/30 text-slate-500 cursor-not-allowed" : isRecording ? "bg-red-600 hover:bg-red-700" : "bg-slate-700 hover:bg-slate-600"}`}
              >
                <Mic className="w-5 h-5" />
              </button>

              <button
                onClick={handleSendMessage}
                disabled={!canSendMessage || !inputMessage.trim() || isSending}
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${!canSendMessage || !inputMessage.trim() || isSending ? "bg-slate-700/30 text-slate-500 cursor-not-allowed" : "bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800"}`}
              >
                {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Decision Modal */}
      {showDecisionModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-2xl w-full max-w-2xl p-8">
             <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent">
                {t('mediation.finalDecision')}
              </h2>
              <button onClick={() => setShowDecisionModal(false)} className="text-slate-400">
                <X className="w-6 h-6" />
              </button>
            </div>

            <p className="text-slate-300 mb-8">{t('mediation.confirmDecision')}</p>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleDecision(true)}
                className="px-8 py-6 bg-gradient-to-br from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-xl transition-all hover:scale-105 flex flex-col items-center gap-3"
              >
                  <CheckCircle className="w-12 h-12" />
                <div>
                  <p className="font-bold">{t('mediation.agreement')}</p>
                  <p className="text-sm text-green-100">{t('mediation.settled')}</p>
                </div>
              </button>

              <button
                onClick={() => handleDecision(false)}
                className="px-8 py-6 bg-gradient-to-br from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-xl transition-all hover:scale-105 flex flex-col items-center gap-3"
              >
                  <XCircle className="w-12 h-12" />
                <div>
                  <p className="font-bold">{t('mediation.refuse')}</p>
                  <p className="text-sm text-red-100">{t('mediation.cancel')}</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediationRoom;
