export default function CustomerLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Hero Banner Skeleton */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-200 p-6 sm:p-8 h-48 sm:h-56 flex flex-col justify-center">
        <div className="max-w-md space-y-3">
          <div className="h-6 w-32 rounded-full bg-slate-300" />
          <div className="h-8 w-3/4 rounded-xl bg-slate-300" />
          <div className="h-4 w-1/2 rounded-lg bg-slate-300" />
        </div>
      </div>

      {/* Category Chips Scroll Skeleton */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-6 w-40 rounded-lg bg-slate-200" />
          <div className="h-4 w-16 rounded-md bg-slate-200" />
        </div>
        <div className="flex gap-3 overflow-x-hidden pb-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex shrink-0 items-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-xs"
            >
              <div className="h-8 w-8 rounded-full bg-slate-200" />
              <div className="h-4 w-20 rounded-md bg-slate-200" />
            </div>
          ))}
        </div>
      </div>

      {/* Filter and Search Bar Skeleton */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="h-12 w-full sm:w-80 rounded-2xl bg-slate-200" />
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="h-10 w-24 rounded-xl bg-slate-200" />
          <div className="h-10 w-24 rounded-xl bg-slate-200" />
          <div className="h-10 w-24 rounded-xl bg-slate-200" />
        </div>
      </div>

      {/* Merchant Cards Grid Skeleton */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-6 w-48 rounded-lg bg-slate-200" />
          <div className="h-4 w-24 rounded-md bg-slate-200" />
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs"
            >
              {/* Image skeleton */}
              <div className="relative aspect-16/10 w-full bg-slate-200">
                <div className="absolute top-3 right-3 h-6 w-16 rounded-full bg-slate-300" />
                <div className="absolute bottom-3 left-3 h-12 w-12 rounded-2xl bg-slate-300 border-2 border-white" />
              </div>

              {/* Content skeleton */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between pt-1">
                  <div className="h-5 w-36 rounded-md bg-slate-200" />
                  <div className="h-4 w-12 rounded-md bg-slate-200" />
                </div>

                <div className="flex items-center gap-2">
                  <div className="h-3.5 w-20 rounded-md bg-slate-200" />
                  <div className="h-3.5 w-24 rounded-md bg-slate-200" />
                </div>

                <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                  <div className="h-4 w-24 rounded-md bg-slate-200" />
                  <div className="h-4 w-16 rounded-md bg-slate-200" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
