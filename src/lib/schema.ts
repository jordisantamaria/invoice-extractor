import { z } from "zod";

// OpenAI structured outputs require all fields in `required`.
// Use `.nullable()` instead of `.optional()` for fields that may not be present.

export const lineItemSchema = z.object({
  description: z.string().describe("Item or service description"),
  quantity: z.number().describe("Quantity"),
  unitPrice: z.number().describe("Unit price"),
  amount: z.number().describe("Line total (quantity × unitPrice)"),
  taxRate: z.number().nullable().describe("Tax rate for this item if specified (e.g. 0.1 for 10%), null if not shown"),
});

export const invoiceDataSchema = z.object({
  vendorName: z.string().describe("Company or person issuing the invoice"),
  vendorAddress: z.string().nullable().describe("Vendor address if visible, null if not"),
  invoiceNumber: z.string().nullable().describe("Invoice number / 請求書番号, null if not visible"),
  invoiceDate: z.string().nullable().describe("Invoice date in YYYY-MM-DD format, null if not visible"),
  dueDate: z.string().nullable().describe("Payment due date in YYYY-MM-DD format, null if not visible"),
  items: z.array(lineItemSchema).describe("Line items on the invoice"),
  subtotal: z.number().describe("Subtotal before tax"),
  taxAmount: z.number().describe("Total tax amount"),
  taxRate: z.number().nullable().describe("Overall tax rate if uniform (e.g. 0.1 for 10%), null if mixed or not shown"),
  total: z.number().describe("Grand total including tax"),
  currency: z.string().describe("Currency code: JPY, USD, EUR, etc."),
  language: z.enum(["ja", "en", "other"]).describe("Primary language of the invoice"),
  notes: z.string().nullable().describe("Any additional notes or payment instructions, null if none"),
});

export type LineItem = z.infer<typeof lineItemSchema>;
export type InvoiceData = z.infer<typeof invoiceDataSchema>;

export type InvoiceStatus = "processing" | "auto-approved" | "needs-review" | "approved" | "corrected";

export interface StoredInvoice {
  id: string;
  status: InvoiceStatus;
  data: InvoiceData;
  imageBase64: string;
  imageMimeType: string;
  /** Plain-text representation for spreadsheet uploads (CSV/Excel) */
  textContent?: string;
  modelUsed: string;
  validationErrors: string[];
  cascaded: boolean;
  createdAt: string;
}
