import Link from "next/link";
import { listShipments } from "@/lib/api";
import { SearchFilters } from "@/components/SearchFilters";
import { StatusBadge } from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: { status?: string; q?: string; page?: string };
}) {
  let content;

  try {
    const { data, meta } = await listShipments(searchParams);

    content =
      data.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          No shipments match those filters.
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">Lane</th>
                  <th className="px-4 py-3">ETA</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">
                      <Link href={`/shipments/${s.id}`} className="hover:underline">
                        {s.referenceNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {s.origin} -&gt; {s.destination}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{s.expectedDelivery.slice(0, 10)}</td>
                    <td className="px-4 py-3"><StatusBadge status={s.currentStatus} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs text-slate-500">Page {meta.page} of {meta.totalPages} · {meta.total} shipments</p>
        </>
      );
  } catch {
    content = (
      <div className="rounded-lg border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
        Could not reach the API. If it is hosted on a free tier it may be waking up - retry in about a minute.
      </div>
    );
  }

  return <><h1 className="mb-6 text-2xl font-semibold tracking-tight">Shipments</h1><SearchFilters />{content}</>;
}