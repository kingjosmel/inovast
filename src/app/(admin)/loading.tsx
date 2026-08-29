export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header & Global Refresh Skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="h-7 w-64 rounded-lg bg-slate-200" />
          <div className="h-4 w-96 rounded-md bg-slate-100" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-32 rounded-xl bg-slate-200" />
          <div className="h-10 w-28 rounded-xl bg-slate-200" />
        </div>
      </div>

      {/* KPI Metrics Cards (4-Column Grid) Skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-28 rounded-md bg-slate-200" />
              <div className="h-9 w-9 rounded-xl bg-slate-100" />
            </div>
            <div className="h-8 w-36 rounded-lg bg-slate-300" />
            <div className="flex items-center gap-2">
              <div className="h-4 w-12 rounded-full bg-slate-100" />
              <div className="h-3.5 w-24 rounded-md bg-slate-100" />
            </div>
          </div>
        ))}
      </div>

      {/* Live Fleet Map & Activity Stream Dual Grid Skeleton */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Map Container Skeleton */}
        <div className="lg:col-span-8 overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 h-[480px] p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="h-6 w-44 rounded-lg bg-slate-200" />
            <div className="flex gap-2">
              <div className="h-8 w-20 rounded-xl bg-slate-200" />
              <div className="h-8 w-20 rounded-xl bg-slate-200" />
            </div>
          </div>
          <div className="self-center flex flex-col items-center gap-2">
            <div className="h-12 w-12 rounded-full bg-slate-200" />
            <div className="h-4 w-40 rounded-md bg-slate-200" />
          </div>
          <div className="h-10 w-full max-w-sm rounded-xl bg-slate-200 self-center" />
        </div>

        {/* Live Event Stream Skeleton */}
        <div className="lg:col-span-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="h-5 w-32 rounded-md bg-slate-200" />
            <div className="h-5 w-16 rounded-full bg-slate-200" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 p-2.5 rounded-xl border border-slate-100 bg-slate-50/60">
                <div className="h-7 w-7 rounded-lg bg-slate-200 shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3.5 w-3/4 rounded-md bg-slate-200" />
                  <div className="h-3 w-1/2 rounded-md bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Analytical Table Skeleton */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="h-5 w-40 rounded-md bg-slate-200" />
          <div className="h-9 w-32 rounded-xl bg-slate-200" />
        </div>
        <div className="divide-y divide-slate-100">
          <div className="bg-slate-50/80 p-4 grid grid-cols-5 gap-4">
            <div className="h-4 w-20 rounded-md bg-slate-200" />
            <div className="h-4 w-24 rounded-md bg-slate-200" />
            <div className="h-4 w-16 rounded-md bg-slate-200" />
            <div className="h-4 w-20 rounded-md bg-slate-200" />
            <div className="h-4 w-16 rounded-md bg-slate-200 justify-self-end" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4 grid grid-cols-5 gap-4 items-center">
              <div className="h-4 w-28 rounded-md bg-slate-200" />
              <div className="h-4 w-32 rounded-md bg-slate-200" />
              <div className="h-5 w-20 rounded-full bg-slate-200" />
              <div className="h-4 w-24 rounded-md bg-slate-200" />
              <div className="h-8 w-20 rounded-lg bg-slate-200 justify-self-end" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
