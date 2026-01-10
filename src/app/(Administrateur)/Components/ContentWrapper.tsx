"use client";

import React from "react";

interface ContentWrapperProps {
  children: React.ReactNode;
  isDark: boolean;
}

const ContentWrapper: React.FC<ContentWrapperProps> = ({
  children,
  isDark,
}) => {
  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-6">
      <div className="space-y-4 md:space-y-6 animate-fade-in">{children}</div>
    </main>
  );
};

export default ContentWrapper;
