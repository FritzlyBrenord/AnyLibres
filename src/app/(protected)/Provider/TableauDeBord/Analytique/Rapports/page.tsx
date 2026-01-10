"use client";

import { useState, useEffect } from "react";
import {
  Download,
  FileText,
  Calendar,
  TrendingUp,
  Users,
  ShoppingBag,
  DollarSign,
  FileSpreadsheet,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/layout/HeaderProvider";

interface ReportData {
  earnings: any[];
  orders: any[];
  services: any[];
  reviews: any[];
  balance: any;
}

export default function AnalyticsReports() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReportData | null>(null);
  const [exporting, setExporting] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user) {
      fetchAllData();
    }
  }, [authLoading, user]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [earningsRes, servicesRes, ordersRes, reviewsRes] =
        await Promise.all([
          fetch("/api/provider/earnings"),
          fetch("/api/services"),
          fetch("/api/providers/orders"),
          fetch("/api/providers/reviews"),
        ]);

      const earningsData = await earningsRes.json();
      const servicesData = await servicesRes.json();
      const ordersData = await ordersRes.json();
      const reviewsData = await reviewsRes.json();

      if (earningsData.success && ordersData.success && servicesData) {
        setData({
          earnings: earningsData.data.earnings || [],
          orders: ordersData.orders || [],
          services: servicesData.services || [],
          reviews: reviewsData.reviews || [],
          balance: earningsData.data.balance,
        });
      }
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  };

  // Export Revenus complet (CSV)
  const exportRevenus = () => {
    if (!data) return;
    setExporting("revenus");

    try {
      const csvRows = [
        [
          "Date",
          "Commande ID",
          "Montant Brut (€)",
          "Frais Plateforme (€)",
          "Montant Net (€)",
          "Statut",
          "Service",
        ],
      ];

      data.earnings.forEach((earning: any) => {
        const order = data.orders.find((o: any) => o.id === earning.order_id);
        const serviceTitle =
          order?.order_items?.[0]?.service?.title?.fr || "N/A";

        csvRows.push([
          new Date(earning.created_at).toLocaleDateString("fr-FR"),
          earning.order_id || "N/A",
          (earning.amount_cents / 100).toFixed(2),
          (earning.platform_fee_cents / 100).toFixed(2),
          (earning.net_amount_cents / 100).toFixed(2),
          earning.status,
          serviceTitle,
        ]);
      });

      const csvContent = csvRows.map((row) => row.join(";")).join("\n");
      downloadCSV(
        csvContent,
        `revenus_${new Date().toISOString().split("T")[0]}.csv`
      );
    } finally {
      setExporting(null);
    }
  };

  // Export Commandes (CSV)
  const exportCommandes = () => {
    if (!data) return;
    setExporting("commandes");

    try {
      const csvRows = [
        [
          "Date",
          "Commande ID",
          "Client",
          "Service",
          "Montant Net (€)",
          "Statut",
          "Date Livraison",
        ],
      ];

      data.orders.forEach((order: any) => {
        const earning = data.earnings.find((e: any) => e.order_id === order.id);
        const serviceTitle =
          order.order_items?.[0]?.service?.title?.fr || "N/A";
        const clientName =
          order.client?.full_name || order.client?.email || "Client";

        csvRows.push([
          new Date(order.created_at).toLocaleDateString("fr-FR"),
          order.id,
          clientName,
          serviceTitle,
          earning ? (earning.net_amount_cents / 100).toFixed(2) : "0.00",
          order.status,
          order.delivery_date
            ? new Date(order.delivery_date).toLocaleDateString("fr-FR")
            : "N/A",
        ]);
      });

      const csvContent = csvRows.map((row) => row.join(";")).join("\n");
      downloadCSV(
        csvContent,
        `commandes_${new Date().toISOString().split("T")[0]}.csv`
      );
    } finally {
      setExporting(null);
    }
  };

  // Export Services Performance (CSV)
  const exportServices = () => {
    if (!data) return;
    setExporting("services");

    try {
      const csvRows = [
        [
          "Service",
          "Prix de Base (€)",
          "Commandes",
          "Revenus Générés (€)",
          "Note Moyenne",
          "Avis",
          "Taux Conversion",
        ],
      ];

      data.services.forEach((service: any) => {
        const serviceOrders = data.orders.filter((order: any) => {
          return order.order_items?.some(
            (item: any) => item.service_id === service.id
          );
        });

        const serviceRevenue = data.earnings
          .filter((earning: any) => {
            const order = data.orders.find(
              (o: any) => o.id === earning.order_id
            );
            return order?.order_items?.some(
              (item: any) => item.service_id === service.id
            );
          })
          .reduce(
            (acc: number, earning: any) =>
              acc + (earning.net_amount_cents || 0),
            0
          );

        const views = service.metrics?.views || 0;
        const ordersCount = serviceOrders.length;
        const conversionRate =
          views > 0 ? ((ordersCount / views) * 100).toFixed(2) : "0.00";

        const rating =
          service.reviews && service.reviews.length > 0
            ? (
                service.reviews.reduce(
                  (acc: number, r: any) => acc + r.rating,
                  0
                ) / service.reviews.length
              ).toFixed(1)
            : "0.0";

        csvRows.push([
          service.title?.fr || service.title?.en || "Service",
          (service.base_price_cents / 100).toFixed(2),
          ordersCount.toString(),
          (serviceRevenue / 100).toFixed(2),
          rating,
          (service.reviews?.length || 0).toString(),
          conversionRate + "%",
        ]);
      });

      const csvContent = csvRows.map((row) => row.join(";")).join("\n");
      downloadCSV(
        csvContent,
        `services_performance_${new Date().toISOString().split("T")[0]}.csv`
      );
    } finally {
      setExporting(null);
    }
  };

  // Export Clients (CSV)
  const exportClients = () => {
    if (!data) return;
    setExporting("clients");

    try {
      const csvRows = [
        [
          "Client",
          "Email",
          "Nombre Commandes",
          "Dépenses Totales (€)",
          "Valeur Moy. Commande (€)",
          "Première Commande",
          "Dernière Commande",
        ],
      ];

      const clientsMap = new Map();

      data.earnings.forEach((earning: any) => {
        const relatedOrder = data.orders.find(
          (o: any) => o.id === earning.order_id
        );
        if (!relatedOrder) return;

        const clientId = relatedOrder.client_id || relatedOrder.client?.id;
        if (!clientId) return;

        if (!clientsMap.has(clientId)) {
          clientsMap.set(clientId, {
            client_id: clientId,
            name: relatedOrder.client?.full_name || "Client",
            email: relatedOrder.client?.email || "N/A",
            orders_count: 0,
            total_spend_cents: 0,
            first_order: relatedOrder.created_at,
            last_order: relatedOrder.created_at,
          });
        }

        const client = clientsMap.get(clientId);
        client.orders_count++;
        client.total_spend_cents += earning.net_amount_cents || 0;

        if (new Date(relatedOrder.created_at) < new Date(client.first_order)) {
          client.first_order = relatedOrder.created_at;
        }
        if (new Date(relatedOrder.created_at) > new Date(client.last_order)) {
          client.last_order = relatedOrder.created_at;
        }
      });

      Array.from(clientsMap.values()).forEach((client: any) => {
        csvRows.push([
          client.name,
          client.email,
          client.orders_count.toString(),
          (client.total_spend_cents / 100).toFixed(2),
          (client.total_spend_cents / client.orders_count / 100).toFixed(2),
          new Date(client.first_order).toLocaleDateString("fr-FR"),
          new Date(client.last_order).toLocaleDateString("fr-FR"),
        ]);
      });

      const csvContent = csvRows.map((row) => row.join(";")).join("\n");
      downloadCSV(
        csvContent,
        `clients_${new Date().toISOString().split("T")[0]}.csv`
      );
    } finally {
      setExporting(null);
    }
  };

  // Export Rapport Fiscal Annuel (CSV)
  const exportRapportFiscal = () => {
    if (!data) return;
    setExporting("fiscal");

    try {
      const currentYear = new Date().getFullYear();
      const yearEarnings = data.earnings.filter(
        (e: any) =>
          new Date(e.created_at).getFullYear() === currentYear &&
          ["completed", "processing"].includes(e.status)
      );

      const totalGross = yearEarnings.reduce(
        (acc: number, e: any) => acc + (e.amount_cents || 0),
        0
      );
      const totalFees = yearEarnings.reduce(
        (acc: number, e: any) => acc + (e.platform_fee_cents || 0),
        0
      );
      const totalNet = yearEarnings.reduce(
        (acc: number, e: any) => acc + (e.net_amount_cents || 0),
        0
      );

      const monthlyData = Array.from({ length: 12 }, (_, i) => {
        const month = i + 1;
        const monthEarnings = yearEarnings.filter(
          (e: any) => new Date(e.created_at).getMonth() === i
        );

        return {
          month: new Date(currentYear, i).toLocaleDateString("fr-FR", {
            month: "long",
          }),
          gross: monthEarnings.reduce(
            (acc: number, e: any) => acc + (e.amount_cents || 0),
            0
          ),
          fees: monthEarnings.reduce(
            (acc: number, e: any) => acc + (e.platform_fee_cents || 0),
            0
          ),
          net: monthEarnings.reduce(
            (acc: number, e: any) => acc + (e.net_amount_cents || 0),
            0
          ),
        };
      });

      const csvRows = [
        ["RAPPORT FISCAL ANNUEL - " + currentYear],
        [""],
        ["RÉSUMÉ ANNUEL"],
        ["Revenus Bruts Total", (totalGross / 100).toFixed(2) + " €"],
        ["Frais de Plateforme Total", (totalFees / 100).toFixed(2) + " €"],
        ["Revenus Net Total", (totalNet / 100).toFixed(2) + " €"],
        ["Nombre de Transactions", yearEarnings.length.toString()],
        [""],
        ["DÉTAIL MENSUEL"],
        [
          "Mois",
          "Revenus Bruts (€)",
          "Frais Plateforme (€)",
          "Revenus Net (€)",
        ],
      ];

      monthlyData.forEach((month: any) => {
        csvRows.push([
          month.month,
          (month.gross / 100).toFixed(2),
          (month.fees / 100).toFixed(2),
          (month.net / 100).toFixed(2),
        ]);
      });

      const csvContent = csvRows.map((row) => row.join(";")).join("\n");
      downloadCSV(csvContent, `rapport_fiscal_${currentYear}.csv`);
    } finally {
      setExporting(null);
    }
  };

  // Export Rapport Mensuel (CSV)
  const exportRapportMensuel = () => {
    if (!data) return;
    setExporting("mensuel");

    try {
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      const monthEarnings = data.earnings.filter((e: any) => {
        const date = new Date(e.created_at);
        return (
          date.getMonth() === currentMonth &&
          date.getFullYear() === currentYear &&
          ["completed", "processing"].includes(e.status)
        );
      });

      const totalGross = monthEarnings.reduce(
        (acc: number, e: any) => acc + (e.amount_cents || 0),
        0
      );
      const totalFees = monthEarnings.reduce(
        (acc: number, e: any) => acc + (e.platform_fee_cents || 0),
        0
      );
      const totalNet = monthEarnings.reduce(
        (acc: number, e: any) => acc + (e.net_amount_cents || 0),
        0
      );

      const csvRows = [
        [
          "RAPPORT MENSUEL - " +
            new Date().toLocaleDateString("fr-FR", {
              month: "long",
              year: "numeric",
            }),
        ],
        [""],
        ["RÉSUMÉ DU MOIS"],
        ["Revenus Bruts", (totalGross / 100).toFixed(2) + " €"],
        ["Frais de Plateforme", (totalFees / 100).toFixed(2) + " €"],
        ["Revenus Net", (totalNet / 100).toFixed(2) + " €"],
        ["Nombre de Transactions", monthEarnings.length.toString()],
        [""],
        ["DÉTAIL DES TRANSACTIONS"],
        [
          "Date",
          "Commande ID",
          "Service",
          "Montant Brut (€)",
          "Frais (€)",
          "Montant Net (€)",
          "Statut",
        ],
      ];

      monthEarnings.forEach((earning: any) => {
        const order = data.orders.find((o: any) => o.id === earning.order_id);
        const serviceTitle =
          order?.order_items?.[0]?.service?.title?.fr || "N/A";

        csvRows.push([
          new Date(earning.created_at).toLocaleDateString("fr-FR"),
          earning.order_id || "N/A",
          serviceTitle,
          (earning.amount_cents / 100).toFixed(2),
          (earning.platform_fee_cents / 100).toFixed(2),
          (earning.net_amount_cents / 100).toFixed(2),
          earning.status,
        ]);
      });

      const monthName = new Date()
        .toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
        .replace(" ", "_");
      const csvContent = csvRows.map((row) => row.join(";")).join("\n");
      downloadCSV(csvContent, `rapport_mensuel_${monthName}.csv`);
    } finally {
      setExporting(null);
    }
  };

  // Helper function to download CSV
  const downloadCSV = (content: string, filename: string) => {
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + content], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        </main>
      </div>
    );
  }

  const stats = data
    ? {
        totalEarnings: data.balance.total_earned_cents / 100,
        totalOrders: data.orders.length,
        totalServices: data.services.length,
        totalClients: new Set(data.orders.map((o: any) => o.client_id)).size,
      }
    : { totalEarnings: 0, totalOrders: 0, totalServices: 0, totalClients: 0 };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                📊 Rapports & Exports
              </h1>
              <p className="text-slate-600">
                Exportez vos données analytiques pour votre comptabilité et
                analyses
              </p>
            </div>
            <button
              onClick={fetchAllData}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="font-medium">Actualiser</span>
            </button>
          </div>
        </div>

        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6" />
              </div>
              <TrendingUp className="w-5 h-5 opacity-80" />
            </div>
            <p className="text-blue-100 text-sm mb-1">Revenus Totaux</p>
            <p className="text-3xl font-bold">
              {stats.totalEarnings.toFixed(2)} €
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <CheckCircle2 className="w-5 h-5 opacity-80" />
            </div>
            <p className="text-purple-100 text-sm mb-1">Commandes</p>
            <p className="text-3xl font-bold">{stats.totalOrders}</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <AlertCircle className="w-5 h-5 opacity-80" />
            </div>
            <p className="text-green-100 text-sm mb-1">Services Actifs</p>
            <p className="text-3xl font-bold">{stats.totalServices}</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <TrendingUp className="w-5 h-5 opacity-80" />
            </div>
            <p className="text-orange-100 text-sm mb-1">Clients Uniques</p>
            <p className="text-3xl font-bold">{stats.totalClients}</p>
          </div>
        </div>

        {/* Export Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Rapport Mensuel */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all hover:scale-[1.02]">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Rapport Mensuel
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              Détail complet de toutes les transactions du mois en cours avec
              résumé financier.
            </p>
            <button
              onClick={exportRapportMensuel}
              disabled={exporting === "mensuel"}
              className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {exporting === "mensuel" ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Télécharger CSV
            </button>
          </div>

          {/* Rapport Fiscal Annuel */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all hover:scale-[1.02]">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Rapport Fiscal Annuel
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              Résumé annuel complet pour votre déclaration fiscale avec détail
              mensuel.
            </p>
            <button
              onClick={exportRapportFiscal}
              disabled={exporting === "fiscal"}
              className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-purple-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {exporting === "fiscal" ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Télécharger CSV
            </button>
          </div>

          {/* Historique Revenus */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all hover:scale-[1.02]">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-4">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Historique des Revenus
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              Liste complète de tous vos revenus avec détails des frais et
              montants nets.
            </p>
            <button
              onClick={exportRevenus}
              disabled={exporting === "revenus"}
              className="w-full py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-semibold hover:from-green-700 hover:to-green-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {exporting === "revenus" ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Télécharger CSV
            </button>
          </div>

          {/* Historique des Commandes */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all hover:scale-[1.02]">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-4">
              <ShoppingBag className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Historique des Commandes
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              Archive complète de toutes vos commandes avec clients et statuts
              de livraison.
            </p>
            <button
              onClick={exportCommandes}
              disabled={exporting === "commandes"}
              className="w-full py-2.5 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg font-semibold hover:from-orange-700 hover:to-orange-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {exporting === "commandes" ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Télécharger CSV
            </button>
          </div>

          {/* Performance des Services */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all hover:scale-[1.02]">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Performance des Services
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              Analyse détaillée de la performance de chacun de vos services avec
              métriques.
            </p>
            <button
              onClick={exportServices}
              disabled={exporting === "services"}
              className="w-full py-2.5 bg-gradient-to-r from-pink-600 to-pink-700 text-white rounded-lg font-semibold hover:from-pink-700 hover:to-pink-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {exporting === "services" ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Télécharger CSV
            </button>
          </div>

          {/* Analyse Clients */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all hover:scale-[1.02]">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Analyse Clients
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              Liste détaillée de vos clients avec historique d'achat et
              statistiques.
            </p>
            <button
              onClick={exportClients}
              disabled={exporting === "clients"}
              className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-cyan-700 text-white rounded-lg font-semibold hover:from-cyan-700 hover:to-cyan-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {exporting === "clients" ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Télécharger CSV
            </button>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <FileSpreadsheet className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 mb-2">
                ℹ️ Informations sur les exports
              </h3>
              <ul className="text-sm text-slate-600 space-y-2">
                <li>
                  • Tous les fichiers sont au format CSV, compatible avec Excel,
                  Google Sheets et logiciels de comptabilité
                </li>
                <li>
                  • Les montants sont en euros (€) avec séparateur décimal
                  français
                </li>
                <li>
                  • Le séparateur de colonnes est le point-virgule (;) pour
                  compatibilité Excel France
                </li>
                <li>
                  • Les revenus nets correspondent aux montants après déduction
                  des frais de plateforme (2.5%)
                </li>
                <li>
                  • Les données sont exportées en temps réel depuis votre compte
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
