// ============================================================================
// User Behavioral Tracking System
// Système de tracking comportemental avec localStorage + sync API
// ============================================================================

import { createClient } from '@/lib/supabase/client';

// Types
export interface UserActivity {
  activityType:
  | 'view_service'
  | 'view_provider'
  | 'search'
  | 'favorite'
  | 'unfavorite'
  | 'order'
  | 'message'
  | 'review'
  | 'share'
  | 'click'
  | 'scroll'
  | 'hover'
  | 'filter'
  | 'sort';
  entityType?: 'service' | 'provider' | 'category' | 'search' | 'other';
  entityId?: string;
  entityData?: any;
  searchQuery?: string;
  filtersApplied?: any;
  durationSeconds?: number;
  scrollDepth?: number;
  pageUrl?: string;
  referrerUrl?: string;
  deviceType?: 'mobile' | 'tablet' | 'desktop';
}

export interface LocalStorageData {
  views: Array<{ id: string; type: string; timestamp: number; data?: any }>;
  searches: Array<{ query: string; timestamp: number; filters?: any }>;
  favorites: string[];
  lastSync: number;
  sessionStart: number;
  pageViews: Record<string, number>;
}

class UserTracker {
  private STORAGE_KEY = 'anylibre_user_data';
  private SYNC_INTERVAL = 60000; // Sync toutes les 60 secondes
  private syncTimer: NodeJS.Timeout | null = null;
  private sessionStartTime: number = Date.now();
  private currentPageStartTime: number = Date.now();
  private scrollDepth: number = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeTracking();
    }
  }

  // ============================================================================
  // Initialization
  // ============================================================================

  private initializeTracking() {
    // Initialiser localStorage si vide
    if (!this.getLocalData()) {
      this.setLocalData({
        views: [],
        searches: [],
        favorites: [],
        lastSync: 0,
        sessionStart: Date.now(),
        pageViews: {},
      });
    }

    // Détecter le type d'appareil
    this.detectDeviceType();

    // Tracker le scroll
    this.setupScrollTracking();

    // Sync périodique
    this.startPeriodicSync();

    // Sync avant fermeture
    this.setupBeforeUnload();
  }

  // ============================================================================
  // LocalStorage Management
  // ============================================================================

  private getLocalData(): LocalStorageData | null {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  private setLocalData(data: LocalStorageData) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  private updateLocalData(updates: Partial<LocalStorageData>) {
    const current = this.getLocalData() || {
      views: [],
      searches: [],
      favorites: [],
      lastSync: 0,
      sessionStart: Date.now(),
      pageViews: {},
    };
    this.setLocalData({ ...current, ...updates });
  }

  // ============================================================================
  // Device & Context Detection
  // ============================================================================

  private detectDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  private getCurrentContext() {
    return {
      pageUrl: window.location.href,
      referrerUrl: document.referrer,
      deviceType: this.detectDeviceType(),
    };
  }

  // ============================================================================
  // Scroll Tracking
  // ============================================================================

  private setupScrollTracking() {
    let ticking = false;

    const updateScrollDepth = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;

      const depth = Math.round(
        ((scrollTop + windowHeight) / documentHeight) * 100
      );
      this.scrollDepth = Math.max(this.scrollDepth, depth);
      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollDepth);
        ticking = true;
      }
    });
  }

  // ============================================================================
  // Activity Tracking Methods
  // ============================================================================

  public trackServiceView(serviceId: string, serviceData?: any) {
    const data = this.getLocalData();
    if (data) {
      data.views.push({
        id: serviceId,
        type: 'service',
        timestamp: Date.now(),
        data: serviceData,
      });
      // Garder seulement les 100 dernières vues
      if (data.views.length > 100) {
        data.views = data.views.slice(-100);
      }
      this.setLocalData(data);
    }

    this.trackActivity({
      activityType: 'view_service',
      entityType: 'service',
      entityId: serviceId,
      entityData: serviceData,
      ...this.getCurrentContext(),
    });

    // Increment view count in DB
    fetch(`/api/services/${serviceId}/view`, { method: 'POST' }).catch(err =>
      console.error('Error incrementing view count:', err)
    );
  }

  public trackProviderView(providerId: string, providerData?: any) {
    const data = this.getLocalData();
    if (data) {
      data.views.push({
        id: providerId,
        type: 'provider',
        timestamp: Date.now(),
        data: providerData,
      });
      if (data.views.length > 100) {
        data.views = data.views.slice(-100);
      }
      this.setLocalData(data);
    }

    this.trackActivity({
      activityType: 'view_provider',
      entityType: 'provider',
      entityId: providerId,
      entityData: providerData,
      ...this.getCurrentContext(),
    });
  }

  public trackSearch(query: string, filters?: any) {
    const data = this.getLocalData();
    if (data) {
      data.searches.push({
        query,
        timestamp: Date.now(),
        filters,
      });
      // Garder seulement les 50 dernières recherches
      if (data.searches.length > 50) {
        data.searches = data.searches.slice(-50);
      }
      this.setLocalData(data);
    }

    this.trackActivity({
      activityType: 'search',
      entityType: 'search',
      searchQuery: query,
      filtersApplied: filters,
      ...this.getCurrentContext(),
    });
  }

  public trackFavorite(serviceId: string, isFavorite: boolean) {
    const data = this.getLocalData();
    if (data) {
      if (isFavorite) {
        if (!data.favorites.includes(serviceId)) {
          data.favorites.push(serviceId);
        }
      } else {
        data.favorites = data.favorites.filter((id) => id !== serviceId);
      }
      this.setLocalData(data);
    }

    this.trackActivity({
      activityType: isFavorite ? 'favorite' : 'unfavorite',
      entityType: 'service',
      entityId: serviceId,
      ...this.getCurrentContext(),
    });
  }

  public trackPageView(pagePath: string) {
    const data = this.getLocalData();
    if (data) {
      data.pageViews[pagePath] = (data.pageViews[pagePath] || 0) + 1;
      this.setLocalData(data);
    }

    this.currentPageStartTime = Date.now();
    this.scrollDepth = 0;
  }

  public trackPageExit() {
    const duration = Math.round((Date.now() - this.currentPageStartTime) / 1000);

    this.trackActivity({
      activityType: 'scroll',
      durationSeconds: duration,
      scrollDepth: this.scrollDepth,
      ...this.getCurrentContext(),
    });
  }

  // ============================================================================
  // Generic Activity Tracking
  // ============================================================================

  private async trackActivity(activity: UserActivity) {
    try {
      // Envoyer à l'API
      await fetch('/api/tracking/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activity),
      });
    } catch (error) {
      console.error('Error tracking activity:', error);
    }
  }

  // ============================================================================
  // Sync with Backend
  // ============================================================================

  private startPeriodicSync() {
    this.syncTimer = setInterval(() => {
      this.syncToBackend();
    }, this.SYNC_INTERVAL);
  }

  private setupBeforeUnload() {
    window.addEventListener('beforeunload', () => {
      this.trackPageExit();
      this.syncToBackend();
    });
  }

  private async syncToBackend() {
    const data = this.getLocalData();
    if (!data) return;

    try {
      await fetch('/api/tracking/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          views: data.views,
          searches: data.searches,
          favorites: data.favorites,
          pageViews: data.pageViews,
          sessionDuration: Math.round((Date.now() - data.sessionStart) / 1000),
        }),
      });

      // Mettre à jour lastSync
      this.updateLocalData({ lastSync: Date.now() });
    } catch (error) {
      console.error('Error syncing to backend:', error);
    }
  }

  // ============================================================================
  // Get User Data
  // ============================================================================

  public getUserData(): LocalStorageData | null {
    return this.getLocalData();
  }

  public getRecentViews(limit: number = 10) {
    const data = this.getLocalData();
    return data?.views.slice(-limit).reverse() || [];
  }

  public getRecentSearches(limit: number = 5) {
    const data = this.getLocalData();
    return data?.searches.slice(-limit).reverse() || [];
  }

  public getFavorites() {
    const data = this.getLocalData();
    return data?.favorites || [];
  }

  // ============================================================================
  // Cleanup
  // ============================================================================

  public destroy() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }
  }
}

// Export singleton
export const userTracker = new UserTracker();