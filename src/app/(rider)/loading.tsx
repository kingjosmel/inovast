export default function RiderLoading() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-pulse">
      {/* Rider Duty Header & Switch Skeleton */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center gap-3.5 w-full sm:w-auto">
          <div className="h-12 w-12 rounded-2xl bg-slate-200" />
          <div className="space-y-2">
            <div className="h-5 w-36 rounded-md bg-slate-200" />
            <div className="h-3.5 w-24 rounded-md bg-slate-200" />
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <div className="h-9 w-28 rounded-full bg-slate-200" />
          <div className="h-9 w-10 rounded-xl bg-slate-200" />
        </div>
      </div>

      {/* Daily Earnings & Performance KPI Card Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-2"
          >
            <div className="h-4 w-20 rounded-md bg-slate-200" />
            <div className="h-7 w-28 rounded-md bg-slate-300" />
            <div className="h-3 w-16 rounded-md bg-slate-100" />
          </div>
        ))}
      </div>

      {/* Active Trip / Dispatch Radar Card Skeleton */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="h-5 w-40 rounded-md bg-slate-200" />
          <div className="h-6 w-20 rounded-full bg-slate-200" />
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-xl bg-slate-200 shrink-0" />
            <div className="space-y-1.5 flex-1">
              <div className="h-4 w-1/3 rounded-md bg-slate-200" />
              <div className="h-3.5 w-2/3 rounded-md bg-slate-100" />
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-xl bg-slate-200 shrink-0" />
            <div className="space-y-1.5 flex-1">
              <div className="h-4 w-1/3 rounded-md bg-slate-200" />
              <div className="h-3.5 w-2/3 rounded-md bg-slate-100" />
            </div>
          </div>
        </div>

        <div className="pt-2 flex gap-3">
          <div className="h-12 flex-1 rounded-xl bg-slate-200" />
          <div className="h-12 w-28 rounded-xl bg-slate-200" />
        </div>
      </div>

      {/* Recent Trips Delivery Log Skeleton */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-5 w-32 rounded-md bg-slate-200" />
          <div className="h-4 w-16 rounded-md bg-slate-200" />
        </div>

        <div className="divide-y divide-slate-100">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-slate-200" />
                <div className="space-y-1.5">
                  <div className="h-4 w-36 rounded-md bg-slate-200" />
                  <div className="h-3 w-24 rounded-md bg-slate-100" />
                </div>
              </div>
              <div className="h-5 w-20 rounded-md bg-slate-200" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
