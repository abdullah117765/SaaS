import { useEffect, useState } from "react";
import InfoTip from "../../../components/common/InfoTip";
import Pagination from "../../../components/common/Pagination";
import { useToast } from "../../../contexts/ToastContext";
import useDebouncedValue from "../../../hooks/useDebouncedValue";
import {
    createCoupon,
    deleteCoupon,
    formatMoney,
    listAdminCoupons,
    updateCoupon,
} from "../../../utils/billingApi";

const blank = {
  code: "",
  name: "",
  description: "",
  discountType: "PERCENT",
  percentOff: 10,
  amountOffCents: 0,
  currency: "USD",
  duration: "ONCE",
  durationMonths: 0,
  appliesTo: "ALL",
  maxRedemptions: 0,
  startsAt: "",
  expiresAt: "",
  active: true,
  highlight: false,
  marketingTitle: "",
  marketingBody: "",
};

const AdminCouponsPanel = () => {
  const { showToast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(blank);
  const [submitting, setSubmitting] = useState(false);
  const [filters, setFilters] = useState({ page: 1, limit: 25, search: "", appliesTo: "", active: "" });

  const debouncedSearch = useDebouncedValue(filters.search, 400);

  const load = async (overrideFilters) => {
    setLoading(true);
    const f = overrideFilters ?? filters;
    try {
      const res = await listAdminCoupons({
        page: f.page,
        limit: f.limit,
        search: debouncedSearch || undefined,
        appliesTo: f.appliesTo || undefined,
        active: f.active !== "" ? f.active : undefined,
      });
      setData(res);
    } catch (err) {
      showToast({
        status: "error",
        title: "Failed to load coupons",
        description: err.message ?? "",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setFilters((f) => ({ ...f, page: 1 }));
  }, [debouncedSearch, filters.appliesTo, filters.active]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.page, filters.limit, debouncedSearch, filters.appliesTo, filters.active]);

  const coupons = data?.items ?? [];

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        code: form.code.toUpperCase(),
        name: form.name,
        description: form.description || undefined,
        discountType: form.discountType,
        percentOff:
          form.discountType === "PERCENT" ? Number(form.percentOff) : undefined,
        amountOffCents:
          form.discountType === "AMOUNT"
            ? Number(form.amountOffCents)
            : undefined,
        currency: form.currency || undefined,
        duration: form.duration,
        durationMonths:
          form.duration === "REPEATING"
            ? Number(form.durationMonths)
            : undefined,
        appliesTo: form.appliesTo,
        maxRedemptions: form.maxRedemptions
          ? Number(form.maxRedemptions)
          : undefined,
        startsAt: form.startsAt || undefined,
        expiresAt: form.expiresAt || undefined,
        active: form.active,
        highlight: form.highlight,
        marketingTitle: form.marketingTitle || undefined,
        marketingBody: form.marketingBody || undefined,
      };
      await createCoupon(payload);
      showToast({ status: "success", title: "Coupon created" });
      setForm(blank);
      setShowForm(false);
      await load();
    } catch (err) {
      showToast({
        status: "error",
        title: "Create failed",
        description: err.message ?? "",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (coupon) => {
    try {
      await updateCoupon(coupon.id, { active: !coupon.active });
      showToast({
        status: "success",
        title: coupon.active ? "Coupon disabled" : "Coupon activated",
      });
      await load();
    } catch (err) {
      showToast({
        status: "error",
        title: "Update failed",
        description: err.message ?? "",
      });
    }
  };

  const toggleHighlight = async (coupon) => {
    try {
      await updateCoupon(coupon.id, { highlight: !coupon.highlight });
      await load();
    } catch (err) {
      showToast({
        status: "error",
        title: "Update failed",
        description: err.message ?? "",
      });
    }
  };

  const remove = async (coupon) => {
    if (!window.confirm(`Disable coupon "${coupon.code}"?`)) return;
    try {
      await deleteCoupon(coupon.id);
      showToast({ status: "success", title: "Coupon disabled" });
      await load();
    } catch (err) {
      showToast({
        status: "error",
        title: "Delete failed",
        description: err.message ?? "",
      });
    }
  };

  const fmtDiscount = (c) =>
    c.discountType === "PERCENT"
      ? `${c.percentOff}% off`
      : `${formatMoney(c.amountOffCents, c.currency)} off`;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search code or name…"
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value, page: 1 }))}
        />
        <label className="text-sm text-slate-600">
          Applies to
          <select
            className="ml-2 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
            value={filters.appliesTo}
            onChange={(e) => setFilters((f) => ({ ...f, appliesTo: e.target.value, page: 1 }))}
          >
            <option value="">All</option>
            <option value="ALL">All products</option>
            <option value="PACKAGES">Packages</option>
            <option value="PLANS">Plans</option>
          </select>
        </label>
        <label className="text-sm text-slate-600">
          Status
          <select
            className="ml-2 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
            value={filters.active}
            onChange={(e) => setFilters((f) => ({ ...f, active: e.target.value, page: 1 }))}
          >
            <option value="">All</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </label>
        <span className="ml-auto text-xs text-slate-500">
          {data ? `${data.total} coupons` : ""}
        </span>
        <button
          type="button"
          onClick={() => setShowForm((s) => !s)}
          className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
        >
          {showForm ? "Close" : "New coupon"}
        </button>
      </div>

      {showForm ? (
        <form
          onSubmit={handleCreate}
          className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-3"
        >
          <label className="text-sm">
            Code
            <input
              required
              value={form.code}
              onChange={(e) =>
                setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))
              }
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm uppercase"
            />
          </label>
          <label className="text-sm md:col-span-2">
            Name
            <input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
            />
          </label>

          <label className="text-sm">
            Discount type
            <select
              value={form.discountType}
              onChange={(e) =>
                setForm((f) => ({ ...f, discountType: e.target.value }))
              }
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
            >
              <option value="PERCENT">Percent off</option>
              <option value="AMOUNT">Fixed amount off</option>
            </select>
          </label>
          {form.discountType === "PERCENT" ? (
            <label className="text-sm">
              % off (1-100)
              <input
                type="number"
                min="1"
                max="100"
                value={form.percentOff}
                onChange={(e) =>
                  setForm((f) => ({ ...f, percentOff: e.target.value }))
                }
                className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
              />
            </label>
          ) : (
            <label className="text-sm">
              Amount off (cents)
              <input
                type="number"
                min="1"
                value={form.amountOffCents}
                onChange={(e) =>
                  setForm((f) => ({ ...f, amountOffCents: e.target.value }))
                }
                className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
              />
            </label>
          )}
          <label className="text-sm">
            Applies to
            <select
              value={form.appliesTo}
              onChange={(e) =>
                setForm((f) => ({ ...f, appliesTo: e.target.value }))
              }
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
            >
              <option value="ALL">All products</option>
              <option value="PACKAGES">Credit packages only</option>
              <option value="PLANS">Subscription plans only</option>
            </select>
          </label>

          <label className="text-sm">
            Duration (subscriptions)
            <select
              value={form.duration}
              onChange={(e) =>
                setForm((f) => ({ ...f, duration: e.target.value }))
              }
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
            >
              <option value="ONCE">Once</option>
              <option value="REPEATING">Repeating (months)</option>
              <option value="FOREVER">Forever</option>
            </select>
          </label>
          {form.duration === "REPEATING" ? (
            <label className="text-sm">
              Duration months
              <input
                type="number"
                min="1"
                max="60"
                value={form.durationMonths}
                onChange={(e) =>
                  setForm((f) => ({ ...f, durationMonths: e.target.value }))
                }
                className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
              />
            </label>
          ) : (
            <span />
          )}
          <label className="text-sm">
            Max redemptions
            <input
              type="number"
              min="0"
              value={form.maxRedemptions}
              onChange={(e) =>
                setForm((f) => ({ ...f, maxRedemptions: e.target.value }))
              }
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
            />
          </label>

          <label className="text-sm">
            Starts at
            <input
              type="datetime-local"
              value={form.startsAt}
              onChange={(e) =>
                setForm((f) => ({ ...f, startsAt: e.target.value }))
              }
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
            />
          </label>
          <label className="text-sm">
            Expires at
            <input
              type="datetime-local"
              value={form.expiresAt}
              onChange={(e) =>
                setForm((f) => ({ ...f, expiresAt: e.target.value }))
              }
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
            />
          </label>
          <div className="flex items-end gap-4">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) =>
                  setForm((f) => ({ ...f, active: e.target.checked }))
                }
              />
              Active
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.highlight}
                onChange={(e) =>
                  setForm((f) => ({ ...f, highlight: e.target.checked }))
                }
              />
              Highlight (marketing)
            </label>
          </div>

          <label className="text-sm md:col-span-3">
            Marketing title
            <input
              value={form.marketingTitle}
              onChange={(e) =>
                setForm((f) => ({ ...f, marketingTitle: e.target.value }))
              }
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
            />
          </label>
          <label className="text-sm md:col-span-3">
            Marketing body
            <textarea
              rows={2}
              value={form.marketingBody}
              onChange={(e) =>
                setForm((f) => ({ ...f, marketingBody: e.target.value }))
              }
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
            />
          </label>
          <label className="text-sm md:col-span-3">
            Internal description
            <input
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
            />
          </label>

          <div className="md:col-span-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setForm(blank);
                setShowForm(false);
              }}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {submitting ? "Creating…" : "Create coupon"}
            </button>
          </div>
        </form>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-900">
              <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-white">
                Code
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-white">
                Name
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-white">
                Discount
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-white">
                Applies to
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-white">
                Redemptions
                <InfoTip content="Used / cap (or unlimited)." />
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-white">
                Window
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-white">
                Active
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-white">
                Highlight
              </th>
              <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-white">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((c) => (
              <tr
                key={c.id}
                className="border-b border-slate-100 text-slate-700"
              >
                <td className="px-3 py-2 font-mono text-xs">{c.code}</td>
                <td className="px-3 py-2">{c.name}</td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {fmtDiscount(c)}
                </td>
                <td className="px-3 py-2 text-xs">{c.appliesTo}</td>
                <td className="px-3 py-2 text-xs">
                  {c.timesRedeemed}
                  {c.maxRedemptions ? ` / ${c.maxRedemptions}` : ""}
                </td>
                <td className="px-3 py-2 text-xs">
                  {c.startsAt
                    ? new Date(c.startsAt).toLocaleDateString()
                    : "any"}
                  {" → "}
                  {c.expiresAt
                    ? new Date(c.expiresAt).toLocaleDateString()
                    : "no end"}
                </td>
                <td className="px-3 py-2 text-center">
                  <button
                    type="button"
                    onClick={() => toggleActive(c)}
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${c.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}
                  >
                    {c.active ? "active" : "inactive"}
                  </button>
                </td>
                <td className="px-3 py-2">
                  <button
                    type="button"
                    onClick={() => toggleHighlight(c)}
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${c.highlight ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}
                  >
                    {c.highlight ? "featured" : "off"}
                  </button>
                </td>
                <td className="px-3 py-2">
                  <button
                    type="button"
                    onClick={() => remove(c)}
                    className="rounded-md border border-rose-300 px-2 py-1 text-xs text-rose-700 hover:bg-rose-50"
                  >
                    Disable
                  </button>
                </td>
              </tr>
            ))}
            {!loading && coupons.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="px-3 py-6 text-center text-sm text-slate-500"
                >
                  No coupons yet — create one to start a promotion.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {data && data.totalPages > 1 ? (
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

export default AdminCouponsPanel;
