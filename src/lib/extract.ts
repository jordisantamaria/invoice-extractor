import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { invoiceDataSchema, InvoiceData, InvoiceStatus } from "./schema";
import { MODELS, AUTO_APPROVE_THRESHOLD } from "./models";
import { validateInvoice } from "./validate";

const SYSTEM_PROMPT = `You are an expert invoice data extractor. Extract structured data from the provided invoice.
Rules:
- Extract ALL line items visible in the invoice
- For Japanese invoices (請求書), pay attention to 税抜 (pre-tax) and 税込 (tax-included) amounts
- Currency should be the ISO code (JPY, USD, EUR, etc.)
- Tax rates should be decimal (0.1 for 10%, 0.08 for 8%)
- Dates should be in YYYY-MM-DD format
- If a field is not visible, omit it rather than guessing`;

interface ExtractionResult {
  data: InvoiceData;
  status: InvoiceStatus;
  modelUsed: string;
  validationErrors: string[];
  cascaded: boolean;
}

type ContentPart =
  | { type: "image"; image: string; mediaType: string }
  | { type: "file"; data: string; mediaType: string }
  | { type: "text"; text: string };

function buildFilePart(base64: string, mimeType: string): ContentPart {
  if (mimeType === "application/pdf") {
    return { type: "file", data: base64, mediaType: mimeType };
  }
  return { type: "image", image: base64, mediaType: mimeType };
}

async function extractFromVision(
  model: string,
  fileBase64: string,
  mimeType: string,
  hint?: string,
): Promise<InvoiceData> {
  const userText = hint
    ? `Extract all invoice data from this document. IMPORTANT: A previous extraction attempt had these validation errors:\n${hint}\nPlease pay extra attention to these issues and correct them.`
    : "Extract all invoice data from this document.";

  const { object } = await generateObject({
    model: openai(model),
    schema: invoiceDataSchema,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user" as const,
        content: [
          buildFilePart(fileBase64, mimeType) as never,
          { type: "text" as const, text: userText },
        ],
      },
    ],
  });

  return object;
}

async function extractFromText(
  model: string,
  textContent: string,
  hint?: string,
): Promise<InvoiceData> {
  const userText = hint
    ? `Extract all invoice data from this spreadsheet/CSV content. IMPORTANT: A previous extraction attempt had these validation errors:\n${hint}\nPlease pay extra attention to these issues and correct them.\n\n${textContent}`
    : `Extract all invoice data from this spreadsheet/CSV content:\n\n${textContent}`;

  const { object } = await generateObject({
    model: openai(model),
    schema: invoiceDataSchema,
    system: SYSTEM_PROMPT,
    prompt: userText,
  });

  return object;
}

function determineStatus(data: InvoiceData, validationErrors: string[]): InvoiceStatus {
  if (validationErrors.length > 0) {
    return "needs-review";
  }

  if (data.currency === "JPY" && data.total < AUTO_APPROVE_THRESHOLD) {
    return "auto-approved";
  }

  if (data.currency !== "JPY") {
    return "auto-approved";
  }

  return "needs-review";
}

type ExtractFn = (model: string, hint?: string) => Promise<InvoiceData>;

async function cascadingExtract(extractFn: ExtractFn): Promise<ExtractionResult> {
  // Step 1: Try with fast model
  const fastData = await extractFn(MODELS.fast);
  const fastErrors = validateInvoice(fastData);

  if (fastErrors.length === 0) {
    return {
      data: fastData,
      status: determineStatus(fastData, fastErrors),
      modelUsed: MODELS.fast,
      validationErrors: [],
      cascaded: false,
    };
  }

  // Step 2: Cascade to accurate model with error hints
  const hint = fastErrors.join("\n");
  const accurateData = await extractFn(MODELS.accurate, hint);
  const accurateErrors = validateInvoice(accurateData);

  return {
    data: accurateData,
    status: determineStatus(accurateData, accurateErrors),
    modelUsed: MODELS.accurate,
    validationErrors: accurateErrors,
    cascaded: true,
  };
}

export async function extractInvoice(
  fileBase64: string,
  mimeType: string,
): Promise<ExtractionResult> {
  return cascadingExtract((model, hint) =>
    extractFromVision(model, fileBase64, mimeType, hint),
  );
}

export async function extractInvoiceFromText(
  textContent: string,
): Promise<ExtractionResult> {
  return cascadingExtract((model, hint) =>
    extractFromText(model, textContent, hint),
  );
}
