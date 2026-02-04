// app/(protected)/messages/page.tsx
// Page principale de messagerie
"use client";

import { MessagingInterface } from "@/components/messaging/MessagingInterface";

export default function MessagesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-purple-50 to-slate-50">
      <main className="flex-1 h-full px-0 sm:px-4 max-w-[1600px] mx-auto w-full">
        <div className="min-h-screen">
          <MessagingInterface />
        </div>
      </main>
    </div>
  );
}
