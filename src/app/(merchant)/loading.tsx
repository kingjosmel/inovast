export default function MerchantLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Top Header & Operational Stats Bar Skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-xl bg-slate-200" />
          <div className="space-y-2">
            <div className="h-5 w-48 rounded-md bg-slate-200" />
            <div className="h-3.5 w-32 rounded-md bg-slate-200" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-9 w-28 rounded-xl bg-slate-200" />
          <div className="h-9 w-36 rounded-xl bg-slate-200" />
          <div className="h-9 w-10 rounded-xl bg-slate-200" />
        </div>
      </div>

      {/* Kitchen Kanban Board Columns Skeleton */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {[
          { title: "NEW ORDERS", count: 2 },
          { title: "PREPARING", count: 3 },
          { title: "READY FOR PICKUP", count: 2 },
          { title: "IN TRANSIT / COMPLETED", count: 1 },
        ].map((col, colIdx) => (
          <div
            key={colIdx}
            className="flex flex-col rounded-2xl border border-slate-200 bg-slate-50/70 p-4 shadow-xs"
          >
            {/* Column Header */}
            <div className="mb-4 flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="h-3.5 w-3.5 rounded-full bg-slate-300" />
                <div className="h-4 w-28 rounded-md bg-slate-300 font-bold" />
              </div>
              <div className="h-5 w-6 rounded-full bg-slate-200" />
            </div>

            {/* Column Cards */}
            <div className="space-y-3.5 flex-1">
              {Array.from({ length: col.count }).map((_, cardIdx) => (
                <div
                  key={cardIdx}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-20 rounded-md bg-slate-200" />
                    <div className="h-5 w-16 rounded-full bg-slate-200" />
                  </div>

                  <div className="space-y-1.5 border-y border-slate-100 py-2.5">
                    <div className="h-3.5 w-3/4 rounded-md bg-slate-200" />
                    <div className="h-3.5 w-1/2 rounded-md bg-slate-200" />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="h-3 w-16 rounded-md bg-slate-200" />
                    <div className="h-7 w-24 rounded-lg bg-slate-200" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
