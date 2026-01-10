"use client";

import React, { useState, useEffect } from "react";
import {
  ShoppingBag,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
  Search,
  Filter,
  Eye,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Package,
  Calendar,
  User,
  MoreHorizontal,
  ArrowRight,
  Briefcase,
} from "lucide-react";
import OrderDetailView from "@/components/order/OrderDetailView"; // Adjust path if needed
import Link from "next/link";
import OrderDetailPage from "@/app/(protected)/orders/[id]/page";

interface OrdersProps {
  isDark: boolean;
}

interface Order {
  id: string;
  created_at: string;
  status: string;
  total_cents: number;
  fees_cents: number;
  client_id: string;
  provider_id: string;

  // Relations from API
  client?: {
    profile?: {
      first_name: string;
      last_name: string;
    };
  };
  provider?: {
    company_name: string;
    profile_id: string;
    profile?: {
      first_name: string;
      last_name: string;
    };
  };
  order_items: {
    id: string;
    title: string;
    service_id: string;
  }[];
}

const Orders: React.FC<OrdersProps> = ({ isDark }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/orders");

      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      } else {
        console.error("Failed to fetch orders");
      }
    } catch (error) {
      console.error("Error fetching admin orders:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter Logic
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.client?.profile?.first_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      order.client?.profile?.last_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      order.provider?.company_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      order.order_items?.[0]?.title
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate Stats
  const stats = {
    total: orders.length,
    completed: orders.filter(
      (o) => o.status === "completed" || o.status === "delivered"
    ).length,
    pending: orders.filter(
      (o) =>
        o.status === "pending" ||
        o.status === "paid" ||
        o.status === "in_progress"
    ).length,
    disputes: orders.filter(
      (o) => o.status === "disputed" || o.status === "cancelled"
    ).length,
    totalRevenue: orders.reduce(
      (acc, curr) => acc + (curr.total_cents + (curr.fees_cents || 0)) / 100,
      0
    ),
  };

  // Pagination Logic
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium border border-green-200 flex items-center gap-1 w-fit">
            <CheckCircle className="w-3 h-3" /> Terminée
          </span>
        );
      case "delivered":
        return (
          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium border border-emerald-200 flex items-center gap-1 w-fit">
            <Package className="w-3 h-3" /> Livrée
          </span>
        );
      case "in_progress":
        return (
          <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium border border-purple-200 flex items-center gap-1 w-fit">
            <Clock className="w-3 h-3" /> En cours
          </span>
        );
      case "paid":
        return (
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium border border-blue-200 flex items-center gap-1 w-fit">
            <Clock className="w-3 h-3" /> Payée
          </span>
        );
      case "pending":
        return (
          <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium border border-amber-200 flex items-center gap-1 w-fit">
            <Clock className="w-3 h-3" /> En attente
          </span>
        );
      case "cancelled":
        return (
          <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium border border-red-200 flex items-center gap-1 w-fit">
            <XCircle className="w-3 h-3" /> Annulée
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium border border-gray-200 w-fit">
            {status}
          </span>
        );
    }
  };

  if (selectedOrder) {
    return (
      <div
        className={`rounded-xl overflow-hidden shadow-2xl transition-all duration-300 ${
          isDark
            ? "bg-gray-900 border border-gray-800"
            : "bg-white border border-slate-200"
        } p-6`}
      >
        {/* <OrderDetailView
          order={selectedOrder}
          isAdmin={false}
          isDark={isDark}
          onBack={() => setSelectedOrder(null)}
        /> */}
        <OrderDetailPage
          order_Id={selectedOrder.id}
          isAdmin={true}
          isDark={isDark}
          onBack={() => setSelectedOrder(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          className={`p-6 rounded-2xl border flex items-center justify-between ${
            isDark
              ? "bg-gray-800 border-gray-700 text-white"
              : "bg-white border-slate-100 text-slate-900 shadow-sm"
          }`}
        >
          <div>
            <p
              className={`text-sm font-medium opacity-70 ${
                isDark ? "text-gray-400" : "text-slate-500"
              }`}
            >
              Total Commandes
            </p>
            <h3 className="text-2xl font-bold mt-1">{stats.total}</h3>
          </div>
          <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>
        <div
          className={`p-6 rounded-2xl border flex items-center justify-between ${
            isDark
              ? "bg-gray-800 border-gray-700 text-white"
              : "bg-white border-slate-100 text-slate-900 shadow-sm"
          }`}
        >
          <div>
            <p
              className={`text-sm font-medium opacity-70 ${
                isDark ? "text-gray-400" : "text-slate-500"
              }`}
            >
              En cours / Attente
            </p>
            <h3 className="text-2xl font-bold mt-1">{stats.pending}</h3>
          </div>
          <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>
        <div
          className={`p-6 rounded-2xl border flex items-center justify-between ${
            isDark
              ? "bg-gray-800 border-gray-700 text-white"
              : "bg-white border-slate-100 text-slate-900 shadow-sm"
          }`}
        >
          <div>
            <p
              className={`text-sm font-medium opacity-70 ${
                isDark ? "text-gray-400" : "text-slate-500"
              }`}
            >
              Terminées
            </p>
            <h3 className="text-2xl font-bold mt-1">{stats.completed}</h3>
          </div>
          <div className="p-3 bg-green-100 text-green-600 rounded-xl">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>
        <div
          className={`p-6 rounded-2xl border flex items-center justify-between ${
            isDark
              ? "bg-gray-800 border-gray-700 text-white"
              : "bg-white border-slate-100 text-slate-900 shadow-sm"
          }`}
        >
          <div>
            <p
              className={`text-sm font-medium opacity-70 ${
                isDark ? "text-gray-400" : "text-slate-500"
              }`}
            >
              Volume d'affaires
            </p>
            <h3 className="text-2xl font-bold mt-1">
              {stats.totalRevenue.toLocaleString("fr-FR", {
                style: "currency",
                currency: "EUR",
              })}
            </h3>
          </div>
          <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div
        className={`relative overflow-hidden rounded-2xl p-6 ${
          isDark
            ? "bg-gray-800 border border-gray-700"
            : "bg-white border border-blue-100 shadow-sm"
        }`}
      >
        {/* Filters */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
          <h2
            className={`text-xl font-bold ${
              isDark ? "text-white" : "text-slate-900"
            }`}
          >
            Gestion des Commandes
          </h2>

          <div className="flex gap-3 w-full md:w-auto">
            <div
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border w-full md:w-64 ${
                isDark
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-slate-50 border-slate-200"
              }`}
            >
              <Search className="w-4 h-4 opacity-50" />
              <input
                type="text"
                placeholder="Rechercher (ID, Client, Prestataire)..."
                className="bg-transparent border-none outline-none w-full text-sm placeholder:opacity-50"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <select
              className={`px-4 py-2.5 rounded-xl border outline-none text-sm font-medium appearance-none cursor-pointer hover:opacity-80 transition-opacity ${
                isDark
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-slate-50 border-slate-200 text-slate-700"
              }`}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="in_progress">En cours</option>
              <option value="delivered">Livrée</option>
              <option value="completed">Terminée</option>
              <option value="cancelled">Annulée</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr
                className={`text-left text-xs uppercase tracking-wider ${
                  isDark ? "text-gray-400" : "text-slate-500"
                }`}
              >
                <th className="pb-4 pl-4">Commande</th>
                <th className="pb-4">Client</th>
                <th className="pb-4">Prestataire</th>
                <th className="pb-4">Service</th>
                <th className="pb-4">Montant</th>
                <th className="pb-4">Statut</th>
                <th className="pb-4">Date</th>
                <th className="pb-4 text-right pr-4">Actions</th>
              </tr>
            </thead>
            <tbody
              className={`divide-y ${
                isDark ? "divide-gray-700" : "divide-slate-50"
              }`}
            >
              {loading ? (
                // Skeleton loading
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 pl-4">
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                    </td>
                    <td className="py-4">
                      <div className="h-4 bg-gray-200 rounded w-32"></div>
                    </td>
                    <td className="py-4">
                      <div className="h-4 bg-gray-200 rounded w-32"></div>
                    </td>
                    <td className="py-4">
                      <div className="h-4 bg-gray-200 rounded w-40"></div>
                    </td>
                    <td className="py-4">
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                    </td>
                    <td className="py-4">
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                    </td>
                    <td className="py-4">
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                    </td>
                    <td className="py-4 pr-4">
                      <div className="h-4 bg-gray-200 rounded w-8 ml-auto"></div>
                    </td>
                  </tr>
                ))
              ) : paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Aucune commande trouvée
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => (
                  <tr
                    key={order.id}
                    className={`group transition-colors cursor-pointer ${
                      isDark
                        ? "hover:bg-gray-700/50 text-gray-300"
                        : "hover:bg-slate-50 text-slate-600"
                    }`}
                    onClick={() => setSelectedOrder(order)}
                  >
                    <td className="py-4 pl-4">
                      <div className="font-mono text-xs opacity-70">
                        #{order.id.slice(0, 8)}
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                            isDark
                              ? "bg-gray-700 text-gray-300"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {order.client?.profile?.first_name?.charAt(0) || "U"}
                        </div>
                        <span
                          className={`font-medium ${
                            isDark ? "text-gray-200" : "text-slate-900"
                          }`}
                        >
                          {order.client?.profile?.first_name}{" "}
                          {order.client?.profile?.last_name}
                        </span>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-3 h-3 opacity-50" />
                        <span className="font-medium">
                          {order.provider?.company_name || "Unknown Provider"}
                        </span>
                      </div>
                    </td>
                    <td className="py-4">
                      <div
                        className="max-w-[200px] truncate text-sm"
                        title={order.order_items?.[0]?.title}
                      >
                        {order.order_items?.[0]?.title || "Service"}
                      </div>
                    </td>
                    <td className="py-4 font-bold">
                      {((order.total_cents + order.fees_cents) / 100).toFixed(
                        2
                      )}{" "}
                      €
                    </td>
                    <td className="py-4">{getStatusBadge(order.status)}</td>
                    <td className="py-4 text-sm opacity-70">
                      {new Date(order.created_at).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="py-4 pr-4">
                      <div className="flex justify-end">
                        <button
                          className={`p-2 rounded-lg transition-colors ${
                            isDark
                              ? "hover:bg-gray-600 text-gray-400"
                              : "hover:bg-slate-200 text-slate-400"
                          }`}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {!loading && filteredOrders.length > 0 && (
          <div className="flex justify-between items-center mt-6 pt-6 border-t border-slate-100 dark:border-gray-700">
            <div
              className={`text-sm ${
                isDark ? "text-gray-400" : "text-slate-500"
              }`}
            >
              Affichage de {(currentPage - 1) * itemsPerPage + 1} à{" "}
              {Math.min(currentPage * itemsPerPage, filteredOrders.length)} sur{" "}
              {filteredOrders.length} commandes
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={`p-2 rounded-lg disabled:opacity-30 ${
                  isDark
                    ? "hover:bg-gray-700 text-white disabled:text-gray-500"
                    : "hover:bg-slate-100 text-slate-600"
                }`}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span
                className={`text-sm font-medium px-3 ${
                  isDark ? "text-white" : "text-slate-700"
                }`}
              >
                Page {currentPage} / {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className={`p-2 rounded-lg disabled:opacity-30 ${
                  isDark
                    ? "hover:bg-gray-700 text-white disabled:text-gray-500"
                    : "hover:bg-slate-100 text-slate-600"
                }`}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
