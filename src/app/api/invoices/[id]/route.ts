import { NextRequest, NextResponse } from "next/server";
import { getInvoice, updateInvoice } from "@/lib/store";
import { InvoiceData, InvoiceStatus } from "@/lib/schema";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const invoice = getInvoice(id);

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
  const invoice = getInvoice(id);

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const body = await req.json();
  const updates: Partial<{ status: InvoiceStatus; data: InvoiceData }> = {};

  if (body.status === "approved") {
    updates.status = "approved";
  } else if (body.data) {
    updates.data = body.data;
    updates.status = "corrected";
  }

  const updated = updateInvoice(id, updates);
  return NextResponse.json(updated);
}
