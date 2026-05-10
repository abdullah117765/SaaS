import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import useTeacherDashboardData from "../components/teacher/useTeacherDashboardData";
import TeacherClassesTab from "../components/teacher/TeacherClassesTab";
import TeacherCreditUsageChart from "../components/teacher/TeacherCreditUsageChart";
import TeacherResourcesTab from "../components/teacher/TeacherResourcesTab";
import TeacherAcademiesTab from "../components/teacher/TeacherAcademiesTab";
import useTeacherResources from "../components/teacher/useTeacherResources";
import ProfileTab from "../components/profile/ProfileTab";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const STUDENT_STATUS_OPTIONS = [
  { value: "APPROVED", label: "Approved" },
  { value: "PENDING", label: "Pending" },
  { value: "REJECTED", label: "Rejected" },
];

const STUDENT_STATUS_BADGES = {
  APPROVED: "bg-emerald-100 text-emerald-700",
  PENDING: "bg-amber-100 text-amber-700",
  REJECTED: "bg-rose-100 text-rose-700",
};

const formatStatusLabel = (status) =>
  status ? status.charAt(0) + status.slice(1).toLowerCase() : "Not set";

const TeacherDashboard = () => {
  const {
    user,
    userDetails,
    pendingAcademyRequests,
    fetchAcademies,
    requestAcademyMembership,
    withdrawAcademyMembership,
    academyLimits,
  } = useAuth();
  const [activeTab, setActiveTab] = useState("classes");
  const {
    loading,
    loadingAcademies,
    error,
    classes,
    classesMeta,
    students,
    studentsMeta,
    studentsSummary,
    studentFilters,
    filters,
    setFilters: updateFilters,
    setStudentFilters: updateStudentFilters,
    resetStudentFilters,
    metrics,
    refresh,
    createClass,
    updateClass,
    deleteClass,
    academyOptions,
    activeAcademyId,
    setActiveAcademyId,
    academyMemberships,
    hasAcademyAccess,
  } = useTeacherDashboardData();
  const {
    resources,
    loading: resourcesLoading,
    error: resourcesError,
    refresh: refreshResources,
    createResource,
    updateResource,
    deleteResource,
  } = useTeacherResources(classes, activeAcademyId);

  const upcomingClass = useMemo(() => {
    if (!classes.length) return null;
    const upcoming = classes
      .filter((cls) => cls.status === "upcoming")
      .sort((a, b) => new Date(a.scheduledStart) - new Date(b.scheduledStart));
    return upcoming[0] ?? classes[0];
  }, [classes]);

  const [studentFiltersDraft, setStudentFiltersDraft] = useState(studentFilters);

  useEffect(() => {
    setStudentFiltersDraft(studentFilters);
  }, [studentFilters]);

  const studentFiltersChanged = useMemo(
    () =>
      studentFiltersDraft.search !== studentFilters.search ||
      studentFiltersDraft.status !== studentFilters.status ||
      studentFiltersDraft.academyId !== studentFilters.academyId,
    [studentFiltersDraft, studentFilters],
  );

  const academyFilterOptions = useMemo(() => {
    const uniqueAcademies = [];
    const seen = new Set();
    (academyOptions ?? []).forEach((option) => {
      if (option?.value && !seen.has(option.value)) {
        seen.add(option.value);
        uniqueAcademies.push({ value: option.value, label: option.label });
      }
    });
    return [
      { value: "active", label: "Active academy", disabled: !activeAcademyId },
      { value: "all", label: "All academies" },
      ...uniqueAcademies,
    ];
  }, [academyOptions, activeAcademyId]);

  const avatarUrl = (user?.profilePhotoUrl ?? userDetails?.profilePhotoUrl) ?? null;
  const avatarInitials = useMemo(() => {
    const parts = [user?.firstName, user?.lastName].filter(Boolean);
    if (parts.length > 0) {
      return parts
        .map((part) => (part ? part.charAt(0) : ''))
        .join('')
        .slice(0, 2)
        .toUpperCase();
    }
    const fallback = user?.email ?? 'You';
    return fallback.slice(0, 2).toUpperCase();
  }, [user?.email, user?.firstName, user?.lastName]);

  const isBusy = loading || loadingAcademies;

  const handleStudentFilterChange = (event) => {
    const { name, value } = event.target;
    setStudentFiltersDraft((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const applyStudentFilters = () => {
    updateStudentFilters({
      search: studentFiltersDraft.search ?? "",
      status: studentFiltersDraft.status,
      academyId: studentFiltersDraft.academyId,
    });
  };

  const resetStudentFiltersHandler = () => {
    resetStudentFilters();
  };

  const handleStudentSearchKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      applyStudentFilters();
    }
  };

  const renderLoading = () => (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-gray-500">
      <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      <p>Loading your dashboard.</p>
    </div>
  );

  const renderError = () => (
    <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-3 text-red-600">
      <p>{error}</p>
      <button
        type="button"
        onClick={refresh}
        className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
      >
        Retry
      </button>
    </div>
  );

  const renderStudents = () => (
    <motion.div
      key="students"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-xl bg-white shadow"
    >
      <div className="flex flex-col gap-4 border-b border-gray-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Students</h2>
          <p className="text-sm text-gray-500">
            Refine by academy or status to quickly find the learners you need.
          </p>
          {studentsSummary ? (
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 font-medium text-emerald-700">
                Approved {studentsSummary.approved ?? 0}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 font-medium text-amber-700">
                Pending {studentsSummary.pending ?? 0}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-1 font-medium text-rose-700">
                Rejected {studentsSummary.rejected ?? 0}
              </span>
            </div>
          ) : null}
        </div>
        <div className="text-sm text-gray-500">
          {(studentsMeta?.total ?? metrics.studentCount ?? students.length) || 0} total
        </div>
      </div>
      <div className="border-b border-gray-100 px-6 py-4">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="md:col-span-2">
            <label
              htmlFor="student-search"
              className="block text-xs font-semibold uppercase tracking-wide text-gray-600"
            >
              Search students
            </label>
            <input
              id="student-search"
              name="search"
              value={studentFiltersDraft.search}
              onChange={handleStudentFilterChange}
              onKeyDown={handleStudentSearchKeyDown}
              placeholder="Search by name or email"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label
              htmlFor="student-status"
              className="block text-xs font-semibold uppercase tracking-wide text-gray-600"
            >
              Status
            </label>
            <select
              id="student-status"
              name="status"
              value={studentFiltersDraft.status}
              onChange={handleStudentFilterChange}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {STUDENT_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="student-academy"
              className="block text-xs font-semibold uppercase tracking-wide text-gray-600"
            >
              Academy
            </label>
            <select
              id="student-academy"
              name="academyId"
              value={studentFiltersDraft.academyId}
              onChange={handleStudentFilterChange}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {academyFilterOptions.map((option) => (
                <option key={option.value} value={option.value} disabled={option.disabled}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={applyStudentFilters}
            disabled={!studentFiltersChanged}
            className="inline-flex items-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
          >
            Apply filters
          </button>
          <button
            type="button"
            onClick={resetStudentFiltersHandler}
            className="inline-flex items-center rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-600 transition hover:bg-gray-100"
          >
            Reset
          </button>
          <span className="text-xs text-gray-500">
            Showing {students.length} of {studentsMeta?.total ?? students.length} students
          </span>
        </div>
      </div>
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
                Academies
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Joined
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {students.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-8 text-center text-sm text-gray-500"
                >
                  No students match your filters yet.
                </td>
              </tr>
            ) : (
              students.map((student) => (
                <tr key={student.id}>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-900">
                      {student.name}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {student.email}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {student.academies?.length
                      ? student.academies.join(", ")
                      : "-"}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        STUDENT_STATUS_BADGES[student.status] ?? "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {formatStatusLabel(student.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {student.joined}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );

  const renderPlaceholder = (title, message) => (
    <motion.div
      className="rounded-xl bg-white p-6 shadow"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <h2 className="mb-4 text-xl font-semibold text-gray-800">{title}</h2>
      <p className="text-gray-600">{message}</p>
    </motion.div>
  );

  return (
    <div className="container mx-auto space-y-6 px-4 py-8">
      <motion.div
        className="space-y-4"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div
              className={`flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-emerald-200 shadow-inner ${avatarUrl ? 'bg-white' : 'bg-gradient-to-br from-emerald-500 to-emerald-600'}`}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Your avatar" className="h-full w-full object-cover" />
              ) : (
                <span className="text-base font-semibold uppercase tracking-widest text-white">{avatarInitials}</span>
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-emerald-700">Teacher Dashboard</h1>
              <p className="text-gray-600">Welcome back{user?.firstName ? `, ${user.firstName}` : ''}! Stay on top of your classes and students.</p>
            </div>
          </div>
        </div>
        {upcomingClass ? (
          <div className="max-w-xl rounded-lg border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-900">
            <span className="font-semibold">Next session:</span> {upcomingClass.title} - {upcomingClass.start}
          </div>
        ) : null}
      </motion.div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: "classes", label: "My Classes" },
            { key: "students", label: "Students" },
            { key: "resources", label: "Resources" },
            { key: "academies", label: "Academies" },
            { key: "profile", label: "My Profile" },
          ].map((tab) => (
            <motion.button
              key={tab.key}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`py-4 px-1 text-sm font-medium ${
                activeTab === tab.key
                  ? "border-b-2 border-emerald-500 text-emerald-600"
                  : "border-b-2 border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </motion.button>
          ))}
        </nav>
      </div>

      {isBusy && renderLoading()}
      {!isBusy && error && renderError()}

      {!loading && !loadingAcademies && !hasAcademyAccess ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-medium">You are not currently associated with an academy.</p>
          <p className="mt-1 text-amber-800">Join an academy from the directory to schedule classes and upload resources.</p>
        </div>
      ) : null}

      {!isBusy && !error && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {activeTab === "classes" ? (
            <div className="space-y-6">
              <TeacherCreditUsageChart days={14} />
              <TeacherClassesTab
                classes={classes}
                students={students}
                filters={filters}
                onUpdateFilters={updateFilters}
                onCreateClass={createClass}
                onUpdateClass={updateClass}
                onDeleteClass={deleteClass}
                loading={loading}
                meta={classesMeta}
                onRefresh={refresh}
                metrics={metrics}
                academyOptions={academyOptions}
                activeAcademyId={activeAcademyId}
                onSelectAcademy={setActiveAcademyId}
                hasAcademyAccess={hasAcademyAccess}
                loadingAcademies={loadingAcademies}
              />
            </div>
          ) : null}
          {activeTab === "resources" ? (
            <TeacherResourcesTab
              resources={resources}
              loading={resourcesLoading}
              error={resourcesError}
              onRefresh={refreshResources}
              onCreate={createResource}
              onUpdate={updateResource}
              onDelete={deleteResource}
              classes={classes}
              hasAcademyAccess={hasAcademyAccess}
              loadingAcademies={loadingAcademies}
            />
          ) : null}
          {activeTab === "academies" ? (
            <TeacherAcademiesTab
              memberships={academyMemberships}
              pendingRequests={pendingAcademyRequests}
              activeAcademyId={activeAcademyId}
              onSelectAcademy={setActiveAcademyId}
              fetchDirectory={fetchAcademies}
              onJoinAcademy={requestAcademyMembership}
              onWithdrawMembership={withdrawAcademyMembership}
              academyLimits={academyLimits}
              loading={loadingAcademies}
            />
          ) : null}
          {activeTab === "students" ? renderStudents() : null}
          {activeTab === "profile" ? (
            <ProfileTab
              title="My Profile"
              subtitle="Share your teaching style, update contact details, and keep learners in the loop."
            />
          ) : null}
        </motion.div>
      )}
    </div>
  );
};

export default TeacherDashboard;


