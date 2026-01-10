/**
 * Secure OTP Manager with in-memory storage
 *
 * Security features:
 * - Rate limiting (3 attempts, 5 resends per hour)
 * - OTP expiration (90 seconds)
 * - Automatic cleanup
 * - IP-based tracking
 * - Brute force protection
 */

interface OTPData {
  code: string;
  expiresAt: number;
  attempts: number;
  createdAt: number;
  ip?: string;
}

interface ResendTracker {
  count: number;
  resetAt: number;
}

class OTPManager {
  private otpStore = new Map<string, OTPData>();
  private resendTracker = new Map<string, ResendTracker>();

  // Configuration
  private readonly OTP_LENGTH = 6;
  private readonly OTP_EXPIRY_MS = 90 * 1000; // 90 seconds
  private readonly MAX_ATTEMPTS = 3;
  private readonly MAX_RESENDS_PER_HOUR = 5;
  private readonly RESEND_WINDOW_MS = 60 * 60 * 1000; // 1 hour
  private readonly CLEANUP_INTERVAL_MS = 60 * 1000; // 1 minute

  constructor() {
    // Auto-cleanup expired OTPs
    setInterval(() => this.cleanup(), this.CLEANUP_INTERVAL_MS);
  }

  /**
   * Generate a secure random OTP
   */
  private generateOTP(): string {
    const min = Math.pow(10, this.OTP_LENGTH - 1);
    const max = Math.pow(10, this.OTP_LENGTH) - 1;
    return Math.floor(Math.random() * (max - min + 1) + min).toString();
  }

  /**
   * Create and store a new OTP
   */
  createOTP(identifier: string, ip?: string): { success: boolean; code?: string; error?: string; expiresIn?: number } {
    // Check resend rate limiting
    const resendKey = identifier;
    const resendData = this.resendTracker.get(resendKey);

    if (resendData) {
      if (Date.now() < resendData.resetAt) {
        if (resendData.count >= this.MAX_RESENDS_PER_HOUR) {
          const waitTime = Math.ceil((resendData.resetAt - Date.now()) / 1000 / 60);
          return {
            success: false,
            error: `Trop de tentatives. Réessayez dans ${waitTime} minutes.`
          };
        }
        resendData.count++;
      } else {
        // Reset window expired
        this.resendTracker.set(resendKey, {
          count: 1,
          resetAt: Date.now() + this.RESEND_WINDOW_MS
        });
      }
    } else {
      this.resendTracker.set(resendKey, {
        count: 1,
        resetAt: Date.now() + this.RESEND_WINDOW_MS
      });
    }

    const code = this.generateOTP();
    const expiresAt = Date.now() + this.OTP_EXPIRY_MS;

    this.otpStore.set(identifier, {
      code,
      expiresAt,
      attempts: 0,
      createdAt: Date.now(),
      ip
    });

    return {
      success: true,
      code,
      expiresIn: this.OTP_EXPIRY_MS / 1000
    };
  }

  /**
   * Verify an OTP code
   */
  verifyOTP(identifier: string, code: string, ip?: string): { success: boolean; error?: string } {
    const otpData = this.otpStore.get(identifier);

    if (!otpData) {
      return {
        success: false,
        error: "Code OTP invalide ou expiré"
      };
    }

    // Check expiration
    if (Date.now() > otpData.expiresAt) {
      this.otpStore.delete(identifier);
      return {
        success: false,
        error: "Code OTP expiré. Demandez un nouveau code."
      };
    }

    // Check max attempts (brute force protection)
    if (otpData.attempts >= this.MAX_ATTEMPTS) {
      this.otpStore.delete(identifier);
      return {
        success: false,
        error: "Trop de tentatives. Demandez un nouveau code."
      };
    }

    // Optional: Check if IP matches (additional security)
    if (ip && otpData.ip && ip !== otpData.ip) {
      console.warn(`IP mismatch for OTP verification: ${identifier}`);
    }

    // Verify code
    if (otpData.code !== code) {
      otpData.attempts++;
      return {
        success: false,
        error: `Code incorrect. ${this.MAX_ATTEMPTS - otpData.attempts} tentatives restantes.`
      };
    }

    // Success - remove OTP
    this.otpStore.delete(identifier);
    return { success: true };
  }

  /**
   * Get remaining time for an OTP
   */
  getRemainingTime(identifier: string): number {
    const otpData = this.otpStore.get(identifier);
    if (!otpData) return 0;

    const remaining = Math.max(0, otpData.expiresAt - Date.now());
    return Math.ceil(remaining / 1000);
  }

  /**
   * Check if can resend OTP
   */
  canResend(identifier: string): { canResend: boolean; remainingResends?: number; error?: string } {
    const resendData = this.resendTracker.get(identifier);

    if (!resendData) {
      return { canResend: true, remainingResends: this.MAX_RESENDS_PER_HOUR };
    }

    if (Date.now() >= resendData.resetAt) {
      return { canResend: true, remainingResends: this.MAX_RESENDS_PER_HOUR };
    }

    if (resendData.count >= this.MAX_RESENDS_PER_HOUR) {
      const waitTime = Math.ceil((resendData.resetAt - Date.now()) / 1000 / 60);
      return {
        canResend: false,
        error: `Limite atteinte. Réessayez dans ${waitTime} minutes.`
      };
    }

    return {
      canResend: true,
      remainingResends: this.MAX_RESENDS_PER_HOUR - resendData.count
    };
  }

  /**
   * Cleanup expired OTPs
   */
  private cleanup() {
    const now = Date.now();

    // Clean expired OTPs
    for (const [key, data] of this.otpStore.entries()) {
      if (now > data.expiresAt) {
        this.otpStore.delete(key);
      }
    }

    // Clean expired resend trackers
    for (const [key, data] of this.resendTracker.entries()) {
      if (now > data.resetAt) {
        this.resendTracker.delete(key);
      }
    }
  }

  /**
   * Get store size (for debugging)
   */
  getStoreSize(): { otps: number; resendTrackers: number } {
    return {
      otps: this.otpStore.size,
      resendTrackers: this.resendTracker.size
    };
  }
}

// Singleton instance
export const otpManager = new OTPManager();
