"use client";

import React, { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import {
  Loader2,
  ExternalLink,
  Gavel,
  Ban,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  DollarSign,
  User,
  Shield,
  Clock,
  Send,
  X,
  MessageSquare,
  RefreshCw,
  RotateCcw,
  Maximize2,
  Minimize2
} from "lucide-react";
import MediationChatRoom from "@/components/dispute/MediationChatRoom";
import { useAuth } from "@/contexts/AuthContext";
import AdminOrderDetail from "./AdminOrderDetail";

interface DisputeDetailModalProps {
  dispute: any;
  onClose: () => void;
  isDark: boolean;
  onUpdate: () => void;
}

export default function DisputeDetailModal({
  dispute,
  onClose,
  isDark,
  onUpdate,
}: DisputeDetailModalProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"details" | "chat" | "resolution">("details");
  const [resolutionNote, setResolutionNote] = useState("");
  const [processing, setProcessing] = useState(false);
  const [order, setOrder] = useState<any>(dispute.order);
  const [loading, setLoading] = useState(false);
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Supabase client
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Charger les détails frais de la commande
  useEffect(() => {
    if (dispute.order_id) {
        // Optionnel: charger order fresh si besoin
    }
  }, [dispute]);

  const handleReopen = async () => {
    let newDetails = dispute.details;
    const isMeeting = dispute.details?.includes("[DEMANDE DE RÉUNION]");
    
    if (isMeeting) {
        const newDate = prompt("⚠️ Litige Réunion : Veuillez saisir une NOUVELLE date/heure pour réouvrir (Format: YYYY-MM-DD HH:MM)", "");
        if (!newDate) return;
        
        const baseComplaint = (dispute.details || "").split(/\[DEMANDE DE RÉUNION\]/)[0].trim();
        newDetails = `${baseComplaint}\n\n[DEMANDE DE RÉUNION]: ${newDate}`;
    } else {
        if (!confirm("Voulez-vous vraiment réouvrir ce litige ?")) return;
    }

    setProcessing(true);
    try {
        const res = await fetch('/api/orders/reopen-dispute', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ 
                order_id: dispute.order_id,
                details: newDetails
            })
        });
        
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || "Erreur réouverture");
        }
        
        alert("✅ Litige réouvert avec succès !");
        onUpdate();
        onClose();
    } catch (e: any) {
        alert(e.message);
    } finally {
        setProcessing(false);
    }
  };

  const handleStartAnalysis = async () => {
    if (!confirm("Voulez-vous lancer une session de médiation pour ce litige ? Les deux parties seront invitées à rejoindre.")) {
      return;
    }
    
    setProcessing(true);
    try {
        // Appeler l'API pour démarrer la médiation
        const response = await fetch('/api/mediation/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                disputeId: dispute.id,
                orderId: dispute.order_id 
            })
        });
        
        const data = await response.json();
        
        if (!response.ok || !data.success) {
            throw new Error(data.error || "Erreur lors du démarrage de la médiation");
        }
        
        alert("✅ Session de médiation lancée ! Les parties ont été notifiées.");
        onUpdate();
        onClose();
    } catch (e: any) {
        console.error(e);
        alert(`Erreur: ${e.message}`);
    } finally {
        setProcessing(false);
    }
  };

  const handleResolve = async (action: 'refund_client' | 'release_provider' | 'dismiss' | 'cancel_dispute' | 'change_meeting_date') => {
      if (!resolutionNote && !['cancel_dispute', 'change_meeting_date', 'dismiss'].includes(action)) {
          alert("Veuillez ajouter une note de résolution expliquant votre décision.");
          return;
      }
      
      if (action !== 'change_meeting_date' && !confirm("Êtes-vous sûr de vouloir appliquer cette décision ? Cette action est irréversible.")) return;

      setProcessing(true);
      try {
          if (action === 'cancel_dispute') {
              const res = await fetch('/api/orders/cancel-dispute', {
                  method: 'POST',
                  headers: {'Content-Type': 'application/json'},
                  body: JSON.stringify({
                      order_id: dispute.order_id,
                      resolutionNote: resolutionNote || "Annulé par l'admin"
                  })
              });
              if (!res.ok) {
                  const errJson = await res.json();
                  throw new Error(errJson.error || "Erreur annulation");
              }
          } else if (action === 'change_meeting_date') {
              const newDate = prompt("Entrez la nouvelle date/heure (Format: YYYY-MM-DD HH:MM)", "");
              if (!newDate) {
                  setProcessing(false);
                  return;
              }

              const currentDetails = dispute.details || "";
              const baseComplaint = currentDetails.split(/\[DEMANDE DE RÉUNION\]/)[0].trim();
              const updatedDetails = `${baseComplaint}\n\n[DEMANDE DE RÉUNION]: ${newDate}`;

              const res = await fetch('/api/admin/disputes/update', {
                  method: 'POST',
                  headers: {'Content-Type': 'application/json'},
                  body: JSON.stringify({ 
                      disputeId: dispute.id,
                      details: updatedDetails
                  })
              });

              if (!res.ok) throw new Error("Erreur mise à jour date");
              dispute.details = updatedDetails;
              alert("✅ Date de réunion mise à jour !");
          } else {
             const disputeRes = await fetch('/api/admin/disputes/update', {
                 method: 'POST',
                 headers: {'Content-Type': 'application/json'},
                 body: JSON.stringify({ 
                     disputeId: dispute.id,
                     status: 'resolved', 
                     resolutionNote: resolutionNote || (action === 'dismiss' ? "Réunion confirmée" : "Litige clos par l'administrateur"),
                     resolutionType: action
                 })
             });

             if (!disputeRes.ok) throw new Error("Erreur mise à jour litige");

             let finalStatus = 'completed';
             if (action === 'refund_client') finalStatus = 'refunded';
             
             const orderRes = await fetch('/api/admin/orders/update-status', {
                 method: 'POST',
                 headers: {'Content-Type': 'application/json'},
                 body: JSON.stringify({ 
                     orderId: dispute.order_id, 
                     status: finalStatus,
                     resolutionNote: resolutionNote || "Résolution du litige"
                 })
             });

             if (!orderRes.ok) throw new Error("Erreur mise à jour statut commande");

             if (action === 'refund_client') {
                 alert("✅ Remboursement validé. La commande est maintenant 'Remboursée'.");
             } else {
                 alert("✅ Fonds libérés. La commande est maintenant 'Terminée'.");
             }
          }

          onUpdate();
          if (action !== 'change_meeting_date') onClose();
      } catch (e: any) {
          console.error(e);
          alert("Erreur: " + e.message);
      } finally {
          setProcessing(false);
      }
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in ${isFullScreen ? 'p-0' : 'p-4'}`}>
      <div 
        className={`flex flex-col shadow-2xl overflow-hidden transition-all duration-300 relative ${
            isFullScreen 
            ? "w-full h-full rounded-none border-none" 
            : "w-full max-w-5xl h-[85vh] rounded-3xl"
        } ${isDark ? "bg-gray-900 border border-gray-700" : "bg-white"}`}
      >
        
        {/* Header - Hidden in Full Screen when Chat is active */}
        {(!isFullScreen || activeTab !== "chat") && (
          <div className={`p-6 border-b flex justify-between items-center ${isDark ? "border-gray-800 bg-gray-900" : "border-gray-100 bg-white"}`}>
               <div className="flex items-center gap-4">
                   <div className="p-3 bg-purple-100 rounded-xl">
                       <Gavel className="w-6 h-6 text-purple-600" />
                   </div>
                   <div>
                       <h2 className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                          Litige #{dispute.id.slice(0, 8)}
                       </h2>
                       <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                          Commande #{dispute.order_id.slice(0, 8)} • Ouvert le {new Date(dispute.created_at).toLocaleDateString()}
                       </p>
                   </div>
               </div>
               
               <div className="flex items-center gap-3">
                   <div className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 ${
                       dispute.status === 'open' ? 'bg-red-100 text-red-700' :
                       dispute.status === 'under_analysis' ? 'bg-purple-100 text-purple-700' :
                       dispute.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                   }`}>
                       {dispute.status === 'open' ? <AlertTriangle className="w-4 h-4"/> : 
                        dispute.status === 'resolved' ? <CheckCircle className="w-4 h-4"/> : <Clock className="w-4 h-4"/>}
                       {dispute.status === 'open' ? 'Ouvert' :
                        dispute.status === 'under_analysis' ? 'En Analyse' :
                        dispute.status === 'resolved' ? 'Résolu' : 'Annulé'}
                   </div>

                   <button 
                      onClick={() => setIsFullScreen(!isFullScreen)} 
                      className={`p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors`}
                      title={isFullScreen ? "Réduire" : "Plein écran"}
                   >
                       {isFullScreen ? (
                           <Minimize2 className={`w-6 h-6 ${isDark ? "text-gray-400" : "text-gray-600"}`} />
                       ) : (
                           <Maximize2 className={`w-6 h-6 ${isDark ? "text-gray-400" : "text-gray-600"}`} />
                       )}
                   </button>

                   <button onClick={onClose} className={`p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors`}>
                       <X className={`w-6 h-6 ${isDark ? "text-gray-400" : "text-gray-600"}`} />
                   </button>
               </div>
          </div>
        )}

        {/* Floating Toggle Button for Full Screen Chat */}
        {isFullScreen && activeTab === "chat" && (
          <div className="absolute top-4 right-4 z-[60] flex gap-2">
            <button 
                onClick={() => setIsFullScreen(false)} 
                className="p-3 bg-black/50 hover:bg-black/70 backdrop-blur-md rounded-full text-white shadow-xl transition-all hover:scale-110"
                title="Quitter le plein écran"
            >
                <Minimize2 className="w-6 h-6" />
            </button>
            <button 
                onClick={onClose} 
                className="p-3 bg-red-600/80 hover:bg-red-600 backdrop-blur-md rounded-full text-white shadow-xl transition-all hover:scale-110"
                title="Fermer"
            >
                <X className="w-6 h-6" />
            </button>
          </div>
        )}

        {/* Tabs & Content */}
        <div className="flex flex-1 overflow-hidden relative">
            {/* Sidebar Navigation - Hidden in Full Screen when Chat is active */}
            {(!isFullScreen || activeTab !== "chat") && (
              <div className={`w-64 flex-shrink-0 border-r p-4 space-y-2 ${isDark ? "border-gray-800 bg-gray-900" : "border-gray-100 bg-gray-50"}`}>
                  <button 
                      onClick={() => setActiveTab('details')}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-left ${activeTab === 'details' ? 'bg-purple-600 text-white shadow-lg' : isDark ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-white hover:shadow-sm'}`}
                  >
                      <FileText className="w-5 h-5" />
                      Détails
                  </button>
                  
                  {/* Conversations et Résolution uniquement si ouvert */}
                  {(dispute.status === 'open' || dispute.status === 'under_analysis') && (
                      <>
                          <button 
                              onClick={() => setActiveTab('chat')}
                              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-left ${activeTab === 'chat' ? 'bg-purple-600 text-white shadow-lg' : isDark ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-white hover:shadow-sm'}`}
                          >
                              <MessageSquare className="w-5 h-5" />
                              Conversation
                          </button>
                          <button 
                              onClick={() => setActiveTab('resolution')}
                              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-left ${activeTab === 'resolution' ? 'bg-purple-600 text-white shadow-lg' : isDark ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-white hover:shadow-sm'}`}
                          >
                              <Shield className="w-5 h-5" />
                              Résolution
                          </button>
                      </>
                  )}
                  
                  <div className={`mt-8 p-4 rounded-xl ${isDark ? "bg-gray-800" : "bg-white shadow-sm"}`}>
                      <h4 className={`text-xs font-bold uppercase mb-3 ${isDark ? "text-gray-500" : "text-gray-400"}`}>Actions Rapides</h4>
                      {dispute.status === 'open' && (
                          <button 
                              onClick={handleStartAnalysis}
                              disabled={processing}
                              className="w-full py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-bold hover:bg-blue-200 transition-colors flex items-center justify-center gap-2"
                          >
                              {processing ? <Loader2 className="w-4 h-4 animate-spin"/> : <Shield className="w-4 h-4" />}
                              Lancer la médiation
                          </button>
                      )}
                      {dispute.status === 'cancelled' && (
                          <button 
                              onClick={handleReopen}
                              disabled={processing}
                              className="w-full py-2 bg-green-100 text-green-700 rounded-lg text-sm font-bold hover:bg-green-200 transition-colors flex items-center justify-center gap-2"
                          >
                              {processing ? <Loader2 className="w-4 h-4 animate-spin"/> : <RefreshCw className="w-4 h-4" />}
                              Réouvrir le litige
                          </button>
                      )}
                      {(dispute.status === 'open' || dispute.status === 'under_analysis') && (
                          <button 
                              onClick={() => window.open(`/litige/${dispute.id}`, '_blank')}
                              className="w-full py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-bold hover:bg-purple-200 transition-colors flex items-center justify-center gap-2 mt-2"
                          >
                              <MessageSquare className="w-4 h-4" />
                              Superviser la Médiation
                          </button>
                      )}
                  </div>
              </div>
            )}

            {/* Main Content Area */}
            <div className={`flex-1 overflow-y-auto ${isFullScreen && activeTab === 'chat' ? 'p-0 h-full' : 'p-8'} ${isDark ? "bg-gray-900" : "bg-white"}`}>
                
                {/* DETAILS TAB */}
                {activeTab === 'details' && (
                    <div className="space-y-8 animate-fade-in">
                        {/* Dispute Info */}
                             <div className={`p-6 rounded-2xl border ${isDark ? "bg-gray-800 border-gray-700" : "bg-red-50 border-red-100"}`}>
                                { (dispute.status === 'resolved' || dispute.status === 'cancelled') && (
                                     <div className="mb-6 p-4 rounded-xl bg-white/80 dark:bg-gray-900/80 border border-purple-200 dark:border-purple-800 flex items-center justify-between">
                                         <div className="flex items-center gap-3">
                                             <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                                                 <CheckCircle className="w-5 h-5" />
                                             </div>
                                             <div>
                                                 <p className="font-bold text-gray-900 dark:text-white">Dossier clôturé</p>
                                                 <p className="text-xs text-gray-500">Vous pouvez réouvrir ce dossier si nécessaire.</p>
                                             </div>
                                         </div>
                                         <button 
                                             onClick={handleReopen}
                                             disabled={processing}
                                             className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-bold hover:bg-purple-700 transition-all shadow-md active:scale-95"
                                         >
                                             {processing ? <Loader2 className="w-4 h-4 animate-spin"/> : <RotateCcw className="w-4 h-4" />}
                                             Réouvrir le litige
                                         </button>
                                     </div>
                                )}
                                <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${isDark ? "text-white" : "text-red-900"}`}>
                                <AlertTriangle className="w-5 h-5 text-red-500" />
                                Informations du Problème
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <p className={`text-sm font-medium mb-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Motif déclaré</p>
                                    <p className={`text-lg font-bold ${isDark ? "text-white" : "text-gray-900"}`}>{dispute.reason}</p>
                                </div>
                                <div>
                                    <p className={`text-sm font-medium mb-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Ouvert par</p>
                                    <div className="flex items-center gap-3">
                                        {dispute.opener?.avatar_url ? (
                                           <img src={dispute.opener.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-700" />
                                        ) : (
                                           <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${isDark ? "bg-gray-700 text-white" : "bg-gray-200 text-gray-700"}`}>
                                               {dispute.opener?.first_name?.[0] || "?"}
                                           </div>
                                        )}
                                        <div>
                                            <p className={`font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                                                {dispute.opener?.first_name} {dispute.opener?.last_name}
                                            </p>
                                            <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                                                {dispute.opener?.email || "Email masqué"} • <span className="capitalize">{dispute.opener?.role || "Utilisateur"}</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-span-2">
                                    <p className={`text-sm font-medium mb-2 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Description détaillée</p>
                                    <div className={`p-4 rounded-xl ${isDark ? "bg-gray-900 text-gray-300" : "bg-white text-gray-700"} border border-gray-200 dark:border-gray-700 whitespace-pre-wrap leading-relaxed`}>
                                        {(() => {
                                            const details = dispute.details || "";
                                            if (details.includes("[DEMANDE DE RÉUNION]")) {
                                                const parts = details.split("[DEMANDE DE RÉUNION]");
                                                const complaint = parts[0].trim();
                                                const meeting = parts[1].replace(":", "").trim();
                                                
                                                return (
                                                    <div className="space-y-4">
                                                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 rounded-lg">
                                                            <p className="font-bold text-amber-800 dark:text-amber-400 flex items-center gap-2 mb-1">
                                                                📅 Réunion demandée :
                                                            </p>
                                                            <p className="text-amber-700 dark:text-amber-300">{meeting}</p>
                                                        </div>
                                                        {complaint && (
                                                            <div>
                                                                <p className="font-bold mb-1">Plainte :</p>
                                                                <p>{complaint}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            }
                                            return details || "Aucun détail fourni.";
                                        })()}
                                    </div>
                                </div>

                                {dispute.resolution_note && (
                                    <div className="col-span-2">
                                        <p className={`text-sm font-medium mb-2 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Note de résolution</p>
                                        <div className={`p-4 rounded-xl ${isDark ? "bg-purple-900/20 text-purple-200" : "bg-purple-50 text-purple-800"} border border-purple-100 dark:border-purple-800 italic`}>
                                            "{dispute.resolution_note}"
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Order Info */}
                        <div>
                            <h3 className={`text-lg font-bold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>Commande Concernée</h3>
                            <div className={`p-6 rounded-2xl border ${isDark ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <p className={`text-2xl font-bold font-mono ${isDark ? "text-white" : "text-gray-900"}`}>
                                            {(dispute.order?.total_cents / 100).toFixed(2)} {dispute.order?.currency}
                                        </p>
                                        <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>Montant total</p>
                                    </div>
                                    <button 
                                        onClick={() => setShowOrderDetail(true)}
                                        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                                    >
                                        Voir la commande <ExternalLink className="w-3 h-3"/>
                                    </button>
                                </div>
                                
                                <div className="mt-6 flex items-center gap-8">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                            <User className="w-5 h-5 text-gray-600"/>
                                        </div>
                                        <div>
                                            <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>Client</p>
                                            <p className={`font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                                                {dispute.order?.client?.first_name} {dispute.order?.client?.last_name}
                                            </p>
                                        </div>
                                    </div>
                                    <div className={`h-8 w-px ${isDark ? "bg-gray-700" : "bg-gray-300"}`}></div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-purple-200 flex items-center justify-center">
                                            <User className="w-5 h-5 text-purple-600"/>
                                        </div>
                                        <div>
                                            <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>Prestataire</p>
                                            <p className={`font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                                                {dispute.order?.provider?.profile?.first_name} {dispute.order?.provider?.profile?.last_name}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* CHAT TAB */}
                {activeTab === 'chat' && (
                    <div className="h-full flex flex-col animate-fade-in transition-all">
                        {dispute.order && user && (
                            <MediationChatRoom 
                                disputeId={dispute.id}
                                currentUserId={user.id}
                                currentUserRole="admin"
                                currentUserName={(user as any).first_name || (user as any).user_metadata?.first_name || "Médiateur"}
                                clientId={dispute.order.client_id}
                                providerId={dispute.order.provider?.profile?.user_id || dispute.order.provider_id}
                                clientName={dispute.order.client ? `${dispute.order.client.first_name} ${dispute.order.client.last_name}` : "Client"}
                                providerName={dispute.order.provider?.profile ? `${dispute.order.provider.profile.first_name} ${dispute.order.provider.profile.last_name}` : "Prestataire"}
                                isDark={isDark}
                            />
                        )}
                        {!dispute.order && <div className="p-8 text-center">Chargement ou données manquantes...</div>}
                    </div>
                )}

                {/* RESOLUTION TAB */}
                {activeTab === 'resolution' && (
                    <div className="animate-fade-in max-w-2xl mx-auto py-4">
                         <h3 className={`text-2xl font-bold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>Résolution du Litige</h3>
                         <p className={`mb-8 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                             Veuillez examiner les preuves et décider de l'issue du litige. Cette action est finale.
                         </p>

                         <div className="space-y-6">
                             {/* Détection du type de litige pour affichage adapté */}
                             {(() => {
                                 const details = dispute.details || "";
                                 const hasMeetingRequest = details.includes("[DEMANDE DE RÉUNION]");
                                 
                                 if (hasMeetingRequest) {
                                     return (
                                         <div className="grid grid-cols-1 gap-4">
                                            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl mb-4">
                                                <h4 className="font-bold text-amber-900 mb-1 flex items-center gap-2">
                                                    📅 Gestion de la Réunion
                                                </h4>
                                                <p className="text-sm text-amber-800">
                                                    Ce litige contient une demande de réunion. Vous pouvez confirmer, reporter ou annuler cette demande.
                                                </p>
                                            </div>

                                            <button 
                                                disabled={processing}
                                                onClick={() => handleResolve('dismiss')}
                                                className="p-4 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 transition-all flex items-center justify-between group"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="p-2 bg-blue-200 rounded-lg text-blue-700"><CheckCircle className="w-5 h-5"/></div>
                                                    <div className="text-left">
                                                        <h4 className="font-bold text-blue-900">Confirmer la réunion</h4>
                                                        <p className="text-sm text-blue-700">Valider le créneau et informer les parties.</p>
                                                    </div>
                                                </div>
                                            </button>

                                            <button 
                                                disabled={processing}
                                                onClick={() => handleResolve('change_meeting_date')}
                                                className="p-4 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 transition-all flex items-center justify-between group"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="p-2 bg-purple-200 rounded-lg text-purple-700"><RefreshCw className="w-5 h-5"/></div>
                                                    <div className="text-left">
                                                        <h4 className="font-bold text-purple-900">Modifier la date de réunion</h4>
                                                        <p className="text-sm text-purple-700">Proposer un nouveau créneau au client et au prestataire.</p>
                                                    </div>
                                                </div>
                                            </button>

                                            <button 
                                                disabled={processing}
                                                onClick={() => handleResolve('cancel_dispute')}
                                                className="p-4 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 transition-all flex items-center justify-between group"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="p-2 bg-red-200 rounded-lg text-red-700"><Ban className="w-5 h-5"/></div>
                                                    <div className="text-left">
                                                        <h4 className="font-bold text-red-900">Annuler la demande / Fermer litige</h4>
                                                        <p className="text-sm text-red-700">Rejeter la demande de réunion et clore le litige.</p>
                                                    </div>
                                                </div>
                                            </button>
                                         </div>
                                     );
                                 }

                                 // Affichage Standard (Remboursement / Autre)
                                 return (
                                     <>
                                        <div>
                                            <label className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                                                Note de résolution (Visible par les utilisateurs)
                                            </label>
                                            <textarea 
                                                className={`w-full p-4 rounded-xl border h-32 focus:ring-2 focus:ring-purple-500 outline-none transition-all ${isDark ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-200 text-gray-900"}`}
                                                placeholder="Expliquez la décision et la répartition des fonds..."
                                                value={resolutionNote}
                                                onChange={(e) => setResolutionNote(e.target.value)}
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 gap-4">
                                            <button 
                                                disabled={processing}
                                                onClick={() => handleResolve('refund_client')}
                                                className="p-4 rounded-xl border border-green-200 bg-green-50 hover:bg-green-100 transition-all flex items-center justify-between group"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="p-2 bg-green-200 rounded-lg text-green-700"><DollarSign className="w-5 h-5"/></div>
                                                    <div className="text-left">
                                                        <h4 className="font-bold text-green-900">Accepter le Remboursement</h4>
                                                        <p className="text-sm text-green-700">Restituer l'intégralité des fonds au client.</p>
                                                    </div>
                                                </div>
                                            </button>

                                            <button 
                                                disabled={processing}
                                                onClick={() => handleResolve('release_provider')}
                                                className="p-4 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 transition-all flex items-center justify-between group"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="p-2 bg-blue-200 rounded-lg text-blue-700"><Shield className="w-5 h-5"/></div>
                                                    <div className="text-left">
                                                        <h4 className="font-bold text-blue-900">Libérer les Fonds (Refuser remboursement)</h4>
                                                        <p className="text-sm text-blue-700">Valider la commande et payer le prestataire.</p>
                                                    </div>
                                                </div>
                                            </button>

                                            <button 
                                                disabled={processing}
                                                onClick={() => handleResolve('cancel_dispute')}
                                                className="p-4 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-all flex items-center justify-between group"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="p-2 bg-gray-200 rounded-lg text-gray-700"><Ban className="w-5 h-5"/></div>
                                                    <div className="text-left">
                                                        <h4 className="font-bold text-gray-900">Annuler / Fermer sans action</h4>
                                                        <p className="text-sm text-gray-600">Rejeter le litige et laisser la commande en l'état.</p>
                                                    </div>
                                                </div>
                                            </button>
                                        </div>
                                     </>
                                 );
                             })()}
                         </div>
                    </div>
                )}
            </div>
        </div>
      </div>
      {showOrderDetail && dispute.order && (
          <AdminOrderDetail 
             order={{
                 ...dispute.order,
                 client: dispute.order.client ? { ...dispute.order.client, profile: dispute.order.client } : undefined,
                 provider: dispute.order.provider
             }}
             onClose={() => setShowOrderDetail(false)}
             onRefresh={() => {
                 onUpdate();
             }}
             isDark={isDark}
          />
      )}
    </div>
  );
}
