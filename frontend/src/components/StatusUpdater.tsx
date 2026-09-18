"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { updateStatus } from "@/lib/api";
import { label, type Status, TRANSITIONS } from "@/lib/status";

export function StatusUpdater({ id, current }: { id: string; current: Status }) {
  const router = useRouter();
  const allowed = TRANSITIONS[current];
  const [status, setStatus] = useState<Status | "">("");
  const [note, setNote] = useState("");
  const [location, setLocation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (allowed.length === 0) return <p className="rounded-md bg-slate-100 px-4 py-3 text-sm text-slate-600">{label(current)} is a terminal status - no further updates allowed.</p>;

  const submit = async () => {
    if (!status) return;
    setError(null);
    setSaving(true);
    try {
      await updateStatus(id, { status, note: note || undefined, location: location || undefined });
      setStatus(""); setNote(""); setLocation(""); router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Update failed");
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-5">
      <h2 className="text-sm font-semibold">Update status</h2>
      <select value={status} onChange={(event) => setStatus(event.target.value as Status)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
        <option value="">Select next status...</option>
        {allowed.map((nextStatus) => <option key={nextStatus} value={nextStatus}>{label(nextStatus)}</option>)}
      </select>
      <input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Location (optional)" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
      <input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Note (optional)" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <button onClick={submit} disabled={!status || saving} className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-40">{saving ? "Saving..." : "Save update"}</button>
      <p className="text-xs text-slate-500">Only transitions the API allows from {label(current)} are listed.</p>
    </div>
  );
}