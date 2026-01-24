import React, { useState, useRef, useEffect } from "react";
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
} from "lucide-react";

type UserRole = "client" | "provider" | "admin";

interface Message {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  content: string;
  type: "text" | "image" | "video" | "document" | "audio" | "voice";
  fileUrl?: string;
  fileName?: string;
  timestamp: Date;
  duration?: number;
}

interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;
  online: boolean;
}

const MediationRoom = () => {
  const [currentUser, setCurrentUser] = useState<User>({
    id: "1",
    name: "Marie Dupont",
    role: "client",
    avatar: "👩‍💼",
    online: true,
  });

  const [users] = useState<User[]>([
    {
      id: "1",
      name: "Marie Dupont",
      role: "client",
      avatar: "👩‍💼",
      online: true,
    },
    {
      id: "2",
      name: "Jean Martin",
      role: "provider",
      avatar: "👨‍💻",
      online: true,
    },
    {
      id: "3",
      name: "Admin Système",
      role: "admin",
      avatar: "⚖️",
      online: true,
    },
  ]);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      userId: "3",
      userName: "Admin Système",
      userRole: "admin",
      content:
        "Bienvenue dans cette salle de médiation. Je suis là pour faciliter la discussion entre vous deux. Merci de rester courtois et professionnel.",
      type: "text",
      timestamp: new Date(Date.now() - 3600000),
    },
    {
      id: "2",
      userId: "1",
      userName: "Marie Dupont",
      userRole: "client",
      content:
        "Bonjour, je ne suis pas satisfaite du service livré. Le projet ne correspond pas à ce qui était convenu initialement.",
      type: "text",
      timestamp: new Date(Date.now() - 3000000),
    },
    {
      id: "3",
      userId: "2",
      userName: "Jean Martin",
      userRole: "provider",
      content:
        "Bonjour Marie, je comprends votre préoccupation. Pouvez-vous préciser les points qui ne correspondent pas ?",
      type: "text",
      timestamp: new Date(Date.now() - 2400000),
    },
  ]);

  const [inputMessage, setInputMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [showMediaMenu, setShowMediaMenu] = useState(false);
  const [showAdminPause, setShowAdminPause] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isRecording) {
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      setRecordingTime(0);
    }
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, [isRecording]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const getRoleStyles = (role: UserRole) => {
    switch (role) {
      case "client":
        return {
          bg: "bg-gradient-to-br from-blue-900/40 to-blue-800/30",
          border: "border-blue-500/50",
          text: "text-blue-100",
          badge: "bg-blue-600/80",
          font: "font-serif",
        };
      case "provider":
        return {
          bg: "bg-gradient-to-br from-emerald-900/40 to-emerald-800/30",
          border: "border-emerald-500/50",
          text: "text-emerald-100",
          badge: "bg-emerald-600/80",
          font: "font-sans",
        };
      case "admin":
        return {
          bg: "bg-gradient-to-br from-amber-900/40 to-amber-800/30",
          border: "border-amber-500/50",
          text: "text-amber-100",
          badge: "bg-amber-600/80",
          font: "font-mono",
        };
    }
  };

  const handleSendMessage = () => {
    if (inputMessage.trim() === "" || isPaused) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      content: inputMessage,
      type: "text",
      timestamp: new Date(),
    };

    setMessages([...messages, newMessage]);
    setInputMessage("");
  };

  const handleFileUpload = (type: "image" | "video" | "document") => {
    if (isPaused) return;

    const fileTypes = {
      image: "image/*",
      video: "video/*",
      document: ".pdf,.doc,.docx,.txt",
    };

    const input = document.createElement("input");
    input.type = "file";
    input.accept = fileTypes[type];
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const newMessage: Message = {
          id: Date.now().toString(),
          userId: currentUser.id,
          userName: currentUser.name,
          userRole: currentUser.role,
          content: `${type === "image" ? "📷" : type === "video" ? "🎥" : "📄"} ${file.name}`,
          type: type,
          fileName: file.name,
          fileUrl: URL.createObjectURL(file),
          timestamp: new Date(),
        };
        setMessages([...messages, newMessage]);
      }
    };
    input.click();
    setShowMediaMenu(false);
  };

  const handleVoiceRecording = () => {
    if (isPaused) return;

    if (!isRecording) {
      setIsRecording(true);
    } else {
      setIsRecording(false);
      const newMessage: Message = {
        id: Date.now().toString(),
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        content: "🎤 Message vocal",
        type: "voice",
        duration: recordingTime,
        timestamp: new Date(),
      };
      setMessages([...messages, newMessage]);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleDecision = (agreed: boolean) => {
    const decisionMessage: Message = {
      id: Date.now().toString(),
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      content: agreed
        ? "✅ J'accepte cet accord. Tout est réglé !"
        : "❌ Je refuse et demande l'annulation avec remboursement.",
      type: "text",
      timestamp: new Date(),
    };
    setMessages([...messages, decisionMessage]);
    setShowDecisionModal(false);
  };

  const toggleAdminPause = () => {
    setIsPaused(!isPaused);
    const pauseMessage: Message = {
      id: Date.now().toString(),
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      content: !isPaused
        ? "⏸️ Discussion mise en pause par l'administrateur"
        : "▶️ Discussion reprise par l'administrateur",
      type: "text",
      timestamp: new Date(),
    };
    setMessages([...messages, pauseMessage]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
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
                <p className="text-sm text-slate-400">
                  Session active - Résolution de conflit
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              {/* Participants */}
              <div className="flex items-center gap-3">
                {users.map((user) => (
                  <div key={user.id} className="relative group">
                    <div
                      className={`w-10 h-10 rounded-full ${getRoleStyles(user.role).bg} border-2 ${getRoleStyles(user.role).border} flex items-center justify-center cursor-pointer transition-transform hover:scale-110`}
                    >
                      <span className="text-lg">{user.avatar}</span>
                    </div>
                    {user.online && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900"></div>
                    )}
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-slate-800 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      {user.name}
                      <div
                        className={`text-xs ${getRoleStyles(user.role).badge} px-2 py-0.5 rounded mt-1`}
                      >
                        {user.role === "client"
                          ? "Client"
                          : user.role === "provider"
                            ? "Prestataire"
                            : "Médiateur"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Admin Controls */}
              {currentUser.role === "admin" && (
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
              {currentUser.role === "client" && (
                <button
                  onClick={() => setShowDecisionModal(true)}
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
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden">
          {/* Messages Area */}
          <div className="h-[calc(100vh-300px)] overflow-y-auto px-6 py-6 space-y-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
            {messages.map((message) => {
              const styles = getRoleStyles(message.userRole);
              const isCurrentUser = message.userId === currentUser.id;

              return (
                <div
                  key={message.id}
                  className={`flex ${isCurrentUser ? "justify-end" : "justify-start"} animate-fade-in`}
                >
                  <div
                    className={`max-w-2xl ${isCurrentUser ? "items-end" : "items-start"} flex flex-col gap-1`}
                  >
                    <div className="flex items-center gap-2 px-2">
                      {!isCurrentUser && (
                        <span className="text-xl">
                          {users.find((u) => u.id === message.userId)?.avatar}
                        </span>
                      )}
                      <span className="text-sm text-slate-400">
                        {message.userName}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${styles.badge}`}
                      >
                        {message.userRole === "client"
                          ? "Client"
                          : message.userRole === "provider"
                            ? "Prestataire"
                            : "Médiateur"}
                      </span>
                    </div>

                    <div
                      className={`${styles.bg} ${styles.border} border rounded-2xl px-5 py-3 shadow-lg ${isCurrentUser ? "rounded-tr-sm" : "rounded-tl-sm"}`}
                    >
                      {message.type === "text" && (
                        <p
                          className={`${styles.text} ${styles.font} leading-relaxed`}
                        >
                          {message.content}
                        </p>
                      )}

                      {message.type === "image" && (
                        <div className="space-y-2">
                          <img
                            src={message.fileUrl}
                            alt={message.fileName}
                            className="rounded-lg max-w-md"
                          />
                          <p className={`${styles.text} text-sm`}>
                            {message.content}
                          </p>
                        </div>
                      )}

                      {message.type === "video" && (
                        <div className="space-y-2">
                          <video controls className="rounded-lg max-w-md">
                            <source src={message.fileUrl} />
                          </video>
                          <p className={`${styles.text} text-sm`}>
                            {message.content}
                          </p>
                        </div>
                      )}

                      {message.type === "document" && (
                        <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                          <FileText className="w-8 h-8" />
                          <div className="flex-1">
                            <p className={`${styles.text} font-medium`}>
                              {message.fileName}
                            </p>
                            <p className="text-xs text-slate-400">Document</p>
                          </div>
                          <Download className="w-5 h-5 cursor-pointer hover:text-amber-400" />
                        </div>
                      )}

                      {message.type === "voice" && (
                        <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg min-w-[200px]">
                          <button className="w-10 h-10 bg-amber-600 rounded-full flex items-center justify-center hover:bg-amber-700">
                            {playingAudio === message.id ? (
                              <Pause className="w-5 h-5" />
                            ) : (
                              <Play className="w-5 h-5" />
                            )}
                          </button>
                          <div className="flex-1">
                            <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                              <div className="h-full bg-amber-500 w-1/3"></div>
                            </div>
                            <p className="text-xs text-slate-400 mt-1">
                              {formatTime(message.duration || 0)}
                            </p>
                          </div>
                          <Volume2 className="w-5 h-5 text-slate-400" />
                        </div>
                      )}
                    </div>

                    <span className="text-xs text-slate-500 px-2">
                      {message.timestamp.toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-slate-700/50 bg-slate-800/50 px-6 py-4">
            {isRecording && (
              <div className="mb-3 px-4 py-3 bg-red-900/30 border border-red-500/50 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-red-300 font-medium">
                    Enregistrement en cours...
                  </span>
                  <span className="text-red-400 font-mono">
                    {formatTime(recordingTime)}
                  </span>
                </div>
                <button
                  onClick={handleVoiceRecording}
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
                  onClick={() => !isPaused && setShowMediaMenu(!showMediaMenu)}
                  disabled={isPaused}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                    isPaused
                      ? "bg-slate-700/30 text-slate-500 cursor-not-allowed"
                      : "bg-slate-700 hover:bg-slate-600 text-slate-300"
                  }`}
                >
                  <Paperclip className="w-5 h-5" />
                </button>

                {showMediaMenu && !isPaused && (
                  <div className="absolute bottom-full mb-2 left-0 bg-slate-800 border border-slate-700 rounded-xl shadow-xl p-2 space-y-1">
                    <button
                      onClick={() => handleFileUpload("image")}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <Image className="w-5 h-5 text-blue-400" />
                      <span className="text-sm">Image</span>
                    </button>
                    <button
                      onClick={() => handleFileUpload("video")}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <Video className="w-5 h-5 text-purple-400" />
                      <span className="text-sm">Vidéo</span>
                    </button>
                    <button
                      onClick={() => handleFileUpload("document")}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-700 rounded-lg transition-colors"
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
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  disabled={isPaused}
                  placeholder={
                    isPaused
                      ? "Discussion en pause..."
                      : "Écrivez votre message..."
                  }
                  className={`w-full px-5 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all ${
                    isPaused
                      ? "bg-slate-800/30 border-slate-700/50 text-slate-500 cursor-not-allowed"
                      : "bg-slate-800 border-slate-600 text-white focus:ring-amber-500/50"
                  }`}
                />
              </div>

              {/* Voice Recording */}
              <button
                onClick={handleVoiceRecording}
                disabled={isPaused}
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                  isPaused
                    ? "bg-slate-700/30 text-slate-500 cursor-not-allowed"
                    : isRecording
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-slate-700 hover:bg-slate-600 text-slate-300"
                }`}
              >
                <Mic className="w-5 h-5" />
              </button>

              {/* Send Button */}
              <button
                onClick={handleSendMessage}
                disabled={isPaused || !inputMessage.trim()}
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                  isPaused || !inputMessage.trim()
                    ? "bg-slate-700/30 text-slate-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 shadow-lg shadow-amber-900/50"
                }`}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Decision Modal */}
      {showDecisionModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-2xl max-w-2xl w-full p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent">
                Décision finale
              </h2>
              <button
                onClick={() => setShowDecisionModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <p className="text-slate-300 mb-8 leading-relaxed">
              Vous êtes sur le point de prendre une décision concernant cette
              médiation. Cette action sera enregistrée et notifiera tous les
              participants.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleDecision(true)}
                className="group relative overflow-hidden px-8 py-6 bg-gradient-to-br from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-xl transition-all hover:scale-105 shadow-lg shadow-green-900/50"
              >
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                <div className="relative flex flex-col items-center gap-3">
                  <CheckCircle className="w-12 h-12" />
                  <div>
                    <p className="font-bold text-lg">Accord trouvé</p>
                    <p className="text-sm text-green-100">Tout est réglé</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleDecision(false)}
                className="group relative overflow-hidden px-8 py-6 bg-gradient-to-br from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-xl transition-all hover:scale-105 shadow-lg shadow-red-900/50"
              >
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                <div className="relative flex flex-col items-center gap-3">
                  <XCircle className="w-12 h-12" />
                  <div>
                    <p className="font-bold text-lg">Refuser</p>
                    <p className="text-sm text-red-100">
                      Annuler et rembourser
                    </p>
                  </div>
                </div>
              </button>
            </div>
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
};

export default MediationRoom;
