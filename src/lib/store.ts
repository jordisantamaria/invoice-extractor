import { Redis } from "@upstash/redis";
import { StoredInvoice } from "./schema";

// Serverless-friendly store backed by Upstash Redis (HTTP). On Vercel, add the
// Upstash integration and it injects UPSTASH_REDIS_REST_URL / _TOKEN.
//
// Records expire after TTL_SECONDS so the demo self-cleans. An ordered index
// (sorted set, scored by createdAt) backs the dashboard listing.
const TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days
const INDEX_KEY = "invoices:index";
const keyFor = (id: string) => `invoice:${id}`;

// Lazy singleton so importing this module never throws at build time when the
// env vars are absent — the client is only created on first actual use.
let redisClient: Redis | null = null;
function redis(): Redis {
  if (!redisClient) redisClient = Redis.fromEnv();
  return redisClient;
}

export function generateId(): string {
  return `inv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function setInvoice(invoice: StoredInvoice): Promise<void> {
  const r = redis();
  await r.set(keyFor(invoice.id), invoice, { ex: TTL_SECONDS });
  await r.zadd(INDEX_KEY, {
    score: new Date(invoice.createdAt).getTime(),
    member: invoice.id,
  });
}

export async function getInvoice(id: string): Promise<StoredInvoice | undefined> {
  // @upstash/redis auto-deserializes JSON values written via `set`.
  const record = await redis().get<StoredInvoice>(keyFor(id));
  return record ?? undefined;
}

export async function getAllInvoices(): Promise<StoredInvoice[]> {
  const r = redis();
  const ids = await r.zrange<string[]>(INDEX_KEY, 0, -1, { rev: true });
  if (!ids || ids.length === 0) return [];

  const records = await r.mget<StoredInvoice[]>(...ids.map(keyFor));

  const invoices: StoredInvoice[] = [];
  const expired: string[] = [];
  records.forEach((record, i) => {
    if (record) invoices.push(record);
    else expired.push(ids[i]); // record TTL'd out — drop it from the index
  });

  if (expired.length > 0) await r.zrem(INDEX_KEY, ...expired);

  return invoices;
}

export async function updateInvoice(
  id: string,
  updates: Partial<StoredInvoice>,
): Promise<StoredInvoice | undefined> {
  const existing = await getInvoice(id);
  if (!existing) return undefined;
  const updated = { ...existing, ...updates };
  await setInvoice(updated);
  return updated;
}
