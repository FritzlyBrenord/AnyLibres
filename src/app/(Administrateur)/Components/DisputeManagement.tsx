"use client";

import React, { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import {
  Search,
  Filter,
  AlertTriangle,
  CheckCircle,
  Clock,
  MoreVertical,
  Eye,
  MessageSquare,
  Gavel,
  RefreshCw,
  XCircle,
  FileText,
  User,
  ExternalLink,
  ChevronDown
} from "lucide-react";
import { useLanguageContext } from "../../../contexts/LanguageContext";
import { usePermissions } from "@/contexts/PermissionsContext";
import DisputeDetailModal from "./DisputeDetailModal";

// Interface pour les litiges
interface Dispute {
  id: string;
  order_id: string;
  opened_by_id: string;
  reason: string;
  details: string;
  status: "open" | "under_analysis" | "resolved" | "cancelled";
  created_at: string;
  resolved_at?: string;
  resolution_note?: string;
  // Relations
  order?: any;
  opener?: any;
}

interface DisputeManagementProps {
  isDark: boolean;
}

export default function DisputeManagement({ isDark }: DisputeManagementProps) {
  const { t } = useLanguageContext();
  const { hasPermission } = usePermissions();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  
  // Vérifier les permissions
  const canViewDisputes = hasPermission('disputes.view');
  const canManageDisputes = hasPermission('disputes.manage');
  const canResolveDisputes = hasPermission('disputes.resolve');
  
  // Supabase client
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchDisputes = async () => {
    setLoading(true);
    const startTime = Date.now();
    try {
      // Query optimized with specific fields and a limit of 50 for performance
      const { data, error } = await supabase
        .from("disputes")
        .select(`
          id,
          order_id,
          opened_by_id,
          reason,
          details,
          status,
          created_at,
          resolution_note,
          order:orders!disputes_order_id_fkey (
            id,
            total_cents,
            currency,
            client:profiles!orders_client_id_profiles_fkey (first_name, last_name, avatar_url),
            provider:providers (
                id,
                company_name,
                profile:profiles!providers_profile_id_fkey (first_name, last_name, avatar_url)
            )
          ),
          opener:profiles!disputes_opened_by_id_fkey (first_name, last_name, email, avatar_url)
        `)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setDisputes(data || []);
      
      const duration = Date.now() - startTime;
      console.log(`Disputes loaded in ${duration}ms`);
    } catch (err) {
      console.error("Erreur chargement litiges:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  // Filtrage
  const filteredDisputes = disputes.filter((dispute) => {
    const matchesSearch = 
      dispute.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispute.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispute.opener?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispute.opener?.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = statusFilter === "all" || dispute.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {(t.admin?.disputeManagement?.status?.open || status)}</span>;
      case "under_analysis":
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1"><Eye className="w-3 h-3" /> {(t.admin?.disputeManagement?.status?.under_analysis || status)}</span>;
      case "resolved":
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> {(t.admin?.disputeManagement?.status?.resolved || status)}</span>;
      case "cancelled":
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800 border border-gray-200 flex items-center gap-1"><XCircle className="w-3 h-3" /> {(t.admin?.disputeManagement?.status?.cancelled || status)}</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  // Si pas de permission de voir les litiges
  if (!canViewDisputes) {
    return (
      <div className="animate-fade-in p-6">
        <div className="flex flex-col items-center justify-center h-96 text-center">
          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 ${
            isDark ? 'bg-red-500/10 text-red-500' : 'bg-red-50 text-red-600'
          }`}>
            <AlertTriangle className="w-10 h-10" />
          </div>
          <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Accès Refusé
          </h2>
          <p className={`max-w-md ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Vous n'avez pas la permission de voir les litiges. Contactez un administrateur système.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className={`text-2xl font-bold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>
            {t.admin?.disputeManagement?.title || "Gestion des Litiges"}
          </h1>
          <p className={`${isDark ? "text-gray-400" : "text-gray-600"}`}>
            {t.admin?.disputeManagement?.subtitle || "Gérez et résolvez les conflits entre clients et prestataires"}
          </p>
        </div>
        <div className="flex gap-3">
             <button 
                onClick={fetchDisputes}
                className={`p-2 rounded-xl transition-colors ${isDark ? "bg-gray-800 hover:bg-gray-700 text-gray-300" : "bg-white hover:bg-gray-50 text-gray-600"} border ${isDark ? "border-gray-700" : "border-gray-200"}`}
             >
                <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
             </button>
             <button className="px-4 py-2 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all flex items-center gap-2">
                <Gavel className="w-4 h-4" />
                <span>{t.admin?.disputeManagement?.policy || "Politique des litiges"}</span>
             </button>
        </div>
      </div>

      {/* Filters */}
      <div className={`p-4 rounded-2xl mb-6 flex flex-col md:flex-row gap-4 items-center justify-between ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"} border shadow-sm`}>
        <div className="relative w-full md:w-96">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-gray-500" : "text-gray-400"}`} />
            <input 
                type="text"
                placeholder={t.admin?.disputeManagement?.searchPlaceholder || "Rechercher par ID, raison, nom ou email..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-purple-500 transition-all ${
                    isDark ? "bg-gray-900 border-gray-700 text-white placeholder-gray-600" : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400"
                }`} 
            />
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            {['all', 'open', 'under_analysis', 'resolved', 'cancelled'].map((status) => (
                <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                        statusFilter === status
                            ? "bg-purple-100 text-purple-700 border border-purple-200"
                            : isDark ? "text-gray-400 hover:bg-gray-700" : "text-gray-600 hover:bg-gray-100"
                    }`}
                >
                    {status === 'all' ? (t.admin?.disputeManagement?.filters?.all || "Tous") : 
                     status === 'open' ? (t.admin?.disputeManagement?.filters?.open || "Ouverts") :
                     status === 'under_analysis' ? (t.admin?.disputeManagement?.filters?.under_analysis || "En cours") :
                     status === 'resolved' ? (t.admin?.disputeManagement?.filters?.resolved || "Résolus") : (t.admin?.disputeManagement?.filters?.cancelled || "Annulés")}
                </button>
            ))}
        </div>
      </div>

      {/* Table */}
      <div className={`rounded-3xl border overflow-hidden shadow-xl ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}>
         <div className="overflow-x-auto">
             <table className="w-full">
                 <thead>
                     <tr className={`text-left text-xs font-bold uppercase tracking-wider ${isDark ? "bg-gray-900/50 text-gray-400" : "bg-gray-50 text-gray-500"}`}>
                        <th className="px-6 py-4">{t.admin?.disputeManagement?.table?.headers?.idOrder || "ID / Commande"}</th>
                        <th className="px-6 py-4">{t.admin?.disputeManagement?.table?.headers?.openedBy || "Ouvert par"}</th>
                        <th className="px-6 py-4">{t.admin?.disputeManagement?.table?.headers?.parties || "Parties concernées"}</th>
                        <th className="px-6 py-4">{t.admin?.disputeManagement?.table?.headers?.status || "Status"}</th>
                        <th className="px-6 py-4">{t.admin?.disputeManagement?.table?.headers?.date || "Date"}</th>
                        <th className="px-6 py-4 text-right">{t.admin?.disputeManagement?.table?.headers?.action || "Action"}</th>
                     </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                     {loading ? (
                         <tr>
                             <td colSpan={6} className="px-6 py-8 text-center">
                                 <div className="flex items-center justify-center gap-3">
                                     <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                                     <span className={isDark ? "text-gray-400" : "text-gray-500"}>{t.admin?.disputeManagement?.table?.loading || "Chargement des litiges..."}</span>
                                 </div>
                             </td>
                         </tr>
                     ) : filteredDisputes.length === 0 ? (
                         <tr>
                             <td colSpan={6} className="px-6 py-12 text-center">
                                 <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                     <Gavel className="w-8 h-8 text-gray-400" />
                                 </div>
                                 <h3 className={`text-lg font-medium mb-1 ${isDark ? "text-white" : "text-gray-900"}`}>{t.admin?.disputeManagement?.table?.empty?.title || "Aucun litige trouvé"}</h3>
                                 <p className={isDark ? "text-gray-400" : "text-gray-500"}>{t.admin?.disputeManagement?.table?.empty?.subtitle || "Il semble que tout se passe bien sur la plateforme !"}</p>
                             </td>
                         </tr>
                     ) : (
                        filteredDisputes.map((dispute) => (
                             <tr key={dispute.id} className={`group transition-colors ${isDark ? "hover:bg-gray-700/30" : "hover:bg-purple-50/30"}`}>
                                 <td className="px-6 py-4">
                                     <div className="flex items-center gap-3">
                                         <div className="p-2 rounded-lg bg-red-100 text-red-600">
                                            <AlertTriangle className="w-4 h-4" />
                                         </div>
                                         <div>
                                             <div className={`font-mono text-xs font-bold ${isDark ? "text-purple-400" : "text-purple-600"}`}>
                                                 #{dispute.id.slice(0, 6)}...
                                             </div>
                                             <div className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                                                 {t.admin?.disputeManagement?.table?.rows?.cmd || "Cmd"}: #{dispute.order_id?.slice(0, 8)}
                                             </div>
                                         </div>
                                     </div>
                                 </td>
                                 <td className="px-6 py-4">
                                     <div className="flex items-center gap-3">
                                        {dispute.opener?.avatar_url ? (
                                           <img src={dispute.opener.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-gray-700" />
                                        ) : (
                                           <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isDark ? "bg-gray-700 text-white" : "bg-gray-200 text-gray-700"}`}>
                                               {dispute.opener?.first_name?.[0] || "?"}
                                           </div>
                                        )}
                                        <div>
                                            <div className={`text-sm font-medium ${isDark ? "text-gray-200" : "text-gray-900"}`}>
                                                {dispute.opener?.first_name} {dispute.opener?.last_name}
                                            </div>
                                            <div className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                                                {dispute.reason}
                                            </div>
                                        </div>
                                     </div>
                                 </td>
                                 <td className="px-6 py-4">
                                     {dispute.order ? (
                                        <div className="flex items-center gap-2">
                                            <div className="flex -space-x-2">
                                                <div className={`w-8 h-8 rounded-full border-2 ${isDark ? "border-gray-800 bg-gray-700" : "border-white bg-gray-200"} flex items-center justify-center text-xs font-bold`} title="Client">
                                                    {dispute.order.client?.first_name ? dispute.order.client.first_name[0] : "C"}
                                                </div>
                                                <div className={`w-8 h-8 rounded-full border-2 ${isDark ? "border-gray-800 bg-gray-700" : "border-white bg-gray-200"} flex items-center justify-center text-xs font-bold`} title="Prestataire">
                                                    {dispute.order.provider?.profile?.first_name ? dispute.order.provider.profile.first_name[0] : "P"}
                                                </div>
                                            </div>
                                            <div className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                                                {dispute.order.client?.first_name || "Client"} & {dispute.order.provider?.profile?.first_name || "Prestataire"}
                                            </div>
                                        </div>
                                     ) : (
                                        <span className="text-xs text-gray-400">{t.admin?.disputeManagement?.table?.rows?.notLinked || "Non lié"}</span>
                                     )}
                                 </td>
                                 <td className="px-6 py-4">
                                     {getStatusBadge(dispute.status)}
                                 </td>
                                 <td className="px-6 py-4">
                                     <div className={`flex items-center gap-1.5 text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                                         <Clock className="w-3.5 h-3.5" />
                                         {new Date(dispute.created_at).toLocaleDateString()}
                                     </div>
                                 </td>
                                  <td className="px-6 py-4 text-right">
                                      {canManageDisputes ? (
                                        <button 
                                           onClick={() => setSelectedDispute(dispute)}
                                           className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-sm font-medium shadow-md hover:shadow-lg hover:from-purple-700 hover:to-indigo-700 transition-all transform hover:scale-105"
                                        >
                                            {t.admin?.disputeManagement?.table?.rows?.manage || "Gérer"}
                                        </button>
                                      ) : (
                                        <button 
                                           onClick={() => setSelectedDispute(dispute)}
                                           className="px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl text-sm font-medium shadow-md hover:shadow-lg transition-all"
                                        >
                                            {t.admin?.disputeManagement?.table?.rows?.view || "Voir"}
                                        </button>
                                      )}
                                  </td>
                             </tr>
                        ))
                     )}
                 </tbody>
             </table>
         </div>
         
         {/* Detail Modal */}
         {selectedDispute && (
             <DisputeDetailModal 
                dispute={selectedDispute} 
                onClose={() => setSelectedDispute(null)} 
                isDark={isDark}
                onUpdate={fetchDisputes} // Refresh list after action
             />
         )}
      </div>
    </div>
  );
}
