import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import {
    FaCheck,
    FaFilter,
    FaSearch,
    FaTimes,
    FaTrash,
    FaUsers,
} from "react-icons/fa";

const PAGE_SIZE = 8;

const STATUS_OPTIONS = {
  teachers: ["all", "APPROVED", "INACTIVE"],
  students: ["all", "APPROVED", "INACTIVE"],
  pending: ["all", "PENDING"],
};

const safeText = (value) => (typeof value === "string" ? value : "");

const SummaryCard = ({ label, value }) => (
  <div className="rounded-xl border border-emerald-900/15 bg-emerald-950/5 px-4 py-3">
    <p className="text-xs font-medium uppercase tracking-wide text-emerald-700/80">
      {label}
    </p>
    <p className="mt-1 text-xl font-bold text-emerald-950">{value}</p>
  </div>
);

const TabButton = ({ active, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
      active
        ? "bg-emerald-900 text-white"
        : "border border-emerald-900/20 bg-white text-emerald-900 hover:bg-emerald-50"
    }`}
  >
    {children}
  </button>
);

const UsersTab = ({
  teachers = [],
  students = [],
  pendingUsers = [],
  teacherSummary,
  studentSummary,
  onApproveUser,
  onRejectUser,
  onRevokeUser,
  initialSubTab = "teachers",
}) => {
  const [activeSubTab, setActiveSubTab] = useState(initialSubTab);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);

  const sourceRows = useMemo(() => {
    if (activeSubTab === "students") return students;
    if (activeSubTab === "pending") return pendingUsers;
    return teachers;
  }, [activeSubTab, pendingUsers, students, teachers]);

  const filteredRows = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return sourceRows.filter((row) => {
      const name = safeText(row.name).toLowerCase();
      const email = safeText(row.email).toLowerCase();
      const role = safeText(row.role).toLowerCase();
      const rowStatus = safeText(row.status).toUpperCase();

      const matchesSearch =
        !needle ||
        name.includes(needle) ||
        email.includes(needle) ||
        role.includes(needle);
      const matchesStatus = status === "all" || rowStatus === status;

      return matchesSearch && matchesStatus;
    });
  }, [search, sourceRows, status]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const paginatedRows = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredRows.slice(start, start + PAGE_SIZE);
  }, [filteredRows, safePage]);

  const changeTab = (tab) => {
    setActiveSubTab(tab);
    setStatus("all");
    setSearch("");
    setPage(1);
  };

  const onChangeStatus = (next) => {
    setStatus(next);
    setPage(1);
  };

  const onChangeSearch = (event) => {
    setSearch(event.target.value);
    setPage(1);
  };

  const renderPendingActions = (row) => {
    const membershipId = row.id ?? row.membershipId;
    return (
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => onApproveUser?.(membershipId)}
          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
        >
          <FaCheck className="h-3 w-3" /> Approve
        </button>
        <button
          type="button"
          onClick={() => {
            const reason = window.prompt("Reason for rejection:");
            if (!reason || !reason.trim()) return;
            onRejectUser?.(membershipId, reason.trim());
          }}
          className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
        >
          <FaTimes className="h-3 w-3" /> Reject
        </button>
      </div>
    );
  };

  const renderMemberActions = (row) => {
    const membershipId = row.membershipId ?? row.id;
    return (
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={() => {
            const reason = window.prompt("Reason for revocation:");
            if (!reason || !reason.trim()) return;
            onRevokeUser?.(membershipId, reason.trim());
          }}
          className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
        >
          <FaTrash className="h-3 w-3" /> Revoke
        </button>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.2 }}
      className="space-y-5"
    >
      <div className="rounded-2xl border border-emerald-900/15 bg-gradient-to-br from-emerald-50 to-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-emerald-950">
              Academy Members
            </h2>
            <p className="text-sm text-emerald-800/80">
              Manage teachers and students, approve requests, and control
              academy access.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-900/20 bg-white px-4 py-2 text-sm font-semibold text-emerald-900">
            <FaUsers className="h-4 w-4" />
            {teachers.length + students.length} active members
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <SummaryCard
            label="Teachers"
            value={`${teacherSummary?.approved ?? teachers.length} approved`}
          />
          <SummaryCard
            label="Students"
            value={`${studentSummary?.approved ?? students.length} approved`}
          />
          <SummaryCard
            label="Pending"
            value={`${pendingUsers.length} requests`}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <TabButton
            active={activeSubTab === "teachers"}
            onClick={() => changeTab("teachers")}
          >
            Teachers ({teachers.length})
          </TabButton>
          <TabButton
            active={activeSubTab === "students"}
            onClick={() => changeTab("students")}
          >
            Students ({students.length})
          </TabButton>
          <TabButton
            active={activeSubTab === "pending"}
            onClick={() => changeTab("pending")}
          >
            Pending ({pendingUsers.length})
          </TabButton>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <FaSearch className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-emerald-700/60" />
            <input
              type="text"
              value={search}
              onChange={onChangeSearch}
              placeholder="Search name or email"
              className="h-10 w-64 rounded-lg border border-emerald-900/20 bg-white pl-9 pr-3 text-sm text-emerald-950 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="relative">
            <FaFilter className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-emerald-700/60" />
            <select
              value={status}
              onChange={(event) => onChangeStatus(event.target.value)}
              className="h-10 rounded-lg border border-emerald-900/20 bg-white pl-9 pr-8 text-sm text-emerald-950 focus:border-emerald-500 focus:outline-none"
            >
              {STATUS_OPTIONS[activeSubTab].map((option) => (
                <option key={option} value={option}>
                  {option === "all" ? "All statuses" : option}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-emerald-900/15 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-emerald-100 text-sm">
            <thead className="bg-emerald-950 text-left text-xs uppercase tracking-wide text-emerald-100">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-100">
              {paginatedRows.length > 0 ? (
                paginatedRows.map((row) => (
                  <tr
                    key={row.id ?? row.membershipId}
                    className="hover:bg-emerald-50/50"
                  >
                    <td className="px-4 py-3 font-semibold text-emerald-950">
                      {row.name || "-"}
                    </td>
                    <td className="px-4 py-3 text-emerald-900/80">
                      {row.email || "-"}
                    </td>
                    <td className="px-4 py-3 text-emerald-900/80">
                      {safeText(row.role).toUpperCase() || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                        {safeText(row.status).toUpperCase() || "UNKNOWN"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-emerald-900/80">
                      {row.joinDate || "-"}
                    </td>
                    <td className="px-4 py-3">
                      {activeSubTab === "pending"
                        ? renderPendingActions(row)
                        : renderMemberActions(row)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-sm text-emerald-800/70"
                  >
                    No users found for the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-emerald-100 px-4 py-3">
          <p className="text-xs text-emerald-800/70">
            Showing{" "}
            {paginatedRows.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}-
            {(safePage - 1) * PAGE_SIZE + paginatedRows.length} of{" "}
            {filteredRows.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={safePage <= 1}
              className="rounded-lg border border-emerald-900/20 px-3 py-1.5 text-xs font-semibold text-emerald-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-xs font-semibold text-emerald-900">
              Page {safePage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={safePage >= totalPages}
              className="rounded-lg border border-emerald-900/20 px-3 py-1.5 text-xs font-semibold text-emerald-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default UsersTab;
