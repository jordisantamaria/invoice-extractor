import { StoredInvoice } from "./schema";

// Persist across hot-reloads in development
const globalStore = globalThis as unknown as {
  __invoiceStore?: Map<string, StoredInvoice>;
};

if (!globalStore.__invoiceStore) {
  globalStore.__invoiceStore = new Map<string, StoredInvoice>();
}

const store = globalStore.__invoiceStore;

export function generateId(): string {
  return `inv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function setInvoice(invoice: StoredInvoice): void {
  store.set(invoice.id, invoice);
}

export function getInvoice(id: string): StoredInvoice | undefined {
  return store.get(id);
}

export function getAllInvoices(): StoredInvoice[] {
  return Array.from(store.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function updateInvoice(id: string, updates: Partial<StoredInvoice>): StoredInvoice | undefined {
  const existing = store.get(id);
  if (!existing) return undefined;
  const updated = { ...existing, ...updates };
  store.set(id, updated);
  return updated;
}
