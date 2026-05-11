import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import InfoTip from "../../components/common/InfoTip";
import Pagination from "../../components/common/Pagination";
import TruncatedCell from "../../components/common/TruncatedCell";
import SuperAdminLayout from "../../components/super-admin/SuperAdminLayout";
import apiRequest from "../../utils/apiClient";

const STATUS_OPTIONS = ["ALL", "NEW", "IN_REVIEW", "RESOLVED", "SPAM"];

const badgeClasses = {
  NEW: "bg-blue-100 text-blue-700",
  IN_REVIEW: "bg-amber-100 text-amber-700",
  RESOLVED: "bg-emerald-100 text-emerald-700",
  SPAM: "bg-rose-100 text-rose-700",
};

const formatStatus = (value) => value?.replace(/_/g, " ") ?? "Unknown";

const SuperAdminContactMessagesPage = () => {
  const [status, setStatus] = useState("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    setPage(1);
  }, [status, search]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(pageSize),
        });
        if (status !== "ALL") params.append("status", status);
        if (search.trim()) params.append("search", search.trim());

        const response = await apiRequest(
          `/contact-messages/admin?${params.toString()}`,
        );
        if (!active) return;

        setData(response?.data ?? []);
        setMeta(response?.meta ?? null);
        setError(null);
      } catch (err) {
        if (!active) return;
        setError(err?.message ?? "Failed to load contact messages.");
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [page, pageSize, status, search]);

  const updateStatus = async (id, nextStatus) => {
    setUpdatingId(id);
    try {
      await apiRequest(`/contact-messages/admin/${id}/status`, {
        method: "PATCH",
        body: { status: nextStatus },
      });
      setData((prev) =>
        prev.map((row) =>
          row.id === id ? { ...row, status: nextStatus } : row,
        ),
      );
    } catch (err) {
      setError(err?.message ?? "Failed to update message status.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <SuperAdminLayout>
      <div className="py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-green-800">Contact Inbox</h1>
          <p className="mt-2 text-gray-600">
            Public website enquiries from the contact page are listed here for
            triage.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-gray-100 bg-white shadow-sm"
        >
          <div className="border-b border-gray-100 px-6 py-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="font-medium text-gray-700">Filters</span>
                <InfoTip content="Search sender, subject, or body. Status filtering is server-side." />
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search messages"
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 sm:w-72"
                />
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 sm:w-44"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option === "ALL" ? "All statuses" : formatStatus(option)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {error ? (
            <div className="px-6 py-5">
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Subject
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Message
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Created
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {loading ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-6 py-10 text-center text-sm text-gray-500"
                        >
                          Loading contact messages...
                        </td>
                      </tr>
                    ) : data.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-6 py-10 text-center text-sm text-gray-500"
                        >
                          No messages match the current filters.
                        </td>
                      </tr>
                    ) : (
                      data.map((row) => (
                        <tr key={row.id} className="hover:bg-gray-50">
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                            <TruncatedCell
                              value={row.name}
                              maxWidth="12rem"
                              className="font-medium text-gray-900"
                            />
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                            <TruncatedCell value={row.email} maxWidth="14rem" />
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                            <TruncatedCell
                              value={row.subject || "No subject"}
                              maxWidth="12rem"
                            />
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            <TruncatedCell
                              value={row.message}
                              maxWidth="22rem"
                            />
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badgeClasses[row.status] ?? "bg-gray-100 text-gray-700"}`}
                            >
                              {formatStatus(row.status)}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                            {row.createdAt
                              ? new Date(row.createdAt).toLocaleString()
                              : "—"}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-center text-sm">
                            <div className="flex justify-center gap-2">
                              {row.status !== "IN_REVIEW" ? (
                                <button
                                  type="button"
                                  disabled={updatingId === row.id}
                                  onClick={() =>
                                    updateStatus(row.id, "IN_REVIEW")
                                  }
                                  className="rounded-md border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-100 disabled:opacity-60"
                                >
                                  In review
                                </button>
                              ) : null}
                              {row.status !== "RESOLVED" ? (
                                <button
                                  type="button"
                                  disabled={updatingId === row.id}
                                  onClick={() =>
                                    updateStatus(row.id, "RESOLVED")
                                  }
                                  className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
                                >
                                  Resolve
                                </button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="px-6 pb-6">
                <Pagination
                  page={meta?.currentPage ?? 1}
                  totalPages={meta?.totalPages ?? 0}
                  totalItems={meta?.total ?? 0}
                  pageSize={pageSize}
                  onPageChange={setPage}
                  onPageSizeChange={setPageSize}
                />
              </div>
            </>
          )}
        </motion.div>
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminContactMessagesPage;
