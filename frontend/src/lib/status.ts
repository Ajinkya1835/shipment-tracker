export const STATUSES = [
  "BOOKED",
  "IN_TRANSIT",
  "CUSTOMS_HOLD",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "EXCEPTION",
  "CANCELLED",
] as const;

export type Status = (typeof STATUSES)[number];

export const TRANSITIONS: Record<Status, Status[]> = {
  BOOKED: ["IN_TRANSIT", "EXCEPTION", "CANCELLED"],
  IN_TRANSIT: ["CUSTOMS_HOLD", "OUT_FOR_DELIVERY", "EXCEPTION", "CANCELLED"],
  CUSTOMS_HOLD: ["IN_TRANSIT", "EXCEPTION", "CANCELLED"],
  OUT_FOR_DELIVERY: ["DELIVERED", "EXCEPTION", "IN_TRANSIT"],
  EXCEPTION: ["IN_TRANSIT", "CUSTOMS_HOLD", "CANCELLED"],
  DELIVERED: [],
  CANCELLED: [],
};

export const STATUS_STYLES: Record<Status, string> = {
  BOOKED: "bg-slate-100 text-slate-700 ring-slate-200",
  IN_TRANSIT: "bg-blue-50 text-blue-700 ring-blue-200",
  CUSTOMS_HOLD: "bg-amber-50 text-amber-800 ring-amber-200",
  OUT_FOR_DELIVERY: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  DELIVERED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  EXCEPTION: "bg-rose-50 text-rose-700 ring-rose-200",
  CANCELLED: "bg-zinc-100 text-zinc-500 ring-zinc-200",
};

export const label = (s: string) =>
  s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());