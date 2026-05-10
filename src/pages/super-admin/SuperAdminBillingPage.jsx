import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
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

const RANGE_OPTIONS = [
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
  { value: "90d", label: "90d" },
  { value: "all", label: "all" },
  { value: "custom", label: "custom" },
];

const SuperAdminBillingPage = () => {
  const [tab, setTab] = useState("overview");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [range, setRange] = useState("30d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [provider, setProvider] = useState("");
  const [interval, setInterval] = useState("day");

  const buildDateWindow = () => {
    const now = new Date();
    if (range === "custom") {
      return {
        from: customFrom ? new Date(`${customFrom}T00:00:00.000Z`) : undefined,
        to: customTo ? new Date(`${customTo}T23:59:59.999Z`) : now,
      };
    }
    if (range === "all") {
      return { from: undefined, to: now };
    }
    const days = range === "7d" ? 7 : range === "90d" ? 90 : 30;
    return {
      from: new Date(now.getTime() - days * 86400000),
      to: now,
    };
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { from, to } = buildDateWindow();
      const res = await getBillingAnalytics({
        from: from ? from.toISOString() : undefined,
        to: to ? to.toISOString() : undefined,
        interval,
        provider: provider || undefined,
      });
      setData(res);
    } catch (err) {
      setError(err.message ?? "Failed to load analytics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab !== "overview") {
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, interval, provider, tab]);

  const handleApplyCustomRange = () => {
    if (!customFrom || !customTo) return;
    load();
  };

  const totals = data?.totals;
  const currency = "USD";
  const platformFeePercent = totals?.platformFeePercent ?? 10;

  const providerData = useMemo(
    () =>
      (data?.byProvider ?? []).map((row) => ({
        provider: row.provider ?? "unknown",
        gross: Number(row._sum?.amount ?? 0),
        fee: Number(row._sum?.platformFeeAmount ?? 0),
      })),
    [data],
  );

  const packageData = useMemo(() => {
    const recentByPkg = new Map();
    (data?.recent ?? []).forEach((p) => {
      if (p.package?.name) recentByPkg.set(p.packageId, p.package.name);
    });
    return (data?.byPackage ?? []).map((row) => ({
      packageName:
        recentByPkg.get(row.packageId) ?? row.packageId?.slice(0, 8) ?? "pkg",
      gross: Number(row._sum?.amount ?? 0),
    }));
  }, [data]);

  const timeSeries = useMemo(
    () =>
      (data?.timeSeries ?? []).map((row) => ({
        period: row.period,
        gross: Number(row.gross ?? 0),
        platformFee: Number(row.platformFee ?? 0),
        net: Number(row.net ?? 0),
      })),
    [data],
  );

  const providerOptions = useMemo(() => {
    const values = new Set((data?.byProvider ?? []).map((p) => p.provider));
    return Array.from(values).filter(Boolean);
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
      <div className="w-full p-2">
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
    <div className="w-full space-y-6 px-1 py-2">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Platform billing</h1>
          <p className="text-sm text-slate-600">
            Revenue, subscriptions, payments and promotional coupons.
          </p>
        </div>
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
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
              <div className="xl:col-span-2">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Date range
                </label>
                <div className="inline-flex w-full rounded-lg border border-slate-200 bg-white p-1 text-sm">
                  {RANGE_OPTIONS.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setRange(r.value)}
                      className={`flex-1 rounded-md px-2 py-1.5 transition ${
                        range === r.value
                          ? "bg-emerald-600 text-white"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Provider
                </label>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="">All providers</option>
                  {providerOptions.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Interval
                </label>
                <select
                  value={interval}
                  onChange={(e) => setInterval(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="day">Day</option>
                  <option value="week">Week</option>
                  <option value="month">Month</option>
                </select>
              </div>

              {range === "custom" ? (
                <>
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      From
                    </label>
                    <input
                      type="date"
                      value={customFrom}
                      onChange={(e) => setCustomFrom(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      To
                    </label>
                    <input
                      type="date"
                      value={customTo}
                      onChange={(e) => setCustomTo(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleApplyCustomRange}
                      className="w-full rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                    >
                      Apply custom range
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          </section>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
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

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">
              Revenue trend
              <InfoTip content="Backend-aggregated series for gross, fee, and net in the selected interval." />
            </h2>
            <div className="mt-4 h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeSeries} margin={{ left: 8, right: 12, top: 12, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => formatMoneyDecimal(v, currency)} />
                  <Legend />
                  <Line type="monotone" dataKey="gross" stroke="#0f766e" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="platformFee" stroke="#ca8a04" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="net" stroke="#0369a1" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900">
                By provider
                <InfoTip content="Gross revenue grouped by payment provider." />
              </h2>
              <div className="mt-4 h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={providerData} margin={{ left: 8, right: 12, top: 12, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="provider" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v) => formatMoneyDecimal(v, currency)} />
                    <Legend />
                    <Bar dataKey="gross" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="fee" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900">
                Top credit packages
                <InfoTip content="Best-selling credit packages by gross revenue." />
              </h2>
              <div className="mt-4 h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={packageData} margin={{ left: 8, right: 12, top: 12, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="packageName" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v) => formatMoneyDecimal(v, currency)} />
                    <Legend />
                    <Bar dataKey="gross" fill="#059669" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
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
                      <InfoTip content={`Platform fee (${platformFeePercent}%).`} />
                    </th>
                    <th className="py-2 pr-4">Net</th>
                    <th className="py-2 pr-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.recent ?? []).map((p) => (
                    <tr key={p.id} className="border-b border-slate-100 text-slate-700">
                      <td className="whitespace-nowrap py-2 pr-4 text-xs">
                        {new Date(p.createdAt).toLocaleString()}
                      </td>
                      <td className="py-2 pr-4">
                        <TruncatedCell value={p.user?.email ?? "—"} maxWidth="14rem" />
                      </td>
                      <td className="py-2 pr-4">
                        <TruncatedCell value={p.description ?? "—"} maxWidth="14rem" />
                      </td>
                      <td className="py-2 pr-4 font-mono text-xs">
                        <TruncatedCell value={p.reference ?? "—"} maxWidth="10rem" />
                      </td>
                      <td className="whitespace-nowrap py-2 pr-4">
                        {formatMoneyDecimal(p.amount, p.currency)}
                      </td>
                      <td className="whitespace-nowrap py-2 pr-4">
                        {formatMoneyDecimal(p.platformFeeAmount, p.currency)}
                      </td>
                      <td className="whitespace-nowrap py-2 pr-4">
                        {formatMoneyDecimal(p.netAmount, p.currency)}
                      </td>
                      <td className="py-2 pr-4 text-xs">{p.status}</td>
                    </tr>
                  ))}
                  {(data?.recent ?? []).length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-sm text-slate-500">
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
