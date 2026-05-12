import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    FaCalendarAlt,
    FaCloudDownloadAlt,
    FaExclamationTriangle,
    FaExternalLinkAlt,
    FaLaptop,
    FaPlay,
    FaPlus,
    FaSearch,
    FaTimes,
    FaVideo
} from "react-icons/fa";
import apiRequest from "../../utils/apiClient";
import Pagination from "../common/Pagination";

const SOURCE_LABELS = {
  ZOOM_CLOUD: {
    label: "Cloud",
    icon: FaCloudDownloadAlt,
    color: "text-sky-600 bg-sky-50 border-sky-200",
  },
  ZOOM_LOCAL: {
    label: "Local",
    icon: FaLaptop,
    color: "text-amber-700 bg-amber-50 border-amber-200",
  },
};

const fmt = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";

const fmtDuration = (secs) => {
  if (!secs) return "—";
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

const RecordingsTab = ({ academyId }) => {
  const [recordings, setRecordings] = useState([]);
  const [meta, setMeta] = useState(null);
  const [teachers, setTeachers] = useState([]);

  const [page, setPage] = useState(1);
  const [limit] = useState(15);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [teacherFilter, setTeacherFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add-recording modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    classId: "",
    source: "ZOOM_LOCAL",
    playUrl: "",
    downloadUrl: "",
    password: "",
    topic: "",
  });
  const [addBusy, setAddBusy] = useState(false);
  const [addError, setAddError] = useState(null);
  const [classes, setClasses] = useState([]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, teacherFilter, fromDate, toDate, sourceFilter]);

  // Fetch teachers for filter dropdown
  useEffect(() => {
    apiRequest(`/users/teachers?academyId=${academyId}&limit=100`)
      .then((r) => setTeachers(r?.data ?? []))
      .catch(() => {});
  }, [academyId]);

  const fetchRecordings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (teacherFilter) params.set("teacherId", teacherFilter);
      if (fromDate) params.set("from", fromDate);
      if (toDate) params.set("to", toDate);
      if (sourceFilter) params.set("source", sourceFilter);
      const res = await apiRequest(`/recordings/my?${params}`);
      setRecordings(res?.data ?? []);
      setMeta(res?.meta ?? null);
    } catch (e) {
      setError(e?.message ?? "Failed to load recordings.");
    } finally {
      setLoading(false);
    }
  }, [
    page,
    limit,
    debouncedSearch,
    teacherFilter,
    fromDate,
    toDate,
    sourceFilter,
  ]);

  useEffect(() => {
    fetchRecordings();
  }, [fetchRecordings]);

  // Fetch classes for the add-recording modal
  useEffect(() => {
    if (!showAddModal) return;
    apiRequest(`/classes?academyId=${academyId}&limit=100`)
      .then((r) => setClasses(r?.data ?? []))
      .catch(() => {});
  }, [showAddModal, academyId]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!addForm.classId) {
      setAddError("Please select a class.");
      return;
    }
    if (!addForm.playUrl && !addForm.downloadUrl) {
      setAddError("Provide at least a play or download URL.");
      return;
    }
    setAddBusy(true);
    setAddError(null);
    try {
      await apiRequest("/recordings", { method: "POST", body: addForm });
      setShowAddModal(false);
      setAddForm({
        classId: "",
        source: "ZOOM_LOCAL",
        playUrl: "",
        downloadUrl: "",
        password: "",
        topic: "",
      });
      fetchRecordings();
    } catch (e) {
      setAddError(e?.message ?? "Failed to add recording.");
    } finally {
      setAddBusy(false);
    }
  };

  const filtersActive = useMemo(
    () =>
      !!(
        debouncedSearch ||
        teacherFilter ||
        fromDate ||
        toDate ||
        sourceFilter
      ),
    [debouncedSearch, teacherFilter, fromDate, toDate, sourceFilter],
  );

  const clearFilters = () => {
    setSearch("");
    setTeacherFilter("");
    setFromDate("");
    setToDate("");
    setSourceFilter("");
  };

  return (
    <motion.div
      key="recordings"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="p-6"
    >
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Recordings</h2>
          <p className="text-sm text-gray-500">
            Cloud and local recordings from your academy&apos;s classes
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <FaPlus className="h-3.5 w-3.5" />
          Add Recording
        </button>
      </div>

      {/* Filters */}
      <div className="mb-5 rounded-xl border border-gray-200 bg-gray-50 p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
            <input
              type="text"
              placeholder="Search topic or class…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2 pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>
          <select
            value={teacherFilter}
            onChange={(e) => setTeacherFilter(e.target.value)}
            className="rounded-lg border border-gray-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
          >
            <option value="">All teachers</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.firstName} {t.lastName ?? ""}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              placeholder="From"
            />
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              placeholder="To"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="flex-1 rounded-lg border border-gray-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              <option value="">All sources</option>
              <option value="ZOOM_CLOUD">Cloud</option>
              <option value="ZOOM_LOCAL">Local</option>
            </select>
            {filtersActive && (
              <button
                type="button"
                onClick={clearFilters}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-500 hover:text-red-500"
                title="Clear filters"
              >
                <FaTimes className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <FaExclamationTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-xl bg-gray-100"
            />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && recordings.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-20 text-center">
          <FaVideo className="mb-4 h-10 w-10 text-gray-300" />
          <p className="text-base font-semibold text-gray-500">
            {filtersActive
              ? "No recordings match the current filters"
              : "No recordings yet"}
          </p>
          <p className="mt-1 text-sm text-gray-400">
            Cloud recordings appear automatically after a class ends. Local
            recordings can be added manually.
          </p>
        </div>
      )}

      {/* Table */}
      {!loading && recordings.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-900 text-xs uppercase tracking-wide text-white">
              <tr>
                <th className="px-4 py-3 text-left">Class / Topic</th>
                <th className="px-4 py-3 text-left">Teacher</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Duration</th>
                <th className="px-4 py-3 text-center">Source</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {recordings.map((rec) => {
                const src =
                  SOURCE_LABELS[rec.source] ?? SOURCE_LABELS.ZOOM_LOCAL;
                const SrcIcon = src.icon;
                const teacher = rec.class?.teacher;
                return (
                  <tr
                    key={rec.id}
                    className="hover:bg-gray-50/70 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 line-clamp-1">
                        {rec.topic || rec.class?.title || "—"}
                      </p>
                      {rec.class?.title &&
                        rec.topic &&
                        rec.topic !== rec.class.title && (
                          <p className="text-xs text-gray-400 line-clamp-1">
                            {rec.class.title}
                          </p>
                        )}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {teacher
                        ? `${teacher.firstName} ${teacher.lastName ?? ""}`.trim()
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <span className="inline-flex items-center gap-1">
                        <FaCalendarAlt className="h-3 w-3 text-gray-400" />
                        {fmt(rec.startTime ?? rec.class?.scheduledStart)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {fmtDuration(rec.durationSeconds)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${src.color}`}
                      >
                        <SrcIcon className="h-3 w-3" />
                        {src.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        {rec.playUrl && (
                          <a
                            href={rec.playUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
                            title="Watch recording"
                          >
                            <FaPlay className="h-2.5 w-2.5" /> Watch
                          </a>
                        )}
                        {rec.downloadUrl && (
                          <a
                            href={rec.downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
                            title="Download recording"
                          >
                            <FaExternalLinkAlt className="h-2.5 w-2.5" />{" "}
                            Download
                          </a>
                        )}
                        {!rec.playUrl && !rec.downloadUrl && (
                          <span className="text-xs text-gray-400">No link</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!loading && meta && meta.totalPages > 1 && (
        <div className="mt-4 flex justify-center">
          <Pagination
            currentPage={page}
            totalPages={meta.totalPages}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* Add Recording Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h3 className="text-base font-bold text-gray-900">
                Add Local Recording
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setAddError(null);
                }}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <FaTimes className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Class *
                </label>
                <select
                  value={addForm.classId}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, classId: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  <option value="">Select a class…</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} — {fmt(c.scheduledStart)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Topic / Label
                </label>
                <input
                  type="text"
                  value={addForm.topic}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, topic: e.target.value }))
                  }
                  placeholder="e.g. Session recording"
                  className="w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Source
                </label>
                <select
                  value={addForm.source}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, source: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  <option value="ZOOM_LOCAL">Local (downloaded to PC)</option>
                  <option value="ZOOM_CLOUD">Cloud (Zoom cloud)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Play / Watch URL
                </label>
                <input
                  type="url"
                  value={addForm.playUrl}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, playUrl: e.target.value }))
                  }
                  placeholder="https://drive.google.com/…"
                  className="w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Download URL
                </label>
                <input
                  type="url"
                  value={addForm.downloadUrl}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, downloadUrl: e.target.value }))
                  }
                  placeholder="https://…"
                  className="w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Password (optional)
                </label>
                <input
                  type="text"
                  value={addForm.password}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, password: e.target.value }))
                  }
                  placeholder="Recording password"
                  className="w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
              {addError && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {addError}
                </p>
              )}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setAddError(null);
                  }}
                  className="flex-1 rounded-lg border border-gray-300 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addBusy}
                  className="flex-1 rounded-lg bg-emerald-600 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {addBusy ? "Saving…" : "Save Recording"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default RecordingsTab;
