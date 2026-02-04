"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Search, 
  X, 
  User, 
  Loader2, 
  MessageSquarePlus, 
  Users, 
  Building,
  Star,
  MapPin,
  Mail,
  RefreshCw,
  CheckCircle2
} from "lucide-react";
import type { Profile } from "@/types/auth";
import { useSafeLanguage } from "@/hooks/useSafeLanguage";

interface NewConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUser: (user: Profile) => void;
  isDark?: boolean;
}

export function NewConversationModal({
  isOpen,
  onClose,
  onSelectUser,
  isDark = false,
}: NewConversationModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"clients" | "providers" | "system">("clients");
  const [clients, setClients] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [systemUsers, setSystemUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useSafeLanguage();

  const loadUsers = useCallback(async (search: string = "") => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === "clients") {
        const params = new URLSearchParams({
          isAdmin: "true",
          ...(search && { search }),
          sort_by: "newest",
        });
        const response = await fetch(`/api/admin/clients?${params}`);
        const data = await response.json();
        if (data.success) {
          // Filtrer pour ne garder que les vrais clients (éviter les users système qui apparaissent parfois ici selon l'API)
          const onlyClients = (data.data.clients || []).filter((c: any) => c.role === 'client' || !c.role);
          setClients(onlyClients);
        }
      } else if (activeTab === "providers") {
        const params = new URLSearchParams({
          isAdmin: "true",
          ...(search && { search }),
          sort_by: "newest",
        });
        const response = await fetch(`/api/admin/providers?${params}`);
        const data = await response.json();
        if (data.success) {
          setProviders(data.data.providers || []);
        }
      } else if (activeTab === "system") {
        const response = await fetch(`/api/admin/system-users`);
        const data = await response.json();
        if (data.success) {
          let users = data.users || [];
          if (search) {
            const lowSearch = search.toLowerCase();
            users = users.filter((u: any) => 
               u.display_name?.toLowerCase().includes(lowSearch) || 
               u.email?.toLowerCase().includes(lowSearch) ||
               u.first_name?.toLowerCase().includes(lowSearch) ||
               u.last_name?.toLowerCase().includes(lowSearch)
            );
          }
          setSystemUsers(users);
        }
      }
    } catch (err) {
      console.error("Error loading users:", err);
      setError("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        loadUsers(searchQuery);
      }, searchQuery ? 300 : 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen, activeTab, searchQuery, loadUsers]);

  if (!isOpen) return null;

  const results = activeTab === "clients" ? clients : activeTab === "providers" ? providers : systemUsers;

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300`}>
      <div 
        className={`${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-white/20'} w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[650px] animate-in zoom-in-95 duration-300 border`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Section */}
        <div className="bg-slate-900 text-white p-6 relative overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl -mr-16 -mt-16 animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/20 rounded-full blur-3xl -ml-12 -mb-12"></div>
          
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-inner group">
                <MessageSquarePlus className="w-6 h-6 text-indigo-300 group-hover:scale-110 transition-transform" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Nouvelle Conversation</h2>
                <p className="text-white/60 text-sm">Démarrer une discussion avec un membre</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-xl transition-all text-white/80 hover:text-white border border-white/10 hover:border-white/20"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className={`px-6 py-4 ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-100'} border-b flex items-center justify-between`}>
          <div className={`flex p-1 ${isDark ? 'bg-slate-800' : 'bg-slate-200/50'} rounded-2xl w-fit`}>
            <button
              onClick={() => setActiveTab("clients")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all duration-200 ${
                activeTab === "clients"
                  ? isDark ? "bg-slate-700 text-indigo-400 shadow-sm" : "bg-white text-indigo-600 shadow-sm"
                  : isDark ? "text-slate-500 hover:text-slate-400" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Users className="w-4 h-4" />
              Clients
            </button>
            <button
              onClick={() => setActiveTab("providers")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all duration-200 ${
                activeTab === "providers"
                  ? isDark ? "bg-slate-700 text-indigo-400 shadow-sm" : "bg-white text-indigo-600 shadow-sm"
                  : isDark ? "text-slate-500 hover:text-slate-400" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Building className="w-4 h-4" />
              Prestataires
            </button>
            <button
              onClick={() => setActiveTab("system")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all duration-200 ${
                activeTab === "system"
                  ? isDark ? "bg-slate-700 text-indigo-400 shadow-sm" : "bg-white text-indigo-600 shadow-sm"
                  : isDark ? "text-slate-500 hover:text-slate-400" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              Système
            </button>
          </div>
          
          <div className={`${isDark ? 'bg-slate-800 text-slate-500 border-slate-700' : 'bg-slate-100 text-slate-400 border-slate-200 shadow-sm'} text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border`}>
            {results.length} Membres
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-6 py-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input
              autoFocus
              type="text"
              placeholder={`Rechercher un ${activeTab === 'clients' ? 'client' : activeTab === 'providers' ? 'prestataire' : 'utilisateur système'}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-12 pr-12 py-4 ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-indigo-500/50' : 'bg-slate-50 border-slate-100 text-slate-900 placeholder-slate-400 focus:border-indigo-500/50'} border-2 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium`}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center bg-slate-200 hover:bg-slate-300 text-slate-500 rounded-full transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 custom-scrollbar">
          {loading && results.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center py-20 animate-pulse">
              <div className={`w-20 h-20 ${isDark ? 'bg-indigo-500/10' : 'bg-indigo-50'} rounded-full flex items-center justify-center mb-6`}>
                <Loader2 className={`w-10 h-10 animate-spin ${isDark ? 'text-indigo-400' : 'text-indigo-500'}`} />
              </div>
              <p className={`${isDark ? 'text-slate-300' : 'text-slate-500'} font-bold tracking-tight text-lg`}>Génération de la liste...</p>
              <p className="text-slate-400 text-sm mt-1">Nous optimisons votre sélection</p>
            </div>
          ) : results.length > 0 ? (
            <div className="grid grid-cols-1 gap-3">
              {results.map((item) => {
                // Determine the profile and correct ID
                // For clients, item is the profile
                // For providers, item has the provider details but we need the profile
                const isProvider = activeTab === "providers";
                const isSystem = activeTab === "system";
                const profile = isProvider ? item.profile : item;
                
                if (!profile) return null;

                // Ensure we have a profile-like object with the right ID
                const user = {
                  ...profile,
                  // For providers, override top-level from flattened API info if needed
                  display_name: item.display_name || profile.display_name,
                  avatar_url: item.avatar_url || profile.avatar_url,
                  email: item.email || profile.email,
                  role: isSystem 
                    ? (typeof item.role === 'object' ? item.role?.slug : item.role)
                    : (item.role || profile.role || (isProvider ? 'provider' : 'client')),
                };

                const displayRole = isSystem 
                  ? (typeof item.role === 'object' ? item.role?.name : item.role)
                  : (user.role || (isProvider ? 'provider' : 'client'));

                const displayName = user.display_name || [user.first_name, user.last_name].filter(Boolean).join(" ") || user.email || "Membre";
                const avatarUrl = user.avatar_url;
                const email = user.email;
                const isVerified = user.email_verified || user.is_verified || item.is_verified;
                const rating = isProvider ? (item.rating || 0) : 0;
                const location = user.location || item.location;

                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectUser(user)}
                    className={`group ${isDark ? 'bg-slate-800/40 border-slate-800' : 'bg-white border-slate-50 shadow-indigo-500/5'} p-4 flex items-center gap-4 rounded-2xl border-2 hover:border-indigo-500/20 hover:bg-indigo-50/10 hover:shadow-xl transition-all duration-300 relative overflow-hidden`}
                  >
                    {/* Background decoration on hover */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity -mr-16 -mt-16"></div>

                    {/* Avatar Container */}
                    <div className="relative flex-shrink-0">
                      {avatarUrl ? (
                        <img 
                          src={avatarUrl} 
                          alt={displayName} 
                          className="w-16 h-16 rounded-2xl object-cover ring-4 ring-white shadow-lg group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform duration-300">
                          <User className="w-8 h-8 opacity-80" />
                        </div>
                      )}
                      {isVerified && (
                        <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-lg shadow-md">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-50" />
                        </div>
                      )}
                    </div>

                    {/* Info Container */}
                    <div className="flex-1 text-left min-w-0 pr-4">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-extrabold ${isDark ? 'text-white' : 'text-slate-900'} group-hover:text-indigo-600 transition-colors truncate`}>
                          {displayName}
                        </h3>
                        {activeTab === "providers" && rating > 0 && (
                          <div className="flex items-center gap-1 bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full text-[10px] font-black shadow-sm">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            {rating.toFixed(1)}
                          </div>
                        )}
                        {activeTab === "system" && (
                          <div className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${isDark ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-purple-50 text-purple-600 border border-purple-100'}`}>
                            {displayRole || 'Admin'}
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                          <Mail className="w-3 h-3 opacity-60" />
                          <span className="truncate italic font-medium">{email}</span>
                        </div>
                        {location && (
                          <div className="flex items-center gap-1.5 text-slate-400 text-[10px]">
                            <MapPin className="w-3 h-3 opacity-60" />
                            <span className="truncate">{location}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Hint */}
                    <div className="opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 hidden sm:block">
                      <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl shadow-lg flex items-center justify-center">
                        <RefreshCw className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center py-20 text-center">
              <div className={`w-20 h-20 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'} rounded-full flex items-center justify-center mb-6 text-slate-300 border-2 border-dashed`}>
                <Search className="w-10 h-10" />
              </div>
              <p className={`${isDark ? 'text-white' : 'text-slate-900'} font-bold text-lg mb-1`}>Aucun résultat trouvé</p>
              <p className="text-slate-500 text-sm max-w-xs mx-auto">
                {searchQuery 
                  ? `Nous n'avons trouvé aucun ${activeTab === 'clients' ? 'client' : 'prestataire'} correspondant à "${searchQuery}".`
                  : `Commencez à saisir un nom ou une adresse email.`
                }
              </p>
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="mt-6 text-indigo-600 font-bold text-sm hover:underline"
                >
                  Effacer la recherche
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className={`px-6 py-4 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-100'} border-t flex items-center justify-center`}>
          <p className="text-[10px] text-slate-400 flex items-center gap-2">
            <RefreshCw className="w-3 h-3" />
            Les données sont actualisées en temps réel via l'API Admin
          </p>
        </div>
      </div>

      {/* Backdrop Close */}
      <div 
        className="absolute inset-0 -z-10 cursor-alias" 
        onClick={onClose}
      />

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f8fafc;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
}
