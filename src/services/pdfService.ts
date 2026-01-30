import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Invoice, Client, Project } from "../types";

function esc(text: string | null): string {
  if (!text) return "";
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export async function exportInvoicePdf(invoice: Invoice, client: Client, project: Project) {
  const html = `
    <html>
      <head>
        <style>
          body { font-family: Helvetica, Arial, sans-serif; padding: 40px; color: #333; }
          h1 { font-size: 28px; margin-bottom: 4px; }
          .subtitle { color: #999; font-size: 14px; margin-bottom: 32px; }
          .section { margin-bottom: 24px; }
          .section-title { font-size: 12px; text-transform: uppercase; color: #999; margin-bottom: 8px; }
          .row { display: flex; justify-content: space-between; padding: 8px 0; }
          .label { color: #666; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          th { text-align: left; border-bottom: 2px solid #333; padding: 8px 0; font-size: 13px; text-transform: uppercase; color: #999; }
          td { padding: 10px 0; border-bottom: 1px solid #eee; }
          .total-row td { border-bottom: none; border-top: 2px solid #333; font-weight: bold; font-size: 18px; padding-top: 12px; }
          .badge { display: inline-block; padding: 4px 12px; border-radius: 6px; color: #fff; font-weight: bold; font-size: 12px; }
          .paid { background-color: #4CAF50; }
          .unpaid { background-color: #FF9800; }
        </style>
      </head>
      <body>
        <h1>Invoice #${invoice.invoiceNumber || invoice.id}</h1>
        <p class="subtitle">${new Date(invoice.createdAt).toLocaleDateString()}</p>

        <div class="section">
          <div class="section-title">Client</div>
          <div><strong>${esc(client.name)}</strong></div>
          ${client.company ? `<div>${esc(client.company)}</div>` : ""}
          ${client.email ? `<div>${esc(client.email)}</div>` : ""}
        </div>

        <div class="section">
          <div class="section-title">Project</div>
          <div><strong>${esc(project.name)}</strong></div>
        </div>

        <div class="section">
          <table>
            <tr>
              <th>Description</th>
              <th style="text-align:right">Hours</th>
              <th style="text-align:right">Rate</th>
              <th style="text-align:right">Amount</th>
            </tr>
            <tr>
              <td>${esc(project.name)}</td>
              <td style="text-align:right">${(invoice.hours ?? 0).toFixed(2)}</td>
              <td style="text-align:right">${(invoice.hourlyRate ?? 0).toFixed(2)} EUR</td>
              <td style="text-align:right">${invoice.amount.toFixed(2)} EUR</td>
            </tr>
            <tr class="total-row">
              <td colspan="3">Total</td>
              <td style="text-align:right">${invoice.amount.toFixed(2)} EUR</td>
            </tr>
          </table>
        </div>

        <div class="section">
          <span class="badge ${invoice.status}">${invoice.status.toUpperCase()}</span>
          ${invoice.paidAt ? `<span style="margin-left:12px;color:#999;">Paid on ${new Date(invoice.paidAt).toLocaleDateString()}</span>` : ""}
        </div>
      </body>
    </html>
  `;

  const { uri } = await Print.printToFileAsync({ html });
  await Sharing.shareAsync(uri, { mimeType: "application/pdf", UTI: "com.adobe.pdf" });
}
