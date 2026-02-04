/**
 * Email Service using Nodemailer with SMTP
 *
 * Multi-purpose email sending:
 * - OTP verification emails
 * - Contact notifications
 * - Order confirmations
 * - General notifications
 */

import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

class EmailService {
  private readonly DEFAULT_FROM = process.env.EMAIL_FROM || 'noreply@anylibre.com';
  private transporter: nodemailer.Transporter | null = null;

  /**
   * Initialize SMTP transporter
   */
  private getTransporter() {
    if (this.transporter) {
      return this.transporter;
    }

    // Configuration SMTP
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER || process.env.EMAIL_FROM,
        pass: process.env.SMTP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2',
      },
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000,
    });

    return this.transporter;
  }

  /**
   * Send a generic email
   */
  async sendEmail({ to, subject, html, from }: EmailOptions): Promise<{ success: boolean; error?: string }> {
    try {
      if (!process.env.SMTP_PASSWORD) {
        console.error('SMTP_PASSWORD is not configured');
        return { success: false, error: 'Email service not configured' };
      }

      const transporter = this.getTransporter();

      const info = await transporter.sendMail({
        from: from || this.DEFAULT_FROM,
        to,
        subject,
        html,
      });

      console.log('Email sent successfully:', info.messageId);
      return { success: true };
    } catch (error) {
      console.error('Error sending email:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to send email' };
    }
  }

  /**
   * Send OTP verification email
   */
  async sendOTPEmail(to: string, code: string, expiresInSeconds: number): Promise<{ success: boolean; error?: string }> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              margin: 0;
              padding: 40px 20px;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: white;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              padding: 40px 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              color: white;
              font-size: 28px;
              font-weight: 700;
            }
            .content {
              padding: 40px 30px;
            }
            .otp-box {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              border-radius: 12px;
              padding: 30px;
              text-align: center;
              margin: 30px 0;
            }
            .otp-code {
              font-size: 42px;
              font-weight: 700;
              color: white;
              letter-spacing: 8px;
              margin: 0;
              font-family: 'Courier New', monospace;
            }
            .info-text {
              color: #64748b;
              font-size: 15px;
              line-height: 1.6;
              margin: 20px 0;
            }
            .warning {
              background: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 15px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .warning p {
              margin: 0;
              color: #92400e;
              font-size: 14px;
            }
            .footer {
              background: #f8fafc;
              padding: 30px;
              text-align: center;
              border-top: 1px solid #e2e8f0;
            }
            .footer p {
              margin: 5px 0;
              color: #64748b;
              font-size: 13px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Vérification de votre compte</h1>
            </div>

            <div class="content">
              <p class="info-text">
                Bonjour,<br><br>
                Vous avez demandé à vérifier votre adresse email. Utilisez le code ci-dessous pour confirmer votre identité :
              </p>

              <div class="otp-box">
                <p class="otp-code">${code}</p>
              </div>

              <p class="info-text" style="text-align: center;">
                ⏱️ Ce code expire dans <strong>${expiresInSeconds} secondes</strong>
              </p>

              <div class="warning">
                <p>
                  <strong>⚠️ Important :</strong> Si vous n'avez pas demandé ce code, ignorez cet email.
                  Ne partagez jamais ce code avec qui que ce soit.
                </p>
              </div>

              <p class="info-text">
                Pour votre sécurité, ce code :
              </p>
              <ul class="info-text">
                <li>Est à usage unique</li>
                <li>Expire automatiquement après ${expiresInSeconds} secondes</li>
                <li>Ne peut être utilisé que 3 fois maximum</li>
              </ul>
            </div>

            <div class="footer">
              <p><strong>AnyLibre</strong></p>
              <p>Plateforme de services sécurisée</p>
              <p style="margin-top: 15px; color: #94a3b8;">
                Cet email a été envoyé automatiquement, merci de ne pas y répondre.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to,
      subject: `Code de vérification : ${code}`,
      html,
    });
  }

  /**
   * Send contact notification email
   */
  async sendContactNotification(userEmail: string, fromUser: string, message: string): Promise<{ success: boolean; error?: string }> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; }
            .content { padding: 20px; background: #f9fafb; border-radius: 8px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>📧 Nouveau message reçu</h2>
            </div>
            <div class="content">
              <p><strong>De :</strong> ${fromUser}</p>
              <p><strong>Message :</strong></p>
              <p>${message}</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: userEmail,
      subject: `Nouveau message de ${fromUser}`,
      html,
    });
  }

  /**
   * Send order confirmation email
   */
  async sendOrderConfirmation(userEmail: string, orderDetails: any): Promise<{ success: boolean; error?: string }> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 20px; border-radius: 8px; }
            .content { padding: 20px; background: #f9fafb; border-radius: 8px; margin-top: 20px; }
            .order-item { border-bottom: 1px solid #e5e7eb; padding: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>✅ Commande confirmée</h2>
            </div>
            <div class="content">
              <h3>Merci pour votre commande !</h3>
              <p>Numéro de commande : <strong>${orderDetails.orderId || 'N/A'}</strong></p>
              <p>Nous avons bien reçu votre commande et nous la traitons actuellement.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: userEmail,
      subject: `Confirmation de commande ${orderDetails.orderId || ''}`,
      html,
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(to: string, resetUrl: string, firstName: string): Promise<{ success: boolean; error?: string }> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%);
              margin: 0;
              padding: 40px 20px;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: white;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            }
            .header {
              background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%);
              padding: 40px 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              color: white;
              font-size: 28px;
              font-weight: 700;
            }
            .content {
              padding: 40px 30px;
            }
            .greeting {
              color: #1e293b;
              font-size: 18px;
              font-weight: 600;
              margin-bottom: 20px;
            }
            .info-text {
              color: #64748b;
              font-size: 15px;
              line-height: 1.6;
              margin: 20px 0;
            }
            .reset-button {
              display: block;
              background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%);
              color: white;
              text-decoration: none;
              padding: 16px 32px;
              border-radius: 12px;
              text-align: center;
              font-weight: 600;
              font-size: 16px;
              margin: 30px auto;
              max-width: 280px;
            }
            .warning {
              background: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 15px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .warning p {
              margin: 0;
              color: #92400e;
              font-size: 14px;
            }
            .url-box {
              background: #f1f5f9;
              border: 1px dashed #94a3b8;
              padding: 15px;
              border-radius: 8px;
              margin: 20px 0;
              word-break: break-all;
              color: #475569;
              font-size: 13px;
            }
            .footer {
              background: #f8fafc;
              padding: 30px;
              text-align: center;
              border-top: 1px solid #e2e8f0;
            }
            .footer p {
              margin: 5px 0;
              color: #64748b;
              font-size: 13px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Réinitialisation de mot de passe</h1>
            </div>

            <div class="content">
              <p class="greeting">Bonjour${firstName ? ` ${firstName}` : ''},</p>

              <p class="info-text">
                Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :
              </p>

              <a href="${resetUrl}" class="reset-button">
                Réinitialiser mon mot de passe
              </a>

              <p class="info-text" style="text-align: center;">
                ⏱️ Ce lien expire dans <strong>5 minutes</strong>
              </p>

              <p class="info-text">
                Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :
              </p>

              <div class="url-box">
                ${resetUrl}
              </div>

              <div class="warning">
                <p>
                  <strong>⚠️ Important :</strong> Si vous n'avez pas demandé cette réinitialisation, ignorez cet email. Votre compte reste sécurisé.
                </p>
              </div>

              <p class="info-text">
                Pour votre sécurité :
              </p>
              <ul class="info-text">
                <li>Ce lien est à usage unique</li>
                <li>Expire automatiquement après 5 minutes</li>
                <li>Ne partagez jamais ce lien</li>
              </ul>
            </div>

            <div class="footer">
              <p><strong>AnyLibre</strong></p>
              <p>Plateforme de services sécurisée</p>
              <p style="margin-top: 15px; color: #94a3b8;">
                Cet email a été envoyé automatiquement, merci de ne pas y répondre.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to,
      subject: 'Réinitialisation de votre mot de passe',
      html,
    });
  }
}

export const emailService = new EmailService();
