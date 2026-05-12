import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { FaDownload, FaFilter, FaShoppingCart } from "react-icons/fa";
import apiRequest from "../../utils/apiClient";

const PLANS = [
  { id: "basic", name: "Basic", amount: 100, price: "$49.99", accent: "green" },
  {
    id: "standard",
    name: "Standard",
    amount: 250,
    price: "$99.99",
    accent: "blue",
  },
  {
    id: "pro",
    name: "Professional",
    amount: 500,
    price: "$189.99",
    accent: "purple",
  },
];

const planAccents = ["green", "blue", "purple"];

const toCurrency = (value, currency = "USD") => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "--";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const normalizePlan = (plan, index) => {
  const credits =
    Number(
      plan?.credits ?? plan?.amount ?? plan?.creditAmount ?? plan?.minutes,
    ) || 0;
  const amount = Number(plan?.price ?? plan?.priceUsd ?? plan?.cost ?? 0);
  const currency = plan?.currency ?? "USD";
  return {
    id: String(plan?.id ?? plan?.code ?? plan?.name ?? `plan-${index + 1}`),
    name: plan?.name ?? `Package ${index + 1}`,
    amount: credits,
    price: toCurrency(amount, currency),
    accent: planAccents[index % planAccents.length],
  };
};

const accentClass = {
  green: {
    badge: "bg-green-100 text-green-800",
    button: "bg-green-600 hover:bg-green-700 focus:ring-green-500",
  },
  blue: {
    badge: "bg-blue-100 text-blue-800",
    button: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
  },
  purple: {
    badge: "bg-purple-100 text-purple-800",
    button: "bg-purple-600 hover:bg-purple-700 focus:ring-purple-500",
  },
};

const planFeatures = (amount) => [
  `${amount} minutes of class time`,
  "Supports up to 100 participants",
  "Recording included",
  "Priority support",
];

const ZoomCreditsTab = ({ zoomCredits, onPurchaseCredits }) => {
  const [filterType, setFilterType] = useState("all");
  const [processingPlan, setProcessingPlan] = useState(null);
  const [packages, setPackages] = useState(PLANS);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    let mounted = true;

    const loadPackages = async () => {
      try {
        const response = await apiRequest("/billing/packages");
        const records = Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
            ? response.data
            : [];

        if (!mounted || records.length === 0) return;

        setPackages(records.map(normalizePlan).filter((pkg) => pkg.amount > 0));
      } catch {
        // Keep default plans when billing catalog endpoint is unavailable.
      }
    };

    loadPackages();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredHistory = (zoomCredits?.history ?? []).filter((item) => {
    if (filterType === "all") return true;
    return item.type === filterType;
  });

  const handlePurchase = async (plan) => {
    if (!onPurchaseCredits) {
      return;
    }

    try {
      setError(null);
      setSuccess(null);
      setProcessingPlan(plan.id);
      const result = await onPurchaseCredits({
        amount: plan.amount,
        planId: plan.id,
        currency: "USD",
      });
      if (result?.success === false) {
        setError(result.error ?? "Unable to complete purchase.");
      } else {
        setSuccess(`${plan.amount} credits added successfully.`);
      }
    } finally {
      setProcessingPlan(null);
    }
  };

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(null), 3000);
    return () => clearTimeout(timer);
  }, [success]);

  const summary = {
    available: zoomCredits?.available ?? 0,
    used: zoomCredits?.used ?? 0,
    total:
      zoomCredits?.totalCredited ??
      (zoomCredits?.available ?? 0) + (zoomCredits?.used ?? 0),
  };

  const freeGrantEntry = (zoomCredits?.history ?? []).find(
    (item) => item.isInitialGrant,
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 bg-white"
    >
      {freeGrantEntry && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <span className="mt-0.5 text-amber-500">★</span>
          <div>
            <span className="font-semibold">
              Free starter credits included.
            </span>{" "}
            Your academy received{" "}
            <span className="font-bold">
              {freeGrantEntry.amount} free credits
            </span>{" "}
            as a one-time welcome grant. These are granted once per academy and
            cannot be re-issued.
          </div>
        </div>
      )}
      <div className="rounded-lg p-0">
        <h3 className="text-lg font-bold text-gray-800 mb-3">Zoom Credits</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-emerald-700 mb-1">
              Available Credits
            </h4>
            <div className="text-2xl font-bold text-green-600">
              {summary.available}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">Ready for classes</p>
          </div>
          <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-emerald-700 mb-1">
              Used Credits
            </h4>
            <div className="text-2xl font-bold text-emerald-700">
              {summary.used}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">Consumed in sessions</p>
          </div>
          <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-emerald-700 mb-1">
              Total Credits
            </h4>
            <div className="text-2xl font-bold text-emerald-800">
              {summary.total}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">Lifetime allocation</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg p-0">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h4 className="text-lg font-medium text-gray-900">
              Purchase Credits
            </h4>
            <p className="text-gray-600">
              Choose a package to instantly add credits to your balance.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
            {success}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {packages.map((plan) => {
            const accent = accentClass[plan.accent];
            const isProcessing = processingPlan === plan.id;
            return (
              <div
                key={plan.id}
                className="border rounded-lg p-3 hover:shadow-md transition-shadow duration-300 border-gray-200 flex flex-col"
              >
                <div className="flex justify-between items-start mb-2">
                  <h5 className="text-sm font-semibold text-gray-900 leading-tight">
                    {plan.name}
                  </h5>
                  <span
                    className={`${accent.badge} text-xs font-semibold px-2 py-0.5 rounded ml-1 whitespace-nowrap`}
                  >
                    {plan.price}
                  </span>
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-0.5">
                  {plan.amount}
                </div>
                <p className="text-xs text-gray-500 mb-3">Credits</p>
                <button
                  onClick={() => handlePurchase(plan)}
                  disabled={isProcessing}
                  className={`mt-auto w-full inline-flex justify-center items-center px-3 py-1.5 border border-transparent text-xs font-semibold rounded-md shadow-sm text-white ${accent.button} focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60`}
                >
                  <FaShoppingCart className="mr-1.5 h-3 w-3" />
                  {isProcessing ? "Processing…" : "Purchase"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-emerald-100 p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h4 className="text-lg font-medium text-gray-900">
              Credit History
            </h4>
            <p className="text-gray-600">
              Track purchases and usage over time.
            </p>
          </div>
          <div className="flex space-x-2">
            <select
              className="block pl-3 pr-10 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              value={filterType}
              onChange={(event) => setFilterType(event.target.value)}
            >
              <option value="all">All Transactions</option>
              <option value="purchase">Purchases Only</option>
              <option value="usage">Usage Only</option>
            </select>
            <button className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
              <FaFilter className="mr-1.5" /> Filter
            </button>
            <button className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
              <FaDownload className="mr-1.5" /> Export
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-emerald-950">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-emerald-100"
                >
                  Date
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-emerald-100"
                >
                  Type
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-emerald-100"
                >
                  Description
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-emerald-100"
                >
                  Amount
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-emerald-100"
                >
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-100">
              {filteredHistory.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-6 text-center text-sm text-gray-500"
                  >
                    No transactions to display.
                  </td>
                </tr>
              ) : (
                filteredHistory.map((item, idx) => (
                  <tr
                    key={item.id}
                    className={`${idx % 2 === 0 ? "bg-white" : "bg-emerald-50/40"} hover:bg-emerald-50/50`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(item.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.isInitialGrant ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-amber-100 text-amber-800">
                          Free Grant
                        </span>
                      ) : item.type === "purchase" ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Purchase
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          Usage
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.isInitialGrant
                        ? "Free starter credits — one-time academy welcome grant"
                        : item.type === "purchase"
                          ? `Credit purchase (Transaction ID: ${item.transactionId})`
                          : `Used for class: ${item.className}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {item.type === "purchase" ? (
                        <span className="text-green-600">+{item.amount}</span>
                      ) : (
                        <span className="text-red-600">-{item.amount}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

export default ZoomCreditsTab;
