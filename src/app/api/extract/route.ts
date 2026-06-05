import { NextRequest, NextResponse, after } from "next/server";
import { extractInvoice, extractInvoiceFromText } from "@/lib/extract";
import { generateId, setInvoice } from "@/lib/store";
import { EMPTY_INVOICE_DATA } from "@/lib/schema";
import { isSpreadsheet, spreadsheetToText } from "@/lib/spreadsheet-to-text";

// Allow time for the (cascading) model call to finish in the after() callback.
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const imageMimeType = file.type;

    const isSheet = isSpreadsheet(imageMimeType);
    const isVision = imageMimeType === "application/pdf" || imageMimeType.startsWith("image/");

    if (!isSheet && !isVision) {
      return NextResponse.json(
        { error: "Unsupported file type. Upload a PDF, image, CSV, or Excel file." },
        { status: 400 },
      );
    }

    const id = generateId();
    const createdAt = new Date().toISOString();

    const textContent = isSheet ? spreadsheetToText(buffer, imageMimeType) : undefined;
    const imageBase64 = isSheet ? "" : buffer.toString("base64");

    // Persist a "processing" record immediately so the results page can poll
    // and show the progress UI while extraction runs.
    await setInvoice({
      id,
      status: "processing",
      data: EMPTY_INVOICE_DATA,
      imageBase64,
      imageMimeType,
      textContent,
      modelUsed: "",
      validationErrors: [],
      cascaded: false,
      createdAt,
    });

    // Run extraction AFTER responding (Vercel keeps the function alive for
    // after() callbacks up to maxDuration — reliable post-response work).
    after(async () => {
      try {
        const result = isSheet
          ? await extractInvoiceFromText(textContent as string)
          : await extractInvoice(imageBase64, imageMimeType);
        await setInvoice({
          id,
          status: result.status,
          data: result.data,
          imageBase64,
          imageMimeType,
          textContent,
          modelUsed: result.modelUsed,
          validationErrors: result.validationErrors,
          cascaded: result.cascaded,
          createdAt,
        });
      } catch (error) {
        console.error("Extraction error:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        await setInvoice({
          id,
          status: "failed",
          data: EMPTY_INVOICE_DATA,
          imageBase64,
          imageMimeType,
          textContent,
          modelUsed: "error",
          validationErrors: [message],
          cascaded: false,
          createdAt,
        }).catch((e) => console.error("Failed to persist failed-state record:", e));
      }
    });

    return NextResponse.json({ id, status: "processing" });
  } catch (error) {
    console.error("Extract route error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to extract invoice data", detail: message },
      { status: 500 },
    );
  }
}
