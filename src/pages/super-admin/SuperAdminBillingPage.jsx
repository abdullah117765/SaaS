import { useEffect, useMemo, useState } from "react";
import InfoTip from "../../components/common/InfoTip";
import TruncatedCell from "../../components/common/TruncatedCell";
import {
    formatMoney,
    formatMoneyDecimal,
    getBillingAnalytics,
} from "../../utils/billingApi";
import AdminCouponsPanel from "./billing/AdminCouponsPanel";
import AdminPaymentsPanel from "./billing/AdminPaymentsPanel";
import AdminSubscriptionsPanel from "./billing/AdminSubscriptionsPanel";

const StatCard = ({ label, value, info, accent = "emerald" }) => {
  const accentClass =
    {
      emerald: "text-emerald-600",
      sky: "text-sky-600",
      amber: "text-amber-600",
      slate: "text-slate-700",
      rose: "text-rose-600",
    }[accent] ?? "text-slate-700";
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
        {info ? <InfoTip content={info} /> : null}
      </p>
      <p className={`mt-2 text-2xl font-bold ${accentClass}`}>{value}</p>
    </div>
  );
};

/** Pure SVG horizontal bar chart for grouped totals. */
const BarChart = ({
  data,
  valueKey = "value",
  labelKey = "label",
  formatValue = (v) => v,
  height = 220,
}) => {
  const max = Math.max(1, ...data.map((d) => Number(d[valueKey] ?? 0)));
  const barH = 22;
  const gap = 8;
  const chartH = Math.max(height, data.length * (barH + gap) + 8);
  return (
    <svg
      viewBox={`0 0 600 ${chartH}`}
      className="w-full"
      role="img"
      aria-label="Bar chart"
    >
      {data.map((d, i) => {
        const value = Number(d[valueKey] ?? 0);
        const w = (value / max) * 420;
        const y = i * (barH + gap) + 4;
        return (
          <g key={d[labelKey] ?? i}>
            <text
              x="0"
              y={y + 15}
              className="fill-slate-700 text-[11px]"
              style={{ fontFamily: "system-ui" }}
            >
              {String(d[labelKey] ?? "").slice(0, 22)}
            </text>
            <rect
              x="160"
              y={y}
              width={Math.max(2, w)}
              height={barH}
              className="fill-emerald-500"
              rx="3"
            />
            <text
              x={170 + Math.max(2, w)}
              y={y + 15}
              className="fill-slate-600 text-[11px]"
              style={{ fontFamily: "system-ui" }}
            >
              {formatValue(value)}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

const SuperAdminBillingPage = () => {
  const [tab, setTab] = useState("overview");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [range, setRange] = useState("30d");

  const load = async (rangeKey = range) => {
    setLoading(true);
    setError(null);
    try {
      const now = new Date();
      let from;
      if (rangeKey === "7d") from = new Date(now.getTime() - 7 * 86400000);
      else if (rangeKey === "30d")
        from = new Date(now.getTime() - 30 * 86400000);
      else if (rangeKey === "90d")
        from = new Date(now.getTime() - 90 * 86400000);
      const res = await getBillingAnalytics({
        from: from ? from.toISOString() : undefined,
        to: now.toISOString(),
      });
      setData(res);
    } catch (err) {
      setError(err.message ?? "Failed to load analytics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(range);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  const totals = data?.totals;
  const currency = "USD";
  const platformFeePercent = totals?.platformFeePercent ?? 10;

  const providerData = useMemo(
    () =>
      (data?.byProvider ?? []).map((row) => ({
        label: row.provider ?? "unknown",
        value: Number(row._sum?.amount ?? 0),
        fee: Number(row._sum?.platformFeeAmount ?? 0),
        count: row._count?._all ?? 0,
      })),
    [data],
  );

  const packageData = useMemo(() => {
    const recentByPkg = new Map();
    (data?.recent ?? []).forEach((p) => {
      if (p.package?.name) recentByPkg.set(p.packageId, p.package.name);
    });
    return (data?.byPackage ?? []).map((row) => ({
      label:
        recentByPkg.get(row.packageId) ?? row.packageId?.slice(0, 8) ?? "pkg",
      value: Number(row._sum?.amount ?? 0),
      count: row._count?._all ?? 0,
    }));
  }, [data]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-500 border-b-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="rounded-md border border-rose-300 bg-rose-50 p-4 text-rose-800">
          {error}
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "payments", label: "Payments" },
    { id: "subscriptions", label: "Subscriptions" },
    { id: "coupons", label: "Coupons" },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Platform billing
          </h1>
          <p className="text-sm text-slate-600">
            Revenue, subscriptions, payments and promotional coupons.
          </p>
        </div>
        {tab === "overview" ? (
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 text-sm">
            {["7d", "30d", "90d", "all"].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 rounded-md transition ${range === r ? "bg-emerald-600 text-white" : "text-slate-600 hover:text-slate-900"}`}
              >
                {r}
              </button>
            ))}
          </div>
        ) : null}
      </header>

      <nav className="flex flex-wrap gap-2 border-b border-slate-200">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition ${
              tab === t.id
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "payments" ? <AdminPaymentsPanel /> : null}
      {tab === "subscriptions" ? <AdminSubscriptionsPanel /> : null}
      {tab === "coupons" ? <AdminCouponsPanel /> : null}
      {tab !== "overview" ? null : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
            <StatCard
              label="Gross revenue"
              info="Total amount charged across all completed transactions in the selected period."
              value={formatMoneyDecimal(totals?.gross, currency)}
              accent="slate"
            />
            <StatCard
              label="Platform fee"
              info={`Platform fee retained (${platformFeePercent}% of gross).`}
              value={formatMoneyDecimal(totals?.platformFee, currency)}
              accent="emerald"
            />
            <StatCard
              label="Net to providers"
              info="Net amount routed to academies after the platform fee."
              value={formatMoneyDecimal(totals?.net, currency)}
              accent="sky"
            />
            <StatCard
              label="Transactions"
              value={(totals?.transactionCount ?? 0).toLocaleString()}
              accent="slate"
            />
            <StatCard
              label="MRR"
              info="Monthly Recurring Revenue: yearly plans normalised to monthly."
              value={formatMoney(data?.mrrCents ?? 0, currency)}
              accent="amber"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900">
                By provider
                <InfoTip content="Gross revenue grouped by payment provider." />
              </h2>
              {providerData.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">No data.</p>
              ) : (
                <div className="mt-3">
                  <BarChart
                    data={providerData}
                    formatValue={(v) => formatMoneyDecimal(v, currency)}
                  />
                </div>
              )}
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900">
                Top credit packages
                <InfoTip content="Best-selling credit packages by gross revenue." />
              </h2>
              {packageData.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">No data.</p>
              ) : (
                <div className="mt-3">
                  <BarChart
                    data={packageData}
                    formatValue={(v) => formatMoneyDecimal(v, currency)}
                  />
                </div>
              )}
            </section>
          </div>

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">
              Recent transactions
            </h2>
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="py-2 pr-4">Date</th>
                    <th className="py-2 pr-4">User</th>
                    <th className="py-2 pr-4">Description</th>
                    <th className="py-2 pr-4">Reference</th>
                    <th className="py-2 pr-4">Amount</th>
                    <th className="py-2 pr-4">
                      Fee
                      <InfoTip
                        content={`Platform fee (${platformFeePercent}%).`}
                      />
                    </th>
                    <th className="py-2 pr-4">Net</th>
                    <th className="py-2 pr-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.recent ?? []).map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-slate-100 text-slate-700"
                    >
                      <td className="py-2 pr-4 whitespace-nowrap text-xs">
                        {new Date(p.createdAt).toLocaleString()}
                      </td>
                      <td className="py-2 pr-4">
                        <TruncatedCell
                          value={p.user?.email ?? "—"}
                          maxWidth="14rem"
                        />
                      </td>
                      <td className="py-2 pr-4">
                        <TruncatedCell
                          value={p.description ?? "—"}
                          maxWidth="14rem"
                        />
                      </td>
                      <td className="py-2 pr-4 font-mono text-xs">
                        <TruncatedCell
                          value={p.reference ?? "—"}
                          maxWidth="10rem"
                        />
                      </td>
                      <td className="py-2 pr-4 whitespace-nowrap">
                        {formatMoneyDecimal(p.amount, p.currency)}
                      </td>
                      <td className="py-2 pr-4 whitespace-nowrap">
                        {formatMoneyDecimal(p.platformFeeAmount, p.currency)}
                      </td>
                      <td className="py-2 pr-4 whitespace-nowrap">
                        {formatMoneyDecimal(p.netAmount, p.currency)}
                      </td>
                      <td className="py-2 pr-4 text-xs">{p.status}</td>
                    </tr>
                  ))}
                  {(data?.recent ?? []).length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="py-6 text-center text-sm text-slate-500"
                      >
                        No transactions in this range.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">
              Active subscriptions
              <InfoTip content="Total subscriptions currently in ACTIVE status." />
            </h2>
            <p className="mt-2 text-3xl font-bold text-emerald-600">
              {(data?.activeSubscriptions ?? 0).toLocaleString()}
            </p>
          </section>
        </>
      )}
    </div>
  );
};

export default SuperAdminBillingPage;
