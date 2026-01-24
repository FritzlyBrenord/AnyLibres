/**
 * Utilitaires d'export pour Analytics
 */

interface ExportData {
  title: string;
  data: any[];
  columns: string[];
}

/**
 * Exporte les données en CSV
 */
export function exportToCSV(exportData: ExportData): void {
  const { title, data, columns } = exportData;

  // Créer l'en-tête
  let csv = `${title}\n`;
  csv += `Date: ${new Date().toLocaleDateString()}\n\n`;

  // Ajouter les colonnes
  csv += columns.join(",") + "\n";

  // Ajouter les données
  data.forEach((row) => {
    const values = columns.map((col) => {
      const value = row[col] || "";
      // Échapper les guillemets
      return `"${String(value).replace(/"/g, '""')}"`;
    });
    csv += values.join(",") + "\n";
  });

  // Télécharger
  downloadFile(csv, `${title}.csv`, "text/csv");
}

/**
 * Exporte les données en JSON
 */
export function exportToJSON(exportData: ExportData): void {
  const { title, data } = exportData;

  const jsonData = {
    title,
    exportedAt: new Date().toISOString(),
    totalRecords: data.length,
    data,
  };

  const json = JSON.stringify(jsonData, null, 2);
  downloadFile(json, `${title}.json`, "application/json");
}

/**
 * Exporte les données en PDF (simple)
 */
export function exportToPDF(exportData: ExportData): void {
  const { title, data, columns } = exportData;

  let pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length ${title.length + 50} >>
stream
BT
/F1 12 Tf
50 750 Td
(${title}) Tj
0 -20 Td
(Exported: ${new Date().toLocaleDateString()}) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000214 00000 n
0000000322 00000 n
trailer
<< /Size 6 /Root 1 0 R >>
startxref
407
%%EOF`;

  downloadFile(pdfContent, `${title}.pdf`, "application/pdf");
}

/**
 * Crée un fichier Excel (XLSX) - version simple
 */
export function exportToXLSX(exportData: ExportData): void {
  const { title, data, columns } = exportData;

  // Note: Pour un vrai XLSX, utilisez une librairie comme 'xlsx' ou 'exceljs'
  // Ceci est une version simplifiée qui génère une structure XML basique

  let xlsxContent = `<?xml version="1.0" encoding="UTF-8"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>
    <row r="1">
      <c r="A1" t="inlineStr"><is><t>${title}</t></is></c>
    </row>
    <row r="2">
      <c r="A2" t="inlineStr"><is><t>Exported: ${new Date().toLocaleDateString()}</t></is></c>
    </row>
    <row r="3">
      ${columns.map((col, i) => `<c r="${String.fromCharCode(65 + i)}3" t="inlineStr"><is><t>${col}</t></is></c>`).join("")}
    </row>
    ${data.map((row, rowIndex) => `
      <row r="${rowIndex + 4}">
        ${columns.map((col, colIndex) => `<c r="${String.fromCharCode(65 + colIndex)}${rowIndex + 4}" t="inlineStr"><is><t>${row[col] || ""}</t></is></c>`).join("")}
      </row>
    `).join("")}
  </sheetData>
</worksheet>`;

  downloadFile(xlsxContent, `${title}.xlsx`, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
}

/**
 * Télécharge un fichier
 */
function downloadFile(
  content: string,
  filename: string,
  mimeType: string
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Génère un rapport HTML
 */
export function generateHTMLReport(
  title: string,
  sections: Array<{
    heading: string;
    content: string;
    data?: any[];
  }>,
  isDark: boolean = false
): string {
  const bgColor = isDark ? "#111827" : "#ffffff";
  const textColor = isDark ? "#e5e7eb" : "#111827";
  const borderColor = isDark ? "#374151" : "#e5e7eb";

  let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: ${bgColor};
      color: ${textColor};
      padding: 20px;
      line-height: 1.6;
    }
    h1 {
      border-bottom: 2px solid #3b82f6;
      padding-bottom: 10px;
      margin-bottom: 20px;
    }
    h2 {
      margin-top: 30px;
      margin-bottom: 15px;
      color: #3b82f6;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th, td {
      border: 1px solid ${borderColor};
      padding: 12px;
      text-align: left;
    }
    th {
      background-color: #3b82f6;
      color: white;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid ${borderColor};
      font-size: 12px;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <p><strong>Généré le:</strong> ${new Date().toLocaleString()}</p>`;

  sections.forEach((section) => {
    html += `<h2>${section.heading}</h2>`;
    html += `<p>${section.content}</p>`;

    if (section.data && section.data.length > 0) {
      const columns = Object.keys(section.data[0]);
      html += `<table>
        <thead>
          <tr>
            ${columns.map((col) => `<th>${col}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${section.data.map((row) => `
            <tr>
              ${columns.map((col) => `<td>${row[col] || ""}</td>`).join("")}
            </tr>
          `).join("")}
        </tbody>
      </table>`;
    }
  });

  html += `<div class="footer">
    <p>Analytics Live - Rapport généré automatiquement</p>
  </div>
</body>
</html>`;

  return html;
}

/**
 * Imprime les données d'analytics
 */
export function printAnalytics(
  title: string,
  sections: Array<{
    heading: string;
    content: string;
    data?: any[];
  }>,
  isDark: boolean = false
): void {
  const html = generateHTMLReport(title, sections, isDark);
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  }
}

/**
 * Copie le texte dans le presse-papiers
 */
export async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    console.error("Erreur de copie:", err);
  }
}

/**
 * Formate les données pour l'export
 */
export function formatExportData(
  title: string,
  data: any[],
  columns?: string[]
): ExportData {
  const cols = columns || (data.length > 0 ? Object.keys(data[0]) : []);
  return {
    title: title.replace(/\s+/g, "_"),
    data,
    columns: cols,
  };
}
