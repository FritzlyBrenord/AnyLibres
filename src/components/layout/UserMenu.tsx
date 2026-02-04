// ============================================================================
// Component: UserMenu - Menu déroulant utilisateur
// ============================================================================

"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useSafeLanguage } from "@/hooks/useSafeLanguage";
import {
  User,
  Settings,
  Package,
  Heart,
  MessageSquare,
  Bell,
  LogOut,
  Briefcase,
  LayoutDashboard,
  ShoppingBag,
  Star,
  Brain,
  HelpCircle,
} from "lucide-react";

export function UserMenu() {
  const { user, signOut, loading } = useAuth();
  const { t } = useSafeLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [favoriCount, SetfavoriCount] = useState(0);
  const router = useRouter();

  // Fermer le menu si on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
    router.push("/");
  };

  async function handleFavoritesCount() {
    // Tout en une seule fonction
    const count = await fetch("/api/favorites?action=count")
      .then((res) => res.json())
      .then((data) => (data.success ? data.data.count : 0))
      .catch(() => 0);

    return count;
  }

  useEffect(() => {
    handleFavoritesCount().then((count) => {
      SetfavoriCount(count);
    });
  }, []);
  if (loading) {
    return (
      <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href="/login"
          className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
        >
          {t.navigation.login}
        </Link>
        <Link
          href="/register"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          {t.navigation.register}
        </Link>
      </div>
    );
  }

  // Générer les initiales pour l'avatar
  const getInitials = () => {
    if (user.first_name && user.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    if (user.display_name) {
      const names = user.display_name.split(" ");
      return names.length > 1
        ? `${names[0][0]}${names[1][0]}`.toUpperCase()
        : names[0][0].toUpperCase();
    }
    return user.email[0].toUpperCase();
  };

  const isProvider = user.role === "provider";
  const isClient = user.role === "client";

  return (
    <div className="relative" ref={menuRef}>
      {/* Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
      >
        {user.avatar_url ? (
          <img
            src={user.avatar_url}
            alt={user.display_name || "User"}
            className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm border-2 border-gray-200">
            {getInitials()}
          </div>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
          {/* User Info */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.display_name || "User"}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                  {getInitials()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {user.display_name || `${user.first_name} ${user.last_name}`}
                </p>
                {user.username && (
                  <p className="text-xs text-gray-500 truncate">
                    @{user.username}
                  </p>
                )}
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            {/* Voir mon profil */}
            <Link
              href={`/profile/${user.user_id}`}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <User className="w-4 h-4" />
              {t.navigation.profile}
            </Link>

            {/* Dashboard pour prestataires */}
            {isProvider && (
              <Link
                href="/Provider/TableauDeBord"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                <LayoutDashboard className="w-4 h-4" />
                {t.navigation.dashboard}
              </Link>
            )}

            {/* Devenir prestataire pour clients */}
            {isClient && (
              <button
                onClick={async () => {
                  setIsOpen(false);

                  // Vérifier si l'utilisateur a vérifié son email et téléphone
                  try {
                    const response = await fetch("/api/profile");
                    const profileData = await response.json();

                    if (profileData.success && profileData.data?.profile) {
                      const { email_verified } = profileData.data.profile;

                      if (!email_verified) {
                        const missing = [];
                        if (!email_verified) missing.push("email");

                        alert(
                          `Vous devez vérifier votre ${missing.join(
                            " et "
                          )} avant de devenir prestataire. Vous allez être redirigé vers votre profil.`
                        );
                        router.push(
                          `/profile/${profileData.data.profile.user_id}`
                        );
                        return;
                      }
                    }
                  } catch (error) {
                    console.error("Error checking verification status:", error);
                  }

                  // Si tout est vérifié, rediriger vers become-provider
                  router.push("/become-provider");
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-blue-600 hover:bg-blue-50 font-medium"
              >
                <Briefcase className="w-4 h-4" />
                {t.navigation.becomeProvider}
              </button>
            )}
          </div>

          <div className="border-t border-gray-100 py-1">
            {/* Mes commandes */}
            <Link
              href="/orders"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <ShoppingBag className="w-4 h-4" />
              {t.navigation.myOrders}
            </Link>

            {/* Messages */}
            <Link
              href="/messages"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <MessageSquare className="w-4 h-4" />
              {t.messages.title}
            </Link>

            {/* Notifications */}
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Bell className="w-4 h-4" />
              {t.notifications.title}
            </Link>

            {/* Favoris */}
            <Link
              href="/favorites"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Heart className="w-4 h-4" />
              {t.navigation.favorites} {favoriCount > 0 && `(${favoriCount})`}
            </Link>

            {/* AI Insights - NEW */}
            <Link
              href="/insights"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-purple-600 hover:bg-purple-50 font-medium"
            >
              <Brain className="w-4 h-4" />
              {t.navigation.aiInsights}
            </Link>

            {/* Centre d'aide */}
            <Link
              href="/help"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <HelpCircle className="w-4 h-4" />
              {t.help?.title || "Centre d'Aide"}
            </Link>
          </div>

          <div className="border-t border-gray-100 py-1">
            {/* Déconnexion */}
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4" />
              {t.navigation.logout}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
