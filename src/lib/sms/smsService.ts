/**
 * SMS Service using Twilio
 *
 * Secure SMS sending for:
 * - Phone verification OTP
 * - Two-factor authentication
 * - Important notifications
 */

import twilio from 'twilio';

class SMSService {
  private client: any;
  private fromNumber: string;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER || '';

    if (accountSid && authToken) {
      this.client = twilio(accountSid, authToken);
    }
  }

  /**
   * Check if SMS service is configured
   */
  isConfigured(): boolean {
    return !!(this.client && this.fromNumber);
  }

  /**
   * Send a generic SMS
   */
  async sendSMS(to: string, message: string): Promise<{ success: boolean; error?: string; messageId?: string }> {
    try {
      if (!this.isConfigured()) {
        console.error('Twilio is not configured');
        return { success: false, error: 'SMS service not configured' };
      }

      // Validate phone number format
      if (!to.startsWith('+')) {
        return { success: false, error: 'Phone number must include country code (e.g., +33...)' };
      }

      const result = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: to,
      });

      console.log('SMS sent successfully:', result.sid);
      return { success: true, messageId: result.sid };
    } catch (error: any) {
      console.error('Error sending SMS:', error);
      return {
        success: false,
        error: error.message || 'Failed to send SMS'
      };
    }
  }

  /**
   * Send OTP verification SMS
   */
  async sendOTPSMS(to: string, code: string, expiresInSeconds: number): Promise<{ success: boolean; error?: string }> {
    const message = `🔐 AnyLibre - Code de vérification

Votre code : ${code}

⏱️ Expire dans ${expiresInSeconds}s

⚠️ Ne partagez jamais ce code.`;

    return this.sendSMS(to, message);
  }

  /**
   * Send a notification SMS
   */
  async sendNotificationSMS(to: string, notification: string): Promise<{ success: boolean; error?: string }> {
    const message = `📢 AnyLibre

${notification}`;

    return this.sendSMS(to, message);
  }

  /**
   * Validate phone number format (basic validation)
   */
  validatePhoneNumber(phone: string): { valid: boolean; error?: string } {
    // Remove spaces and dashes
    const cleaned = phone.replace(/[\s-]/g, '');

    // Must start with +
    if (!cleaned.startsWith('+')) {
      return { valid: false, error: 'Le numéro doit inclure l\'indicatif pays (ex: +33...)' };
    }

    // Must be between 10-15 digits (after +)
    const digits = cleaned.slice(1);
    if (!/^\d{10,15}$/.test(digits)) {
      return { valid: false, error: 'Format de numéro invalide' };
    }

    return { valid: true };
  }
}

export const smsService = new SMSService();
