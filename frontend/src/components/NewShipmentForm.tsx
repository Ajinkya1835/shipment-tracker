"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createShipment } from "@/lib/api";

const field = "w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900";

export function NewShipmentForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    referenceNumber: "",
    origin: "",
    destination: "",
    expectedDelivery: "",
    carrier: "",
    weightKg: "",
  });

  const set = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));

  const submit = async () => {
    setError(null);
    setSaving(true);
    try {
      const { data } = await createShipment({
        referenceNumber: form.referenceNumber,
        origin: form.origin,
        destination: form.destination,
        expectedDelivery: form.expectedDelivery,
        carrier: form.carrier || undefined,
        weightKg: form.weightKg ? Number(form.weightKg) : undefined,
      });
      router.push(`/shipments/${data.id}`);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Something went wrong");
      setSaving(false);
    }
  };

  const ready = form.referenceNumber && form.origin && form.destination && form.expectedDelivery;

  return (
    <div className="max-w-lg space-y-4 rounded-lg border border-slate-200 bg-white p-6">
      <div><label className="mb-1 block text-sm font-medium">Reference number</label><input className={field} placeholder="NGK-2026-1042" value={form.referenceNumber} onChange={set("referenceNumber")} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="mb-1 block text-sm font-medium">Origin</label><input className={field} placeholder="Nhava Sheva, IN" value={form.origin} onChange={set("origin")} /></div>
        <div><label className="mb-1 block text-sm font-medium">Destination</label><input className={field} placeholder="Jebel Ali, AE" value={form.destination} onChange={set("destination")} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="mb-1 block text-sm font-medium">Expected delivery</label><input type="date" className={field} value={form.expectedDelivery} onChange={set("expectedDelivery")} /></div>
        <div><label className="mb-1 block text-sm font-medium">Weight (kg)</label><input type="number" className={field} placeholder="1250" value={form.weightKg} onChange={set("weightKg")} /></div>
      </div>
      <div><label className="mb-1 block text-sm font-medium">Carrier</label><input className={field} placeholder="Maersk" value={form.carrier} onChange={set("carrier")} /></div>
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <button onClick={submit} disabled={!ready || saving} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-40">
        {saving ? "Creating..." : "Create shipment"}
      </button>
      <p className="text-xs text-slate-500">New shipments start as Booked and get an opening history event automatically.</p>
    </div>
  );
}