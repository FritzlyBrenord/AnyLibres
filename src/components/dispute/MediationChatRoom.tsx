"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Send,
  Paperclip,
  Mic,
  Video,
  Image,
  FileText,
  X,
  Check,
  XCircle,
  CheckCircle,
  Phone,
  Volume2,
  Pause,
  Play,
  Download,
  AlertCircle,
  Loader2,
  Music,
  Reply,
  MicOff,
  VolumeX,
  Clock, // Added Clock
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// --- Types ---
type UserRole = "client" | "provider" | "admin";

interface Message {
  id: string;
  sender_id: string;
  content: string;
  message_type: "text" | "image" | "video" | "document" | "audio" | "voice";
  created_at: string;
  media_url?: string;
  media_name?: string;
  media_size?: number;
  media_duration?: number;
  reply_to_id?: string | null;
  is_read?: boolean;
  sender?: {
    first_name: string;
    last_name: string;
    role: string;
    avatar_url?: string;
  };
}

interface MediationChatRoomProps {
  disputeId: string;
  currentUserId: string;
  currentUserRole: "client" | "provider" | "admin";
  currentUserName: string;
  clientId: string;
  providerId: string;
  clientName: string;
  providerName: string;
  isDark?: boolean;
}

export default function MediationChatRoom({
  disputeId,
  currentUserId,
  currentUserRole,
  currentUserName,
  clientId,
  providerId,
  clientName,
  providerName,
  isDark = false,
}: MediationChatRoomProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showDecisionModal, setShowDecisionModal] = useState(false);

  // Resolution State
  const [resolutionStep, setResolutionStep] = useState(1); // 1: Choice, 2: Details, 3: Success
  const [resolutionType, setResolutionType] = useState<
    "agreement" | "no_agreement" | null
  >(null);
  const [resolutionNote, setResolutionNote] = useState("");
  const [wantsRefund, setWantsRefund] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Audio Player State
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [currentAudioDuration, setCurrentAudioDuration] = useState(0);

  const [showMediaMenu, setShowMediaMenu] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [participantMutes, setParticipantMutes] = useState<
    Record<string, boolean>
  >({});
  const [processingMute, setProcessingMute] = useState<string | null>(null);
  const isMuted = participantMutes[currentUserId] || false;

  // Timer State
  const [mediationStartedAt, setMediationStartedAt] = useState<string | null>(
    null,
  );
  const [mediationEndedAt, setMediationEndedAt] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Use null for no reply, Message object for active reply
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const supabase = createClient();

  // --- Initialize ---
  useEffect(() => {
    loadMessages();
    loadPresenceState();
    loadTimerState(); // Load timer start/end
    const channelMessages = subscribeToMessages();
    const channelPresence = subscribeToPresence();
    const channelDispute = subscribeToDispute(); // Listen for dispute updates (end)

    return () => {
      supabase.removeChannel(channelMessages);
      supabase.removeChannel(channelPresence);
      supabase.removeChannel(channelDispute);
    };
  }, []);

  // Timer Interval Logic
  useEffect(() => {
    if (!mediationStartedAt) return;

    const updateTimer = () => {
      const start = new Date(mediationStartedAt).getTime();
      const end = mediationEndedAt
        ? new Date(mediationEndedAt).getTime()
        : new Date().getTime();
      const diff = Math.max(0, Math.floor((end - start) / 1000));
      setElapsedTime(diff);
    };

    updateTimer(); // Initial call

    // Only run interval if not ended
    if (!mediationEndedAt) {
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }
  }, [mediationStartedAt, mediationEndedAt]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // --- Recording Timer ---
  useEffect(() => {
    if (isRecording) {
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (recordingIntervalRef.current)
        clearInterval(recordingIntervalRef.current);
      setRecordingTime(0);
    }
    return () => {
      if (recordingIntervalRef.current)
        clearInterval(recordingIntervalRef.current);
    };
  }, [isRecording]);

  // --- Helpers ---

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDuration = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    }
    return `${minutes}m ${seconds}s`;
  };

  const formatMessageTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderWithLinks = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        const href = part.startsWith("www.") ? `https://${part}` : part;
        return (
          <a
            key={index}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline break-all"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        );
      }
      return <React.Fragment key={index}>{part}</React.Fragment>;
    });
  };

  const getRepliedMessageContent = (msg: Message) => {
    switch (msg.message_type) {
      case "image":
        return "📷 Photo";
      case "video":
        return "🎥 Vidéo";
      case "voice":
        return "🎤 Message vocal";
      case "audio":
        return "🎵 Audio";
      case "document":
        return "📄 Document";
      default:
        return msg.content;
    }
  };

  // --- API / Logic ---

  const loadPresenceState = async () => {
    try {
      const { data, error } = await supabase
        .from("mediation_presence")
        .select("user_id, is_muted")
        .eq("dispute_id", disputeId);

      if (!error && data) {
        const mutes: Record<string, boolean> = {};
        data.forEach((p) => {
          mutes[p.user_id] = p.is_muted;
        });
        setParticipantMutes(mutes);
      }
    } catch (error) {
      console.error("Error loading presence state:", error);
    }
  };

  const loadMessages = async () => {
    try {
      const response = await fetch(`/api/disputes/${disputeId}/mediation-chat`);
      const data = await response.json();
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToPresence = () => {
    return supabase
      .channel(`mediation_presence_${disputeId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "mediation_presence",
          filter: `dispute_id=eq.${disputeId}`,
        },
        (payload) => {
          const { user_id, is_muted } = payload.new;
          setParticipantMutes((prev) => ({
            ...prev,
            [user_id]: is_muted,
          }));
        },
      )
      .subscribe();
  };

  const subscribeToDispute = () => {
    return supabase
      .channel(`dispute_timer_${disputeId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "disputes",
          filter: `id=eq.${disputeId}`,
        },
        (payload) => {
          const { mediation_session_started_at, ended_at } = payload.new;
          if (mediation_session_started_at)
            setMediationStartedAt(mediation_session_started_at);
          if (ended_at) setMediationEndedAt(ended_at);
        },
      )
      .subscribe();
  };

  const loadTimerState = async () => {
    const { data } = await supabase
      .from("disputes")
      .select("mediation_session_started_at, ended_at")
      .eq("id", disputeId)
      .single();

    if (data) {
      setMediationStartedAt(data.mediation_session_started_at);
      setMediationEndedAt(data.ended_at);
    }
  };

  const subscribeToMessages = () => {
    return supabase
      .channel(`mediation_chat_${disputeId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "mediation_messages",
          filter: `dispute_id=eq.${disputeId}`,
        },
        () => {
          loadMessages();
        },
      )
      .subscribe();
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleReply = (message: Message) => {
    setReplyingTo(message);
    // Ideally focus input here
  };

  const cancelReply = () => {
    setReplyingTo(null);
  };

  // --- Resolution Actions ---

  const handleOpenDecisionModal = () => {
    setResolutionStep(1);
    setResolutionType(null);
    setResolutionNote("");
    setWantsRefund(false);
    setShowDecisionModal(true);
  };

  const handleSelectResolution = (type: "agreement" | "no_agreement") => {
    setResolutionType(type);
    setResolutionStep(2);
  };

  const handleSubmitResolution = async () => {
    if (!resolutionType) return;
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/disputes/${disputeId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resolution_type: resolutionType,
          resolution_note: resolutionNote,
          wants_refund: wantsRefund,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setResolutionStep(3);
      } else {
        alert(data.error || "Une erreur est survenue");
      }
    } catch (e) {
      console.error(e);
      alert("Erreur de connexion");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseAndRedirect = () => {
    router.push("/home"); // or wherever appropriate
  };

  // --- Chat Actions ---

  const handleSendMessage = async () => {
    if (inputMessage.trim() === "" || isPaused) return;

    try {
      const formData = new FormData();
      formData.append("content", inputMessage);
      formData.append("type", "text");
      formData.append("sender_role", currentUserRole);
      if (replyingTo) {
        formData.append("reply_to_id", replyingTo.id);
      }

      setInputMessage(""); // Optimistic clear
      const currentReply = replyingTo;
      setReplyingTo(null); // Clear reply state

      const response = await fetch(
        `/api/disputes/${disputeId}/mediation-chat`,
        {
          method: "POST",
          body: formData,
        },
      );

      const data = await response.json();
      if (data.success && data.message) {
        // Optimistic Update
        const newMsg: Message = {
          ...data.message,
          sender: {
            first_name: currentUserName.split(" ")[0],
            last_name: currentUserName.split(" ").slice(1).join(" "),
            role: currentUserRole,
            avatar_url: null,
          },
          reply_to_id: currentReply ? currentReply.id : null,
        };
        setMessages((prev) => [...prev, newMsg]);
      }
    } catch (error) {
      console.error("Error sending message", error);
      alert("Erreur d'envoi");
    }
  };

  const handleFileUpload = (type: "image" | "video" | "document" | "audio") => {
    if (isPaused) return;

    const fileTypes = {
      image: "image/*",
      video: "video/*",
      audio: "audio/*",
      document: ".pdf,.doc,.docx,.txt",
    };

    const input = document.createElement("input");
    input.type = "file";
    input.accept = fileTypes[type];

    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (file) {
        try {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("type", type);
          formData.append(
            "content",
            `${type === "image" ? "📷" : type === "video" ? "🎥" : type === "audio" ? "🎵" : "📄"} ${file.name}`,
          );
          formData.append("sender_role", currentUserRole);
          if (replyingTo) {
            formData.append("reply_to_id", replyingTo.id);
          }

          const currentReply = replyingTo;
          setShowMediaMenu(false);
          setReplyingTo(null);

          const response = await fetch(
            `/api/disputes/${disputeId}/mediation-chat`,
            {
              method: "POST",
              body: formData,
            },
          );

          const data = await response.json();
          if (data.success && data.message) {
            const newMsg: Message = {
              ...data.message,
              sender: {
                first_name: currentUserName.split(" ")[0],
                last_name: currentUserName.split(" ").slice(1).join(" "),
                role: currentUserRole,
                avatar_url: null,
              },
              reply_to_id: currentReply ? currentReply.id : null,
            };
            setMessages((prev) => [...prev, newMsg]);
          }
        } catch (error) {
          console.error("Upload error", error);
          alert("Erreur d'upload");
        }
      }
    };
    input.click();
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        const audioFile = new File([audioBlob], "voice_message.webm", {
          type: "audio/webm",
        });

        const formData = new FormData();
        formData.append("file", audioFile);
        formData.append("type", "voice");
        formData.append("content", "🎤 Message vocal");
        formData.append("duration", recordingTime.toString());
        formData.append("sender_role", currentUserRole);
        if (replyingTo) {
          formData.append("reply_to_id", replyingTo.id);
        }

        const currentReply = replyingTo;
        setReplyingTo(null);

        const response = await fetch(
          `/api/disputes/${disputeId}/mediation-chat`,
          {
            method: "POST",
            body: formData,
          },
        );

        const data = await response.json();
        if (data.success && data.message) {
          const newMsg: Message = {
            ...data.message,
            sender: {
              first_name: currentUserName.split(" ")[0],
              last_name: currentUserName.split(" ").slice(1).join(" "),
              role: currentUserRole,
              avatar_url: null,
            },
            reply_to_id: currentReply ? currentReply.id : null,
          };
          setMessages((prev) => [...prev, newMsg]);
        }

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone", err);
      alert("Accès micro refusé ou impossible");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleVoiceRecording = () => {
    if (isPaused) return;
    if (!isRecording) {
      startRecording();
    } else {
      stopRecording();
    }
  };

  const toggleAudioPlay = (url: string | undefined, id: string) => {
    if (!url) {
      console.warn("Cannot play audio: No URL provided");
      return;
    }

    if (playingAudio === id) {
      audioRef.current?.pause();
      setPlayingAudio(null);
      setPlaybackProgress(0);
      setPlaybackTime(0);
      setCurrentAudioDuration(0);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      try {
        const audio = new Audio(url);
        audioRef.current = audio;

        setPlaybackProgress(0);
        setPlaybackTime(0);
        setCurrentAudioDuration(0);

        audio.onloadedmetadata = () => {
          if (audio.duration && audio.duration !== Infinity) {
            setCurrentAudioDuration(audio.duration);
          }
        };

        audio.ontimeupdate = () => {
          if (audio.duration && audio.duration !== Infinity) {
            setPlaybackProgress((audio.currentTime / audio.duration) * 100);
            setPlaybackTime(audio.currentTime);
            if (currentAudioDuration === 0) {
              setCurrentAudioDuration(audio.duration);
            }
          }
        };

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            console.error("Audio playback error:", error);
            alert(
              "Impossible de lire l'audio. Format non supporté ou fichier inaccessible.",
            );
            setPlayingAudio(null);
          });
        }

        setPlayingAudio(id);

        audio.onended = () => {
          setPlayingAudio(null);
          setPlaybackProgress(0);
          setPlaybackTime(0);
          setCurrentAudioDuration(0);
        };

        audio.onerror = (e) => {
          console.error("Audio error event:", e);
          setPlayingAudio(null);
        };
      } catch (e) {
        console.error("Error initializing audio:", e);
      }
    }
  };

  const handleDecision = async (agreed: boolean) => {
    // Legacy call, replaced by handleOpenDecisionModal, but kept if needed for simple cases
    alert(
      agreed ? "Accord accepté (Simulation)" : "Accord refusé (Simulation)",
    );
    setShowDecisionModal(false);
  };

  const toggleMute = async (userId: string) => {
    if (currentUserRole !== "admin") return;

    setProcessingMute(userId);
    const currentMute = participantMutes[userId] || false;
    const newMute = !currentMute;

    try {
      const response = await fetch("/api/mediation/toggle-mute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disputeId, userId, isMuted: newMute }),
      });
      const data = await response.json();
      if (!data.success) {
        alert(data.error || "Erreur lors du changement d'état");
      }
    } catch (error) {
      console.error("Error toggling mute:", error);
    } finally {
      // Small delay to let realtime catch up visually if needed, but usually strictly sequential
      setProcessingMute(null);
    }
  };

  const toggleAdminPause = () => {
    setIsPaused(!isPaused);
  };

  const getRoleStyles = (role: string) => {
    switch (role) {
      case "client":
        return {
          bg: "bg-gradient-to-br from-blue-900/40 to-blue-800/30",
          border: "border-blue-500/50",
          text: "text-blue-100",
          badge: "bg-blue-600/80",
          font: "font-serif",
          replyBg: "bg-blue-900/50",
        };
      case "provider":
        return {
          bg: "bg-gradient-to-br from-emerald-900/40 to-emerald-800/30",
          border: "border-emerald-500/50",
          text: "text-emerald-100",
          badge: "bg-emerald-600/80",
          font: "font-sans",
          replyBg: "bg-emerald-900/50",
        };
      case "admin":
        return {
          bg: "bg-gradient-to-br from-amber-900/40 to-amber-800/30",
          border: "border-amber-500/50",
          text: "text-amber-100",
          badge: "bg-amber-600/80",
          font: "font-mono",
          replyBg: "bg-amber-900/50",
        };
      default:
        return {
          bg: "bg-slate-800",
          border: "border-slate-700",
          text: "text-gray-100",
          badge: "bg-gray-600",
          font: "font-sans",
          replyBg: "bg-slate-800",
        };
    }
  };

  const users = [
    { id: clientId, name: clientName, role: "client", avatar: "👤" },
    { id: providerId, name: providerName, role: "provider", avatar: "🛠️" },
    { id: currentUserId, name: "Médiateur", role: "admin", avatar: "⚖️" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <Loader2 className="w-12 h-12 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex flex-col h-screen">
      {/* Header Premium */}
      <div className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-600 to-amber-800 rounded-xl flex items-center justify-center shadow-lg shadow-amber-900/50">
                <span className="text-2xl">⚖️</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent">
                  Salle de Médiation
                </h1>
                <p className="text-sm text-slate-400 flex items-center gap-2 mt-1">
                  <span>
                    Session active - {clientName} ↔ {providerName}
                  </span>
                  {mediationStartedAt && (
                    <span
                      className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md font-mono font-medium border ${
                        mediationEndedAt
                          ? "bg-slate-800 text-slate-400 border-slate-700"
                          : "bg-amber-900/30 text-amber-400 border-amber-500/30 animate-pulse"
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      {formatDuration(elapsedTime)}
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              {/* Participants */}
              <div className="flex items-center gap-3">
                {users.map((u) => {
                  const isUserMuted = participantMutes[u.id];
                  const isProcessing = processingMute === u.id;

                  return (
                    <div
                      key={u.id}
                      className="flex flex-col items-center gap-2"
                    >
                      {/* Avatar Circle with Control Overlay */}
                      <div className="relative group w-14 h-14">
                        <div
                          className={`w-full h-full rounded-full ${getRoleStyles(u.role).bg} border-[3px] ${isUserMuted ? "border-slate-600 grayscale opacity-50" : getRoleStyles(u.role).border} flex items-center justify-center shadow-lg overflow-hidden transition-all`}
                        >
                          <span className="text-2xl">{u.avatar}</span>
                        </div>

                        {/* Online indicator */}
                        {!isUserMuted && !isProcessing && (
                          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-slate-900 shadow-sm z-20 pointer-events-none"></div>
                        )}

                        {/* Admin Controls Overlay */}
                        {currentUserRole === "admin" && u.role !== "admin" && (
                          <button
                            onClick={() => !isProcessing && toggleMute(u.id)}
                            disabled={isProcessing}
                            className={`absolute inset-0 z-10 flex items-center justify-center rounded-full transition-all duration-300 backdrop-blur-[2px] ${
                              isProcessing
                                ? "bg-slate-900/60 opacity-100 cursor-wait"
                                : isUserMuted
                                  ? "bg-red-900/60 opacity-100 hover:bg-red-900/80 cursor-pointer"
                                  : "bg-slate-900/60 opacity-0 group-hover:opacity-100 cursor-pointer"
                            }`}
                            title={
                              isUserMuted
                                ? "Réactiver la parole"
                                : "Mettre en pause"
                            }
                          >
                            {isProcessing ? (
                              <Loader2 className="w-6 h-6 text-white animate-spin" />
                            ) : isUserMuted ? (
                              <Play className="w-6 h-6 text-white fill-current drop-shadow-md" />
                            ) : (
                              <Pause className="w-6 h-6 text-white fill-current drop-shadow-md" />
                            )}
                          </button>
                        )}
                      </div>

                      {/* Name/Role */}
                      <div className="text-center">
                        <p className="text-xs font-bold text-slate-300 leading-tight">
                          {u.name.split(" ")[0]}
                        </p>
                        <span
                          className={`text-[9px] uppercase tracking-wider font-bold ${isUserMuted ? "text-red-400" : "text-amber-500/80"}`}
                        >
                          {u.role === "client"
                            ? "Client"
                            : u.role === "provider"
                              ? "Prestataire"
                              : "Médiateur"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Admin Controls */}
              {currentUserRole === "admin" && (
                <button
                  onClick={toggleAdminPause}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    isPaused
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-red-600 hover:bg-red-700"
                  } shadow-lg`}
                >
                  {isPaused ? "▶️ Reprendre" : "⏸️ Pause"}
                </button>
              )}

              {/* Decision Button for Client */}
              {currentUserRole === "client" && (
                <button
                  onClick={handleOpenDecisionModal}
                  className="px-6 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 rounded-lg font-semibold shadow-lg shadow-amber-900/50 transition-all hover:scale-105"
                >
                  Prendre une décision
                </button>
              )}
            </div>
          </div>

          {/* Pause Indicator */}
          {isPaused && (
            <div className="mt-3 px-4 py-2 bg-red-900/30 border border-red-500/50 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span className="text-sm text-red-300">
                Discussion en pause - L'administrateur a temporairement suspendu
                les échanges
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        <div className="max-w-7xl mx-auto space-y-4">
          {messages.map((message) => {
            const role = message.sender?.role || "unknown";
            const styles = getRoleStyles(role);
            const isCurrentUser = message.sender_id === currentUserId;
            const isSenderAdmin = role === "admin";

            // User requested Admin messages ALWAYS on the left
            const showOnRight = isCurrentUser && !isSenderAdmin;

            const senderName = message.sender
              ? `${message.sender.first_name} ${message.sender.last_name}`
              : "Utilisateur";

            // Find replied message if exists
            const repliedMessage = message.reply_to_id
              ? messages.find((m) => m.id === message.reply_to_id)
              : null;

            return (
              <div
                key={message.id}
                className={`flex ${showOnRight ? "justify-end" : "justify-start"} animate-fade-in group`}
              >
                {!showOnRight && (
                  <button
                    onClick={() => handleReply(message)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-slate-500 hover:text-white self-center"
                    title="Répondre"
                  >
                    <Reply className="w-4 h-4" />
                  </button>
                )}

                <div
                  className={`max-w-2xl ${showOnRight ? "items-end" : "items-start"} flex flex-col gap-1`}
                >
                  <div
                    className={`flex items-center gap-2 px-2 ${showOnRight ? "flex-row-reverse" : ""}`}
                  >
                    <span className="text-sm text-slate-400">{senderName}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${styles.badge} flex items-center gap-1`}
                    >
                      {role === "admin" && <span>⚖️</span>}
                      {role === "client"
                        ? "Client"
                        : role === "provider"
                          ? "Prestataire"
                          : role === "admin"
                            ? "Médiateur"
                            : role}
                    </span>
                  </div>

                  <div
                    className={`${styles.bg} ${styles.border} border rounded-2xl px-5 py-3 shadow-lg ${
                      isSenderAdmin
                        ? "shadow-amber-500/10 border-amber-500/40"
                        : ""
                    } ${showOnRight ? "rounded-tr-sm" : "rounded-tl-sm"} relative`}
                  >
                    {isSenderAdmin && (
                      <div className="text-[10px] font-bold text-amber-500/80 uppercase tracking-widest mb-1 pointer-events-none select-none">
                        Transmission Officielle
                      </div>
                    )}
                    {/* Reply Context */}
                    {repliedMessage && (
                      <div
                        className={`mb-2 p-2 rounded-lg text-sm border-l-4 border-slate-400/50 bg-black/20 cursor-pointer hover:bg-black/30 transition-colors`}
                        onClick={() => {
                          // Optional logic to scroll to message
                        }}
                      >
                        <p className="text-xs text-amber-500 font-semibold mb-1">
                          {repliedMessage.sender?.first_name || "Utilisateur"}
                        </p>
                        <p className="text-slate-300 line-clamp-1">
                          {getRepliedMessageContent(repliedMessage)}
                        </p>
                      </div>
                    )}

                    {message.message_type === "text" && (
                      <p
                        className={`${styles.text} ${styles.font} leading-relaxed whitespace-pre-wrap`}
                      >
                        {renderWithLinks(message.content)}
                      </p>
                    )}

                    {message.message_type === "image" && message.media_url && (
                      <div className="space-y-2">
                        <img
                          src={message.media_url}
                          alt={message.media_name}
                          className="rounded-lg max-w-md max-h-64 object-cover"
                        />
                        <p className={`${styles.text} text-sm`}>
                          {message.content}
                        </p>
                      </div>
                    )}

                    {message.message_type === "video" && message.media_url && (
                      <div className="space-y-2">
                        <video
                          controls
                          className="rounded-lg max-w-md max-h-64"
                        >
                          <source src={message.media_url} />
                          Votre navigateur ne supporte pas la lecture de vidéos.
                        </video>
                        <p className={`${styles.text} text-sm`}>
                          {message.content}
                        </p>
                      </div>
                    )}

                    {message.message_type === "document" &&
                      message.media_url && (
                        <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                          <FileText className="w-8 h-8" />
                          <div className="flex-1">
                            <p
                              className={`${styles.text} font-medium line-clamp-1`}
                            >
                              {message.media_name}
                            </p>
                            <p className="text-xs text-slate-400">Document</p>
                          </div>
                          <a
                            href={message.media_url}
                            target="_blank"
                            rel="noreferrer"
                            download
                          >
                            <Download className="w-5 h-5 cursor-pointer hover:text-amber-400" />
                          </a>
                        </div>
                      )}

                    {(message.message_type === "voice" ||
                      message.message_type === "audio") &&
                      message.media_url && (
                        <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg min-w-[200px]">
                          <button
                            onClick={() =>
                              toggleAudioPlay(message.media_url, message.id)
                            }
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${message.message_type === "audio" ? "bg-purple-600 hover:bg-purple-700" : "bg-amber-600 hover:bg-amber-700"}`}
                          >
                            {playingAudio === message.id ? (
                              <Pause className="w-5 h-5" />
                            ) : (
                              <Play className="w-5 h-5" />
                            )}
                          </button>
                          <div className="flex-1">
                            <div className="h-1 bg-slate-700 rounded-full overflow-hidden cursor-pointer">
                              <div
                                className={`h-full transition-all duration-100 ease-linear ${message.message_type === "audio" ? "bg-purple-500" : "bg-amber-500"}`}
                                style={{
                                  width:
                                    playingAudio === message.id
                                      ? `${playbackProgress}%`
                                      : "0%",
                                }}
                              ></div>
                            </div>
                            <p className="text-xs text-slate-400 mt-1 flex justify-between">
                              <span>
                                {playingAudio === message.id
                                  ? formatTime(playbackTime)
                                  : formatTime(message.media_duration || 0)}
                              </span>
                              {playingAudio === message.id && (
                                <span>
                                  {formatTime(
                                    currentAudioDuration > 0
                                      ? currentAudioDuration
                                      : message.media_duration || 0,
                                  )}
                                </span>
                              )}
                            </p>
                          </div>
                          {message.message_type === "audio" ? (
                            <Music className="w-5 h-5 text-purple-400" />
                          ) : (
                            <Volume2 className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                      )}
                  </div>

                  <span className="text-xs text-slate-500 px-2">
                    {formatMessageTime(message.created_at)}
                  </span>
                </div>

                {isCurrentUser && (
                  <button
                    onClick={() => handleReply(message)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-slate-500 hover:text-white self-center"
                    title="Répondre"
                  >
                    <Reply className="w-4 h-4 scale-x-[-1]" />
                  </button>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-slate-700/50 bg-slate-800/50 px-6 py-4">
        {/* Reply Preview Banner */}
        {replyingTo && (
          <div className="mb-2 flex items-center justify-between bg-slate-800/80 border-l-4 border-amber-500 rounded-r-lg p-3 animate-fade-in">
            <div className="flex-1">
              <p className="text-xs text-amber-500 font-semibold mb-1">
                Réponse à {replyingTo.sender?.first_name || "Utilisateur"}
              </p>
              <p className="text-sm text-slate-300 line-clamp-1">
                {getRepliedMessageContent(replyingTo)}
              </p>
            </div>
            <button
              onClick={cancelReply}
              className="p-2 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {isRecording && (
          <div className="mb-3 px-4 py-3 bg-red-900/30 border border-red-500/50 rounded-lg flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-red-300 font-medium">
                Enregistrement en cours...
              </span>
              <span className="text-red-400 font-mono">
                {formatTime(recordingTime)}
              </span>
            </div>
            <button
              onClick={stopRecording}
              className="text-red-400 hover:text-red-300"
            >
              <Check className="w-6 h-6" />
            </button>
          </div>
        )}

        <div className="flex items-end gap-3">
          {/* Media Menu */}
          <div className="relative">
            <button
              onClick={() =>
                !isPaused && !isMuted && setShowMediaMenu(!showMediaMenu)
              }
              disabled={isPaused || isMuted}
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                isPaused || isMuted
                  ? "bg-slate-700/30 text-slate-500 cursor-not-allowed"
                  : "bg-slate-700 hover:bg-slate-600 text-slate-300"
              }`}
            >
              <Paperclip className="w-5 h-5" />
            </button>

            {showMediaMenu && !isPaused && (
              <div className="absolute bottom-full mb-2 left-0 bg-slate-800 border border-slate-700 rounded-xl shadow-xl p-2 space-y-1 w-40 z-50">
                <button
                  onClick={() => handleFileUpload("image")}
                  className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-700 rounded-lg transition-colors text-white"
                >
                  <Image className="w-5 h-5 text-blue-400" />
                  <span className="text-sm">Image</span>
                </button>
                <button
                  onClick={() => handleFileUpload("video")}
                  className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-700 rounded-lg transition-colors text-white"
                >
                  <Video className="w-5 h-5 text-purple-400" />
                  <span className="text-sm">Vidéo</span>
                </button>
                <button
                  onClick={() => handleFileUpload("audio")}
                  className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-700 rounded-lg transition-colors text-white"
                >
                  <Music className="w-5 h-5 text-purple-400" />
                  <span className="text-sm">Audio</span>
                </button>
                <button
                  onClick={() => handleFileUpload("document")}
                  className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-700 rounded-lg transition-colors text-white"
                >
                  <FileText className="w-5 h-5 text-green-400" />
                  <span className="text-sm">Document</span>
                </button>
              </div>
            )}
          </div>

          {/* Text Input */}
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={isPaused || isMuted}
              placeholder={
                isPaused
                  ? "Discussion en pause..."
                  : isMuted
                    ? "Vous avez été rendu silencieux par le médiateur"
                    : "Écrivez votre message..."
              }
              className={`w-full px-5 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all ${
                isPaused || isMuted
                  ? "bg-slate-800/30 border-slate-700/50 text-slate-500 cursor-not-allowed"
                  : "bg-slate-800 border-slate-600 text-white focus:ring-amber-500/50"
              }`}
            />
          </div>

          {/* Voice Recording */}
          <button
            onClick={handleVoiceRecording}
            disabled={isPaused || isMuted}
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
              isPaused || isMuted
                ? "bg-slate-700/30 text-slate-500 cursor-not-allowed"
                : isRecording
                  ? "bg-red-600 hover:bg-red-700 shadow-red-900/50 shadow-lg"
                  : "bg-slate-700 hover:bg-slate-600 text-slate-300"
            }`}
          >
            <Mic className="w-5 h-5" />
          </button>

          {/* Send Button */}
          <button
            onClick={handleSendMessage}
            disabled={isPaused || isMuted || !inputMessage.trim()}
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
              isPaused || isMuted || !inputMessage.trim()
                ? "bg-slate-700/30 text-slate-500 cursor-not-allowed"
                : "bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 shadow-lg shadow-amber-900/50"
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Decision Modal */}
      {showDecisionModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-2xl max-w-2xl w-full p-8 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent">
                {resolutionStep === 3 ? "Confirmation" : "Décision finale"}
              </h2>
              {resolutionStep !== 3 && (
                <button
                  onClick={() => setShowDecisionModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              )}
            </div>

            {/* STEP 1: CHOICE */}
            {resolutionStep === 1 && (
              <>
                <p className="text-slate-300 mb-8 leading-relaxed">
                  Vous êtes sur le point de clore cette médiation. Cette action
                  est <strong>définitive</strong> et ne pourra pas être annulée.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleSelectResolution("agreement")}
                    className="group relative overflow-hidden px-8 py-6 bg-gradient-to-br from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-xl transition-all hover:scale-105 shadow-lg shadow-green-900/50"
                  >
                    <div className="relative flex flex-col items-center gap-3">
                      <CheckCircle className="w-12 h-12" />
                      <div>
                        <p className="font-bold text-lg">Accord trouvé</p>
                        <p className="text-sm text-green-100">
                          Nous avons trouvé une solution
                        </p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleSelectResolution("no_agreement")}
                    className="group relative overflow-hidden px-8 py-6 bg-gradient-to-br from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-xl transition-all hover:scale-105 shadow-lg shadow-red-900/50"
                  >
                    <div className="relative flex flex-col items-center gap-3">
                      <XCircle className="w-12 h-12" />
                      <div>
                        <p className="font-bold text-lg">Pas d'accord</p>
                        <p className="text-sm text-red-100">
                          Impossible de s'entendre
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              </>
            )}

            {/* STEP 2: DETAILS */}
            {resolutionStep === 2 && (
              <div className="space-y-6">
                {resolutionType === "agreement" ? (
                  <>
                    <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 flex items-center gap-3">
                      <CheckCircle className="text-green-500 w-6 h-6" />
                      <p className="text-green-200">
                        Félicitations pour avoir trouvé un terrain d'entente.
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Note de conclusion (Optionnel)
                      </label>
                      <textarea
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-green-500/50 outline-none h-32 resize-none"
                        placeholder="Décrivez brièvement les termes de l'accord..."
                        value={resolutionNote}
                        onChange={(e) => setResolutionNote(e.target.value)}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 flex items-center gap-3">
                      <AlertCircle className="text-red-500 w-6 h-6" />
                      <p className="text-red-200">
                        Nous sommes désolés qu'aucune solution n'ait été
                        trouvée.
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Quel est le problème principal ?
                      </label>
                      <textarea
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-red-500/50 outline-none h-32 resize-none"
                        placeholder="Expliquez pourquoi aucun accord n'a été possible..."
                        value={resolutionNote}
                        onChange={(e) => setResolutionNote(e.target.value)}
                      />
                    </div>
                    <div className="flex items-center gap-3 pt-2">
                      <input
                        type="checkbox"
                        id="refund"
                        checked={wantsRefund}
                        onChange={(e) => setWantsRefund(e.target.checked)}
                        className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-amber-600 focus:ring-amber-500"
                      />
                      <label
                        htmlFor="refund"
                        className="text-slate-300 cursor-pointer select-none"
                      >
                        Je souhaite demander un remboursement intégral
                      </label>
                    </div>
                  </>
                )}

                <div className="flex items-center gap-4 pt-4">
                  <button
                    onClick={() => setResolutionStep(1)}
                    className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                  >
                    Retour
                  </button>
                  <button
                    onClick={handleSubmitResolution}
                    disabled={isSubmitting}
                    className={`flex-1 py-3 rounded-xl font-bold text-white shadow-lg transition-all transform hover:scale-[1.02] ${
                      resolutionType === "agreement"
                        ? "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-green-900/50"
                        : "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-red-900/50"
                    }`}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />{" "}
                        Traitement...
                      </span>
                    ) : (
                      "Confirmer la clôture"
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: SUCCESS */}
            {resolutionStep === 3 && (
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-amber-700 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-amber-900/50">
                  <Check className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  La dispute est close
                </h3>

                {resolutionType === "agreement" ? (
                  <p className="text-slate-300 mb-8 max-w-md mx-auto">
                    Merci d'avoir utilisé notre plateforme de médiation.
                    L'accord a été enregistré avec succès.
                  </p>
                ) : (
                  <p className="text-slate-300 mb-8 max-w-md mx-auto">
                    Votre demande a été prise en compte.
                    {wantsRefund && (
                      <span className="block mt-2 text-amber-400 font-medium">
                        Un agent vous contactera sous peu concernant votre
                        demande de remboursement.
                      </span>
                    )}
                  </p>
                )}

                <button
                  onClick={handleCloseAndRedirect}
                  className="px-8 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl font-semibold transition-colors w-full sm:w-auto"
                >
                  Quitter la salle
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
