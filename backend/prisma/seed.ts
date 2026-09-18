import "dotenv/config";
import { PrismaClient, ShipmentStatus } from "@prisma/client";

const prisma = new PrismaClient();

const LANES: [string, string][] = [
  ["Nhava Sheva, IN", "Jebel Ali, AE"],
  ["Mundra, IN", "Rotterdam, NL"],
  ["Chennai, IN", "Singapore, SG"],
  ["Mumbai, IN", "Hamburg, DE"],
  ["Kolkata, IN", "Colombo, LK"],
  ["Cochin, IN", "Felixstowe, GB"],
];

const CARRIERS = ["Maersk", "MSC", "CMA CGM", "Hapag-Lloyd", "ONE"];

const CHAINS: ShipmentStatus[][] = [
  ["BOOKED"],
  ["BOOKED", "IN_TRANSIT"],
  ["BOOKED", "IN_TRANSIT", "CUSTOMS_HOLD"],
  ["BOOKED", "IN_TRANSIT", "CUSTOMS_HOLD", "IN_TRANSIT", "OUT_FOR_DELIVERY"],
  ["BOOKED", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED"],
  ["BOOKED", "IN_TRANSIT", "EXCEPTION"],
  ["BOOKED", "CANCELLED"],
];

const daysFromNow = (n: number) => new Date(Date.now() + n * 86_400_000);

async function main() {
  await prisma.shipmentEvent.deleteMany();
  await prisma.shipment.deleteMany();

  for (let i = 0; i < 18; i++) {
    const [origin, destination] = LANES[i % LANES.length];
    const chain = CHAINS[i % CHAINS.length];
    const reference = `NGK-2026-${String(1001 + i)}`;

    const shipment = await prisma.shipment.create({
      data: {
        referenceNumber: reference,
        origin,
        destination,
        carrier: CARRIERS[i % CARRIERS.length],
        weightKg: 400 + i * 137,
        expectedDelivery: daysFromNow(3 + (i % 21)),
        currentStatus: chain[chain.length - 1],
        createdAt: daysFromNow(-(chain.length * 3 + 2)),
      },
    });

    await prisma.shipmentEvent.createMany({
      data: chain.map((status, idx) => ({
        shipmentId: shipment.id,
        status,
        location: idx === 0 ? origin : idx === chain.length - 1 ? destination : "In network",
        note: `Status set to ${status.replace(/_/g, " ").toLowerCase()}`,
        occurredAt: daysFromNow(-(chain.length - idx) * 3),
      })),
    });
  }

  console.log("Seeded 18 shipments");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());