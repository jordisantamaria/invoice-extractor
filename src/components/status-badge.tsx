"use client";

import { Badge } from "@/components/ui/badge";
import { InvoiceStatus } from "@/lib/schema";

const statusConfig: Record<InvoiceStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  processing: { label: "Processing", variant: "secondary" },
  "auto-approved": { label: "Auto-Approved", variant: "default" },
  "needs-review": { label: "Needs Review", variant: "destructive" },
  approved: { label: "Approved", variant: "default" },
  corrected: { label: "Corrected", variant: "outline" },
};

export function StatusBadge({ status }: { status: InvoiceStatus }) {
  const config = statusConfig[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
