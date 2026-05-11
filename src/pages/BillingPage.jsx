import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import InfoTip from "../components/common/InfoTip";
import TruncatedCell from "../components/common/TruncatedCell";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import {
    cancelMySubscription,
    formatMoney,
    formatMoneyDecimal,
    getMyBilling,
    getPackages,
    getPlans,
    listMarketingCoupons,
    openBillingPortal,
    startPackageCheckout,
    startPlanCheckout,
} from "../utils/billingApi";

const Section = ({ title, action, children, info, embedded = false }) => (
  <section
    className={`rounded-xl border p-6 shadow-sm ${
      embedded
        ? "border-emerald-900/20 bg-emerald-950/10"
        : "border-slate-200 bg-white"
    }`}
  >
    <div className="mb-4 flex items-center justify-between gap-2">
      <h2
        className={`text-lg font-semibold ${embedded ? "text-emerald-100" : "text-slate-900"}`}
      >
        {title}
        {info ? <InfoTip content={info} /> : null}
      </h2>
      {action}
    </div>
    {children}
  </section>
);

const StatusPill = ({ status }) => {
  const map = {
    ACTIVE: "bg-emerald-100 text-emerald-700",
    TRIALING: "bg-sky-100 text-sky-700",
    PAST_DUE: "bg-amber-100 text-amber-700",
    CANCELED: "bg-slate-200 text-slate-700",
    INCOMPLETE: "bg-slate-100 text-slate-600",
    INCOMPLETE_EXPIRED: "bg-slate-100 text-slate-500",
    UNPAID: "bg-rose-100 text-rose-700",
    completed: "bg-emerald-100 text-emerald-700",
    pending: "bg-amber-100 text-amber-700",
    failed: "bg-rose-100 text-rose-700",
  };
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${map[status] ?? "bg-slate-100 text-slate-700"}`}
    >
      {status}
    </span>
  );
};

const BillingPage = ({ embedded = false, mode = "all", outerClassName }) => {
  const { user, userRole } = useAuth();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const role = userRole ?? user?.role;
  const canTransact = role === "academy_owner" || role === "super_admin";
  const canManageSubscription =
    role === "academy_owner" || role === "super_admin";
  const canViewCatalog = role === "academy_owner" || role === "super_admin";

  const [overview, setOverview] = useState(null);
  const [packages, setPackages] = useState([]);
  const [plans, setPlans] = useState([]);
  const [marketingCoupons, setMarketingCoupons] = useState([]);
  const [couponCode, setCouponCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [paymentSearch, setPaymentSearch] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("all");
  const [paymentPage, setPaymentPage] = useState(1);

  const successFlag = searchParams.get("checkout");
  const cancelFlag = searchParams.get("cancel");

  useEffect(() => {
    if (successFlag === "success") {
      showToast?.({
        status: "success",
        description:
          "Payment received. It may take a few seconds to reflect on your account.",
      });
      const next = new URLSearchParams(searchParams);
      next.delete("checkout");
      next.delete("session_id");
      setSearchParams(next, { replace: true });
    } else if (cancelFlag === "1") {
      showToast?.({ status: "info", description: "Checkout cancelled." });
      const next = new URLSearchParams(searchParams);
      next.delete("cancel");
      setSearchParams(next, { replace: true });
    }
  }, [successFlag, cancelFlag, searchParams, setSearchParams, showToast]);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [me, pkgs, sub, mkt] = await Promise.all([
        getMyBilling(),
        canViewCatalog ? getPackages() : Promise.resolve([]),
        canViewCatalog ? getPlans() : Promise.resolve([]),
        canViewCatalog
          ? listMarketingCoupons().catch(() => [])
          : Promise.resolve([]),
      ]);
      setOverview(me);
      setPackages(pkgs ?? []);
      setPlans(sub ?? []);
      setMarketingCoupons(mkt ?? []);
    } catch (err) {
      setError(err.message ?? "Failed to load billing information.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currency = overview?.currency?.toUpperCase?.() ?? "USD";
  const platformFeePercent = overview?.platformFeePercent ?? 10;
  const balance = overview?.credits?.balance ?? 0;
  const recentPayments = overview?.recentPayments ?? [];
  const subscription = overview?.subscription;
  const paymentPageSize = 5;

  const filteredPayments = useMemo(() => {
    const needle = paymentSearch.trim().toLowerCase();
    return recentPayments.filter((payment) => {
      const status = (payment.status ?? "").toLowerCase();
      const matchesStatus =
        paymentStatus === "all" || status === paymentStatus.toLowerCase();
      const matchesSearch =
        !needle ||
        (payment.reference ?? "").toLowerCase().includes(needle) ||
        (payment.provider ?? "").toLowerCase().includes(needle) ||
        (payment.description ?? "").toLowerCase().includes(needle);
      return matchesStatus && matchesSearch;
    });
  }, [paymentSearch, paymentStatus, recentPayments]);

  const paymentTotalPages = Math.max(
    1,
    Math.ceil(filteredPayments.length / paymentPageSize),
  );
  const safePaymentPage = Math.min(paymentPage, paymentTotalPages);
  const pagedPayments = useMemo(() => {
    const start = (safePaymentPage - 1) * paymentPageSize;
    return filteredPayments.slice(start, start + paymentPageSize);
  }, [filteredPayments, safePaymentPage]);

  const showPromotionsAndPackages = mode === "all" || mode === "billing";
  const showSubscriptions = mode === "all" || mode === "subscriptions";
  const showRecentPayments = mode === "all" || mode === "payments";

  const handleBuyPackage = async (pkgId) => {
    if (busy) return;
    setBusy(true);
    try {
      const successUrl = `${window.location.origin}${window.location.pathname}?checkout=success&session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${window.location.origin}${window.location.pathname}?cancel=1`;
      const res = await startPackageCheckout({
        id: pkgId,
        successUrl,
        cancelUrl,
        couponCode: couponCode?.trim() || undefined,
      });
      if (res?.url) {
        window.location.href = res.url;
      } else {
        showToast?.({
          status: "error",
          description: "Failed to create checkout session.",
        });
      }
    } catch (err) {
      showToast?.({
        status: "error",
        description: err.message ?? "Failed to start checkout.",
      });
    } finally {
      setBusy(false);
    }
  };

  const handleSubscribe = async (planId) => {
    if (busy) return;
    setBusy(true);
    try {
      const successUrl = `${window.location.origin}${window.location.pathname}?checkout=success&session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${window.location.origin}${window.location.pathname}?cancel=1`;
      const res = await startPlanCheckout({
        id: planId,
        successUrl,
        cancelUrl,
        couponCode: couponCode?.trim() || undefined,
      });
      if (res?.url) {
        window.location.href = res.url;
      } else {
        showToast?.({
          status: "error",
          description: "Failed to create checkout session.",
        });
      }
    } catch (err) {
      showToast?.({
        status: "error",
        description: err.message ?? "Failed to subscribe.",
      });
    } finally {
      setBusy(false);
    }
  };

  const handlePortal = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await openBillingPortal(window.location.href);
      if (res?.url) window.location.href = res.url;
    } catch (err) {
      showToast?.({
        status: "error",
        description: err.message ?? "Could not open billing portal.",
      });
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = async () => {
    if (busy) return;
    if (
      !window.confirm(
        "Cancel your subscription at the end of the current period?",
      )
    )
      return;
    setBusy(true);
    try {
      await cancelMySubscription();
      showToast?.({
        status: "success",
        description: "Subscription will end at the current period.",
      });
      await loadAll();
    } catch (err) {
      showToast?.({
        status: "error",
        description: err.message ?? "Failed to cancel subscription.",
      });
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-500 border-b-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={embedded ? "p-6" : "mx-auto max-w-4xl p-6"}>
        <div className="rounded-md border border-rose-300 bg-rose-50 p-4 text-rose-800">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div
      className={
        outerClassName ??
        (embedded
          ? "min-h-[calc(100vh-12rem)] w-full space-y-6 bg-gradient-to-b from-emerald-950 via-emerald-900/80 to-black p-6"
          : "mx-auto max-w-6xl space-y-6 bg-white p-6")
      }
    >
      <header className="flex items-center justify-between">
        <div>
          <h1
            className={`text-2xl font-bold ${embedded ? "text-emerald-50" : "text-slate-900"}`}
          >
            Billing
          </h1>
          <p
            className={`mt-1 text-sm ${embedded ? "text-emerald-100/80" : "text-slate-600"}`}
          >
            Manage your credits, subscription and payment history.
          </p>
        </div>
        {canTransact ? (
          <button
            type="button"
            onClick={handlePortal}
            disabled={busy}
            className={`rounded-lg px-4 py-2 text-sm font-medium shadow-sm transition disabled:opacity-50 ${
              embedded
                ? "border border-emerald-300/40 bg-emerald-500/20 text-emerald-50 hover:bg-emerald-500/30"
                : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            Open Stripe Portal
          </button>
        ) : null}
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div
          className={`rounded-xl border p-6 shadow-sm ${embedded ? "border-emerald-900/20 bg-emerald-950/10" : "border-slate-200 bg-white"}`}
        >
          <p
            className={`text-sm font-medium ${embedded ? "text-emerald-100/90" : "text-slate-500"}`}
          >
            Credit balance
            <InfoTip content="Credits are consumed by Zoom class minutes." />
          </p>
          <p
            className={`mt-2 text-3xl font-bold ${embedded ? "text-emerald-50" : "text-slate-900"}`}
          >
            {balance.toLocaleString()}
          </p>
          <p
            className={`mt-1 text-xs ${embedded ? "text-emerald-100/70" : "text-slate-500"}`}
          >
            Currency: {currency}
          </p>
        </div>
        <div
          className={`rounded-xl border p-6 shadow-sm ${embedded ? "border-emerald-900/20 bg-emerald-950/10" : "border-slate-200 bg-white"}`}
        >
          <p
            className={`text-sm font-medium ${embedded ? "text-emerald-100/90" : "text-slate-500"}`}
          >
            Platform fee
            <InfoTip
              content={`A ${platformFeePercent}% platform fee is applied on every paid transaction.`}
            />
          </p>
          <p
            className={`mt-2 text-3xl font-bold ${embedded ? "text-emerald-50" : "text-slate-900"}`}
          >
            {platformFeePercent}%
          </p>
          <p
            className={`mt-1 text-xs ${embedded ? "text-emerald-100/70" : "text-slate-500"}`}
          >
            Applied automatically at checkout.
          </p>
        </div>
        <div
          className={`rounded-xl border p-6 shadow-sm ${embedded ? "border-emerald-900/20 bg-emerald-950/10" : "border-slate-200 bg-white"}`}
        >
          <p
            className={`text-sm font-medium ${embedded ? "text-emerald-100/90" : "text-slate-500"}`}
          >
            Subscription
            <InfoTip content="Active subscription tier (if any)." />
          </p>
          <div className="mt-2 flex items-center gap-2">
            {subscription?.plan ? (
              <>
                <span
                  className={`text-xl font-semibold ${embedded ? "text-emerald-50" : "text-slate-900"}`}
                >
                  {subscription.plan.name}
                </span>
                <StatusPill status={subscription.status} />
              </>
            ) : (
              <span
                className={embedded ? "text-emerald-100/80" : "text-slate-500"}
              >
                No active subscription
              </span>
            )}
          </div>
          {subscription?.currentPeriodEnd ? (
            <p
              className={`mt-1 text-xs ${embedded ? "text-emerald-100/70" : "text-slate-500"}`}
            >
              Renews{" "}
              {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
            </p>
          ) : null}
          {subscription && canManageSubscription ? (
            <button
              type="button"
              onClick={handleCancel}
              disabled={busy}
              className="mt-3 text-xs font-medium text-rose-600 hover:underline disabled:opacity-50"
            >
              Cancel at period end
            </button>
          ) : null}
        </div>
      </div>

      {showPromotionsAndPackages &&
      canViewCatalog &&
      (marketingCoupons.length > 0 ||
        packages.length > 0 ||
        plans.length > 0) ? (
        <Section
          title="Promotions & coupons"
          info="Redeem a coupon code at checkout. Featured promotions appear below."
          embedded={embedded}
        >
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-sm">
              <span className="block text-slate-600">Coupon code</span>
              <input
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="e.g. LAUNCH25"
                className="mt-1 w-56 rounded-md border border-slate-300 px-2 py-1 text-sm uppercase tracking-wider"
              />
            </label>
            <p className="text-xs text-slate-500">
              The code is applied automatically to your next checkout.
            </p>
          </div>
          {marketingCoupons.length > 0 ? (
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {marketingCoupons.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCouponCode(c.code)}
                  className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-left transition hover:border-amber-400"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                    {c.marketingTitle ?? c.name}
                  </p>
                  <p className="mt-1 text-sm text-slate-700">
                    {c.marketingBody ??
                      (c.discountType === "PERCENT"
                        ? `${c.percentOff}% off`
                        : `${formatMoney(c.amountOffCents, c.currency)} off`)}
                  </p>
                  <p className="mt-2 font-mono text-xs text-amber-800">
                    {c.code}
                  </p>
                  {c.expiresAt ? (
                    <p className="mt-1 text-[11px] text-slate-500">
                      Expires {new Date(c.expiresAt).toLocaleDateString()}
                    </p>
                  ) : null}
                </button>
              ))}
            </div>
          ) : null}
        </Section>
      ) : null}

      {showPromotionsAndPackages && canViewCatalog && packages.length > 0 ? (
        <Section
          title="Buy credits"
          info="A platform fee is included in the price shown. You will be redirected to Stripe Checkout."
          embedded={embedded}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {packages.map((pkg) => {
              const totalCredits = (pkg.credits ?? 0) + (pkg.bonusCredits ?? 0);
              return (
                <div
                  key={pkg.id}
                  className={`flex flex-col rounded-xl border p-5 shadow-sm ${pkg.highlight ? "border-emerald-400 bg-emerald-50" : "border-slate-200 bg-white"}`}
                >
                  <h3 className="text-base font-semibold text-slate-900">
                    {pkg.name}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-600">
                    {pkg.description}
                  </p>
                  <p className="mt-3 text-2xl font-bold text-slate-900">
                    {formatMoney(pkg.priceCents, pkg.currency)}
                  </p>
                  <p className="text-xs text-slate-500">
                    {pkg.credits.toLocaleString()} credits
                    {pkg.bonusCredits ? (
                      <span className="text-emerald-700">
                        {" "}
                        + {pkg.bonusCredits} bonus
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {totalCredits.toLocaleString()} total
                  </p>
                  <button
                    type="button"
                    onClick={() => handleBuyPackage(pkg.id)}
                    disabled={busy || !canTransact}
                    className="mt-4 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white shadow transition hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {canTransact ? "Buy now" : "Only academy owners can buy"}
                  </button>
                </div>
              );
            })}
          </div>
        </Section>
      ) : null}

      {showSubscriptions && canViewCatalog && plans.length > 0 ? (
        <Section
          title="Subscription plans"
          info="Subscriptions renew automatically. Cancel any time."
          embedded={embedded}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`flex flex-col rounded-xl border p-5 shadow-sm ${plan.highlight ? "border-emerald-400 bg-emerald-50" : "border-slate-200 bg-white"}`}
              >
                <h3 className="text-base font-semibold text-slate-900">
                  {plan.name}
                </h3>
                <p className="mt-1 line-clamp-2 text-xs text-slate-600">
                  {plan.description}
                </p>
                <p className="mt-3 text-2xl font-bold text-slate-900">
                  {formatMoney(plan.priceCents, plan.currency)}
                  <span className="text-sm font-normal text-slate-500">
                    /{plan.interval === "YEARLY" ? "yr" : "mo"}
                  </span>
                </p>
                <ul className="mt-3 space-y-1 text-xs text-slate-600">
                  <li>
                    {plan.monthlyCredits?.toLocaleString() ?? 0} credits /
                    period
                  </li>
                  <li>Unlimited teachers</li>
                  <li>Unlimited students</li>
                </ul>
                <button
                  type="button"
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={
                    busy ||
                    plan.priceCents === 0 ||
                    !canTransact ||
                    subscription?.planId === plan.id
                  }
                  className="mt-4 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white shadow transition hover:bg-slate-800 disabled:opacity-50"
                >
                  {!canTransact
                    ? "Only academy owners can subscribe"
                    : plan.priceCents === 0
                      ? "Free tier"
                      : subscription?.planId === plan.id
                        ? "Current plan"
                        : "Subscribe"}
                </button>
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {showRecentPayments ? (
        <Section
          title="Recent payments"
          info="Filter, search, and review your recent payment activity."
          embedded={embedded}
        >
          {recentPayments.length === 0 ? (
            <p
              className={`text-sm ${embedded ? "text-emerald-100/80" : "text-slate-500"}`}
            >
              No payments yet.
            </p>
          ) : (
            <>
              <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                <input
                  value={paymentSearch}
                  onChange={(event) => {
                    setPaymentSearch(event.target.value);
                    setPaymentPage(1);
                  }}
                  placeholder="Search by reference, provider, or description"
                  className={`h-10 rounded-lg border px-3 text-sm focus:outline-none ${
                    embedded
                      ? "border-emerald-300/30 bg-emerald-950/40 text-emerald-50 placeholder:text-emerald-100/55 focus:border-emerald-300"
                      : "border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-emerald-500"
                  }`}
                />
                <select
                  value={paymentStatus}
                  onChange={(event) => {
                    setPaymentStatus(event.target.value);
                    setPaymentPage(1);
                  }}
                  className={`h-10 rounded-lg border px-3 text-sm focus:outline-none ${
                    embedded
                      ? "border-emerald-300/30 bg-emerald-950/40 text-emerald-50 focus:border-emerald-300"
                      : "border-slate-300 bg-white text-slate-900 focus:border-emerald-500"
                  }`}
                >
                  <option value="all">All statuses</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
                <div
                  className={`flex items-center rounded-lg border px-3 text-sm ${
                    embedded
                      ? "border-emerald-300/30 bg-emerald-950/40 text-emerald-100"
                      : "border-slate-200 bg-slate-50 text-slate-600"
                  }`}
                >
                  {filteredPayments.length} matching transactions
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-emerald-800/20">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-900 text-left text-xs font-semibold uppercase tracking-wide text-white">
                      <th className="py-2 pr-4">Date</th>
                      <th className="py-2 pr-4">Provider</th>
                      <th className="py-2 pr-4">Description</th>
                      <th className="py-2 pr-4">Reference</th>
                      <th className="py-2 pr-4">
                        Amount
                        <InfoTip content="Gross amount charged to your card." />
                      </th>
                      <th className="py-2 pr-4">
                        Platform fee
                        <InfoTip
                          content={`Platform fee retained (${platformFeePercent}%).`}
                        />
                      </th>
                      <th className="py-2 pr-4">
                        Net
                        <InfoTip content="Net amount after platform fee." />
                      </th>
                      <th className="py-2 pr-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedPayments.map((p, index) => (
                      <tr
                        key={p.id}
                        className={`border-b border-emerald-100 text-slate-700 ${index % 2 === 0 ? "bg-white" : "bg-emerald-50/40"} hover:bg-emerald-50/50`}
                      >
                        <td className="py-2 pr-4 whitespace-nowrap text-xs">
                          {new Date(p.createdAt).toLocaleString()}
                        </td>
                        <td className="py-2 pr-4 text-xs uppercase tracking-wide">
                          {p.provider ?? "-"}
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
                        <td className="py-2 pr-4">
                          <StatusPill status={p.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <p
                  className={`text-xs ${embedded ? "text-emerald-100/75" : "text-slate-500"}`}
                >
                  Showing{" "}
                  {pagedPayments.length === 0
                    ? 0
                    : (safePaymentPage - 1) * paymentPageSize + 1}
                  -
                  {(safePaymentPage - 1) * paymentPageSize +
                    pagedPayments.length}{" "}
                  of {filteredPayments.length}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setPaymentPage((page) => Math.max(1, page - 1))
                    }
                    disabled={safePaymentPage <= 1}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${
                      embedded
                        ? "border-emerald-300/30 bg-emerald-950/40 text-emerald-50 hover:bg-emerald-900/50"
                        : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    Previous
                  </button>
                  <span
                    className={`text-xs font-semibold ${embedded ? "text-emerald-50" : "text-slate-700"}`}
                  >
                    Page {safePaymentPage} / {paymentTotalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setPaymentPage((page) =>
                        Math.min(paymentTotalPages, page + 1),
                      )
                    }
                    disabled={safePaymentPage >= paymentTotalPages}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${
                      embedded
                        ? "border-emerald-300/30 bg-emerald-950/40 text-emerald-50 hover:bg-emerald-900/50"
                        : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </Section>
      ) : null}
    </div>
  );
};

export default BillingPage;
