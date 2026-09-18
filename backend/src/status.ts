import { ShipmentStatus } from "@prisma/client";

export const STATUSES = [
  "BOOKED",
  "IN_TRANSIT",
  "CUSTOMS_HOLD",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "EXCEPTION",
  "CANCELLED",
] as const satisfies readonly ShipmentStatus[];

/**
 * Freight reality: a shipment can bounce between transit and customs any
 * number of times, can be flagged as an exception from anywhere live, and
 * is immutable once delivered or cancelled.
 */
export const TRANSITIONS: Record<ShipmentStatus, ShipmentStatus[]> = {
  BOOKED: ["IN_TRANSIT", "EXCEPTION", "CANCELLED"],
  IN_TRANSIT: ["CUSTOMS_HOLD", "OUT_FOR_DELIVERY", "EXCEPTION", "CANCELLED"],
  CUSTOMS_HOLD: ["IN_TRANSIT", "EXCEPTION", "CANCELLED"],
  OUT_FOR_DELIVERY: ["DELIVERED", "EXCEPTION", "IN_TRANSIT"],
  EXCEPTION: ["IN_TRANSIT", "CUSTOMS_HOLD", "CANCELLED"],
  DELIVERED: [],
  CANCELLED: [],
};

export const canTransition = (from: ShipmentStatus, to: ShipmentStatus) =>
  TRANSITIONS[from].includes(to);