import { useEffect, useState } from "react";
import InfoTip from "../../../components/common/InfoTip";
import Pagination from "../../../components/common/Pagination";
import TruncatedCell from "../../../components/common/TruncatedCell";
import { useToast } from "../../../contexts/ToastContext";
import useDebouncedValue from "../../../hooks/useDebouncedValue";
import {
    formatMoneyDecimal,
    listAdminPayments,
    refundAdminPayment,
} from "../../../utils/billingApi";

const STATUSES = ["", "completed", "refunded", "partially_refunded", "failed"];
const PROVIDERS = ["", "stripe", "manual"];

const AdminPaymentsPanel = () => {
  const { showToast } = useToast();
  const [searchInput, setSearchInput] = useState("");
  const [filters, setFilters] = useState({ page: 1, limit: 20, status: "", provider: "", from: "", to: "" });
  const debouncedSearch = useDebouncedValue(searchInput, 400);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refundingId, setRefundingId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await listAdminPayments({ ...filters, search: debouncedSearch || undefined });
      setData(res);
    } catch (err) {
      showToast({
        status: "error",
        title: "Failed to load payments",
        description: err.message ?? "",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setFilters((f) => ({ ...f, page: 1 }));
  }, [debouncedSearch]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.page, filters.limit, filters.status, filters.provider, filters.from, filters.to, debouncedSearch]);

  const handleRefund = async (payment, partial = false) => {
    let amountCents;
    if (partial) {
      const input = window.prompt(
        `Enter the partial refund amount in ${payment.currency} (max ${payment.amount}):`,
      );
      if (!input) return;
      const num = Number(input);
      if (Number.isNaN(num) || num <= 0) {
        showToast({ status: "error", title: "Invalid amount" });
        return;
      }
      amountCents = Math.round(num * 100);
    } else if (
      !window.confirm(
        `Refund the full amount of ${formatMoneyDecimal(payment.amount, payment.currency)}?`,
      )
    ) {
      return;
    }
    setRefundingId(payment.id);
    try {
      await refundAdminPayment(payment.id, amountCents);
      showToast({ status: "success", title: "Refund issued" });
      await load();
    } catch (err) {
      showToast({
        status: "error",
        title: "Refund failed",
        description: err.message ?? "",
      });
    } finally {
      setRefundingId(null);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search email or reference…"
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <label className="text-sm text-slate-600">
          Status
          <select
            className="ml-2 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value, page: 1 }))}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s || "All"}</option>
            ))}
          </select>
        </label>
        <label className="text-sm text-slate-600">
          Provider
          <select
            className="ml-2 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
            value={filters.provider}
            onChange={(e) => setFilters((f) => ({ ...f, provider: e.target.value, page: 1 }))}
          >
            {PROVIDERS.map((p) => (
              <option key={p} value={p}>{p || "All"}</option>
            ))}
          </select>
        </label>
        <label className="text-sm text-slate-600">
          From
          <input
            type="date"
            className="ml-2 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
            value={filters.from}
            onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value, page: 1 }))}
          />
        </label>
        <label className="text-sm text-slate-600">
          To
          <input
            type="date"
            className="ml-2 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
            value={filters.to}
            onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value, page: 1 }))}
          />
        </label>
        <span className="ml-auto text-xs text-slate-500">
          {data ? `${data.total} payments` : ""}
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-900">
              <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-white">
                Date
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-white">
                User
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-white">
                Item
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-white">
                Reference
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-white">
                Amount
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-white">
                Fee
                <InfoTip content="Platform fee retained by Q Edu." />
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-white">
                Net
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-white">
                Status
              </th>
              <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-white">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {(data?.items ?? []).map((p) => {
              const item =
                p.package?.name ??
                p.subscription?.plan?.name ??
                p.description ??
                "—";
              return (
                <tr
                  key={p.id}
                  className="border-b border-slate-100 text-slate-700"
                >
                  <td className="px-3 py-2 whitespace-nowrap text-xs">
                    {new Date(p.createdAt).toLocaleString()}
                  </td>
                  <td className="px-3 py-2">
                    <TruncatedCell
                      value={p.user?.email ?? "—"}
                      maxWidth="14rem"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <TruncatedCell value={item} maxWidth="14rem" />
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">
                    <TruncatedCell
                      value={p.reference ?? "—"}
                      maxWidth="10rem"
                    />
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {formatMoneyDecimal(p.amount, p.currency)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {formatMoneyDecimal(p.platformFeeAmount, p.currency)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {formatMoneyDecimal(p.netAmount, p.currency)}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        p.status === "completed"
                          ? "bg-emerald-100 text-emerald-700"
                          : p.status === "refunded" ||
                              p.status === "partially_refunded"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-center">
                    {p.status === "completed" ? (
                      <div className="flex justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleRefund(p, false)}
                          disabled={refundingId === p.id}
                          className="rounded-md border border-rose-300 px-2 py-1 text-xs text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                        >
                          Refund
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRefund(p, true)}
                          disabled={refundingId === p.id}
                          className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                          Partial
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {!loading && (data?.items ?? []).length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="px-3 py-6 text-center text-sm text-slate-500"
                >
                  No payments found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {data && data.totalPages >= 1 ? (
        <Pagination
          page={filters.page}
          totalPages={data.totalPages}
          totalItems={data.total}
          pageSize={filters.limit}
          onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))}
          onPageSizeChange={(s) => setFilters((f) => ({ ...f, limit: s, page: 1 }))}
        />
      ) : null}
    </section>
  );
};

export default AdminPaymentsPanel;
