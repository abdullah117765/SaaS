import { useEffect, useState } from "react";
import InfoTip from "../../../components/common/InfoTip";
import Pagination from "../../../components/common/Pagination";
import TruncatedCell from "../../../components/common/TruncatedCell";
import { useToast } from "../../../contexts/ToastContext";
import useDebouncedValue from "../../../hooks/useDebouncedValue";
import {
    cancelAdminSubscription,
    formatMoney,
    listAdminSubscriptions,
} from "../../../utils/billingApi";

const STATUSES = [
  "",
  "ACTIVE",
  "TRIALING",
  "PAST_DUE",
  "CANCELED",
  "INCOMPLETE",
  "INCOMPLETE_EXPIRED",
  "UNPAID",
];

const AdminSubscriptionsPanel = () => {
  const { showToast } = useToast();
  const [searchInput, setSearchInput] = useState("");
  const [filters, setFilters] = useState({ page: 1, limit: 20, status: "" });
  const debouncedSearch = useDebouncedValue(searchInput, 400);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cancelingId, setCancelingId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await listAdminSubscriptions({
        ...filters,
        search: debouncedSearch || undefined,
      });
      setData(res);
    } catch (err) {
      showToast({
        status: "error",
        title: "Failed to load subscriptions",
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
  }, [filters.page, filters.limit, filters.status, debouncedSearch]);

  const handleCancel = async (sub, immediate) => {
    if (
      !window.confirm(
        immediate
          ? "Cancel this subscription IMMEDIATELY? This stops billing now."
          : "Cancel this subscription at the end of the current period?",
      )
    )
      return;
    setCancelingId(sub.id);
    try {
      await cancelAdminSubscription(sub.id, immediate);
      showToast({ status: "success", title: "Subscription cancelled" });
      await load();
    } catch (err) {
      showToast({
        status: "error",
        title: "Cancel failed",
        description: err.message ?? "",
      });
    } finally {
      setCancelingId(null);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search by email or name…"
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
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
        <span className="ml-auto text-xs text-slate-500">
          {data ? `${data.total} subscriptions` : ""}
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-900">
              <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-white">
                Customer
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-white">
                Plan
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-white">
                Price
                <InfoTip content="Plan price per billing interval." />
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-white">
                Status
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-white">
                Period end
              </th>
              <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-white">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {(data?.items ?? []).map((s) => (
              <tr
                key={s.id}
                className="border-b border-slate-100 text-slate-700"
              >
                <td className="px-3 py-2">
                  <TruncatedCell
                    value={s.user?.email ?? "—"}
                    maxWidth="14rem"
                  />
                </td>
                <td className="px-3 py-2">
                  {s.plan?.name ?? "—"}{" "}
                  <span className="text-xs text-slate-500">
                    ({s.plan?.tier})
                  </span>
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {formatMoney(s.plan?.priceCents ?? 0, s.plan?.currency)} /{" "}
                  {s.plan?.interval?.toLowerCase()}
                </td>
                <td className="px-3 py-2 text-xs">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      s.status === "ACTIVE"
                        ? "bg-emerald-100 text-emerald-700"
                        : s.status === "TRIALING"
                          ? "bg-sky-100 text-sky-700"
                          : s.status === "PAST_DUE" || s.status === "UNPAID"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {s.status}
                  </span>
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-xs">
                  {s.currentPeriodEnd
                    ? new Date(s.currentPeriodEnd).toLocaleDateString()
                    : "—"}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-center">
                  {s.status === "ACTIVE" ||
                  s.status === "TRIALING" ||
                  s.status === "PAST_DUE" ? (
                    <div className="flex justify-center gap-1">
                      <button
                        type="button"
                        disabled={cancelingId === s.id}
                        onClick={() => handleCancel(s, false)}
                        className="rounded-md border border-amber-300 px-2 py-1 text-xs text-amber-700 hover:bg-amber-50 disabled:opacity-50"
                      >
                        End at period
                      </button>
                      <button
                        type="button"
                        disabled={cancelingId === s.id}
                        onClick={() => handleCancel(s, true)}
                        className="rounded-md border border-rose-300 px-2 py-1 text-xs text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                      >
                        Cancel now
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </td>
              </tr>
            ))}
            {!loading && (data?.items ?? []).length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-6 text-center text-sm text-slate-500"
                >
                  No subscriptions found.
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
          onPageSizeChange={(s) =>
            setFilters((f) => ({ ...f, limit: s, page: 1 }))
          }
        />
      ) : null}
    </section>
  );
};

export default AdminSubscriptionsPanel;
