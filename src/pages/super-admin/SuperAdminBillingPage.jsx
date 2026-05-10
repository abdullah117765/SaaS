import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
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
import SuperAdminLayout from "../../components/super-admin/SuperAdminLayout";
import {
    formatMoney,
    formatMoneyDecimal,
    getBillingAnalytics,
    listAdminPayments,
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

const validTabs = new Set(["overview", "payments", "subscriptions", "coupons"]);

const getTransactionStatusClass = (status) => {
  const normalized = (status ?? "").toLowerCase();

  if (normalized === "completed") {
    return "bg-emerald-100 text-emerald-800";
  }
  if (normalized === "pending") {
    return "bg-amber-100 text-amber-800";
  }
  if (normalized === "failed") {
    return "bg-rose-100 text-rose-800";
  }
  if (normalized === "refunded" || normalized === "partially_refunded") {
    return "bg-sky-100 text-sky-800";
  }

  return "bg-slate-100 text-slate-700";
};

const SuperAdminBillingPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const incomingTab = searchParams.get("tab") ?? "overview";
  const tab = validTabs.has(incomingTab) ? incomingTab : "overview";

  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState(null);

  const [paymentsData, setPaymentsData] = useState({
    items: [],
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentsError, setPaymentsError] = useState(null);

  const defaultEnd = useMemo(() => new Date(), []);
  const defaultStart = useMemo(
    () => new Date(defaultEnd.getTime() - 30 * 86400000),
    [defaultEnd],
  );

  const [startDate, setStartDate] = useState(
    defaultStart.toISOString().slice(0, 10),
  );
  const [endDate, setEndDate] = useState(defaultEnd.toISOString().slice(0, 10));

  const [recentStatus, setRecentStatus] = useState("");
  const [recentProvider, setRecentProvider] = useState("");
  const [recentPage, setRecentPage] = useState(1);
  const [recentLimit, setRecentLimit] = useState(10);

  const updateTab = (nextTab) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", nextTab);
    setSearchParams(next, { replace: true });
  };

  const fromIso = startDate
    ? new Date(`${startDate}T00:00:00.000Z`).toISOString()
    : undefined;
  const toIso = endDate
    ? new Date(`${endDate}T23:59:59.999Z`).toISOString()
    : undefined;

  const loadAnalytics = async () => {
    setAnalyticsLoading(true);
    setAnalyticsError(null);
    try {
      const data = await getBillingAnalytics({
        from: fromIso,
        to: toIso,
        interval: "day",
      });
      setAnalyticsData(data);
    } catch (err) {
      setAnalyticsError(err.message ?? "Failed to load billing analytics.");
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const loadRecentTransactions = async () => {
    setPaymentsLoading(true);
    setPaymentsError(null);
    try {
      const data = await listAdminPayments({
        page: recentPage,
        limit: recentLimit,
        status: recentStatus || undefined,
        provider: recentProvider || undefined,
        from: fromIso,
        to: toIso,
      });
      setPaymentsData(
        data ?? {
          items: [],
          page: 1,
          limit: recentLimit,
          total: 0,
          totalPages: 1,
        },
      );
    } catch (err) {
      setPaymentsError(err.message ?? "Failed to load recent transactions.");
    } finally {
      setPaymentsLoading(false);
    }
  };

  useEffect(() => {
    if (tab !== "subscriptions") {
      return;
    }
    loadAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  useEffect(() => {
    if (tab !== "subscriptions") {
      return;
    }
    loadRecentTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, recentStatus, recentProvider, recentPage, recentLimit]);

  const handleApplyDateRange = () => {
    setRecentPage(1);
    if (tab === "subscriptions") {
      loadAnalytics();
      loadRecentTransactions();
    }
  };

  const totals = analyticsData?.totals;
  const currency = "USD";
  const platformFeePercent = totals?.platformFeePercent ?? 10;

  const providerData = useMemo(
    () =>
      (analyticsData?.byProvider ?? []).map((row) => ({
        provider: row.provider ?? "unknown",
        gross: Number(row._sum?.amount ?? 0),
        fee: Number(row._sum?.platformFeeAmount ?? 0),
      })),
    [analyticsData],
  );

  const packageData = useMemo(() => {
    const recentByPkg = new Map();
    (analyticsData?.recent ?? []).forEach((p) => {
      if (p.package?.name) recentByPkg.set(p.packageId, p.package.name);
    });

    return (analyticsData?.byPackage ?? []).map((row) => ({
      packageName:
        recentByPkg.get(row.packageId) ?? row.packageId?.slice(0, 8) ?? "pkg",
      gross: Number(row._sum?.amount ?? 0),
    }));
  }, [analyticsData]);

  const timeSeries = useMemo(
    () =>
      (analyticsData?.timeSeries ?? []).map((row) => ({
        period: row.period,
        gross: Number(row.gross ?? 0),
        platformFee: Number(row.platformFee ?? 0),
        net: Number(row.net ?? 0),
      })),
    [analyticsData],
  );

  const providerOptions = useMemo(() => {
    const source = analyticsData?.byProvider ?? [];
    const values = new Set(source.map((p) => p.provider).filter(Boolean));
    return Array.from(values);
  }, [analyticsData]);

  return (
    <SuperAdminLayout>
      <div className="w-full space-y-6 px-1 py-2">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Platform billing
            </h1>
            <p className="text-sm text-slate-600">
              Revenue, subscriptions, payments, and promotional coupons.
            </p>
          </div>
        </header>

        <nav className="flex flex-wrap gap-2 border-b border-slate-200">
          {[
            { id: "overview", label: "Overview" },
            { id: "payments", label: "Payments" },
            { id: "subscriptions", label: "Subscriptions" },
            { id: "coupons", label: "Coupons" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => updateTab(item.id)}
              className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition ${
                tab === item.id
                  ? "border-emerald-600 text-emerald-700"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Start date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                End date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleApplyDateRange}
                className="w-full rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Apply date range
              </button>
            </div>
          </div>
        </section>

        {tab === "overview" ? (
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">
              Billing workspace
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Use the sidebar Billing sections to open Payments, Subscriptions,
              and Coupons directly. Subscription analytics and graphs are shown
              in the Subscriptions section.
            </p>
          </section>
        ) : null}

        {tab === "payments" ? <AdminPaymentsPanel /> : null}

        {tab === "subscriptions" ? (
          <>
            {analyticsError ? (
              <div className="rounded-md border border-rose-300 bg-rose-50 p-4 text-rose-800">
                {analyticsError}
              </div>
            ) : null}

            {analyticsLoading ? (
              <div className="flex h-40 items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-500 border-b-transparent" />
              </div>
            ) : (
              <>
                <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-base font-semibold text-slate-900">
                    Active subscriptions
                    <InfoTip content="Total subscriptions currently in ACTIVE status." />
                  </h2>
                  <p className="mt-2 text-3xl font-bold text-emerald-600">
                    {(analyticsData?.activeSubscriptions ?? 0).toLocaleString()}
                  </p>
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
                    info="Monthly Recurring Revenue: yearly plans normalized to monthly."
                    value={formatMoney(analyticsData?.mrrCents ?? 0, currency)}
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
                      <LineChart
                        data={timeSeries}
                        margin={{ left: 8, right: 12, top: 12, bottom: 8 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip
                          formatter={(v) => formatMoneyDecimal(v, currency)}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="gross"
                          stroke="#0f766e"
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="platformFee"
                          stroke="#ca8a04"
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="net"
                          stroke="#0369a1"
                          strokeWidth={2}
                          dot={false}
                        />
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
                        <BarChart
                          data={providerData}
                          margin={{ left: 8, right: 12, top: 12, bottom: 8 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="provider" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip
                            formatter={(v) => formatMoneyDecimal(v, currency)}
                          />
                          <Legend />
                          <Bar
                            dataKey="gross"
                            fill="#10b981"
                            radius={[4, 4, 0, 0]}
                          />
                          <Bar
                            dataKey="fee"
                            fill="#14b8a6"
                            radius={[4, 4, 0, 0]}
                          />
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
                        <BarChart
                          data={packageData}
                          margin={{ left: 8, right: 12, top: 12, bottom: 8 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="packageName"
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip
                            formatter={(v) => formatMoneyDecimal(v, currency)}
                          />
                          <Legend />
                          <Bar
                            dataKey="gross"
                            fill="#059669"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </section>
                </div>
              </>
            )}

            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-3 flex flex-wrap items-end gap-3">
                <h2 className="text-base font-semibold text-emerald-800">
                  Recent transactions
                </h2>
                <select
                  value={recentStatus}
                  onChange={(e) => {
                    setRecentPage(1);
                    setRecentStatus(e.target.value);
                  }}
                  className="rounded-lg border border-emerald-200 bg-emerald-50/40 px-3 py-2 text-sm text-emerald-800 focus:border-emerald-400 focus:outline-none"
                >
                  <option value="">All statuses</option>
                  <option value="completed">completed</option>
                  <option value="pending">pending</option>
                  <option value="failed">failed</option>
                  <option value="refunded">refunded</option>
                  <option value="partially_refunded">partially_refunded</option>
                </select>
                <select
                  value={recentProvider}
                  onChange={(e) => {
                    setRecentPage(1);
                    setRecentProvider(e.target.value);
                  }}
                  className="rounded-lg border border-emerald-200 bg-emerald-50/40 px-3 py-2 text-sm text-emerald-800 focus:border-emerald-400 focus:outline-none"
                >
                  <option value="">All providers</option>
                  {providerOptions.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <select
                  value={recentLimit}
                  onChange={(e) => {
                    setRecentPage(1);
                    setRecentLimit(Number(e.target.value));
                  }}
                  className="rounded-lg border border-emerald-200 bg-emerald-50/40 px-3 py-2 text-sm text-emerald-800 focus:border-emerald-400 focus:outline-none"
                >
                  <option value={10}>10 / page</option>
                  <option value={20}>20 / page</option>
                  <option value={50}>50 / page</option>
                </select>
              </div>

              {paymentsError ? (
                <div className="mb-3 rounded-md border border-rose-300 bg-rose-50 p-3 text-sm text-rose-800">
                  {paymentsError}
                </div>
              ) : null}

              {paymentsLoading ? (
                <div className="flex h-24 items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-b-transparent" />
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-emerald-200 bg-emerald-50/60 text-left text-xs font-semibold uppercase tracking-wide text-emerald-800">
                          <th className="py-2 pr-4">Date</th>
                          <th className="py-2 pr-4">User</th>
                          <th className="py-2 pr-4">Description</th>
                          <th className="py-2 pr-4">Reference</th>
                          <th className="py-2 pr-4">Amount</th>
                          <th className="py-2 pr-4">Fee</th>
                          <th className="py-2 pr-4">Net</th>
                          <th className="py-2 pr-4">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(paymentsData.items ?? []).map((p) => (
                          <tr
                            key={p.id}
                            className="border-b border-emerald-50 text-slate-700 hover:bg-emerald-50/40"
                          >
                            <td className="whitespace-nowrap py-2 pr-4 text-xs">
                              {new Date(p.createdAt).toLocaleString()}
                            </td>
                            <td className="py-2 pr-4">
                              <TruncatedCell
                                value={p.user?.email ?? "-"}
                                maxWidth="14rem"
                              />
                            </td>
                            <td className="py-2 pr-4">
                              <TruncatedCell
                                value={p.description ?? "-"}
                                maxWidth="14rem"
                              />
                            </td>
                            <td className="py-2 pr-4 font-mono text-xs">
                              <TruncatedCell
                                value={p.reference ?? "-"}
                                maxWidth="10rem"
                              />
                            </td>
                            <td className="whitespace-nowrap py-2 pr-4">
                              {formatMoneyDecimal(p.amount, p.currency)}
                            </td>
                            <td className="whitespace-nowrap py-2 pr-4">
                              {formatMoneyDecimal(
                                p.platformFeeAmount,
                                p.currency,
                              )}
                            </td>
                            <td className="whitespace-nowrap py-2 pr-4">
                              {formatMoneyDecimal(p.netAmount, p.currency)}
                            </td>
                            <td className="py-2 pr-4 text-xs">
                              <span
                                className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${getTransactionStatusClass(
                                  p.status,
                                )}`}
                              >
                                {p.status ?? "-"}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {(paymentsData.items ?? []).length === 0 ? (
                          <tr>
                            <td
                              colSpan={8}
                              className="py-6 text-center text-sm text-slate-500"
                            >
                              No transactions in this filter.
                            </td>
                          </tr>
                        ) : null}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-xs text-slate-500">
                      Page {paymentsData.page ?? 1} of{" "}
                      {paymentsData.totalPages ?? 1} ({paymentsData.total ?? 0}{" "}
                      total)
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={(paymentsData.page ?? 1) <= 1}
                        onClick={() =>
                          setRecentPage((prev) => Math.max(prev - 1, 1))
                        }
                        className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <button
                        type="button"
                        disabled={
                          (paymentsData.page ?? 1) >=
                          (paymentsData.totalPages ?? 1)
                        }
                        onClick={() =>
                          setRecentPage((prev) =>
                            Math.min(
                              prev + 1,
                              paymentsData.totalPages ?? prev + 1,
                            ),
                          )
                        }
                        className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </>
              )}
            </section>

            <AdminSubscriptionsPanel />
          </>
        ) : null}

        {tab === "coupons" ? <AdminCouponsPanel /> : null}
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminBillingPage;
