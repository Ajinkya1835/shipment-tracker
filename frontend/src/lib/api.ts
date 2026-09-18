import type { Status } from "./status";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export type Shipment = {
  id: string;
  referenceNumber: string;
  origin: string;
  destination: string;
  carrier: string | null;
  weightKg: number | null;
  currentStatus: Status;
  expectedDelivery: string;
  createdAt: string;
  updatedAt: string;
  events?: ShipmentEvent[];
};

export type ShipmentEvent = {
  id: string;
  shipmentId: string;
  status: Status;
  note: string | null;
  location: string | null;
  occurredAt: string;
};

export type ListMeta = { page: number; limit: number; total: number; totalPages: number };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error?.message ?? `Request failed (${res.status})`);
  return json as T;
}

export const listShipments = (params: { status?: string; q?: string; page?: string }) => {
  const qs = new URLSearchParams();
  if (params.status) qs.set("status", params.status);
  if (params.q) qs.set("q", params.q);
  qs.set("page", params.page ?? "1");
  qs.set("limit", "12");
  return request<{ data: Shipment[]; meta: ListMeta }>(`/api/shipments?${qs}`);
};

export const getShipment = (id: string) =>
  request<{ data: Shipment }>(`/api/shipments/${id}`);

export const createShipment = (body: Record<string, unknown>) =>
  request<{ data: Shipment }>("/api/shipments", {
    method: "POST",
    body: JSON.stringify(body),
  });

export const updateStatus = (id: string, body: Record<string, unknown>) =>
  request<{ data: Shipment }>(`/api/shipments/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });