import type { ShipmentEvent } from "@/lib/api";
import { label } from "@/lib/status";
import { StatusBadge } from "./StatusBadge";

export function Timeline({ events }: { events: ShipmentEvent[] }) {
  return (
    <ol className="relative space-y-6 border-l border-slate-200 pl-6">
      {events.map((event, index) => (
        <li key={event.id} className="relative">
          <span className={`absolute -left-[1.6rem] top-1.5 h-3 w-3 rounded-full ring-4 ring-slate-50 ${index === 0 ? "bg-slate-900" : "bg-slate-300"}`} />
          <div className="flex flex-wrap items-center gap-2"><StatusBadge status={event.status} /><time className="text-xs text-slate-500">{new Date(event.occurredAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</time></div>
          {event.location && <p className="mt-1 text-sm text-slate-700">{event.location}</p>}
          {event.note && <p className="text-sm text-slate-500">{event.note}</p>}
          <span className="sr-only">{label(event.status)}</span>
        </li>
      ))}
    </ol>
  );
}