"use client";

import React from "react";
import { cn } from "@/utils/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  variant?: "primary" | "secondary" | "accent" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const Button = ({
  children,
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonProps) => {
  // Styles de base
  const baseStyles =
    "inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";

  // Variantes de couleur
  const variantStyles = {
    primary:
      "bg-primary text-white hover:bg-primary/90 shadow-md hover:shadow-lg",
    secondary:
      "bg-secondary text-white hover:bg-secondary/90 shadow-md hover:shadow-lg",
    accent: "bg-accent text-white hover:bg-accent/90 shadow-md hover:shadow-lg",
    outline:
      "border-2 border-primary text-primary hover:bg-primary hover:text-white",
    ghost: "text-text-primary hover:bg-background-light",
  };

  // Tailles
  const sizeStyles = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  return (
    <button
      type={type}
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};
