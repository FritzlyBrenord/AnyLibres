// ============================================================================
// INVOICE SERVICE - Génération de Factures PDF
// ============================================================================

import { createClient } from '@/lib/supabase/server';
import type { Invoice } from '@/types/payment';

/**
 * Service de génération de factures PDF
 *
 * Pour activer la génération réelle :
 * 1. npm install jspdf ou @react-pdf/renderer
 * 2. Implémenter generatePDFContent()
 * 3. Uploader vers Supabase Storage ou S3
 */
export class InvoiceService {
  /**
   * Créer une facture pour une commande
   */
  async createInvoiceForOrder(orderId: string): Promise<Invoice> {
    const supabase = await createClient();

    // 1. Récupérer la commande avec détails
    const { data: order } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(*),
        client:client_id(full_name, email, phone),
        provider:provider_id(full_name, email, company_name)
      `)
      .eq('id', orderId)
      .single();

    if (!order) {
      throw new Error('Order not found');
    }

    // 2. Récupérer le paiement associé
    const { data: payment } = await supabase
      .from('payments')
      .select('*')
      .eq('order_id', orderId)
      .single();

    // 3. Calculer les montants
    const subtotal = order.total_cents - (order.fees_cents || 0);
    const fees = order.fees_cents || 0;
    const tax = 0; // À implémenter selon la juridiction
    const total = order.total_cents;

    // 4. Créer la facture
    const { data: invoice, error } = await supabase
      .from('invoices')
      .insert({
        order_id: orderId,
        payment_id: payment?.id || null,
        client_id: order.client_id,
        provider_id: order.provider_id,
        subtotal_cents: subtotal,
        tax_cents: tax,
        fees_cents: fees,
        total_cents: total,
        status: payment?.status === 'succeeded' ? 'paid' : 'issued',
        issue_date: new Date().toISOString().split('T')[0],
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create invoice: ${error.message}`);
    }

    // 5. Générer le PDF (asynchrone)
    this.generatePDFAsync(invoice.id, order, payment);

    return invoice;
  }

  /**
   * Générer le PDF de façon asynchrone
   */
  private async generatePDFAsync(invoiceId: string, order: any, payment: any) {
    try {
      // Simulation de génération PDF
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const pdfUrl = await this.uploadPDFToStorage(invoiceId, order, payment);

      // Mettre à jour la facture
      const supabase = await createClient();
      await supabase
        .from('invoices')
        .update({
          pdf_url: pdfUrl,
          pdf_generated: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', invoiceId);

      console.log(`[InvoiceService] PDF generated for invoice ${invoiceId}`);
    } catch (error) {
      console.error('[InvoiceService] Error generating PDF:', error);
    }
  }

  /**
   * Générer le contenu PDF (à implémenter)
   */
  private async uploadPDFToStorage(
    invoiceId: string,
    order: any,
    payment: any
  ): Promise<string> {
    // TODO: Implémenter avec jsPDF ou @react-pdf/renderer
    //
    // Exemple avec jsPDF:
    // import jsPDF from 'jspdf';
    //
    // const doc = new jsPDF();
    // doc.setFontSize(20);
    // doc.text('FACTURE', 105, 20, { align: 'center' });
    //
    // doc.setFontSize(12);
    // doc.text(`Numéro: ${invoice.invoice_number}`, 20, 40);
    // doc.text(`Date: ${invoice.issue_date}`, 20, 50);
    //
    // // Détails client
    // doc.text('Client:', 20, 70);
    // doc.text(order.client.full_name, 20, 80);
    // doc.text(order.client.email, 20, 90);
    //
    // // Détails prestataire
    // doc.text('Prestataire:', 120, 70);
    // doc.text(order.provider.full_name, 120, 80);
    //
    // // Tableau des services
    // doc.text('Services:', 20, 110);
    // // ... ajouter tableau
    //
    // // Totaux
    // doc.text(`Sous-total: ${subtotal}€`, 120, 200);
    // doc.text(`Frais: ${fees}€`, 120, 210);
    // doc.text(`Total: ${total}€`, 120, 220);
    //
    // const pdfBuffer = doc.output('arraybuffer');
    //
    // // Uploader vers Supabase Storage
    // const { data, error } = await supabase.storage
    //   .from('invoices')
    //   .upload(`${invoiceId}.pdf`, pdfBuffer, {
    //     contentType: 'application/pdf',
    //   });

    // Pour le moment, retourner une URL simulée
    return `/api/invoices/${invoiceId}/download`;
  }

  /**
   * Récupérer une facture
   */
  async getInvoice(invoiceId: string): Promise<Invoice | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (error) {
      console.error('[InvoiceService] Error fetching invoice:', error);
      return null;
    }

    return data;
  }

  /**
   * Récupérer toutes les factures d'un client
   */
  async getClientInvoices(clientId: string): Promise<Invoice[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[InvoiceService] Error fetching invoices:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Récupérer toutes les factures d'un prestataire
   */
  async getProviderInvoices(providerId: string): Promise<Invoice[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('provider_id', providerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[InvoiceService] Error fetching invoices:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Générer le contenu HTML de la facture (pour prévisualisation)
   */
  generateInvoiceHTML(invoice: Invoice, order: any, client: any, provider: any): string {
    const formatCents = (cents: number) => (cents / 100).toFixed(2) + ' €';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Facture ${invoice.invoice_number}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    .header { text-align: center; margin-bottom: 40px; }
    .header h1 { color: #7C3AED; margin: 0; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 40px; }
    .info-box { border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px; }
    .info-box h3 { margin-top: 0; color: #374151; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    th { background: #f9fafb; font-weight: 600; }
    .total-section { text-align: right; }
    .total-section .line { display: flex; justify-content: space-between; margin-bottom: 8px; }
    .total-section .total { font-size: 20px; font-weight: bold; color: #7C3AED; margin-top: 16px; }
    .footer { text-align: center; margin-top: 60px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>FACTURE</h1>
    <p><strong>${invoice.invoice_number}</strong></p>
    <p>Date d'émission: ${new Date(invoice.issue_date).toLocaleDateString('fr-FR')}</p>
  </div>

  <div class="info-grid">
    <div class="info-box">
      <h3>Client</h3>
      <p><strong>${client?.full_name || 'N/A'}</strong></p>
      <p>${client?.email || 'N/A'}</p>
      <p>${client?.phone || ''}</p>
    </div>

    <div class="info-box">
      <h3>Prestataire</h3>
      <p><strong>${provider?.full_name || provider?.company_name || 'N/A'}</strong></p>
      <p>${provider?.email || 'N/A'}</p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th>Quantité</th>
        <th>Prix unitaire</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      ${order.order_items
        ?.map(
          (item: any) => `
        <tr>
          <td>${item.title}</td>
          <td>${item.quantity}</td>
          <td>${formatCents(item.unit_price_cents)}</td>
          <td>${formatCents(item.subtotal_cents)}</td>
        </tr>
      `
        )
        .join('') || ''}
    </tbody>
  </table>

  <div class="total-section" style="max-width: 300px; margin-left: auto;">
    <div class="line">
      <span>Sous-total</span>
      <span>${formatCents(invoice.subtotal_cents)}</span>
    </div>
    <div class="line">
      <span>Frais de service</span>
      <span>${formatCents(invoice.fees_cents)}</span>
    </div>
    ${
      invoice.tax_cents > 0
        ? `
    <div class="line">
      <span>TVA</span>
      <span>${formatCents(invoice.tax_cents)}</span>
    </div>
    `
        : ''
    }
    <hr style="margin: 16px 0;">
    <div class="total">
      <div class="line">
        <span>Total</span>
        <span>${formatCents(invoice.total_cents)}</span>
      </div>
    </div>
  </div>

  <div class="footer">
    <p>Merci pour votre confiance !</p>
    <p>AnyLibre - Plateforme de services freelance</p>
    <p>Contact: support@anylibre.com</p>
  </div>
</body>
</html>
    `;
  }
}

// ============================================================================
// INSTANCE SINGLETON
// ============================================================================

let invoiceServiceInstance: InvoiceService | null = null;

/**
 * Obtenir l'instance du service de factures
 */
export function getInvoiceService(): InvoiceService {
  if (!invoiceServiceInstance) {
    invoiceServiceInstance = new InvoiceService();
  }
  return invoiceServiceInstance;
}