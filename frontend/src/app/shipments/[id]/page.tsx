import Link from "next/link";
import { notFound } from "next/navigation";
import { getShipment } from "@/lib/api";
import { StatusBadge } from "@/components/StatusBadge";
import { StatusUpdater } from "@/components/StatusUpdater";
import { Timeline } from "@/components/Timeline";

export const dynamic = "force-dynamic";

export default async function ShipmentPage({ params }: { params: { id: string } }) {
  let shipment;
  try { shipment = (await getShipment(params.id)).data; } catch { notFound(); }

  const rows: [string, string][] = [
    ["Origin", shipment.origin],
    ["Destination", shipment.destination],
    ["Expected delivery", shipment.expectedDelivery.slice(0, 10)],
    ["Carrier", shipment.carrier ?? "-"],
    ["Weight", shipment.weightKg ? `${shipment.weightKg} kg` : "-"],
    ["Created", new Date(shipment.createdAt).toLocaleDateString("en-IN")],
  ];

  return (
    <>
      <Link href="/" className="text-sm text-slate-500 hover:underline">&lt;- All shipments</Link>
      <div className="mb-6 mt-3 flex flex-wrap items-center gap-3"><h1 className="text-2xl font-semibold tracking-tight">{shipment.referenceNumber}</h1><StatusBadge status={shipment.currentStatus} /></div>
      <div className="grid gap-6 md:grid-cols-[2fr,1fr]">
        <div className="space-y-6">
          <dl className="grid grid-cols-2 gap-4 rounded-lg border border-slate-200 bg-white p-5 text-sm">{rows.map(([key, value]) => <div key={key}><dt className="text-xs uppercase tracking-wide text-slate-500">{key}</dt><dd className="mt-0.5 font-medium">{value}</dd></div>)}</dl>
          <div className="rounded-lg border border-slate-200 bg-white p-5"><h2 className="mb-4 text-sm font-semibold">History</h2><Timeline events={shipment.events ?? []} /></div>
        </div>
        <StatusUpdater id={shipment.id} current={shipment.currentStatus} />
      </div>
    </>
  );
}