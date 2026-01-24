import { createClient } from "@/utils/supabase/client";

/**
 * Service de tracking pour enregistrer l'activité utilisateur en temps réel
 */
class UserActivityTracker {
  private supabase = createClient();
  private activityTimeout: NodeJS.Timeout | null = null;
  private lastActivityTime: Date = new Date();
  private userId: string | null = null;

  /**
   * Initialise le tracker avec l'ID utilisateur
   */
  async init(userId: string) {
    this.userId = userId;
    this.startActivityTracking();
  }

  /**
   * Enregistre l'activité utilisateur
   */
  async recordActivity(
    activityType: "page_view" | "click" | "scroll" | "search" | "login" | "logout"
  ) {
    if (!this.userId) return;

    this.lastActivityTime = new Date();

    try {
      await this.supabase.from("user_activity_log").insert({
        user_id: this.userId,
        activity_type: activityType,
        page_visited: window.location.pathname,
        device_info: navigator.userAgent,
        ip_address: await this.getUserIP(),
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error recording activity:", error);
    }
  }

  /**
   * Met à jour le statut de l'utilisateur
   */
  async updateStatus(
    status: "online" | "idle" | "away" | "offline"
  ) {
    if (!this.userId) return;

    try {
      await this.supabase
        .from("user_activity_log")
        .update({
          status,
          last_activity_time: new Date().toISOString(),
        })
        .eq("user_id", this.userId);
    } catch (error) {
      console.error("Error updating status:", error);
    }
  }

  /**
   * Enregistre le login
   */
  async recordLogin() {
    if (!this.userId) return;

    try {
      await this.supabase.from("user_activity_log").insert({
        user_id: this.userId,
        activity_type: "login",
        login_time: new Date().toISOString(),
        page_visited: window.location.pathname,
        device_info: navigator.userAgent,
        status: "online",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error recording login:", error);
    }
  }

  /**
   * Enregistre le logout
   */
  async recordLogout() {
    if (!this.userId) return;

    try {
      await this.supabase.from("user_activity_log").insert({
        user_id: this.userId,
        activity_type: "logout",
        timestamp: new Date().toISOString(),
      });

      await this.updateStatus("offline");
    } catch (error) {
      console.error("Error recording logout:", error);
    }
  }

  /**
   * Démarre le tracking automatique d'inactivité
   */
  private startActivityTracking() {
    // Écouter les mouvements souris
    document.addEventListener("mousemove", () => this.handleActivity());
    document.addEventListener("keydown", () => this.handleActivity());
    document.addEventListener("click", () => this.handleActivity());
    document.addEventListener("scroll", () => this.handleActivity());

    // Vérifier l'inactivité toutes les minutes
    setInterval(() => {
      const inactiveMinutes = (Date.now() - this.lastActivityTime.getTime()) / 60000;
      
      if (inactiveMinutes > 15) {
        this.updateStatus("offline");
      } else if (inactiveMinutes > 5) {
        this.updateStatus("away");
      } else if (inactiveMinutes > 2) {
        this.updateStatus("idle");
      } else {
        this.updateStatus("online");
      }
    }, 60000);
  }

  /**
   * Gère l'activité utilisateur
   */
  private handleActivity() {
    if (this.activityTimeout) {
      clearTimeout(this.activityTimeout);
    }

    this.lastActivityTime = new Date();
    this.updateStatus("online");

    // Débounce pour éviter trop d'enregistrements
    this.activityTimeout = setTimeout(() => {
      this.recordActivity("click");
    }, 5000);
  }

  /**
   * Obtient l'adresse IP de l'utilisateur
   */
  private async getUserIP(): Promise<string> {
    try {
      const response = await fetch("https://api.ipify.org?format=json");
      const data = await response.json();
      return data.ip;
    } catch {
      return "unknown";
    }
  }

  /**
   * Arrête le tracker
   */
  destroy() {
    document.removeEventListener("mousemove", () => this.handleActivity());
    document.removeEventListener("keydown", () => this.handleActivity());
    document.removeEventListener("click", () => this.handleActivity());
    document.removeEventListener("scroll", () => this.handleActivity());

    if (this.activityTimeout) {
      clearTimeout(this.activityTimeout);
    }
  }
}

export const userActivityTracker = new UserActivityTracker();

/**
 * Hook React pour le tracking d'activité
 */
export function useActivityTracker(userId: string | null) {
  React.useEffect(() => {
    if (!userId) return;

    userActivityTracker.init(userId).then(() => {
      userActivityTracker.recordLogin();
    });

    return () => {
      userActivityTracker.recordLogout();
      userActivityTracker.destroy();
    };
  }, [userId]);
}

// Import React pour useEffect
import React from "react";
