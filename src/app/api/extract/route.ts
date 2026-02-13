import { NextRequest, NextResponse } from "next/server";
import { extractInvoice, extractInvoiceFromText } from "@/lib/extract";
import { generateId, setInvoice } from "@/lib/store";
import { isSpreadsheet, spreadsheetToText } from "@/lib/spreadsheet-to-text";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type;
    const id = generateId();

    if (isSpreadsheet(mimeType)) {
      // Spreadsheet path: convert to text, extract via text prompt
      const textContent = spreadsheetToText(buffer, mimeType);

      setInvoice({
        id,
        status: "processing",
        data: {} as never,
        imageBase64: "",
        imageMimeType: mimeType,
        textContent,
        modelUsed: "",
        validationErrors: [],
        cascaded: false,
        createdAt: new Date().toISOString(),
      });

      extractInvoiceFromText(textContent)
        .then((result) => {
          setInvoice({
            id,
            status: result.status,
            data: result.data,
            imageBase64: "",
            imageMimeType: mimeType,
            textContent,
            modelUsed: result.modelUsed,
            validationErrors: result.validationErrors,
            cascaded: result.cascaded,
            createdAt: new Date().toISOString(),
          });
        })
        .catch((error) => {
          console.error("Background extraction error:", error);
          setInvoice({
            id,
            status: "needs-review",
            data: {} as never,
            imageBase64: "",
            imageMimeType: mimeType,
            textContent,
            modelUsed: "error",
            validationErrors: [error instanceof Error ? error.message : "Extraction failed"],
            cascaded: false,
            createdAt: new Date().toISOString(),
          });
        });
    } else if (mimeType === "application/pdf" || mimeType.startsWith("image/")) {
      // Vision path: send image/PDF to OpenAI
      const fileBase64 = buffer.toString("base64");

      setInvoice({
        id,
        status: "processing",
        data: {} as never,
        imageBase64: fileBase64,
        imageMimeType: mimeType,
        modelUsed: "",
        validationErrors: [],
        cascaded: false,
        createdAt: new Date().toISOString(),
      });

      extractInvoice(fileBase64, mimeType)
        .then((result) => {
          setInvoice({
            id,
            status: result.status,
            data: result.data,
            imageBase64: fileBase64,
            imageMimeType: mimeType,
            modelUsed: result.modelUsed,
            validationErrors: result.validationErrors,
            cascaded: result.cascaded,
            createdAt: new Date().toISOString(),
          });
        })
        .catch((error) => {
          console.error("Background extraction error:", error);
          setInvoice({
            id,
            status: "needs-review",
            data: {} as never,
            imageBase64: fileBase64,
            imageMimeType: mimeType,
            modelUsed: "error",
            validationErrors: [error instanceof Error ? error.message : "Extraction failed"],
            cascaded: false,
            createdAt: new Date().toISOString(),
          });
        });
    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Upload a PDF, image, CSV, or Excel file." },
        { status: 400 },
      );
    }

    // Return immediately — client will poll for results
    return NextResponse.json({ id, status: "processing" });
  } catch (error) {
    console.error("Extraction error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to extract invoice data", detail: message },
      { status: 500 },
    );
  }
}
