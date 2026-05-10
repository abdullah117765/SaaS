import { motion } from "framer-motion";
import React, { useEffect, useMemo, useState } from "react";
import {
  FaChevronDown,
  FaChevronUp,
  FaEdit,
  FaHistory,
  FaPlus,
  FaSync,
} from "react-icons/fa";
import apiRequest from "../../utils/apiClient";

const DEFAULT_AUDIT_LOG = {
  transactions: [],
  limitChanges: [],
  meta: {
    total: 0,
    count: 0,
    take: 20,
    skip: 0,
    nextSkip: null,
    previousSkip: null,
  },
};

const CreditManagementTab = ({ academyId }) => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [expandedTeacher, setExpandedTeacher] = useState(null);
  const [auditLog, setAuditLog] = useState(DEFAULT_AUDIT_LOG);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditFilters, setAuditFilters] = useState({ type: "", from: "", to: "" });
  const [auditPager, setAuditPager] = useState({ take: 20, skip: 0 });

  const [showLimitModal, setShowLimitModal] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);

  const [limitForm, setLimitForm] = useState({ limit: "", reason: "" });
  const [extendForm, setExtendForm] = useState({ amount: "", reason: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (academyId) {
      fetchTeachersSummary();
    }
  }, [academyId]);

  const fetchTeachersSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest(`/zoom-credits/academy/${academyId}/teachers-summary`);
      setTeachers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const buildAuditQuery = (teacherId, pager = auditPager, filters = auditFilters) => {
    const params = new URLSearchParams();
    params.set("academyId", academyId);
    params.set("take", String(pager.take));
    params.set("skip", String(pager.skip));
    if (filters.type) params.set("type", filters.type);
    if (filters.from) params.set("from", new Date(`${filters.from}T00:00:00.000Z`).toISOString());
    if (filters.to) params.set("to", new Date(`${filters.to}T23:59:59.999Z`).toISOString());
    return `/zoom-credits/teacher/${teacherId}/audit-log?${params.toString()}`;
  };

  const fetchAuditLog = async (teacherId, pager = auditPager, filters = auditFilters) => {
    setAuditLoading(true);
    try {
      const data = await apiRequest(buildAuditQuery(teacherId, pager, filters));
      setAuditLog(data ?? DEFAULT_AUDIT_LOG);
    } catch (err) {
      console.error("Error fetching audit log:", err);
      setAuditLog(DEFAULT_AUDIT_LOG);
    } finally {
      setAuditLoading(false);
    }
  };

  const handleExpandTeacher = (teacher) => {
    if (expandedTeacher?.teacherId === teacher.teacherId) {
      setExpandedTeacher(null);
      setAuditLog(DEFAULT_AUDIT_LOG);
      return;
    }

    const pager = { take: 20, skip: 0 };
    const filters = { type: "", from: "", to: "" };
    setExpandedTeacher(teacher);
    setAuditPager(pager);
    setAuditFilters(filters);
    fetchAuditLog(teacher.teacherId, pager, filters);
  };

  const handleOpenLimitModal = (teacher) => {
    setSelectedTeacher(teacher);
    setLimitForm({
      limit: teacher.creditLimit !== null ? String(teacher.creditLimit) : "",
      reason: "",
    });
    setShowLimitModal(true);
  };

  const handleOpenExtendModal = (teacher) => {
    setSelectedTeacher(teacher);
    setExtendForm({ amount: "", reason: "" });
    setShowExtendModal(true);
  };

  const handleSubmitLimit = async (e) => {
    e.preventDefault();
    if (!selectedTeacher) return;

    setSubmitting(true);
    try {
      const limit = limitForm.limit ? Number(limitForm.limit) : null;
      await apiRequest(`/zoom-credits/teacher/${selectedTeacher.teacherId}/limit`, {
        method: "PATCH",
        body: {
          academyId,
          limit,
          reason: limitForm.reason || undefined,
        },
      });

      setShowLimitModal(false);
      setSelectedTeacher(null);
      setLimitForm({ limit: "", reason: "" });
      await fetchTeachersSummary();
      if (expandedTeacher?.teacherId === selectedTeacher.teacherId) {
        await fetchAuditLog(selectedTeacher.teacherId);
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitExtend = async (e) => {
    e.preventDefault();
    if (!selectedTeacher) return;

    const delta = Number(extendForm.amount);
    if (!Number.isFinite(delta) || delta <= 0) {
      alert("Please enter a positive extension amount.");
      return;
    }

    setSubmitting(true);
    try {
      const currentLimit = selectedTeacher.creditLimit ?? 0;
      const nextLimit = currentLimit + delta;
      await apiRequest(`/zoom-credits/teacher/${selectedTeacher.teacherId}/limit`, {
        method: "PATCH",
        body: {
          academyId,
          limit: nextLimit,
          reason:
            extendForm.reason ||
            `Extended by +${delta} credits from ${currentLimit} to ${nextLimit}`,
        },
      });

      setShowExtendModal(false);
      setSelectedTeacher(null);
      setExtendForm({ amount: "", reason: "" });
      await fetchTeachersSummary();
      if (expandedTeacher?.teacherId === selectedTeacher.teacherId) {
        await fetchAuditLog(selectedTeacher.teacherId);
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const applyAuditFilters = async () => {
    if (!expandedTeacher) return;
    const pager = { ...auditPager, skip: 0 };
    setAuditPager(pager);
    await fetchAuditLog(expandedTeacher.teacherId, pager, auditFilters);
  };

  const resetAuditFilters = async () => {
    if (!expandedTeacher) return;
    const nextFilters = { type: "", from: "", to: "" };
    const pager = { ...auditPager, skip: 0 };
    setAuditFilters(nextFilters);
    setAuditPager(pager);
    await fetchAuditLog(expandedTeacher.teacherId, pager, nextFilters);
  };

  const goAuditPage = async (skip) => {
    if (!expandedTeacher) return;
    const pager = { ...auditPager, skip };
    setAuditPager(pager);
    await fetchAuditLog(expandedTeacher.teacherId, pager, auditFilters);
  };

  const totals = useMemo(() => {
    return {
      teachers: teachers.length,
      purchased: teachers.reduce((sum, t) => sum + (t.totalPurchased || 0), 0),
      used: teachers.reduce((sum, t) => sum + (t.totalDebited || 0), 0),
      remaining: teachers.reduce((sum, t) => sum + (t.balance || 0), 0),
    };
  }, [teachers]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        <p className="font-semibold">Error loading credit management</p>
        <p>{error}</p>
        <button
          onClick={fetchTeachersSummary}
          className="mt-2 inline-flex items-center rounded-md bg-red-600 px-3 py-1.5 text-xs text-white hover:bg-red-700"
        >
          <FaSync className="mr-1" /> Retry
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Credit Management</h2>
          <p className="text-sm text-gray-600">
            Manage teacher credit limits, usage, extensions, and audit history.
          </p>
        </div>
        <button
          onClick={fetchTeachersSummary}
          className="inline-flex items-center rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
        >
          <FaSync className="mr-2" /> Refresh
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-600">Total Teachers</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{totals.teachers}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-600">Total Purchased</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{totals.purchased}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-600">Total Used</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-600">{totals.used}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-600">Remaining</p>
          <p className="mt-1 text-2xl font-semibold text-blue-600">{totals.remaining}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {teachers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No teachers found for this academy</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Teacher</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Email</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600">Purchased</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600">Used</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600">Balance</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600">Limit</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((teacher) => (
                  <React.Fragment key={teacher.teacherId}>
                    <tr className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{teacher.teacherName}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{teacher.email}</td>
                      <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">{teacher.totalPurchased}</td>
                      <td className="px-6 py-4 text-right text-sm font-medium text-red-600">{teacher.totalDebited}</td>
                      <td className="px-6 py-4 text-right text-sm font-medium text-blue-600">{teacher.balance}</td>
                      <td className="px-6 py-4 text-right text-sm font-medium">
                        {teacher.creditLimit !== null ? (
                          <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800">
                            {teacher.creditLimit}
                          </span>
                        ) : (
                          <span className="text-gray-500">Unlimited</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right text-sm">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleOpenLimitModal(teacher)}
                            className="inline-flex items-center rounded-md border border-blue-200 px-2 py-1.5 text-xs text-blue-600 hover:bg-blue-50"
                          >
                            <FaEdit className="mr-1" /> Set limit
                          </button>
                          <button
                            onClick={() => handleOpenExtendModal(teacher)}
                            className="inline-flex items-center rounded-md border border-emerald-200 px-2 py-1.5 text-xs text-emerald-700 hover:bg-emerald-50"
                          >
                            <FaPlus className="mr-1" /> Extend +X
                          </button>
                          <button
                            onClick={() => handleExpandTeacher(teacher)}
                            className="inline-flex items-center rounded-md border border-gray-300 px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
                          >
                            <FaHistory className="mr-1" />
                            {expandedTeacher?.teacherId === teacher.teacherId ? <FaChevronUp /> : <FaChevronDown />}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {expandedTeacher?.teacherId === teacher.teacherId && (
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <td colSpan="7" className="px-6 py-4">
                          <div className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-5">
                            <select
                              value={auditFilters.type}
                              onChange={(e) => setAuditFilters((prev) => ({ ...prev, type: e.target.value }))}
                              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                            >
                              <option value="">All types</option>
                              <option value="CREDIT">CREDIT</option>
                              <option value="DEBIT">DEBIT</option>
                              <option value="TRANSFER_IN">TRANSFER_IN</option>
                              <option value="TRANSFER_OUT">TRANSFER_OUT</option>
                            </select>
                            <input
                              type="date"
                              value={auditFilters.from}
                              onChange={(e) => setAuditFilters((prev) => ({ ...prev, from: e.target.value }))}
                              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                            />
                            <input
                              type="date"
                              value={auditFilters.to}
                              onChange={(e) => setAuditFilters((prev) => ({ ...prev, to: e.target.value }))}
                              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                            />
                            <button
                              onClick={applyAuditFilters}
                              className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                            >
                              Apply
                            </button>
                            <button
                              onClick={resetAuditFilters}
                              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              Reset
                            </button>
                          </div>

                          {auditLoading ? (
                            <div className="flex items-center py-4">
                              <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                              <span className="ml-2 text-sm text-gray-600">Loading audit log...</span>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div className="rounded-lg border border-gray-200 bg-white p-3">
                                <p className="text-xs font-semibold uppercase text-gray-600">Credit limit changes</p>
                                <div className="mt-2 max-h-48 space-y-2 overflow-y-auto">
                                  {auditLog.limitChanges?.length ? (
                                    auditLog.limitChanges.map((change) => (
                                      <div key={change.id} className="rounded border border-gray-200 p-2 text-xs">
                                        <p className="font-medium">
                                          {change.oldLimit === null ? "Unlimited" : change.oldLimit} ? {change.newLimit === null ? "Unlimited" : change.newLimit}
                                        </p>
                                        <p className="text-gray-600">By: {change.changedBy}</p>
                                        {change.reason ? <p className="text-gray-600">Reason: {change.reason}</p> : null}
                                        <p className="text-gray-500">{new Date(change.createdAt).toLocaleString()}</p>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-xs text-gray-500">No limit changes for selected filters.</p>
                                  )}
                                </div>
                              </div>

                              <div className="rounded-lg border border-gray-200 bg-white p-3">
                                <p className="text-xs font-semibold uppercase text-gray-600">Transactions</p>
                                <div className="mt-2 max-h-60 space-y-2 overflow-y-auto">
                                  {auditLog.transactions?.length ? (
                                    auditLog.transactions.map((tx) => (
                                      <div key={tx.id} className="rounded border border-gray-200 p-2 text-xs">
                                        <p className="font-medium">
                                          {tx.type}: {tx.amount} credits (Balance: {tx.runningBalance})
                                        </p>
                                        {tx.reason ? <p className="text-gray-600">Reason: {tx.reason}</p> : null}
                                        <p className="text-gray-500">{new Date(tx.createdAt).toLocaleString()}</p>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-xs text-gray-500">No transactions for selected filters.</p>
                                  )}
                                </div>

                                <div className="mt-3 flex items-center justify-between border-t border-gray-200 pt-3">
                                  <p className="text-xs text-gray-500">
                                    Showing {auditLog.meta?.count ?? 0} of {auditLog.meta?.total ?? 0}
                                  </p>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => goAuditPage(auditLog.meta?.previousSkip ?? 0)}
                                      disabled={auditLog.meta?.previousSkip == null}
                                      className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      Previous
                                    </button>
                                    <button
                                      onClick={() => goAuditPage(auditLog.meta?.nextSkip ?? 0)}
                                      disabled={auditLog.meta?.nextSkip == null}
                                      className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      Next
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showLimitModal && selectedTeacher ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-md rounded-2xl bg-white shadow-2xl"
          >
            <form onSubmit={handleSubmitLimit}>
              <div className="border-b border-gray-200 px-6 py-4">
                <h3 className="text-lg font-semibold text-gray-900">Set Credit Limit for {selectedTeacher.teacherName}</h3>
                <p className="text-sm text-gray-600">Leave empty for unlimited credits</p>
              </div>
              <div className="space-y-4 px-6 py-5">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Credit Limit</label>
                  <input
                    type="number"
                    min={0}
                    value={limitForm.limit}
                    onChange={(e) => setLimitForm((prev) => ({ ...prev, limit: e.target.value }))}
                    placeholder="Leave empty for unlimited"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Reason (optional)</label>
                  <textarea
                    value={limitForm.reason}
                    onChange={(e) => setLimitForm((prev) => ({ ...prev, reason: e.target.value }))}
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowLimitModal(false);
                    setSelectedTeacher(null);
                  }}
                  disabled={submitting}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save Limit"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      ) : null}

      {showExtendModal && selectedTeacher ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-md rounded-2xl bg-white shadow-2xl"
          >
            <form onSubmit={handleSubmitExtend}>
              <div className="border-b border-gray-200 px-6 py-4">
                <h3 className="text-lg font-semibold text-gray-900">Extend Credit Limit for {selectedTeacher.teacherName}</h3>
                <p className="text-sm text-gray-600">
                  Current limit: {selectedTeacher.creditLimit === null ? "Unlimited" : selectedTeacher.creditLimit}
                </p>
              </div>
              <div className="space-y-4 px-6 py-5">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Extend by (+X)</label>
                  <input
                    type="number"
                    min={1}
                    value={extendForm.amount}
                    onChange={(e) => setExtendForm((prev) => ({ ...prev, amount: e.target.value }))}
                    placeholder="e.g. 100"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Reason (optional)</label>
                  <textarea
                    value={extendForm.reason}
                    onChange={(e) => setExtendForm((prev) => ({ ...prev, reason: e.target.value }))}
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowExtendModal(false);
                    setSelectedTeacher(null);
                  }}
                  disabled={submitting}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {submitting ? "Extending..." : "Extend Limit"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      ) : null}
    </motion.div>
  );
};

export default CreditManagementTab;
