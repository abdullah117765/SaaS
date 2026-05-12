import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    FaCalendarAlt,
    FaCloudDownloadAlt,
    FaExclamationTriangle,
    FaExternalLinkAlt,
    FaFilter,
    FaLaptop,
    FaPlay,
    FaSearch,
    FaTimes,
    FaVideo,
} from "react-icons/fa";
import Pagination from "../../components/common/Pagination";
import SuperAdminLayout from "../../components/super-admin/SuperAdminLayout";
import apiRequest from "../../utils/apiClient";

const SOURCE_LABELS = {
  ZOOM_CLOUD: {
    label: "Cloud",
    icon: FaCloudDownloadAlt,
    color: "text-sky-700 bg-sky-50 border-sky-200",
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

const SuperAdminRecordingsPage = () => {
  const [recordings, setRecordings] = useState([]);
  const [meta, setMeta] = useState(null);
  const [academyOptions, setAcademyOptions] = useState([]);

  const [page, setPage] = useState(1);
  const [limit] = useState(15);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [academyFilter, setAcademyFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, academyFilter, fromDate, toDate, sourceFilter]);

  // Load academy options once
  useEffect(() => {
    let active = true;
    apiRequest("/academies/admin?limit=200")
      .then((r) => {
        if (!active) return;
        setAcademyOptions(
          (r?.data ?? []).map((a) => ({ value: a.id, label: a.name ?? a.id })),
        );
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const fetchRecordings = useCallback(async () => {
    setLoading(true);
    setError(null);
    let active = true;
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (academyFilter) params.set("academyId", academyFilter);
      if (fromDate) params.set("from", fromDate);
      if (toDate) params.set("to", toDate);
      if (sourceFilter) params.set("source", sourceFilter);
      const res = await apiRequest(`/recordings?${params}`);
      if (!active) return;
      setRecordings(res?.data ?? []);
      setMeta(res?.meta ?? null);
    } catch (e) {
      if (active) setError(e?.message ?? "Failed to load recordings.");
    } finally {
      if (active) setLoading(false);
    }
    return () => {
      active = false;
    };
  }, [
    page,
    limit,
    debouncedSearch,
    academyFilter,
    fromDate,
    toDate,
    sourceFilter,
  ]);

  useEffect(() => {
    fetchRecordings();
  }, [fetchRecordings]);

  const filtersActive = useMemo(
    () =>
      !!(
        debouncedSearch ||
        academyFilter ||
        fromDate ||
        toDate ||
        sourceFilter
      ),
    [debouncedSearch, academyFilter, fromDate, toDate, sourceFilter],
  );

  const clearFilters = () => {
    setSearch("");
    setAcademyFilter("");
    setFromDate("");
    setToDate("");
    setSourceFilter("");
  };

  const totalRecordings = meta?.total ?? recordings.length;

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Recordings</h1>
            <p className="text-sm text-gray-500">
              {loading
                ? "Loading…"
                : `${totalRecordings.toLocaleString()} recording${totalRecordings !== 1 ? "s" : ""} across all academies`}
            </p>
          </div>
        </div>

        {/* Filters card */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
            <FaFilter className="h-3.5 w-3.5 text-gray-400" />
            Filters
            {filtersActive && (
              <button
                type="button"
                onClick={clearFilters}
                className="ml-auto inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium text-red-500 hover:bg-red-50"
              >
                <FaTimes className="h-3 w-3" /> Clear all
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="relative lg:col-span-2">
              <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
              <input
                type="text"
                placeholder="Search topic or class…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-gray-300 py-2 pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <select
              value={academyFilter}
              onChange={(e) => setAcademyFilter(e.target.value)}
              className="rounded-lg border border-gray-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="">All academies</option>
              {academyOptions.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="rounded-lg border border-gray-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="">All sources</option>
              <option value="ZOOM_CLOUD">Cloud</option>
              <option value="ZOOM_LOCAL">Local</option>
            </select>
            <div className="flex gap-2">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                title="From date"
              />
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                title="To date"
              />
            </div>
          </div>
        </motion.div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <FaExclamationTriangle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-14 animate-pulse rounded-xl bg-gray-100"
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && recordings.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-white py-24 text-center"
          >
            <FaVideo className="mb-4 h-12 w-12 text-gray-200" />
            <p className="text-base font-semibold text-gray-500">
              {filtersActive
                ? "No recordings match the current filters"
                : "No recordings found"}
            </p>
            <p className="mt-1 text-sm text-gray-400">
              Cloud recordings are saved automatically when a Zoom class ends.
            </p>
          </motion.div>
        )}

        {/* Table */}
        {!loading && recordings.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm"
          >
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 bg-gray-900 text-xs uppercase tracking-wide text-white">
                <tr>
                  <th className="px-4 py-3 text-left">Class / Topic</th>
                  <th className="px-4 py-3 text-left">Academy</th>
                  <th className="px-4 py-3 text-left">Teacher</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Duration</th>
                  <th className="px-4 py-3 text-center">Source</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recordings.map((rec) => {
                  const src =
                    SOURCE_LABELS[rec.source] ?? SOURCE_LABELS.ZOOM_LOCAL;
                  const SrcIcon = src.icon;
                  const teacher = rec.class?.teacher;
                  const academy =
                    rec.class?.academy?.name ?? rec.class?.academy?.id ?? "—";
                  return (
                    <tr
                      key={rec.id}
                      className="hover:bg-gray-50/60 transition-colors"
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
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                          {academy}
                        </span>
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
                              className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
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
                            <span className="text-xs text-gray-400">
                              No link
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Footer with pagination */}
            {meta && meta.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-4 py-3">
                <p className="text-xs text-gray-500">
                  Showing {(page - 1) * limit + 1}–
                  {Math.min(page * limit, meta.total)} of{" "}
                  {meta.total.toLocaleString()}
                </p>
                <Pagination
                  currentPage={page}
                  totalPages={meta.totalPages}
                  onPageChange={setPage}
                />
              </div>
            )}
          </motion.div>
        )}
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminRecordingsPage;
