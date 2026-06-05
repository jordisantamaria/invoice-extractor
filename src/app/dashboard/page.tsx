"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { InvoiceTable } from "@/components/invoice-table";
import { Loader2 } from "lucide-react";
import type { InvoiceStatus } from "@/lib/schema";

interface InvoiceSummary {
  id: string;
  status: InvoiceStatus;
  data: { vendorName: string; invoiceNumber?: string; total: number; currency: string };
  modelUsed: string;
  cascaded: boolean;
  validationErrors: string[];
  createdAt: string;
}

export default function DashboardPage() {
  const [invoices, setInvoices] = useState<InvoiceSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/invoices")
      .then((res) => res.json())
      .then((data) => {
        setInvoices(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const stats = {
    total: invoices.length,
    autoApproved: invoices.filter((i) => i.status === "auto-approved").length,
    needsReview: invoices.filter((i) => i.status === "needs-review").length,
    approved: invoices.filter((i) => i.status === "approved").length,
  };

  return (
    <div className="container mx-auto max-w-5xl py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Auto-Approved" value={stats.autoApproved} />
        <StatCard label="Needs Review" value={stats.needsReview} />
        <StatCard label="Approved" value={stats.approved} />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Card className="p-0 overflow-hidden">
          <InvoiceTable invoices={invoices as never[]} />
        </Card>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-4 text-center">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </Card>
  );
}
