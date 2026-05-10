import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import Pagination from "../../components/common/Pagination";
import SuperAdminLayout from "../../components/super-admin/SuperAdminLayout";
import { useToast } from "../../contexts/ToastContext";
import useDebouncedValue from "../../hooks/useDebouncedValue";
import apiRequest from "../../utils/apiClient";

const roleOptions = [
  { value: "all", label: "All users" },
  { value: "admins", label: "Academy owners" },
  { value: "teachers", label: "Teachers" },
  { value: "students", label: "Students" },
];

const statusOptions = [
  { value: "ALL", label: "All statuses" },
  { value: "APPROVED", label: "Approved" },
  { value: "PENDING", label: "Pending" },
  { value: "REJECTED", label: "Rejected" },
];

const numberFormatter = new Intl.NumberFormat("en-US");

const formatRole = (role) => {
  if (!role) return "Unknown";
  return role
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const buildDisplayName = (user) => {
  const parts = [user.firstName, user.lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : user.email;
};

const resolveUserContext = (user) => {
  const displayName = buildDisplayName(user);
  const academyName =
    user.academy?.name ??
    user.academyName ??
    user.academyTitle ??
    (user.role === "ACADEMY_OWNER" ? `${displayName}'s Academy` : "Unassigned");
  const ownerName =
    user.academyOwner?.name ??
    user.ownerName ??
    user.academy?.ownerName ??
    (user.role === "ACADEMY_OWNER" ? displayName : "Unassigned");

  return {
    academyName,
    ownerName,
  };
};

const SuperAdminUsersPage = () => {
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [refreshFlag, setRefreshFlag] = useState(0);
  const [academyFilter, setAcademyFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");

  const debouncedSearch = useDebouncedValue(search, 400);
  const { showToast } = useToast();

  useEffect(() => {
    setPage(1);
  }, [role, status, debouncedSearch]);

  useEffect(() => {
    setPage(1);
  }, [academyFilter, ownerFilter]);

  useEffect(() => {
    let active = true;

    const fetchUsers = async () => {
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

        let endpoint = "/users";
        if (role === "admins") {
          endpoint = "/users/admins";
        } else if (role === "teachers") {
          endpoint = "/users/teachers";
        } else if (role === "students") {
          endpoint = "/users/students";
        }

        const response = await apiRequest(`${endpoint}?${params.toString()}`);

        if (!active) return;

        setData(response?.data ?? []);
        setMeta(response?.meta ?? null);
        setSummary(response?.summary ?? null);
        setError(null);
      } catch (err) {
        console.error("Failed to load users", err);
        if (active) {
          const message = err?.message ?? "Failed to load users";
          setError(message);
          showToast({
            status: "error",
            title: "Unable to fetch users",
            description: message,
          });
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchUsers();

    return () => {
      active = false;
    };
  }, [role, status, debouncedSearch, page, pageSize, refreshFlag, showToast]);

  const statusSummary = useMemo(() => {
    if (!summary) {
      return [];
    }
    return [
      {
        label: "Approved",
        value: summary.approved ?? 0,
        tone: "text-green-600",
      },
      {
        label: "Pending",
        value: summary.pending ?? 0,
        tone: "text-yellow-600",
      },
      { label: "Rejected", value: summary.rejected ?? 0, tone: "text-red-600" },
      {
        label: "Inactive",
        value: summary.inactive ?? 0,
        tone: "text-gray-600",
      },
    ];
  }, [summary]);

  const enhancedUsers = useMemo(
    () =>
      (data ?? []).map((user) => {
        const context = resolveUserContext(user);
        return { ...user, ...context };
      }),
    [data],
  );

  const academyOptions = useMemo(() => {
    const set = new Set();
    enhancedUsers.forEach((user) => {
      if (user.academyName && user.academyName !== "Unassigned") {
        set.add(user.academyName);
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [enhancedUsers]);

  const ownerOptions = useMemo(() => {
    const set = new Set();
    enhancedUsers.forEach((user) => {
      if (user.ownerName && user.ownerName !== "Unassigned") {
        set.add(user.ownerName);
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [enhancedUsers]);

  const filteredUsers = useMemo(
    () =>
      enhancedUsers.filter((user) => {
        const matchesAcademy =
          academyFilter === "all" || user.academyName === academyFilter;
        const matchesOwner =
          ownerFilter === "all" || user.ownerName === ownerFilter;
        return matchesAcademy && matchesOwner;
      }),
    [academyFilter, ownerFilter, enhancedUsers],
  );

  const renderStatus = (value) => {
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

  const openApproveModal = (user) => {
    setPendingAction({ type: "approve", user });
    setActionError(null);
  };

  const openRejectModal = (user) => {
    setPendingAction({ type: "reject", user, reason: "" });
    setActionError(null);
  };

  const closeModal = () => {
    setPendingAction(null);
    setActionError(null);
  };

  const handleSubmitAction = async () => {
    if (!pendingAction) return;
    const { user, type } = pendingAction;
    const isReject = type === "reject";

    if (isReject && !pendingAction.reason?.trim()) {
      setActionError("Please provide a rejection reason first.");
      return;
    }

    setActionLoading(true);
    setActionError(null);

    try {
      const payload = {
        status: isReject ? "REJECTED" : "APPROVED",
        ...(isReject ? { rejectionReason: pendingAction.reason.trim() } : {}),
      };

      await apiRequest(`/users/${user.id}/status`, {
        method: "PATCH",
        body: payload,
      });

      const message =
        type === "approve"
          ? `${buildDisplayName(user)} is now approved.`
          : `${buildDisplayName(user)} has been rejected.`;
      showToast({
        status: "success",
        title: "Status updated",
        description: message,
      });
      setRefreshFlag((prev) => prev + 1);
      closeModal();
    } catch (err) {
      console.error("Failed to update user status", err);
      const message =
        err?.response?.data?.message ??
        err?.message ??
        "Unable to update user status.";
      setActionError(message);
      showToast({
        status: "error",
        title: "Update failed",
        description: message,
      });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <SuperAdminLayout>
      <div className="py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-green-800">User Management</h1>
          <p className="mt-2 text-gray-600">
            Full visibility into teachers, students, and admin accounts with
            live filters. Super admins can approve or revoke academy owners,
            while other roles remain view-only for context.
          </p>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-gray-100 bg-white px-5 py-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Total users
            </p>
            <p className="mt-2 text-2xl font-semibold text-gray-800">
              {numberFormatter.format(meta?.total ?? 0)}
            </p>
          </div>
          {statusSummary.map((item) => (
            <div
              key={item.label}
              className="rounded-lg border border-gray-100 bg-white px-5 py-4 shadow-sm"
            >
              <p className="text-xs uppercase tracking-wide text-gray-500">
                {item.label}
              </p>
              <p className={`mt-2 text-2xl font-semibold ${item.tone}`}>
                {numberFormatter.format(item.value)}
              </p>
            </div>
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
                  Directory
                </h2>
                <p className="text-sm text-gray-500">
                  Filter by role, approval state, academy, or owner to take
                  action quickly.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by name or email"
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 sm:w-60"
                />
                <select
                  value={role}
                  onChange={(event) => setRole(event.target.value)}
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 sm:w-40"
                >
                  {roleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 sm:w-40"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <select
                  value={academyFilter}
                  onChange={(event) => setAcademyFilter(event.target.value)}
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 sm:w-44"
                >
                  <option value="all">All academies</option>
                  {academyOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <select
                  value={ownerFilter}
                  onChange={(event) => setOwnerFilter(event.target.value)}
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 sm:w-44"
                >
                  <option value="all">All owners</option>
                  {ownerOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

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
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Academy
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Owner
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Phone
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Updated
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {loading ? (
                      <tr>
                        <td
                          colSpan={10}
                          className="px-6 py-10 text-center text-sm text-gray-500"
                        >
                          Loading users...
                        </td>
                      </tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr>
                        <td
                          colSpan={10}
                          className="px-6 py-10 text-center text-sm text-gray-500"
                        >
                          No users match your current filters.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => {
                        const displayName = buildDisplayName(user);
                        const isSuperAdmin = user.role === "SUPER_ADMIN";
                        return (
                          <tr key={user.id} className="hover:bg-gray-50">
                            <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                              {displayName}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                              {formatRole(user.role)}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                              {user.academyName ?? "Unassigned"}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                              {user.ownerName ?? "Unassigned"}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                              {user.email}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm">
                              {renderStatus(user.status)}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                              {user.phoneNumber ?? "N/A"}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                              {user.createdAt
                                ? new Date(user.createdAt).toLocaleDateString()
                                : "N/A"}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                              {user.updatedAt
                                ? new Date(user.updatedAt).toLocaleDateString()
                                : "N/A"}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                              {isSuperAdmin ? (
                                <span className="text-xs uppercase tracking-wide text-gray-400">
                                  Protected
                                </span>
                              ) : (
                                <div className="flex items-center gap-2">
                                  {user.status === "PENDING" && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => openApproveModal(user)}
                                        className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
                                      >
                                        Approve
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => openRejectModal(user)}
                                        className="rounded-md border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100"
                                      >
                                        Reject
                                      </button>
                                    </>
                                  )}
                                  {user.status === "APPROVED" && (
                                    <button
                                      type="button"
                                      onClick={() => openRejectModal(user)}
                                      className="rounded-md border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100"
                                    >
                                      Revoke access
                                    </button>
                                  )}
                                  {user.status === "REJECTED" && (
                                    <button
                                      type="button"
                                      onClick={() => openApproveModal(user)}
                                      className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
                                    >
                                      Approve
                                    </button>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })
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

        {pendingAction ? (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4 py-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl"
            >
              <h3 className="text-lg font-semibold text-gray-800">
                {pendingAction.type === "approve"
                  ? `Approve ${buildDisplayName(pendingAction.user)}?`
                  : `Reject ${buildDisplayName(pendingAction.user)}?`}
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                {pendingAction.type === "approve"
                  ? "Approving activates the account immediately."
                  : "Rejected accounts lose access until they are re-approved."}
              </p>

              {pendingAction.type === "reject" ? (
                <label className="mt-4 block text-sm font-medium text-gray-700">
                  Rejection reason
                  <textarea
                    className="mt-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400"
                    rows={3}
                    value={pendingAction.reason}
                    onChange={(event) =>
                      setPendingAction((prev) =>
                        prev ? { ...prev, reason: event.target.value } : prev,
                      )
                    }
                    placeholder="Share a short note so the user knows what to fix."
                  />
                </label>
              ) : null}

              {actionError ? (
                <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {actionError}
                </div>
              ) : null}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitAction}
                  className={`rounded-md px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors ${
                    pendingAction.type === "approve"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-red-600 hover:bg-red-700"
                  } ${actionLoading ? "opacity-70" : ""}`}
                  disabled={actionLoading}
                >
                  {actionLoading
                    ? pendingAction.type === "approve"
                      ? "Approving..."
                      : "Rejecting..."
                    : pendingAction.type === "approve"
                      ? "Confirm approval"
                      : "Confirm rejection"}
                </button>
              </div>
            </motion.div>
          </div>
        ) : null}
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminUsersPage;
