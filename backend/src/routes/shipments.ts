import { Router } from "express";
import { Prisma, ShipmentStatus } from "@prisma/client";
import { prisma } from "../db";
import { canTransition, TRANSITIONS } from "../status";
import { conflict, notFound, unprocessable } from "../errors";
import {
  createShipmentSchema,
  listQuerySchema,
  updateStatusSchema,
} from "../schemas/shipment";

export const shipmentsRouter = Router();

/** POST /api/shipments */
shipmentsRouter.post("/", async (req, res, next) => {
  try {
    const body = createShipmentSchema.parse(req.body);

    const shipment = await prisma.$transaction(async (tx) => {
      const created = await tx.shipment.create({
        data: {
          referenceNumber: body.referenceNumber.toUpperCase(),
          origin: body.origin,
          destination: body.destination,
          expectedDelivery: body.expectedDelivery,
          carrier: body.carrier,
          weightKg: body.weightKg,
          currentStatus: "BOOKED",
        },
      });

      // Seed event so history is never empty.
      await tx.shipmentEvent.create({
        data: {
          shipmentId: created.id,
          status: "BOOKED",
          note: body.note ?? "Shipment booked",
          location: body.origin,
        },
      });

      return created;
    });

    res.status(201).json({ data: shipment });
  } catch (err) {
    next(err);
  }
});

/** GET /api/shipments?status=&q=&page=&limit= */
shipmentsRouter.get("/", async (req, res, next) => {
  try {
    const { status, q, page, limit } = listQuerySchema.parse(req.query);

    const where: Prisma.ShipmentWhereInput = {
      ...(status ? { currentStatus: status } : {}),
      ...(q
        ? {
            OR: [
              { referenceNumber: { contains: q, mode: "insensitive" } },
              { origin: { contains: q, mode: "insensitive" } },
              { destination: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [total, data] = await prisma.$transaction([
      prisma.shipment.count({ where }),
      prisma.shipment.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    res.json({
      data,
      meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    });
  } catch (err) {
    next(err);
  }
});

/** GET /api/shipments/:id */
shipmentsRouter.get("/:id", async (req, res, next) => {
  try {
    const shipment = await prisma.shipment.findUnique({
      where: { id: req.params.id },
      include: { events: { orderBy: { occurredAt: "desc" } } },
    });

    if (!shipment) throw notFound("Shipment");
    res.json({ data: shipment });
  } catch (err) {
    next(err);
  }
});

/** GET /api/shipments/:id/events */
shipmentsRouter.get("/:id/events", async (req, res, next) => {
  try {
    const exists = await prisma.shipment.findUnique({
      where: { id: req.params.id },
      select: { id: true },
    });
    if (!exists) throw notFound("Shipment");

    const events = await prisma.shipmentEvent.findMany({
      where: { shipmentId: req.params.id },
      orderBy: { occurredAt: "desc" },
    });

    res.json({ data: events });
  } catch (err) {
    next(err);
  }
});

/** PATCH /api/shipments/:id/status */
shipmentsRouter.patch("/:id/status", async (req, res, next) => {
  try {
    const body = updateStatusSchema.parse(req.body);
    const id = req.params.id;

    const updated = await prisma.$transaction(async (tx) => {
      // Row lock: two concurrent PATCHes on the same shipment would otherwise
      // both read the old status, both pass the guard, and both write.
      const locked = await tx.$queryRaw<{ current_status: ShipmentStatus }[]>`
        SELECT current_status FROM shipments WHERE id = ${id}::uuid FOR UPDATE
      `;

      if (locked.length === 0) throw notFound("Shipment");
      const from = locked[0].current_status;

      if (from === body.status) {
        throw conflict(`Shipment is already ${from}`);
      }

      if (!canTransition(from, body.status)) {
        throw unprocessable(
          `Cannot move a shipment from ${from} to ${body.status}`,
          { from, to: body.status, allowed: TRANSITIONS[from] },
        );
      }

      await tx.shipmentEvent.create({
        data: {
          shipmentId: id,
          status: body.status,
          note: body.note,
          location: body.location,
          occurredAt: body.occurredAt ?? new Date(),
        },
      });

      return tx.shipment.update({
        where: { id },
        data: { currentStatus: body.status },
        include: { events: { orderBy: { occurredAt: "desc" } } },
      });
    });

    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
});