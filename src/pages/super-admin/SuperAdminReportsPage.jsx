import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import Pagination from "../../components/common/Pagination";
import SuperAdminLayout from "../../components/super-admin/SuperAdminLayout";
import apiRequest from "../../utils/apiClient";

const statusFilters = [
  { value: "ALL", label: "All statuses" },
  { value: "COMPLETED", label: "Completed" },
  { value: "PENDING", label: "Pending" },
  { value: "FAILED", label: "Failed" },
  { value: "CANCELLED", label: "Cancelled" },
];

const numberFormatter = new Intl.NumberFormat("en-US");
const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const SuperAdminReportsPage = () => {
  const [status, setStatus] = useState("ALL");
  const [provider, setProvider] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedAcademyId, setSelectedAcademyId] = useState("ALL");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [payments, setPayments] = useState([]);
  const [meta, setMeta] = useState(null);
  const [summary, setSummary] = useState(null);
  const [providersSeen, setProvidersSeen] = useState([]);
  const [academyOptions, setAcademyOptions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    const loadAcademies = async () => {
      try {
        const response = await apiRequest("/users/admins?limit=100");
        if (!active) return;

        const options = (response?.data ?? []).map((item) => ({
          value: item.id,
          label:
            [item.firstName, item.lastName].filter(Boolean).join(" ") ||
            item.email,
        }));
        setAcademyOptions(options);
      } catch (err) {
        console.warn("Failed to pre-load academy options", err);
      }
    };

    loadAcademies();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setPage(1);
  }, [status, provider, fromDate, toDate, selectedAcademyId]);

  useEffect(() => {
    let active = true;

    const fetchPayments = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: pageSize.toString(),
        });

        if (status !== "ALL") {
          params.append("status", status);
        }
        if (provider) {
          params.append("provider", provider);
        }
        if (fromDate) {
          params.append("from", fromDate);
        }
        if (toDate) {
          params.append("to", toDate);
        }
        if (selectedAcademyId !== "ALL") {
          params.append("userId", selectedAcademyId);
        }

        const response = await apiRequest(`/payments?${params.toString()}`);

        if (!active) return;

        setPayments(response?.data ?? []);
        setMeta(response?.meta ?? null);
        setSummary(response?.summary ?? null);
        setProvidersSeen((prev) => {
          const currentProviders = new Set(prev);
          (response?.data ?? []).forEach((payment) => {
            if (payment.provider) {
              currentProviders.add(payment.provider);
            }
          });
          return Array.from(currentProviders).sort();
        });

        setError(null);
      } catch (err) {
        console.error("Failed to load payments", err);
        if (active) {
          setError(err?.message ?? "Failed to load billing reports.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchPayments();

    return () => {
      active = false;
    };
  }, [status, provider, fromDate, toDate, selectedAcademyId, page, pageSize]);

  const renderStatusBadge = (value) => {
    const base = "inline-flex rounded-full px-3 py-1 text-xs font-semibold";
    switch (value) {
      case "COMPLETED":
        return (
          <span className={`${base} bg-green-100 text-green-700`}>
            Completed
          </span>
        );
      case "PENDING":
        return (
          <span className={`${base} bg-yellow-100 text-yellow-700`}>
            Pending
          </span>
        );
      case "FAILED":
        return (
          <span className={`${base} bg-red-100 text-red-700`}>Failed</span>
        );
      case "CANCELLED":
        return (
          <span className={`${base} bg-gray-100 text-gray-600`}>Cancelled</span>
        );
      default:
        return (
          <span className={`${base} bg-gray-100 text-gray-600`}>{value}</span>
        );
    }
  };

  return (
    <SuperAdminLayout>
      <div className="py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-green-800">
            Reports & Billing
          </h1>
          <p className="mt-2 text-gray-600">
            Monitor all monetisation, payments, and credit purchases across the
            platform.
          </p>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-gray-100 bg-white px-5 py-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Total processed
            </p>
            <p className="mt-2 text-2xl font-semibold text-gray-800">
              {summary
                ? currencyFormatter.format(summary.totalAmount)
                : currencyFormatter.format(0)}
            </p>
          </div>
          <div className="rounded-lg border border-gray-100 bg-white px-5 py-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Transactions
            </p>
            <p className="mt-2 text-2xl font-semibold text-gray-800">
              {summary
                ? numberFormatter.format(summary.totalCount)
                : numberFormatter.format(0)}
            </p>
          </div>
          <div className="rounded-lg border border-gray-100 bg-white px-5 py-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Average amount
            </p>
            <p className="mt-2 text-2xl font-semibold text-gray-800">
              {summary && summary.totalCount > 0
                ? currencyFormatter.format(
                    summary.totalAmount / summary.totalCount,
                  )
                : currencyFormatter.format(0)}
            </p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-lg border border-gray-100 bg-white shadow-sm"
        >
          <div className="border-b border-gray-100 px-6 py-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Filters</h2>
                <p className="text-sm text-gray-500">
                  Combine filters to focus on specific revenue segments.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                >
                  {statusFilters.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedAcademyId}
                  onChange={(event) => setSelectedAcademyId(event.target.value)}
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                >
                  <option value="ALL">All academies</option>
                  {academyOptions.map((academy) => (
                    <option key={academy.value} value={academy.value}>
                      {academy.label}
                    </option>
                  ))}
                </select>
                <select
                  value={provider}
                  onChange={(event) => setProvider(event.target.value)}
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                >
                  <option value="">All providers</option>
                  {providersSeen.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(event) => setFromDate(event.target.value)}
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
                <input
                  type="date"
                  value={toDate}
                  onChange={(event) => setToDate(event.target.value)}
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>
            </div>
          </div>

          <div className="px-6 py-4">
            {error ? (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr className="bg-gray-900">
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white">
                          Reference
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white">
                          Academy
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white">
                          Provider
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white">
                          Status
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-white">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {loading ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-6 py-10 text-center text-sm text-gray-500"
                          >
                            Loading payments…
                          </td>
                        </tr>
                      ) : payments.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-6 py-10 text-center text-sm text-gray-500"
                          >
                            No payments match your current filters.
                          </td>
                        </tr>
                      ) : (
                        payments.map((payment) => (
                          <tr key={payment.id} className="hover:bg-gray-50">
                            <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                              {payment.reference ?? payment.id}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                              {payment.userName ?? payment.userId}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                              {payment.provider ?? "—"}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm">
                              {renderStatusBadge(payment.status)}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-700">
                              {currencyFormatter.format(payment.amount)}{" "}
                              {payment.currency}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                              {payment.createdAt
                                ? new Date(payment.createdAt).toLocaleString()
                                : "—"}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4">
                  <Pagination
                    page={meta?.currentPage ?? 1}
                    totalPages={meta?.totalPages ?? 0}
                    totalItems={meta?.total ?? 0}
                    pageSize={pageSize}
                    onPageChange={(nextPage) => setPage(nextPage)}
                    onPageSizeChange={(size) => setPageSize(size)}
                  />
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminReportsPage;
