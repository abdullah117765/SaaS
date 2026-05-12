import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import {
    FaCalendarAlt,
    FaChalkboardTeacher,
    FaCheck,
    FaClock,
    FaCopy,
    FaExternalLinkAlt,
    FaSearch,
    FaUserFriends,
    FaVideo,
} from "react-icons/fa";

const CopyLinkButton = ({ url }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copied ? "Copied!" : "Copy join link"}
      className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs font-medium text-gray-500 hover:border-emerald-300 hover:text-emerald-600 transition-colors"
    >
      {copied ? (
        <FaCheck className="h-3 w-3 text-emerald-500" />
      ) : (
        <FaCopy className="h-3 w-3" />
      )}
    </button>
  );
};

const STATUS_FILTER_MAP = {
  upcoming: "UPCOMING",
  ongoing: "ONGOING",
  past: "ENDED",
  attendance: "ENDED",
};

const EMPTY_CLASSES_SUMMARY = {
  upcoming: 0,
  ongoing: 0,
  ended: 0,
  cancelled: 0,
};

const ClassesTab = ({
  classes = [],
  summary = EMPTY_CLASSES_SUMMARY,
  meta = null,
  filters = {},
  loading = false,
  onChangeFilters,
  activeSubTab,
  setActiveSubTab,
}) => {
  const [searchTerm, setSearchTerm] = useState(filters.search ?? "");
  const [teacherFilter, setTeacherFilter] = useState(
    filters.teacherId ?? "all",
  );
  const [selectedClass, setSelectedClass] = useState(null);
  const [showClassModal, setShowClassModal] = useState(false);

  const classesSummary = { ...EMPTY_CLASSES_SUMMARY, ...(summary ?? {}) };

  useEffect(() => {
    setSearchTerm(filters.search ?? "");
  }, [filters.search]);

  useEffect(() => {
    setTeacherFilter(filters.teacherId ?? "all");
  }, [filters.teacherId]);

  useEffect(() => {
    if (typeof onChangeFilters !== "function") {
      return;
    }
    const expected = STATUS_FILTER_MAP[activeSubTab] ?? "ALL";
    const current = filters.status ?? "ALL";
    if (expected !== current) {
      onChangeFilters({ status: expected, page: 1 });
    }
  }, [activeSubTab, filters.status, onChangeFilters]);

  useEffect(() => {
    if (typeof onChangeFilters !== "function") {
      return;
    }
    const normalized = filters.search ?? "";
    if (searchTerm === normalized) {
      return;
    }
    const debounce = setTimeout(() => {
      onChangeFilters({ search: searchTerm, page: 1 });
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm, filters.search, onChangeFilters]);

  const teacherOptions = useMemo(() => {
    const map = new Map();
    classes.forEach((cls) => {
      if (cls.teacherId) {
        map.set(cls.teacherId, cls.teacher);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [classes]);

  const statusCards = useMemo(
    () => [
      {
        key: "upcoming",
        label: "Upcoming",
        value: classesSummary.upcoming,
        Icon: FaCalendarAlt,
        accent: "bg-blue-50 text-blue-600",
      },
      {
        key: "ongoing",
        label: "In Progress",
        value: classesSummary.ongoing,
        Icon: FaClock,
        accent: "bg-red-50 text-red-600",
      },
      {
        key: "ended",
        label: "Completed (30d)",
        value: classesSummary.ended,
        Icon: FaVideo,
        accent: "bg-emerald-50 text-emerald-600",
      },
      {
        key: "cancelled",
        label: "Cancelled",
        value: classesSummary.cancelled,
        Icon: FaUserFriends,
        accent: "bg-amber-50 text-amber-600",
      },
    ],
    [classesSummary],
  );

  const attendanceMetrics = useMemo(() => {
    const endedClasses = classes.filter((cls) => cls.status === "ended");
    if (!endedClasses.length) {
      return { averageRate: 0, best: null, worst: null, rates: [] };
    }

    const rates = endedClasses.map((cls) => {
      const base = cls.students_count || 0;
      const value =
        base > 0 ? Math.round(((cls.attendance ?? 0) / base) * 100) : 0;
      return { ...cls, rate: value };
    });

    const total = rates.reduce((acc, item) => acc + item.rate, 0);
    const averageRate = Math.round(total / rates.length);
    const sorted = [...rates].sort((a, b) => b.rate - a.rate);

    return {
      averageRate,
      best: sorted[0],
      worst: sorted[sorted.length - 1],
      rates,
    };
  }, [classes]);

  const handleTeacherFilterChange = (event) => {
    const value = event.target.value;
    setTeacherFilter(value);
    if (typeof onChangeFilters === "function") {
      onChangeFilters({
        teacherId: value === "all" ? undefined : value,
        page: 1,
      });
    }
  };

  const handleTabChange = (tab) => {
    setActiveSubTab(tab);
  };

  const handleViewDetails = (classItem) => {
    setSelectedClass(classItem);
    setShowClassModal(true);
  };

  const closeModal = () => {
    setSelectedClass(null);
    setShowClassModal(false);
  };

  const openZoomLink = (link) => {
    if (!link) {
      return;
    }
    window.open(link, "_blank", "noopener,noreferrer");
  };

  const renderStatusBadge = (status) => {
    const accent =
      status === "ongoing"
        ? "bg-red-100 text-red-700"
        : status === "upcoming"
          ? "bg-blue-100 text-blue-700"
          : status === "cancelled"
            ? "bg-amber-100 text-amber-700"
            : "bg-gray-100 text-gray-600";

    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${accent}`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const renderEmptyState = (
    message = "No classes found for the selected filters.",
  ) => (
    <div className="flex items-center justify-center rounded-lg border border-dashed border-gray-200 bg-white p-10 text-sm text-gray-500">
      {message}
    </div>
  );

  const renderClassesTable = (rows) => {
    if (!rows.length) {
      return renderEmptyState();
    }

    return (
      <div className="overflow-hidden rounded-xl border border-emerald-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-900">
                <th
                  scope="col"
                  className="px-5 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide"
                >
                  Class
                </th>
                <th
                  scope="col"
                  className="px-5 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide"
                >
                  Teacher
                </th>
                <th
                  scope="col"
                  className="px-5 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide"
                >
                  Schedule
                </th>
                <th
                  scope="col"
                  className="px-5 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide"
                >
                  Duration
                </th>
                <th
                  scope="col"
                  className="px-5 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide"
                >
                  Students
                </th>
                <th
                  scope="col"
                  className="px-5 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-5 py-3 text-center text-xs font-semibold text-white uppercase tracking-wide"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-50">
              {rows.map((classItem, idx) => {
                const meetingUrl = classItem.zoomStartUrl ?? classItem.zoomLink;
                const canJoin =
                  meetingUrl &&
                  !["ended", "cancelled"].includes(classItem.status);
                return (
                  <tr
                    key={classItem.id}
                    className={`${idx % 2 === 0 ? "bg-white" : "bg-emerald-50/30"} hover:bg-emerald-50/60 transition-colors`}
                  >
                    <td className="px-5 py-3.5">
                      <div className="text-sm font-semibold text-slate-900">
                        {classItem.title}
                      </div>
                      {classItem.description && (
                        <p className="mt-0.5 text-xs text-slate-500 line-clamp-1">
                          {classItem.description}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-600">
                      {classItem.teacher || "—"}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-600">
                      <div>
                        {classItem.schedule ||
                          new Date(classItem.date).toLocaleString()}
                      </div>
                      {classItem.timezone && (
                        <div className="text-xs text-slate-400">
                          {classItem.timezone}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-600 whitespace-nowrap">
                      {classItem.duration} min
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-600">
                      {classItem.students_count ?? 0}
                    </td>
                    <td className="px-5 py-3.5">
                      {renderStatusBadge(classItem.status)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col items-start gap-1.5">
                        {canJoin && (
                          <div className="flex items-center gap-1.5">
                            <a
                              href={meetingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-xs font-medium text-emerald-700 hover:border-emerald-400 hover:bg-emerald-50 transition-colors"
                            >
                              <FaExternalLinkAlt className="mr-1 h-3 w-3" />
                              {classItem.zoomStartUrl ? "Start" : "Join"}
                            </a>
                            <CopyLinkButton url={meetingUrl} />
                          </div>
                        )}
                        {meetingUrl && (
                          <p
                            className="max-w-[200px] truncate text-xs text-gray-400"
                            title={meetingUrl}
                          >
                            {meetingUrl}
                          </p>
                        )}
                        <button
                          onClick={() => handleViewDetails(classItem)}
                          className="inline-flex items-center rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-800 transition-colors"
                        >
                          Details
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderAttendanceInsights = () => (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
            Average Attendance
          </p>
          <p className="mt-2 text-3xl font-bold text-blue-700">
            {attendanceMetrics.averageRate}%
          </p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Best Performing
          </p>
          <p className="mt-2 text-base font-semibold text-slate-900">
            {attendanceMetrics.best ? attendanceMetrics.best.title : "Ã¢â‚¬â€"}
          </p>
          {attendanceMetrics.best && (
            <p className="text-sm text-emerald-600">
              {attendanceMetrics.best.rate}% attendance
            </p>
          )}
        </div>
        <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
            Needs Attention
          </p>
          <p className="mt-2 text-base font-semibold text-slate-900">
            {attendanceMetrics.worst
              ? attendanceMetrics.worst.title
              : "Ã¢â‚¬â€"}
          </p>
          {attendanceMetrics.worst && (
            <p className="text-sm text-amber-600">
              {attendanceMetrics.worst.rate}% attendance
            </p>
          )}
        </div>
      </div>
      {attendanceMetrics.rates.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-emerald-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-900">
                  <th
                    scope="col"
                    className="px-5 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide"
                  >
                    Class
                  </th>
                  <th
                    scope="col"
                    className="px-5 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide"
                  >
                    Teacher
                  </th>
                  <th
                    scope="col"
                    className="px-5 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide"
                  >
                    Students
                  </th>
                  <th
                    scope="col"
                    className="px-5 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide"
                  >
                    Attendance Rate
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-50">
                {attendanceMetrics.rates.map((item, idx) => {
                  const participants = item.students_count ?? 0;
                  return (
                    <tr
                      key={item.id}
                      className={`${idx % 2 === 0 ? "bg-white" : "bg-emerald-50/30"} hover:bg-emerald-50/60 transition-colors`}
                    >
                      <td className="px-5 py-3.5 text-sm font-semibold text-slate-900">
                        {item.title}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-600">
                        {item.teacher || "Ã¢â‚¬â€"}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-600">
                        {participants}
                      </td>
                      <td className="px-5 py-3.5 text-sm font-medium text-emerald-700">
                        {item.rate}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        renderEmptyState("No attendance data available yet.")
      )}
    </div>
  );

  const handlePageChange = (page) => {
    if (!onChangeFilters || !page || page === filters.page) {
      return;
    }
    onChangeFilters({ page });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statusCards.map((card) => (
          <div
            key={card.key}
            className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-4 shadow-sm cursor-pointer hover:border-emerald-200 transition-colors"
            onClick={() =>
              handleTabChange(
                card.key === "ended"
                  ? "past"
                  : card.key === "cancelled"
                    ? "past"
                    : card.key,
              )
            }
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {card.label}
              </p>
              <p className="mt-1.5 text-2xl font-bold text-slate-900">
                {card.value}
              </p>
            </div>
            <div className={`rounded-full p-3 ${card.accent}`}>
              <card.Icon className="h-5 w-5" />
            </div>
          </div>
        ))}
      </div>

      <div className="border-b border-emerald-100">
        <nav className="-mb-px flex space-x-6">
          {["upcoming", "ongoing", "past", "attendance"].map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`whitespace-nowrap border-b-2 py-3 text-sm font-semibold transition-colors ${
                activeSubTab === tab
                  ? "border-emerald-600 text-emerald-700"
                  : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
              }`}
            >
              {tab === "past"
                ? "Completed"
                : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:w-72">
          <FaSearch className="pointer-events-none absolute inset-y-0 left-3 my-auto h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search classes or teachers..."
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <div className="flex items-center gap-3">
          <select
            value={teacherFilter}
            onChange={handleTeacherFilterChange}
            className="rounded-lg border border-slate-300 bg-white py-2 pl-3 pr-10 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">All Teachers</option>
            {teacherOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => onChangeFilters && onChangeFilters({})}
            className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:border-emerald-500 hover:text-emerald-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center rounded-lg border border-dashed border-gray-200 bg-white p-10 text-sm text-gray-500">
          Loading classes...
        </div>
      ) : activeSubTab === "attendance" ? (
        renderAttendanceInsights()
      ) : (
        renderClassesTable(classes)
      )}

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600">
          <div>
            Showing page {meta.currentPage} of {meta.totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!meta.previousPage || loading}
              onClick={() => handlePageChange(meta.previousPage)}
              className={`inline-flex items-center rounded-lg border px-3 py-1.5 text-sm ${
                meta.previousPage && !loading
                  ? "border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-50"
                  : "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
              }`}
            >
              Previous
            </button>
            <button
              type="button"
              disabled={!meta.nextPage || loading}
              onClick={() => handlePageChange(meta.nextPage)}
              className={`inline-flex items-center rounded-lg border px-3 py-1.5 text-sm ${
                meta.nextPage && !loading
                  ? "border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-50"
                  : "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {showClassModal && selectedClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="bg-emerald-950 px-6 py-4">
              <h3 className="text-xl font-semibold text-white">
                {selectedClass.title}
              </h3>
              <p className="mt-1 text-sm text-emerald-200">
                {selectedClass.description || "No description provided."}
              </p>
            </div>
            <div className="space-y-4 px-6 py-5 text-sm text-slate-700">
              <div className="flex items-center gap-2 text-slate-600">
                <FaChalkboardTeacher className="text-emerald-600" />
                <span>Teacher:</span>
                <span className="font-semibold text-slate-900">
                  {selectedClass.teacher || "Unassigned"}
                </span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Start
                  </p>
                  <p className="mt-1 font-medium text-slate-900">
                    {new Date(selectedClass.date).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    End
                  </p>
                  <p className="mt-1 font-medium text-slate-900">
                    {selectedClass.endDate
                      ? new Date(selectedClass.endDate).toLocaleString()
                      : "Ã¢â‚¬â€"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Duration
                  </p>
                  <p className="mt-1 font-medium text-slate-900">
                    {selectedClass.duration} minutes
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Students
                  </p>
                  <p className="mt-1 font-medium text-slate-900">
                    {selectedClass.students_count ?? 0}
                  </p>
                </div>
                {selectedClass.status === "ended" && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Attendance
                    </p>
                    <p className="mt-1 font-medium text-slate-900">
                      {selectedClass.attendance ?? 0}/
                      {selectedClass.students_count ?? 0}
                    </p>
                  </div>
                )}
              </div>
              {selectedClass.zoomLink && (
                <button
                  type="button"
                  onClick={() => openZoomLink(selectedClass.zoomLink)}
                  className="inline-flex items-center rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 transition-colors"
                >
                  <FaExternalLinkAlt className="mr-2" />
                  Open Zoom Meeting
                </button>
              )}
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-3">
              <button
                type="button"
                onClick={closeModal}
                className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ClassesTab;
