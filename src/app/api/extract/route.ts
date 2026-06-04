import { NextRequest, NextResponse } from "next/server";
import { extractInvoice, extractInvoiceFromText } from "@/lib/extract";
import { generateId, setInvoice } from "@/lib/store";
import { EMPTY_INVOICE_DATA } from "@/lib/schema";
import { isSpreadsheet, spreadsheetToText } from "@/lib/spreadsheet-to-text";

// Allow time for the (cascading) model call to finish within the request.
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  let id: string | null = null;
  let imageBase64 = "";
  let imageMimeType = "";
  let textContent: string | undefined;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    imageMimeType = file.type;

    const isSheet = isSpreadsheet(imageMimeType);
    const isVision = imageMimeType === "application/pdf" || imageMimeType.startsWith("image/");

    if (!isSheet && !isVision) {
      return NextResponse.json(
        { error: "Unsupported file type. Upload a PDF, image, CSV, or Excel file." },
        { status: 400 },
      );
    }

    id = generateId();

    // Extract synchronously so the work completes within the request (see
    // demo route for the rationale on auto-stopping Fly machines).
    let result;
    if (isSheet) {
      textContent = spreadsheetToText(buffer, imageMimeType);
      result = await extractInvoiceFromText(textContent);
    } else {
      imageBase64 = buffer.toString("base64");
      result = await extractInvoice(imageBase64, imageMimeType);
    }

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
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ id, status: result.status });
  } catch (error) {
    console.error("Extraction error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";

    // Persist a "failed" record if we got far enough, so the results page can
    // render a clear error instead of breaking.
    if (id) {
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
        createdAt: new Date().toISOString(),
      });
      return NextResponse.json({ id, status: "failed" });
    }

    return NextResponse.json(
      { error: "Failed to extract invoice data", detail: message },
      { status: 500 },
    );
  }
}
