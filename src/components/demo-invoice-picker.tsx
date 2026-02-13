"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";

const DEMO_INVOICES = [
  { filename: "jp-clean.png", label: "JP Clean", description: "Japanese invoice, 3 items, 10% tax, ¥88,000" },
  { filename: "jp-alt-layout.png", label: "JP Alt Layout", description: "Alternative layout, mixed 8%/10% tax rates" },
  { filename: "en-standard.png", label: "EN Standard", description: "English invoice, 4 items, USD $4,750" },
  { filename: "complex-table.png", label: "Complex Table", description: "8 items with discounts, multiple tax rates" },
  { filename: "scanned-noisy.png", label: "Scanned (Noisy)", description: "Simulated scan with noise and rotation" },
  { filename: "error-invoice.png", label: "Error Invoice", description: "Wrong tax rate (12%) — should trigger review" },
];

export function DemoInvoicePicker() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handlePick(filename: string) {
    setError(null);
    setLoading(filename);

    try {
      const res = await fetch("/api/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to process demo");
      }

      const { id } = await res.json();
      router.push(`/results/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
      setLoading(null);
    }
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">Or try a demo invoice</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {DEMO_INVOICES.map((demo) => (
          <Card
            key={demo.filename}
            className={`p-3 cursor-pointer transition-all hover:ring-2 hover:ring-primary/50 ${
              loading === demo.filename ? "ring-2 ring-primary opacity-75" : ""
            } ${loading && loading !== demo.filename ? "opacity-50 pointer-events-none" : ""}`}
            onClick={() => !loading && handlePick(demo.filename)}
          >
            <div className="aspect-[3/4] relative bg-muted rounded overflow-hidden mb-2">
              {loading === demo.filename ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <Image
                  src={`/demo-invoices/${demo.filename}`}
                  alt={demo.label}
                  fill
                  className="object-cover object-top"
                  sizes="(max-width: 768px) 50vw, 33vw"
                />
              )}
            </div>
            <p className="font-medium text-sm">{demo.label}</p>
            <p className="text-xs text-muted-foreground">{demo.description}</p>
          </Card>
        ))}
      </div>
      {error && <p className="text-sm text-destructive mt-3">{error}</p>}
    </div>
  );
}
