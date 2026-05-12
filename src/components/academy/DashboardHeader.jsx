
const DashboardHeader = ({ academyData }) => {
  const planLabel = academyData?.subscription?.plan ?? "Free";
  const createdAt = academyData?.createdAt
    ? new Date(academyData.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "";

  return (
    <div className="mb-6 flex flex-col gap-3 rounded-xl border border-emerald-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-emerald-950">
          {academyData?.name ?? "Your Academy"}
        </h1>
        <p className="mt-0.5 text-xs text-slate-500">
          <span className="font-mono text-slate-400">{academyData?.id}</span>
          {createdAt ? (
            <span className="ml-2 text-slate-400">
              &middot; Created {createdAt}
            </span>
          ) : null}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
          {planLabel} Plan
        </span>
        <button
          type="button"
          className="inline-flex items-center rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-800 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:from-emerald-700 hover:to-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          Upgrade
        </button>
      </div>
    </div>
  );
};

export default DashboardHeader;
