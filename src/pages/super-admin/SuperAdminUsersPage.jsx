import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import InfoTip from "../../components/common/InfoTip";
import Pagination from "../../components/common/Pagination";
import TruncatedCell from "../../components/common/TruncatedCell";
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
  const academyNames = Array.isArray(user.academies)
    ? user.academies.map((academy) => academy.academyName).filter(Boolean)
    : [];
  const ownerNames = Array.isArray(user.academies)
    ? user.academies.map((academy) => academy.academyOwnerName).filter(Boolean)
    : [];
  const academyName =
    user.academy?.name ??
    user.academyName ??
    user.academyTitle ??
    (academyNames.length ? academyNames.join(", ") : null) ??
    (user.role === "ACADEMY_OWNER" ? `${displayName}'s Academy` : "Unassigned");
  const ownerName =
    user.academyOwner?.name ??
    user.ownerName ??
    user.academy?.ownerName ??
    (ownerNames.length ? ownerNames.join(", ") : null) ??
    (user.role === "ACADEMY_OWNER" ? displayName : "Unassigned");

  return {
    academyName: academyName || "Unassigned",
    ownerName: ownerName || "Unassigned",
  };
};

const getUserActivity = (user) => {
  const counts = user._count ?? {};
  if (user.role === "TEACHER") {
    return {
      primary: `${numberFormatter.format(counts.teachingClasses ?? 0)} classes`,
      secondary: `${numberFormatter.format(counts.resources ?? 0)} resources`,
    };
  }
  if (user.role === "STUDENT") {
    return {
      primary: `${numberFormatter.format(counts.classParticipants ?? 0)} enrolled classes`,
      secondary: user.isActive ? "Active account" : "Inactive account",
    };
  }
  if (user.role === "ACADEMY_OWNER") {
    return {
      primary: user.academy?.status ?? "No academy status",
      secondary: user.academy?.name ?? "Academy owner",
    };
  }
  return {
    primary: user.isActive ? "Active account" : "Inactive account",
    secondary: "Administrative user",
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
  const [academyOptions, setAcademyOptions] = useState([]);
  const [ownerOptions, setOwnerOptions] = useState([]);

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
        if (academyFilter !== "all") {
          params.append("academyId", academyFilter);
        }
        if (ownerFilter !== "all") {
          params.append("ownerId", ownerFilter);
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
  }, [
    role,
    status,
    debouncedSearch,
    page,
    pageSize,
    refreshFlag,
    showToast,
    academyFilter,
    ownerFilter,
  ]);

  useEffect(() => {
    let active = true;

    const fetchFilterOptions = async () => {
      try {
        const [ownersResponse, academiesResponse] = await Promise.all([
          apiRequest("/users/admins?page=1&limit=100"),
          apiRequest("/academies/admin?page=1&limit=100"),
        ]);

        if (!active) return;

        const owners = (ownersResponse?.data ?? []).map((owner) => ({
          value: owner.id,
          label: buildDisplayName(owner),
        }));
        setOwnerOptions(owners);

        const academies = (academiesResponse?.data ?? []).map((academy) => ({
          value: academy.id,
          label: academy.name,
        }));
        setAcademyOptions(academies);
      } catch (err) {
        console.warn("Failed to load directory filter options", err);
      }
    };

    fetchFilterOptions();

    return () => {
      active = false;
    };
  }, []);

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

  const filteredUsers = enhancedUsers;

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

        <div className="mb-6 grid grid-cols-5 gap-3">
          <div className="rounded-lg border border-gray-100 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Total users
            </p>
            <p className="mt-1 text-xl font-semibold text-gray-800">
              {numberFormatter.format(meta?.total ?? 0)}
            </p>
          </div>
          {statusSummary.map((item) => (
            <div
              key={item.label}
              className="rounded-lg border border-gray-100 bg-white px-4 py-3 shadow-sm"
            >
              <p className="text-xs uppercase tracking-wide text-gray-500">
                {item.label}
              </p>
              <p className={`mt-1 text-xl font-semibold ${item.tone}`}>
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
                    <option key={option.value} value={option.value}>
                      {option.label}
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
                    <option key={option.value} value={option.value}>
                      {option.label}
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
                  <thead className="bg-gray-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white">User</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white">
                        <span className="inline-flex items-center">
                          Academy
                          <InfoTip content="Resolved from academy ownership or approved memberships." />
                        </span>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white">
                        <span className="inline-flex items-center">
                          Owner
                          <InfoTip content="Academy owner responsible for this user context." />
                        </span>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white">Contact</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white">Activity</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white">Created</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wide text-white">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-100">
                    {loading ? (
                      <tr>
                        <td
                          colSpan={9}
                          className="px-6 py-10 text-center text-sm text-gray-500"
                        >
                          Loading users...
                        </td>
                      </tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr>
                        <td
                          colSpan={9}
                          className="px-6 py-10 text-center text-sm text-gray-500"
                        >
                          No users match your current filters.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user, idx) => {
                        const displayName = buildDisplayName(user);
                        const isSuperAdmin = user.role === "SUPER_ADMIN";
                        const activity = getUserActivity(user);
                        return (
                          <tr
                            key={user.id}
                            className={`${idx % 2 === 0 ? "bg-white" : "bg-emerald-50/40"} hover:bg-emerald-50/50`}
                          >
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                              <TruncatedCell
                                value={displayName}
                                maxWidth="12rem"
                                className="font-medium text-gray-900"
                              />
                              <p className="mt-1 max-w-[12rem] truncate text-xs text-gray-400">
                                {user.id}
                              </p>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                              {formatRole(user.role)}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                              <TruncatedCell
                                value={user.academyName ?? "Unassigned"}
                                maxWidth="13rem"
                              />
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                              <TruncatedCell
                                value={user.ownerName ?? "Unassigned"}
                                maxWidth="12rem"
                              />
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              <TruncatedCell
                                value={user.email}
                                maxWidth="14rem"
                              />
                              <p className="mt-1 text-xs text-gray-400">
                                {user.phoneNumber ?? "No phone"}
                              </p>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              <p className="font-medium text-gray-700">
                                {activity.primary}
                              </p>
                              <p className="mt-1 text-xs text-gray-400">
                                {activity.secondary}
                              </p>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm">
                              {renderStatus(user.status)}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                              {user.createdAt
                                ? new Date(user.createdAt).toLocaleDateString()
                                : "N/A"}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-center text-sm text-gray-500">
                              {isSuperAdmin ? (
                                <span className="text-xs uppercase tracking-wide text-gray-400">
                                  Protected
                                </span>
                              ) : (
                                <div className="flex items-center justify-center gap-2">
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
