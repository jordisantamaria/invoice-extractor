"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/status-badge";
import { ValidationWarnings } from "@/components/validation-warnings";
import { Check, Pencil, Save, X, Cpu } from "lucide-react";
import type { InvoiceData, InvoiceStatus } from "@/lib/schema";

interface Props {
  id: string;
  data: InvoiceData;
  status: InvoiceStatus;
  modelUsed: string;
  cascaded: boolean;
  validationErrors: string[];
}

export function ExtractedDataCard({ id, data, status, modelUsed, cascaded, validationErrors }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState(data);

  async function handleApprove() {
    setSaving(true);
    await fetch(`/api/invoices/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "approved" }),
    });
    router.refresh();
    setSaving(false);
  }

  async function handleSave() {
    setSaving(true);
    await fetch(`/api/invoices/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: editData }),
    });
    setEditing(false);
    router.refresh();
    setSaving(false);
  }

  function updateField(field: keyof InvoiceData, value: string | number) {
    setEditData((prev) => ({ ...prev, [field]: value }));
  }

  function updateItem(index: number, field: string, value: string | number) {
    setEditData((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    }));
  }

  const isReviewable = status === "needs-review" || status === "auto-approved";

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">Extracted Data</h2>
          <div className="flex items-center gap-2 mt-1">
            <StatusBadge status={status} />
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Cpu className="h-3 w-3" />
              {modelUsed.split("-").slice(0, 2).join(" ")}
              {cascaded && " (cascaded)"}
            </span>
          </div>
        </div>
        {isReviewable && !editing && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              <Pencil className="h-3.5 w-3.5 mr-1" />
              Edit
            </Button>
            <Button size="sm" onClick={handleApprove} disabled={saving}>
              <Check className="h-3.5 w-3.5 mr-1" />
              Approve
            </Button>
          </div>
        )}
        {editing && (
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => { setEditing(false); setEditData(data); }}>
              <X className="h-3.5 w-3.5 mr-1" />
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              <Save className="h-3.5 w-3.5 mr-1" />
              Save
            </Button>
          </div>
        )}
      </div>

      <ValidationWarnings errors={validationErrors} />

      <div className="space-y-4 mt-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Vendor" value={editing ? editData.vendorName : data.vendorName} editing={editing} onChange={(v) => updateField("vendorName", v)} />
          <Field label="Invoice #" value={editing ? editData.invoiceNumber || "" : data.invoiceNumber || "-"} editing={editing} onChange={(v) => updateField("invoiceNumber", v)} />
          <Field label="Date" value={editing ? editData.invoiceDate || "" : data.invoiceDate || "-"} editing={editing} onChange={(v) => updateField("invoiceDate", v)} />
          <Field label="Due Date" value={editing ? editData.dueDate || "" : data.dueDate || "-"} editing={editing} onChange={(v) => updateField("dueDate", v)} />
          <Field label="Currency" value={editing ? editData.currency : data.currency} editing={editing} onChange={(v) => updateField("currency", v)} />
          <Field label="Language" value={editing ? editData.language : data.language} editing={editing} onChange={(v) => updateField("language", v)} />
        </div>

        <Separator />

        <div>
          <h3 className="text-sm font-medium mb-2">Line Items</h3>
          <div className="space-y-2">
            {(editing ? editData : data).items.map((item, i) => (
              <div key={i} className="grid grid-cols-[1fr_60px_80px_80px] gap-2 text-sm items-center">
                {editing ? (
                  <>
                    <Input value={item.description} onChange={(e) => updateItem(i, "description", e.target.value)} className="h-8 text-sm" />
                    <Input type="number" value={item.quantity} onChange={(e) => updateItem(i, "quantity", Number(e.target.value))} className="h-8 text-sm" />
                    <Input type="number" value={item.unitPrice} onChange={(e) => updateItem(i, "unitPrice", Number(e.target.value))} className="h-8 text-sm" />
                    <Input type="number" value={item.amount} onChange={(e) => updateItem(i, "amount", Number(e.target.value))} className="h-8 text-sm" />
                  </>
                ) : (
                  <>
                    <span>{item.description}</span>
                    <span className="text-right">{item.quantity}</span>
                    <span className="text-right">{formatCurrency(item.unitPrice, data.currency)}</span>
                    <span className="text-right font-medium">{formatCurrency(item.amount, data.currency)}</span>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        <Separator />

        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            {editing ? (
              <Input type="number" value={editData.subtotal} onChange={(e) => updateField("subtotal", Number(e.target.value))} className="h-7 w-32 text-sm text-right" />
            ) : (
              <span>{formatCurrency(data.subtotal, data.currency)}</span>
            )}
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              Tax{data.taxRate != null ? ` (${(data.taxRate * 100).toFixed(0)}%)` : ""}
            </span>
            {editing ? (
              <Input type="number" value={editData.taxAmount} onChange={(e) => updateField("taxAmount", Number(e.target.value))} className="h-7 w-32 text-sm text-right" />
            ) : (
              <span>{formatCurrency(data.taxAmount, data.currency)}</span>
            )}
          </div>
          <div className="flex justify-between font-semibold text-base pt-1 border-t">
            <span>Total</span>
            {editing ? (
              <Input type="number" value={editData.total} onChange={(e) => updateField("total", Number(e.target.value))} className="h-8 w-32 text-sm text-right font-semibold" />
            ) : (
              <span>{formatCurrency(data.total, data.currency)}</span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

function Field({ label, value, editing, onChange }: { label: string; value: string; editing: boolean; onChange: (v: string) => void }) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {editing ? (
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="h-8 text-sm mt-1" />
      ) : (
        <p className="text-sm font-medium">{value}</p>
      )}
    </div>
  );
}

function formatCurrency(amount: number, currency: string): string {
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
