// app/(Administrateur)/Components/AdminMessaging.tsx
"use client";

import { MessagingInterface } from "@/components/messaging/MessagingInterface";
import { usePermissions } from "@/contexts/PermissionsContext";
import { ShieldAlert } from "lucide-react";

export function AdminMessaging({ isDark = false }: { isDark?: boolean }) {
  const { hasPermission } = usePermissions();

  if (!hasPermission('support.chats.view')) {
    return (
      <div className={`h-full flex flex-col items-center justify-center text-center p-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
        <div className={`${isDark ? 'bg-red-500/10' : 'bg-red-100'} p-4 rounded-full mb-4`}>
          <ShieldAlert className={`w-12 h-12 ${isDark ? 'text-red-500' : 'text-red-500'}`} />
        </div>
        <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Accès Refusé</h3>
        <p className="max-w-md">
          Vous n'avez pas la permission nécessaire (<code>support.chats.view</code>) pour accéder à la messagerie.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full">
      <MessagingInterface isAdminMode={true} showUserSearch={true} isDark={isDark} />
    </div>
  );
}
