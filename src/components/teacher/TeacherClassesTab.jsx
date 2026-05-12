import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import {
    FaBan,
    FaClock,
    FaEdit,
    FaExternalLinkAlt,
    FaPlus,
    FaSearch,
    FaSyncAlt,
    FaTrash,
} from "react-icons/fa";

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "upcoming", label: "Upcoming" },
  { value: "ongoing", label: "Ongoing" },
  { value: "ended", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const STATUS_BADGES = {
  upcoming: "bg-blue-100 text-blue-700",
  ongoing: "bg-emerald-100 text-emerald-700",
  ended: "bg-gray-200 text-gray-700",
  cancelled: "bg-red-100 text-red-700",
};

const DEFAULT_FORM = {
  title: "",
  description: "",
  date: "",
  startTime: "",
  duration: 60,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC",
  status: "UPCOMING",
  participants: [],
};

const formatDate = (value) => {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleString();
  } catch (error) {
    return value;
  }
};

const TeacherClassesTab = ({
  classes,
  students,
  filters,
  onUpdateFilters,
  onCreateClass,
  onUpdateClass,
  onCancelClass,
  onDeleteClass,
  loading,
  meta,
  onRefresh,
  metrics,
  academyOptions = [],
  activeAcademyId,
  onSelectAcademy,
  hasAcademyAccess,
  loadingAcademies = false,
}) => {
  const [localFilters, setLocalFilters] = useState(filters);
  const [showFormModal, setShowFormModal] = useState(false);
  const [formValues, setFormValues] = useState(DEFAULT_FORM);
  const [editingClass, setEditingClass] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelError, setCancelError] = useState("");
  const [cancelSubmitting, setCancelSubmitting] = useState(false);

  const canSchedule = hasAcademyAccess && !loadingAcademies;

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setLocalFilters((prev) => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    onUpdateFilters(localFilters);
  };

  const resetFilters = () => {
    setLocalFilters({ status: "all", search: "", from: "", to: "" });
    onUpdateFilters({ status: "all", search: "", from: "", to: "" });
  };

  const openCreateModal = () => {
    if (!canSchedule) {
      return;
    }

    setEditingClass(null);
    setFormValues({
      ...DEFAULT_FORM,
      date: new Date().toISOString().slice(0, 10),
      startTime: new Date().toISOString().slice(11, 16),
    });
    setShowFormModal(true);
  };

  const openEditModal = (cls) => {
    setEditingClass(cls);
    const start = cls.scheduledStart ? new Date(cls.scheduledStart) : null;
    const end = cls.scheduledEnd ? new Date(cls.scheduledEnd) : null;
    let duration = cls.durationMinutes ?? 60;
    if (start && end) {
      duration = Math.max(
        Math.round((end.getTime() - start.getTime()) / 60000),
        30,
      );
    }
    setFormValues({
      title: cls.title,
      description: cls.description ?? "",
      date: start ? start.toISOString().slice(0, 10) : "",
      startTime: start ? start.toISOString().slice(11, 16) : "",
      duration,
      timezone:
        cls.timezone ??
        Intl.DateTimeFormat().resolvedOptions().timeZone ??
        "UTC",
      status: (cls.status ?? "upcoming").toUpperCase(),
      participants: [],
    });
    setShowFormModal(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setShowFormModal(false);
    setEditingClass(null);
    setFormValues(DEFAULT_FORM);
  };

  const openCancelModal = (cls) => {
    setCancelTarget(cls);
    setCancelReason("");
    setCancelError("");
  };

  const closeCancelModal = () => {
    if (cancelSubmitting) return;
    setCancelTarget(null);
    setCancelReason("");
    setCancelError("");
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleParticipantToggle = (studentId) => {
    setFormValues((prev) => {
      const exists = prev.participants.includes(studentId);
      return {
        ...prev,
        participants: exists
          ? prev.participants.filter((id) => id !== studentId)
          : [...prev.participants, studentId],
      };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!formValues.title.trim()) {
      return;
    }
    const { date, startTime, duration, timezone, status } = formValues;
    const start = new Date(`${date}T${startTime || "00:00"}:00`);
    if (Number.isNaN(start.getTime())) {
      return;
    }
    const end = new Date(start.getTime() + Number(duration || 60) * 60000);
    const payload = {
      title: formValues.title.trim(),
      description: formValues.description?.trim() || undefined,
      scheduledStart: start.toISOString(),
      scheduledEnd: end.toISOString(),
      timezone,
      participants: formValues.participants.map((id) => ({ userId: id })),
    };

    if (editingClass) {
      if (status) {
        payload.status = status;
      }
      setSubmitting(true);
      const result = await onUpdateClass(editingClass.id, payload);
      setSubmitting(false);
      if (result?.success) {
        closeModal();
      }
    } else {
      setSubmitting(true);
      const result = await onCreateClass(payload);
      setSubmitting(false);
      if (result?.success) {
        closeModal();
      }
    }
  };

  const handleClear = async (cls) => {
    const confirmed = window.confirm(`Clear the class "${cls.title}"?`);
    if (!confirmed) {
      return;
    }
    await onDeleteClass(cls.id);
  };

  const handleCancelSubmit = async (event) => {
    event.preventDefault();
    const reason = cancelReason.trim();
    if (reason.length < 3) {
      setCancelError(
        "A cancellation reason of at least 3 characters is required.",
      );
      return;
    }

    setCancelSubmitting(true);
    setCancelError("");
    const result = await onCancelClass(cancelTarget.id, reason);
    setCancelSubmitting(false);
    if (result?.success) {
      closeCancelModal();
    } else if (result?.error) {
      setCancelError(result.error);
    }
  };

  const filterSummary = useMemo(
    () => [
      { label: "Total classes", value: metrics.totalClasses ?? classes.length },
      { label: "Upcoming", value: metrics.upcomingCount ?? 0 },
      { label: "Completed", value: metrics.completedCount ?? 0 },
      { label: "Students", value: metrics.studentCount ?? 0 },
    ],
    [classes.length, metrics],
  );

  return (
    <motion.div
      key="teacher-classes"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">
            Class Manager
          </h2>
          <p className="text-sm text-gray-600">
            Schedule new sessions, refine your timetable, and review past
            meetings.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openCreateModal}
            disabled={!canSchedule}
            className="inline-flex items-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FaPlus className="mr-2" /> Schedule class
          </button>
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:border-emerald-400 hover:text-emerald-600"
          >
            <FaSyncAlt className="mr-2" /> Refresh
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {filterSummary.map((item) => (
          <div
            key={item.label}
            className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
          >
            <p className="text-xs uppercase text-gray-500">{item.label}</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <select
            value={activeAcademyId ?? ""}
            onChange={(event) => onSelectAcademy?.(event.target.value || null)}
            disabled={loadingAcademies || academyOptions.length === 0}
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            {academyOptions.length === 0 ? (
              <option value="">No academies available</option>
            ) : (
              academyOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))
            )}
          </select>
          <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
            <FaSearch className="mr-2 text-gray-400" />
            <input
              type="text"
              name="search"
              value={localFilters.search}
              onChange={handleFilterChange}
              placeholder="Search by title"
              className="w-full bg-transparent text-sm focus:outline-none"
            />
          </div>
          <select
            name="status"
            value={localFilters.status}
            onChange={handleFilterChange}
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <input
            type="date"
            name="from"
            value={localFilters.from}
            onChange={handleFilterChange}
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <input
            type="date"
            name="to"
            value={localFilters.to}
            onChange={handleFilterChange}
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={applyFilters}
            className="inline-flex items-center rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Apply filters
          </button>
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:text-emerald-600 hover:border-emerald-400"
          >
            Reset
          </button>
          {meta ? (
            <span className="ml-auto text-xs text-gray-500">
              Showing {meta.count ?? classes.length} of{" "}
              {meta.total ?? classes.length}
            </span>
          ) : null}
        </div>
        {!hasAcademyAccess && !loadingAcademies ? (
          <p className="mt-3 text-xs text-amber-700">
            Join an academy to enable class scheduling and roster access.
          </p>
        ) : null}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              Scheduled classes
            </h3>
            <p className="text-sm text-gray-500">
              Manage upcoming and past sessions by status and date.
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-sm text-gray-500">
              <FaClock className="mr-2" /> Loading classes...
            </div>
          ) : classes.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-sm text-gray-500">
              No classes aligned with your filters.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-emerald-100">
              <thead className="bg-emerald-950">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-emerald-100">
                    Class
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-emerald-100">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-emerald-100">
                    Starts
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-emerald-100">
                    Participants
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wide text-emerald-100">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-100">
                {classes.map((cls, idx) => {
                  const meetingUrl = cls.zoomStartUrl ?? cls.zoomJoinUrl;
                  const hasEndedByTime = cls.scheduledEnd
                    ? new Date(cls.scheduledEnd).getTime() <= Date.now()
                    : false;
                  const canJoin =
                    meetingUrl &&
                    !hasEndedByTime &&
                    !["ended", "cancelled"].includes(cls.status ?? "");
                  const canClear =
                    hasEndedByTime ||
                    ["ended", "cancelled"].includes(cls.status ?? "");

                  return (
                    <tr
                      key={cls.id}
                      className={`${idx % 2 === 0 ? "bg-white" : "bg-emerald-50/40"} hover:bg-emerald-50/50`}
                    >
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <p className="font-semibold">{cls.title}</p>
                        <p className="text-xs text-gray-500">
                          {cls.description || "No description"}
                        </p>
                        {cls.cancellationReason ? (
                          <p className="mt-1 text-xs text-red-600">
                            Reason: {cls.cancellationReason}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                            STATUS_BADGES[cls.status] ??
                            "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {cls.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {formatDate(cls.scheduledStart)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {cls.participants}
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-gray-700">
                        <div className="flex justify-center gap-2">
                          {canJoin ? (
                            <a
                              href={meetingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                            >
                              <FaExternalLinkAlt className="mr-1" />{" "}
                              {cls.zoomStartUrl ? "Start" : "Join"}
                            </a>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => openEditModal(cls)}
                            className="inline-flex items-center rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:border-emerald-400 hover:text-emerald-600"
                          >
                            <FaEdit className="mr-1" /> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              canClear ? handleClear(cls) : openCancelModal(cls)
                            }
                            className="inline-flex items-center rounded-md border border-red-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
                          >
                            {canClear ? (
                              <>
                                <FaTrash className="mr-1" /> Clear
                              </>
                            ) : (
                              <>
                                <FaBan className="mr-1" /> Cancel
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showFormModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl"
          >
            <form onSubmit={handleSubmit}>
              <div className="border-b border-gray-200 px-6 py-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  {editingClass ? "Edit class" : "Schedule a class"}
                </h3>
                <p className="text-sm text-gray-500">
                  Provide session details below. Invitations are sent
                  automatically to enrolled students.
                </p>
              </div>
              <div className="space-y-4 px-6 py-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Title
                  </label>
                  <input
                    name="title"
                    value={formValues.title}
                    onChange={handleFormChange}
                    required
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formValues.description}
                    onChange={handleFormChange}
                    rows={3}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="Optional context for students"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Date
                    </label>
                    <input
                      type="date"
                      name="date"
                      value={formValues.date}
                      onChange={handleFormChange}
                      required
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Start time
                    </label>
                    <input
                      type="time"
                      name="startTime"
                      value={formValues.startTime}
                      onChange={handleFormChange}
                      required
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      name="duration"
                      min={15}
                      step={5}
                      value={formValues.duration}
                      onChange={handleFormChange}
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Timezone
                    </label>
                    <input
                      name="timezone"
                      value={formValues.timezone}
                      onChange={handleFormChange}
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
                {editingClass ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Status
                      </label>
                      <select
                        name="status"
                        value={formValues.status}
                        onChange={handleFormChange}
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      >
                        {STATUS_OPTIONS.filter(
                          (option) =>
                            option.value !== "all" &&
                            option.value !== "cancelled",
                        ).map((option) => (
                          <option
                            key={option.value}
                            value={option.value.toUpperCase()}
                          >
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : null}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-700">
                      Invite students
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            formValues.participants.length === students.length
                          ) {
                            setFormValues((prev) => ({
                              ...prev,
                              participants: [],
                            }));
                          } else {
                            setFormValues((prev) => ({
                              ...prev,
                              participants: students.map((s) => s.id),
                            }));
                          }
                        }}
                        className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 font-medium transition-colors"
                      >
                        {formValues.participants.length === students.length
                          ? "Deselect all"
                          : "Select all"}
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 max-h-48 space-y-1 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm">
                    {students.length === 0 ? (
                      <p className="text-xs text-gray-500">
                        No students available.
                      </p>
                    ) : (
                      students.map((student) => (
                        <label
                          key={student.id}
                          className="flex items-center gap-2"
                        >
                          <input
                            type="checkbox"
                            checked={formValues.participants.includes(
                              student.id,
                            )}
                            onChange={() => handleParticipantToggle(student.id)}
                            className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          <span>
                            <span className="font-medium text-gray-800">
                              {student.name}
                            </span>
                            <span className="ml-1 text-xs text-gray-500">
                              ({student.email})
                            </span>
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                  {formValues.participants.length > 0 && (
                    <p className="mt-2 text-xs text-gray-600">
                      {formValues.participants.length} student
                      {formValues.participants.length !== 1 ? "s" : ""} selected
                    </p>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  className="inline-flex items-center rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed"
                >
                  {submitting
                    ? "Saving..."
                    : editingClass
                      ? "Update class"
                      : "Create class"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      ) : null}

      {cancelTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-lg rounded-2xl bg-white shadow-2xl"
          >
            <form onSubmit={handleCancelSubmit}>
              <div className="border-b border-gray-200 px-6 py-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  Cancel class
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {cancelTarget.title}
                </p>
              </div>
              <div className="space-y-3 px-6 py-5">
                <label className="block text-sm font-medium text-gray-700">
                  Cancellation reason
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(event) => setCancelReason(event.target.value)}
                  rows={4}
                  required
                  minLength={3}
                  maxLength={500}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                {cancelError ? (
                  <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {cancelError}
                  </div>
                ) : null}
              </div>
              <div className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
                <button
                  type="button"
                  onClick={closeCancelModal}
                  disabled={cancelSubmitting}
                  className="inline-flex items-center rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={cancelSubmitting}
                  className="inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-400"
                >
                  {cancelSubmitting ? "Cancelling..." : "Cancel class"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      ) : null}
    </motion.div>
  );
};

export default TeacherClassesTab;
