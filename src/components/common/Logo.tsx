// ============================================================================
// COMMON: Logo Component
// ============================================================================

import { cn } from "@/utils/utils";
import Link from "next/link";

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export function Logo({ className, showText = true }: LogoProps) {
  return (
    <Link href="/" className={cn("flex items-center gap-2", className)}>
      {/* Icon Logo */}
      <div className="relative w-10 sm:w-20 mt-0 sm:mt-5 h-10 sm:h-20 bg-gradient-primary rounded-lg flex items-center justify-center shadow-sm">
        <span className="text-2xl font-bold ">
          <img src="/logo.png" alt="logo Anylibre" />
        </span>
      </div>

      {/* Text Logo */}
      {showText && (
        <span className="font-heading font-bold text-2xl bg-gradient-primary bg-clip-text text-transparent">
          AnyLibre
        </span>
      )}
    </Link>
  );
}
