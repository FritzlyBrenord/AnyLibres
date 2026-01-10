'use client';

import type { ReactNode } from 'react';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white">
        <div className="p-6">
          <h2 className="text-2xl font-bold">Dashboard</h2>
        </div>
        <nav className="space-y-2 p-4">
          <a href="/dashboard" className="block px-4 py-2 rounded hover:bg-gray-800">
            Accueil
          </a>
          <a href="/orders" className="block px-4 py-2 rounded hover:bg-gray-800">
            Mes commandes
          </a>
          <a href="/messages" className="block px-4 py-2 rounded hover:bg-gray-800">
            Messages
          </a>
          <a href="/profile" className="block px-4 py-2 rounded hover:bg-gray-800">
            Profil
          </a>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
