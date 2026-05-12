import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { FaSearch } from "react-icons/fa";

const STATUS_CLASSES = {
  completed: "bg-emerald-100 text-emerald-800",
  pending: "bg-amber-100 text-amber-800",
  failed: "bg-rose-100 text-rose-800",
  refunded: "bg-slate-200 text-slate-700",
  partially_refunded: "bg-sky-100 text-sky-800",
};

const ITEMS_PER_PAGE = 10;

const formatMoney = (amount, currency = "USD") => {
  const num = Number(amount ?? 0);
  if (!Number.isFinite(num)) return "-";

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(num);
  } catch {
    return `${num.toFixed(2)} ${currency}`;
  }
};

const PaymentsTab = ({ payments = [], loading = false }) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [providerFilter, setProviderFilter] = useState("all");
  const [page, setPage] = useState(1);

  const statusOptions = useMemo(() => {
    const set = new Set(payments.map((p) => p.status).filter(Boolean));
    return ["all", ...Array.from(set)];
  }, [payments]);

  const providerOptions = useMemo(() => {
    const set = new Set(payments.map((p) => p.provider).filter(Boolean));
    return ["all", ...Array.from(set)];
  }, [payments]);

  const filteredPayments = useMemo(() => {
    const term = search.trim().toLowerCase();
    return payments.filter((payment) => {
      const matchesSearch =
        !term ||
        (payment.id ?? "").toLowerCase().includes(term) ||
        (payment.reference ?? "").toLowerCase().includes(term) ||
        (payment.provider ?? "").toLowerCase().includes(term);

      const matchesStatus =
        statusFilter === "all" || payment.status === statusFilter;
      const matchesProvider =
        providerFilter === "all" || payment.provider === providerFilter;

      return matchesSearch && matchesStatus && matchesProvider;
    });
  }, [payments, providerFilter, search, statusFilter]);

  const totals = useMemo(() => {
    const gross = filteredPayments.reduce(
      (sum, payment) => sum + Number(payment.amount ?? 0),
      0,
    );

    return {
      count: filteredPayments.length,
      gross,
      paidCount: filteredPayments.filter((p) => p.status === "completed")
        .length,
    };
  }, [filteredPayments]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredPayments.length / ITEMS_PER_PAGE),
  );
  const clampedPage = Math.min(page, totalPages);

  const pageItems = useMemo(() => {
    const start = (clampedPage - 1) * ITEMS_PER_PAGE;
    return filteredPayments.slice(start, start + ITEMS_PER_PAGE);
  }, [clampedPage, filteredPayments]);

  const goToPage = (nextPage) => {
    setPage(Math.max(1, Math.min(totalPages, nextPage)));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-5"
    >
      <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Total filtered
            </p>
            <p className="mt-1 text-2xl font-semibold text-emerald-900">
              {totals.count}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Completed payments
            </p>
            <p className="mt-1 text-2xl font-semibold text-emerald-900">
              {totals.paidCount}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Gross amount
            </p>
            <p className="mt-1 text-2xl font-semibold text-emerald-900">
              {formatMoney(totals.gross)}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 grid gap-3 md:grid-cols-4">
          <div className="relative md:col-span-2">
            <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by payment id, reference, provider"
              className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none"
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status === "all" ? "All statuses" : status}
              </option>
            ))}
          </select>
          <select
            value={providerFilter}
            onChange={(e) => {
              setProviderFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none"
          >
            {providerOptions.map((provider) => (
              <option key={provider} value={provider}>
                {provider === "all" ? "All providers" : provider}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-emerald-950 text-left text-xs font-semibold uppercase tracking-wide text-emerald-100">
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Provider</th>
                <th className="px-3 py-2">Reference</th>
                <th className="px-3 py-2">Amount</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-8 text-center text-slate-500"
                  >
                    Loading payments...
                  </td>
                </tr>
              ) : pageItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-8 text-center text-slate-500"
                  >
                    No payments found for the selected filters.
                  </td>
                </tr>
              ) : (
                pageItems.map((payment, idx) => (
                  <tr
                    key={payment.id}
                    className={`border-b border-slate-100 text-slate-700 hover:bg-emerald-50/50 ${idx % 2 === 0 ? "bg-white" : "bg-emerald-50/30"}`}
                  >
                    <td className="px-3 py-2 text-xs">
                      {new Date(payment.createdAt).toLocaleString()}
                    </td>
                    <td className="px-3 py-2">{payment.provider ?? "-"}</td>
                    <td className="px-3 py-2 font-mono text-xs">
                      {payment.reference ?? "-"}
                    </td>
                    <td className="px-3 py-2">
                      {formatMoney(payment.amount, payment.currency)}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          STATUS_CLASSES[payment.status] ??
                          "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {payment.status ?? "unknown"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Page {clampedPage} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => goToPage(clampedPage - 1)}
              disabled={clampedPage <= 1}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={() => goToPage(clampedPage + 1)}
              disabled={clampedPage >= totalPages}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PaymentsTab;
