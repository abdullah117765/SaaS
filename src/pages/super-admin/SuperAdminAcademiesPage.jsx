import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FaEye, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import apiRequest from "../../utils/apiClient";
import useDebouncedValue from "../../hooks/useDebouncedValue";
import InfoTip from "../../components/common/InfoTip";
import Pagination from "../../components/common/Pagination";
import TruncatedCell from "../../components/common/TruncatedCell";
import SuperAdminLayout from "../../components/super-admin/SuperAdminLayout";

const statusOptions = [
  { value: "ALL", label: "All statuses" },
  { value: "APPROVED", label: "Approved" },
  { value: "PENDING", label: "Pending" },
  { value: "REJECTED", label: "Rejected" },
];

const numberFormatter = new Intl.NumberFormat("en-US");

const AcademySummaryCard = ({ label, value, accent }) => (
  <div className="rounded-lg border border-gray-100 bg-white px-5 py-4 shadow-sm">
    <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
    <p className="mt-2 text-2xl font-semibold text-gray-800">
      {numberFormatter.format(value)}
      {accent ? (
        <span className="ml-2 text-sm font-medium text-gray-500">{accent}</span>
      ) : null}
    </p>
  </div>
);

const SuperAdminAcademiesPage = () => {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [reviewingId, setReviewingId] = useState(null);
  const [banner, setBanner] = useState(null);
  const [detailModal, setDetailModal] = useState({
    open: false,
    record: null,
    detail: null,
    loading: false,
    error: null,
  });

  const debouncedSearch = useDebouncedValue(search, 400);

  useEffect(() => {
    setPage(1);
  }, [status, debouncedSearch]);

  useEffect(() => {
    let active = true;

    const fetchAcademies = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: pageSize.toString(),
        });

        if (status !== "ALL") {
          params.append("status", status);
        }
        if (debouncedSearch) {
          params.append("search", debouncedSearch);
        }

        const response = await apiRequest(`/academies/admin?${params.toString()}`);

        if (!active) return;

        setData(response?.data ?? []);
        setMeta(response?.meta ?? null);
        setSummary(response?.summary ?? null);
        setError(null);
      } catch (err) {
        console.error("Failed to load academy directory", err);
        if (active) {
          setError(err?.message ?? "Failed to load academies");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchAcademies();

    return () => {
      active = false;
    };
  }, [page, pageSize, status, debouncedSearch, refreshKey]);

  useEffect(() => {
    if (!banner) return;
    const timeout = setTimeout(() => setBanner(null), 6000);
    return () => clearTimeout(timeout);
  }, [banner]);

  const handleOpenDetail = useCallback(async (record) => {
    setDetailModal({
      open: true,
      record,
      detail: null,
      loading: true,
      error: null,
    });
    try {
      const detail = await apiRequest(`/academies/admin/${record.id}`);
      setDetailModal((prev) => ({
        ...prev,
        detail,
        loading: false,
        error: null,
      }));
    } catch (err) {
      const message =
        err?.response?.data?.message ??
        err?.message ??
        "Unable to load academy details.";
      setDetailModal((prev) => ({
        ...prev,
        loading: false,
        error: message,
      }));
    }
  }, []);

  const handleCloseDetail = useCallback(() => {
    setDetailModal({
      open: false,
      record: null,
      detail: null,
      loading: false,
      error: null,
    });
  }, []);

  const handleReview = useCallback(
    async (record, nextStatus) => {
      let reason;
      if (nextStatus === "REJECTED") {
        reason = window.prompt(
          "Provide a reason to share with the academy owner (min 10 characters):",
          record.rejectionReason ?? "",
        );
        if (!reason || reason.trim().length < 10) {
          setBanner({
            type: "error",
            message: "Rejection reason must contain at least 10 characters.",
          });
          return;
        }
      }

      setReviewingId(record.id);
      try {
        await apiRequest(`/academies/admin/${record.id}/review`, {
          method: "PATCH",
          body: {
            status: nextStatus,
            ...(reason ? { reason: reason.trim() } : {}),
          },
        });
        setBanner({
          type: "success",
          message:
            nextStatus === "APPROVED"
              ? `${record.name} has been approved.`
              : `${record.name} has been rejected.`,
        });
        setRefreshKey((value) => value + 1);
        if (detailModal.open && detailModal.record?.id === record.id) {
          handleOpenDetail(record);
        }
      } catch (err) {
        const message =
          err?.response?.data?.message ??
          err?.message ??
          "Unable to update academy status.";
        setBanner({ type: "error", message });
      } finally {
        setReviewingId(null);
      }
    },
    [detailModal.open, detailModal.record, handleOpenDetail],
  );

  const totalAcademies = meta?.total ?? 0;

  const statusSummary = useMemo(() => {
    if (!summary) {
      return [];
    }
    return [
      { label: "Approved", value: summary.approved ?? 0 },
      { label: "Pending", value: summary.pending ?? 0 },
      { label: "Rejected", value: summary.rejected ?? 0 },
    ];
  }, [summary]);

  const renderStatusBadge = (value) => {
    const base = "inline-flex rounded-full px-3 py-1 text-xs font-semibold";
    if (value === "APPROVED") {
      return (
        <span className={`${base} bg-green-100 text-green-700`}>Approved</span>
      );
    }
    if (value === "PENDING") {
      return (
        <span className={`${base} bg-yellow-100 text-yellow-700`}>Pending</span>
      );
    }
    if (value === "REJECTED") {
      return (
        <span className={`${base} bg-red-100 text-red-700`}>Rejected</span>
      );
    }
    return <span className={`${base} bg-gray-100 text-gray-600`}>{value}</span>;
  };

  const renderOwnerName = (owner) => {
    if (!owner) {
      return "Unassigned";
    }
    const fullName = [owner.firstName, owner.lastName].filter(Boolean).join(" ").trim();
    return fullName || owner.email;
  };

  return (
    <SuperAdminLayout>
      <div className="py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-green-800">
            Academy Management
          </h1>
          <p className="mt-2 text-gray-600">
            Track academy onboarding, approval status, and platform utilisation
            in real time.
          </p>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <AcademySummaryCard
            label="Total academies"
            value={totalAcademies}
            accent={
              typeof summary?.pending === "number"
                ? `${numberFormatter.format(summary.pending)} pending`
                : ""
            }
          />
          {statusSummary.map((item) => (
            <AcademySummaryCard
              key={item.label}
              label={item.label}
              value={item.value ?? 0}
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-lg border border-gray-100 bg-white shadow-sm"
        >
          <div className="border-b border-gray-100 px-6 py-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  Academy Directory
                </h2>
                <p className="text-sm text-gray-500">
                  {totalAcademies
                    ? `${numberFormatter.format(totalAcademies)} academy owner accounts`
                    : "All registered academy owners."}
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by name or email"
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 sm:w-64"
                />
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 sm:w-48"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {banner ? (
            <div
              className={`mx-6 mb-4 rounded-lg border px-4 py-3 text-sm ${
                banner.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-red-200 bg-red-50 text-red-800"
              }`}
            >
              {banner.message}
            </div>
          ) : null}

          {error ? (
            <div className="px-6 py-10">
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
                        Academy
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        <span className="inline-flex items-center">
                          Owner
                          <InfoTip content="Primary academy owner profile and contact details." />
                        </span>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Created
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {loading ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-6 py-10 text-center text-sm text-gray-500"
                        >
                          Loading academies…
                        </td>
                      </tr>
                    ) : data.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-6 py-10 text-center text-sm text-gray-500"
                        >
                          No academy owners match your filters yet.
                        </td>
                      </tr>
                    ) : (
                      data.map((academy) => (
                        <tr key={academy.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-900">
                            <div className="font-semibold text-gray-900">
                              <TruncatedCell value={academy.name} maxWidth="16rem" className="font-semibold text-gray-900" />
                            </div>
                            <div className="text-xs uppercase tracking-wide text-gray-500">
                              <TruncatedCell value={academy.slug} maxWidth="14rem" />
                            </div>
                            {academy.description ? (
                              <p className="mt-1 line-clamp-2 text-xs text-gray-600">
                                {academy.description}
                              </p>
                            ) : null}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            <div className="font-medium text-gray-900">
                              <TruncatedCell value={renderOwnerName(academy.owner)} maxWidth="14rem" className="font-medium text-gray-900" />
                            </div>
                            <div className="text-xs text-gray-500">
                              <TruncatedCell value={academy.owner?.email ?? "—"} maxWidth="14rem" />
                            </div>
                            {academy.owner?.phoneNumber ? (
                              <div className="text-xs text-gray-500">
                                <TruncatedCell value={academy.owner.phoneNumber} maxWidth="10rem" />
                              </div>
                            ) : null}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            {renderStatusBadge(academy.status)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {academy.createdAt
                              ? new Date(academy.createdAt).toLocaleDateString()
                              : "—"}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <div className="flex flex-wrap justify-end gap-2">
                              <button
                                type="button"
                                className="inline-flex items-center rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-700 hover:border-gray-300 hover:text-primary-600"
                                onClick={() => handleOpenDetail(academy)}
                              >
                                <FaEye className="mr-1 h-3.5 w-3.5" />
                                View
                              </button>
                              {academy.status !== "APPROVED" ? (
                                <button
                                  type="button"
                                  className="inline-flex items-center rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white shadow hover:bg-emerald-700 disabled:opacity-60"
                                  onClick={() => handleReview(academy, "APPROVED")}
                                  disabled={reviewingId === academy.id}
                                >
                                  <FaCheckCircle className="mr-1 h-3.5 w-3.5" />
                                  Approve
                                </button>
                              ) : null}
                              {academy.status !== "REJECTED" ? (
                                <button
                                  type="button"
                                  className="inline-flex items-center rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-700 hover:border-red-300 hover:bg-red-50 disabled:opacity-60"
                                  onClick={() => handleReview(academy, "REJECTED")}
                                  disabled={reviewingId === academy.id}
                                >
                                  <FaTimesCircle className="mr-1 h-3.5 w-3.5" />
                                  Reject
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
                  onPageChange={(nextPage) => setPage(nextPage)}
                  onPageSizeChange={(size) => setPageSize(size)}
                />
              </div>
            </>
          )}
        </motion.div>
        {detailModal.open ? (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 px-4 py-8">
            <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {detailModal.record?.name ?? "Academy details"}
                </h3>
                <button
                  type="button"
                  className="text-gray-500 transition hover:text-gray-700"
                  onClick={handleCloseDetail}
                >
                  <span className="text-2xl leading-none">&times;</span>
                </button>
              </div>
              <div className="px-6 py-5 text-sm text-gray-700">
                {detailModal.loading ? (
                  <div className="flex flex-col items-center py-8 text-gray-500">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-100 border-t-primary-500" />
                    <p className="mt-3 text-sm">Loading academy profile…</p>
                  </div>
                ) : detailModal.error ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {detailModal.error}
                  </div>
                ) : (
                  (() => {
                    const detail = detailModal.detail ?? detailModal.record;
                    return (
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs font-semibold uppercase text-gray-500">
                            Academy
                          </p>
                          <p className="mt-1 text-base font-semibold text-gray-900">
                            {detail?.name}
                          </p>
                          <p className="text-xs uppercase tracking-wide text-gray-500">
                            {detail?.slug}
                          </p>
                          {detail?.description ? (
                            <p className="mt-2 text-sm text-gray-700">{detail.description}</p>
                          ) : null}
                          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                            {renderStatusBadge(detail?.status)}
                            {detail?.status === "REJECTED" && detail?.rejectionReason ? (
                              <span className="rounded-full bg-red-50 px-2 py-1 font-medium text-red-700">
                                {detail.rejectionReason}
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <div className="grid gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4 sm:grid-cols-2">
                          <div>
                            <p className="text-xs font-semibold uppercase text-gray-500">Owner</p>
                            <p className="mt-1 font-medium text-gray-900">
                              {renderOwnerName(detail?.owner)}
                            </p>
                            <p className="text-xs text-gray-600">
                              {detail?.owner?.email ?? "—"}
                            </p>
                            <p className="text-xs text-gray-600">
                              {detail?.owner?.phoneNumber ?? ""}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase text-gray-500">
                              Members overview
                            </p>
                            <ul className="mt-1 text-sm text-gray-700">
                              <li>Teachers: {detail?.teacherCount ?? 0}</li>
                              <li>Students: {detail?.studentCount ?? 0}</li>
                              <li>Pending requests: {detail?.pendingCount ?? 0}</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    );
                  })()
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminAcademiesPage;
