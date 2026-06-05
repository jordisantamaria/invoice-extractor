import { NextRequest, NextResponse } from "next/server";
import { getInvoice, updateInvoice } from "@/lib/store";
import { InvoiceData, InvoiceStatus } from "@/lib/schema";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const invoice = await getInvoice(id);

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  return NextResponse.json(invoice);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const invoice = await getInvoice(id);

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const body = await req.json();
  const updates: Partial<{ status: InvoiceStatus; data: InvoiceData }> = {};

  if (body.status === "approved") {
    updates.status = "approved";
  } else if (body.data) {
    // Saving edits persists the data but leaves the review status unchanged —
    // the user finalizes explicitly with Approve.
    updates.data = body.data;
  }

  const updated = await updateInvoice(id, updates);
  return NextResponse.json(updated);
}
