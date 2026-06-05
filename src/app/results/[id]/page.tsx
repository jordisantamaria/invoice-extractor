"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { InvoiceViewer } from "@/components/invoice-viewer";
import { PdfViewer } from "@/components/pdf-viewer";
import { SpreadsheetViewer } from "@/components/spreadsheet-viewer";
import { ExtractedDataCard } from "@/components/extracted-data-card";
import { ProcessingIndicator } from "@/components/processing-indicator";
import { isSpreadsheet } from "@/lib/spreadsheet-to-text";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import type { StoredInvoice } from "@/lib/schema";

const POLL_INTERVAL = 2000;

export default function ResultsPage() {
  const params = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<StoredInvoice | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoice = useCallback(async () => {
    if (!params.id) return null;
    const res = await fetch(`/api/invoices/${params.id}`);
    if (!res.ok) throw new Error("Invoice not found");
    return res.json() as Promise<StoredInvoice>;
  }, [params.id]);

  // Initial fetch + polling while processing
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let cancelled = false;

    async function poll() {
      try {
        const data = await fetchInvoice();
        if (cancelled) return;
        setInvoice(data);

        if (data?.status === "processing") {
          timer = setTimeout(poll, POLL_INTERVAL);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load");
        }
      }
    }

    poll();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [fetchInvoice]);

  if (error) {
    return (
      <div className="container mx-auto max-w-4xl py-8 px-4 text-center">
        <p className="text-destructive mb-4">{error}</p>
        <Button asChild variant="outline">
          <Link href="/">Back to Upload</Link>
        </Button>
      </div>
    );
  }

  // Treat "no invoice yet" (initial fetch in flight) the same as "processing"
  // so we render the stable two-column layout immediately — no full-screen
  // spinner, no layout jump.
  const isProcessing = !invoice || invoice.status === "processing";

  return (
    <div className="container mx-auto max-w-6xl py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Invoice Results</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/">Upload Another</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard">Dashboard</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DocumentPanel invoice={invoice} />

        {isProcessing ? (
          <ProcessingIndicator />
        ) : invoice.status === "failed" ? (
          <Card className="p-5 border-destructive/30 bg-destructive/5">
            <h2 className="text-lg font-semibold text-destructive">Extraction failed</h2>
            <p className="text-sm text-muted-foreground mt-1">
              The document could not be processed. This usually means the AI model
              call failed (e.g. a missing or invalid API key).
            </p>
            {invoice.validationErrors.length > 0 && (
              <ul className="mt-3 list-disc list-inside text-sm text-destructive/90 space-y-1">
                {invoice.validationErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            )}
            <Button asChild variant="outline" size="sm" className="mt-4">
              <Link href="/">Try another invoice</Link>
            </Button>
          </Card>
        ) : (
          <ExtractedDataCard
            id={invoice.id}
            data={invoice.data}
            status={invoice.status}
            modelUsed={invoice.modelUsed}
            cascaded={invoice.cascaded}
            validationErrors={invoice.validationErrors}
            onUpdated={setInvoice}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Left column: the original document. Shows the real viewer as soon as the
 * invoice record is available (which carries imageUrl/base64/textContent even
 * while extraction is still running), and a contained placeholder before that
 * — never a full-screen spinner, so the layout stays put.
 */
function DocumentPanel({ invoice }: { invoice: StoredInvoice | null }) {
  if (!invoice) {
    return (
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between p-3 border-b">
          <span className="text-sm font-medium">Original Invoice</span>
        </div>
        <div className="flex flex-col items-center justify-center gap-3 h-[700px] bg-muted/30 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p className="text-sm">Loading document…</p>
        </div>
      </Card>
    );
  }

  if (isSpreadsheet(invoice.imageMimeType)) {
    return <SpreadsheetViewer textContent={invoice.textContent ?? ""} />;
  }

  if (invoice.imageMimeType === "application/pdf") {
    return <PdfViewer base64={invoice.imageBase64} />;
  }

  return (
    <InvoiceViewer
      imageBase64={invoice.imageBase64}
      imageMimeType={invoice.imageMimeType}
      imageUrl={invoice.imageUrl}
    />
  );
}
