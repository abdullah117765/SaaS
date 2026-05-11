import { useEffect, useState } from "react";
import InfoTip from "../../../components/common/InfoTip";
import TruncatedCell from "../../../components/common/TruncatedCell";
import { useToast } from "../../../contexts/ToastContext";
import {
    formatMoneyDecimal,
    listAdminPayments,
    refundAdminPayment,
} from "../../../utils/billingApi";

const STATUSES = ["", "completed", "refunded", "partially_refunded", "failed"];

const AdminPaymentsPanel = () => {
  const { showToast } = useToast();
  const [filters, setFilters] = useState({ page: 1, limit: 20, status: "" });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refundingId, setRefundingId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await listAdminPayments(filters);
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
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.page, filters.limit, filters.status]);

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
        <label className="text-sm text-slate-600">
          Status
          <select
            className="ml-2 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
            value={filters.status}
            onChange={(e) =>
              setFilters((f) => ({ ...f, status: e.target.value, page: 1 }))
            }
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s || "All"}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={load}
          className="rounded-md border border-slate-300 bg-white px-3 py-1 text-sm hover:bg-slate-50"
        >
          Refresh
        </button>
        <span className="ml-auto text-xs text-slate-500">
          {data ? `${data.total} payments` : ""}
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">User</th>
              <th className="px-3 py-2">Item</th>
              <th className="px-3 py-2">Reference</th>
              <th className="px-3 py-2">Amount</th>
              <th className="px-3 py-2">
                Fee
                <InfoTip content="Platform fee retained by Q Edu." />
              </th>
              <th className="px-3 py-2">Net</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2 text-center">Actions</th>
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

      {data && data.totalPages > 1 ? (
        <div className="flex items-center justify-end gap-2 text-sm">
          <button
            type="button"
            disabled={filters.page <= 1}
            onClick={() =>
              setFilters((f) => ({ ...f, page: Math.max(1, f.page - 1) }))
            }
            className="rounded-md border border-slate-300 bg-white px-3 py-1 disabled:opacity-50"
          >
            Prev
          </button>
          <span className="text-slate-600">
            Page {data.page} of {data.totalPages}
          </span>
          <button
            type="button"
            disabled={filters.page >= data.totalPages}
            onClick={() =>
              setFilters((f) => ({
                ...f,
                page: Math.min(data.totalPages, f.page + 1),
              }))
            }
            className="rounded-md border border-slate-300 bg-white px-3 py-1 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      ) : null}
    </section>
  );
};

export default AdminPaymentsPanel;
