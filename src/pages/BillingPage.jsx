import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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

const Section = ({ title, action, children, info }) => (
  <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
    <div className="mb-4 flex items-center justify-between gap-2">
      <h2 className="text-lg font-semibold text-slate-900">
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

const BillingPage = () => {
  const { user, userRole } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const role = userRole ?? user?.role;
  const canPurchase = role === "academy_owner" || role === "super_admin";
  const canSubscribe = role === "academy_owner" || role === "super_admin";

  const [overview, setOverview] = useState(null);
  const [packages, setPackages] = useState([]);
  const [plans, setPlans] = useState([]);
  const [marketingCoupons, setMarketingCoupons] = useState([]);
  const [couponCode, setCouponCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

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
        canPurchase ? getPackages() : Promise.resolve([]),
        canSubscribe ? getPlans() : Promise.resolve([]),
        canPurchase
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
      <div className="mx-auto max-w-4xl p-6">
        <div className="rounded-md border border-rose-300 bg-rose-50 p-4 text-rose-800">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Billing</h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage your credits, subscription and payment history.
          </p>
        </div>
        {canPurchase ? (
          <button
            type="button"
            onClick={handlePortal}
            disabled={busy}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
          >
            Open Stripe Portal
          </button>
        ) : null}
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Credit balance
            <InfoTip content="Credits are consumed by Zoom class minutes." />
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {balance.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-slate-500">Currency: {currency}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Platform fee
            <InfoTip
              content={`A ${platformFeePercent}% platform fee is applied on every paid transaction.`}
            />
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {platformFeePercent}%
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Applied automatically at checkout.
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Subscription
            <InfoTip content="Active subscription tier (if any)." />
          </p>
          <div className="mt-2 flex items-center gap-2">
            {subscription?.plan ? (
              <>
                <span className="text-xl font-semibold text-slate-900">
                  {subscription.plan.name}
                </span>
                <StatusPill status={subscription.status} />
              </>
            ) : (
              <span className="text-slate-500">No active subscription</span>
            )}
          </div>
          {subscription?.currentPeriodEnd ? (
            <p className="mt-1 text-xs text-slate-500">
              Renews{" "}
              {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
            </p>
          ) : null}
          {subscription && canSubscribe ? (
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

      {canPurchase &&
      (marketingCoupons.length > 0 ||
        packages.length > 0 ||
        plans.length > 0) ? (
        <Section
          title="Promotions & coupons"
          info="Redeem a coupon code at checkout. Featured promotions appear below."
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

      {canPurchase && packages.length > 0 ? (
        <Section
          title="Buy credits"
          info="A platform fee is included in the price shown. You will be redirected to Stripe Checkout."
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
                    disabled={busy}
                    className="mt-4 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white shadow transition hover:bg-emerald-700 disabled:opacity-50"
                  >
                    Buy now
                  </button>
                </div>
              );
            })}
          </div>
        </Section>
      ) : null}

      {canSubscribe && plans.length > 0 ? (
        <Section
          title="Subscription plans"
          info="Subscriptions renew automatically. Cancel any time."
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
                    {plan.monthlyClassMinutes?.toLocaleString() ?? 0} minutes /
                    period
                  </li>
                  <li>
                    {plan.monthlyCredits?.toLocaleString() ?? 0} credits /
                    period
                  </li>
                  {plan.maxTeachers ? (
                    <li>Up to {plan.maxTeachers} teachers</li>
                  ) : null}
                  {plan.maxStudents ? (
                    <li>Up to {plan.maxStudents} students</li>
                  ) : null}
                </ul>
                <button
                  type="button"
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={busy || plan.priceCents === 0}
                  className="mt-4 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white shadow transition hover:bg-slate-800 disabled:opacity-50"
                >
                  {plan.priceCents === 0
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

      <Section
        title="Recent payments"
        info="Most recent 10 transactions on your account."
      >
        {recentPayments.length === 0 ? (
          <p className="text-sm text-slate-500">No payments yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="py-2 pr-4">Date</th>
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
                {recentPayments.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-slate-100 text-slate-700"
                  >
                    <td className="py-2 pr-4 whitespace-nowrap text-xs">
                      {new Date(p.createdAt).toLocaleString()}
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
        )}
      </Section>
    </div>
  );
};

export default BillingPage;
