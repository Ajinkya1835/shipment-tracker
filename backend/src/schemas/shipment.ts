import { z } from "zod";
import { STATUSES } from "../status";

const statusEnum = z.enum(STATUSES);

export const createShipmentSchema = z.object({
  referenceNumber: z
    .string()
    .trim()
    .min(3)
    .max(40)
    .regex(/^[A-Za-z0-9-]+$/, "Letters, numbers and hyphens only"),
  origin: z.string().trim().min(2).max(120),
  destination: z.string().trim().min(2).max(120),
  expectedDelivery: z.coerce.date(),
  carrier: z.string().trim().max(120).optional(),
  weightKg: z.coerce.number().positive().max(1_000_000).optional(),
  note: z.string().trim().max(500).optional(),
});

export const updateStatusSchema = z.object({
  status: statusEnum,
  note: z.string().trim().max(500).optional(),
  location: z.string().trim().max(120).optional(),
  occurredAt: z.coerce.date().optional(),
});

export const listQuerySchema = z.object({
  status: statusEnum.optional(),
  q: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});