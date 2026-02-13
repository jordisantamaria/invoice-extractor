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

  const isProcessing = invoice?.status === "processing";

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

  if (!invoice) {
    return (
      <div className="container mx-auto max-w-4xl py-12 px-4">
        <ProcessingIndicator />
      </div>
    );
  }

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
        {isSpreadsheet(invoice.imageMimeType) ? (
          <SpreadsheetViewer textContent={invoice.textContent ?? ""} />
        ) : invoice.imageMimeType === "application/pdf" ? (
          <PdfViewer base64={invoice.imageBase64} />
        ) : (
          <InvoiceViewer
            imageBase64={invoice.imageBase64}
            imageMimeType={invoice.imageMimeType}
          />
        )}

        {isProcessing ? (
          <ProcessingIndicator />
        ) : (
          <ExtractedDataCard
            id={invoice.id}
            data={invoice.data}
            status={invoice.status}
            modelUsed={invoice.modelUsed}
            cascaded={invoice.cascaded}
            validationErrors={invoice.validationErrors}
          />
        )}
      </div>
    </div>
  );
}
