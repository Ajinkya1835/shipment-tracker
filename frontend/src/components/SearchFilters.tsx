"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { label, STATUSES } from "@/lib/status";

export function SearchFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const activeStatus = params.get("status") ?? "";

  const push = (next: Record<string, string>) => {
    const sp = new URLSearchParams(params.toString());
    Object.entries(next).forEach(([k, v]) => (v ? sp.set(k, v) : sp.delete(k)));
    sp.delete("page");
    router.push(`/?${sp.toString()}`);
  };

  return (
    <div className="mb-6 space-y-3">
      <div className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && push({ q })}
          placeholder="Search reference, origin or destination"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
        />
        <button
          onClick={() => push({ q })}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Search
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => push({ status: "" })}
          className={`rounded-full px-3 py-1 text-xs ring-1 ring-inset ${
            activeStatus === "" ? "bg-slate-900 text-white ring-slate-900" : "bg-white ring-slate-300"
          }`}
        >
          All
        </button>
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => push({ status: activeStatus === s ? "" : s })}
            className={`rounded-full px-3 py-1 text-xs ring-1 ring-inset ${
              activeStatus === s ? "bg-slate-900 text-white ring-slate-900" : "bg-white ring-slate-300"
            }`}
          >
            {label(s)}
          </button>
        ))}
      </div>
    </div>
  );
}