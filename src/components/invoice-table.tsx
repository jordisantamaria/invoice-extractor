"use client";

import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import type { InvoiceStatus, InvoiceData } from "@/lib/schema";

interface InvoiceRow {
  id: string;
  status: InvoiceStatus;
  data: InvoiceData;
  modelUsed: string;
  cascaded: boolean;
  validationErrors: string[];
  createdAt: string;
}

function formatCurrency(amount: number | undefined, currency: string | undefined): string {
  if (amount == null || !currency) return "-";
  try {
    return new Intl.NumberFormat(currency === "JPY" ? "ja-JP" : "en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: currency === "JPY" ? 0 : 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

export function InvoiceTable({ invoices }: { invoices: InvoiceRow[] }) {
  if (invoices.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No invoices processed yet. Upload or try a demo invoice.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Vendor</TableHead>
          <TableHead>Invoice #</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Model</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((inv) => (
          <TableRow key={inv.id}>
            <TableCell>
              <Link href={`/results/${inv.id}`} className="font-medium hover:underline">
                {inv.data.vendorName}
              </Link>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {inv.data.invoiceNumber || "-"}
            </TableCell>
            <TableCell className="font-mono">
              {formatCurrency(inv.data.total, inv.data.currency)}
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">
              {inv.modelUsed.split("-").slice(0, 2).join(" ")}
              {inv.cascaded ? " *" : ""}
            </TableCell>
            <TableCell>
              <StatusBadge status={inv.status} />
            </TableCell>
            <TableCell className="text-muted-foreground text-sm">
              {new Date(inv.createdAt).toLocaleDateString()}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
