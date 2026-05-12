import { motion } from "framer-motion";
import { useCallback, useMemo, useState } from "react";
import AcademyDirectory from "../components/academy/AcademyDirectory";
import ProfileTab from "../components/profile/ProfileTab";
import StudentResourcesTab from "../components/student/StudentResourcesTab";
import useStudentDashboardData from "../components/student/useStudentDashboardData";
import useStudentResources from "../components/student/useStudentResources";
import { useAuth } from "../contexts/AuthContext";

const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [text]);
  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copied ? "Copied!" : "Copy link"}
      className="ml-1.5 rounded px-1.5 py-0.5 text-xs text-gray-400 hover:text-emerald-600 border border-gray-200 hover:border-emerald-300 transition-colors"
    >
      {copied ? "✓" : "Copy"}
    </button>
  );
};

const formatDate = (value) => {
  if (!value) return "-";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "-" : parsed.toLocaleString();
};

const StudentDashboard = () => {
  const [activeTab, setActiveTab] = useState("courses");
  const { user, userDetails } = useAuth();
  const {
    loading,
    error,
    classes,
    classesMeta,
    classPage,
    setClassPage,
    teachers,
    metrics,
    upcomingClasses,
    refresh,
    hasAcademyAccess,
    loadingAcademies,
    activeAcademyId,
  } = useStudentDashboardData();
  const {
    resources,
    loading: resourcesLoading,
    error: resourcesError,
    refresh: refreshResources,
  } = useStudentResources(classes, teachers, activeAcademyId);

  const nextClass = useMemo(
    () => upcomingClasses[0] ?? null,
    [upcomingClasses],
  );
  const teacherInsights = useMemo(() => {
    const initial = new Map(
      teachers.map((teacher) => [
        teacher.id,
        {
          upcomingClasses: 0,
          totalClasses: 0,
          platformClasses: teacher.classCount ?? 0,
          resources: 0,
          platformResources: teacher.resourceCount ?? 0,
          nextClass: null,
        },
      ]),
    );

    classes.forEach((cls) => {
      const teacherId = cls.teacherId;
      if (!teacherId || !initial.has(teacherId)) {
        return;
      }
      const insight = initial.get(teacherId);
      const isUpcoming = cls.status === "upcoming";
      insight.totalClasses = Math.max(insight.totalClasses, 0) + 1;
      if (isUpcoming) {
        insight.upcomingClasses += 1;
        if (
          !insight.nextClass ||
          new Date(cls.start).getTime() <
            new Date(insight.nextClass.start).getTime()
        ) {
          insight.nextClass = cls;
        }
      }
    });

    resources.forEach((resource) => {
      if (!resource.uploaderId || !initial.has(resource.uploaderId)) {
        return;
      }
      const insight = initial.get(resource.uploaderId);
      insight.resources += 1;
    });

    return initial;
  }, [classes, resources, teachers]);

  const getTeacherInitials = (teacher) => {
    const source = teacher?.name || teacher?.email || "TE";
    return source
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const isBusy = loading || loadingAcademies;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };

  const cardVariants = {
    hidden: { scale: 0.92, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { type: "spring", stiffness: 160 },
    },
    hover: { scale: 1.02, boxShadow: "0 10px 20px rgba(16, 185, 129, 0.18)" },
  };

  const renderLoading = () => (
    <div className="min-h-[50vh] flex flex-col items-center justify-center text-gray-500">
      <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
      <p>Preparing your learning dashboardâ€¦</p>
    </div>
  );

  const renderError = () => (
    <div className="min-h-[50vh] flex flex-col items-center justify-center text-red-600 space-y-3">
      <p>{error}</p>
      <button
        type="button"
        onClick={refresh}
        className="px-4 py-2 rounded-md bg-red-600 text-white text-sm font-semibold hover:bg-red-700"
      >
        Retry
      </button>
    </div>
  );

  const renderCourses = () => (
    <motion.div
      key="courses"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          whileHover="hover"
          className="bg-white rounded-xl shadow p-6"
        >
          <p className="text-sm text-gray-500">Total Classes</p>
          <p className="text-3xl font-semibold text-emerald-600 mt-2">
            {metrics.totalClasses}
          </p>
        </motion.div>
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          whileHover="hover"
          className="bg-white rounded-xl shadow p-6"
        >
          <p className="text-sm text-gray-500">Upcoming Sessions</p>
          <p className="text-3xl font-semibold text-emerald-600 mt-2">
            {metrics.upcomingCount}
          </p>
        </motion.div>
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          whileHover="hover"
          className="bg-white rounded-xl shadow p-6"
        >
          <p className="text-sm text-gray-500">Teachers Available</p>
          <p className="text-3xl font-semibold text-emerald-600 mt-2">
            {metrics.teacherCount}
          </p>
        </motion.div>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Class Schedule
            </h2>
            <p className="text-sm text-gray-500">
              All platform classes are shown below.
            </p>
          </div>
          <button
            type="button"
            className="hidden sm:inline-flex items-center text-sm font-medium text-emerald-600 hover:text-emerald-700"
            onClick={refresh}
          >
            Refresh
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Class
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Teacher
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Starts
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Join Link
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {classes.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-sm text-gray-500"
                  >
                    No classes are available at the moment.
                  </td>
                </tr>
              ) : (
                classes.map((cls) => (
                  <tr key={cls.id}>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">
                        {cls.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {cls.description || "No description provided."}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {cls.teacher}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {formatDate(cls.start)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${cls.status === "upcoming" ? "bg-emerald-100 text-emerald-800" : cls.status === "ended" ? "bg-gray-200 text-gray-700" : "bg-yellow-100 text-yellow-800"}`}
                      >
                        {cls.status.replace(/\b\w/g, (c) => c.toUpperCase())}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {cls.joinUrl ? (
                        <div className="flex flex-col gap-1">
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <span
                              className="max-w-[200px] truncate"
                              title={cls.joinUrl}
                            >
                              {cls.joinUrl}
                            </span>
                            <CopyButton text={cls.joinUrl} />
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">No link</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {["upcoming", "ongoing"].includes(cls.status) &&
                      cls.joinUrl ? (
                        <a
                          href={cls.joinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2"
                        >
                          {cls.status === "ongoing"
                            ? "Rejoin class"
                            : "Join class"}
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400">
                          {cls.status === "ended"
                            ? "Ended"
                            : cls.status === "cancelled"
                              ? "Cancelled"
                              : "—"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {classesMeta && classesMeta.totalPages > 1 ? (
          <div className="flex items-center justify-between border-t border-gray-200 px-6 py-3">
            <p className="text-xs text-gray-500">
              Page {classesMeta.currentPage} of {classesMeta.totalPages} &mdash;{" "}
              {classesMeta.total} total
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={!classesMeta.previousPage}
                onClick={() => setClassPage((p) => p - 1)}
                className="inline-flex items-center rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:border-emerald-400 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                &laquo; Prev
              </button>
              {Array.from(
                { length: Math.min(classesMeta.totalPages, 7) },
                (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setClassPage(page)}
                      className={`inline-flex items-center rounded-md border px-3 py-1.5 text-xs font-medium ${
                        classesMeta.currentPage === page
                          ? "border-emerald-500 bg-emerald-600 text-white"
                          : "border-gray-300 text-gray-600 hover:border-emerald-400 hover:text-emerald-600"
                      }`}
                    >
                      {page}
                    </button>
                  );
                },
              )}
              <button
                type="button"
                disabled={!classesMeta.nextPage}
                onClick={() => setClassPage((p) => p + 1)}
                className="inline-flex items-center rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:border-emerald-400 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next &raquo;
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </motion.div>
  );

  const renderTeachers = () => (
    <motion.div
      key="teachers"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white rounded-xl shadow overflow-hidden"
    >
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">
            Teaching Staff
          </h2>
          <p className="text-sm text-gray-500">
            Approved teachers connected to your academy and classes.
          </p>
        </div>
        <span className="hidden sm:inline-flex text-sm text-gray-500">
          {metrics.teacherCount} teachers
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Teacher
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Academy
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Classes
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Resources
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {teachers.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-8 text-center text-sm text-gray-500"
                >
                  No teachers are available right now.
                </td>
              </tr>
            ) : (
              teachers.map((teacher) => {
                const insight = teacherInsights.get(teacher.id) ?? {
                  upcomingClasses: 0,
                  totalClasses: 0,
                  platformClasses: teacher.classCount ?? 0,
                  resources: 0,
                  platformResources: teacher.resourceCount ?? 0,
                  nextClass: null,
                };
                const visibleClassCount = Math.max(
                  insight.totalClasses,
                  insight.platformClasses ?? 0,
                );
                const resourceCount = Math.max(
                  insight.resources,
                  insight.platformResources ?? 0,
                );
                return (
                  <tr key={teacher.id}>
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700">
                          {teacher.avatarUrl ? (
                            <img
                              src={teacher.avatarUrl}
                              alt={`${teacher.name} avatar`}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            getTeacherInitials(teacher)
                          )}
                        </div>
                        <div className="max-w-sm">
                          <p className="text-sm font-medium text-gray-900">
                            {teacher.name}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {teacher.email}
                          </p>
                          {teacher.bio ? (
                            <p className="mt-2 line-clamp-2 text-xs text-gray-500">
                              {teacher.bio}
                            </p>
                          ) : null}
                          <p className="mt-2 text-xs text-gray-400">
                            Joined {teacher.joined}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {teacher.academies?.length
                        ? teacher.academies.join(", ")
                        : "Assigned academy"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      <p className="font-medium text-gray-900">
                        {visibleClassCount} visible
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {insight.upcomingClasses} upcoming
                      </p>
                      {insight.nextClass ? (
                        <p className="mt-1 text-xs text-emerald-700">
                          Next: {insight.nextClass.title}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {resourceCount} available
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-emerald-100 text-emerald-800">
                        {teacher.status}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );

  const renderPlaceholder = (title, description) => (
    <motion.div
      key={title}
      className="bg-white rounded-xl shadow p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <h2 className="text-xl font-semibold text-gray-800 mb-2">{title}</h2>
      <p className="text-gray-600">{description}</p>
    </motion.div>
  );

  return (
    <div className="w-full max-w-none px-4 py-8 space-y-6 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div
              className={`flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-emerald-200 shadow-inner ${(user?.profilePhotoUrl ?? userDetails?.profilePhotoUrl) ? "bg-white" : "bg-gradient-to-br from-emerald-500 to-emerald-600"}`}
            >
              {(user?.profilePhotoUrl ?? userDetails?.profilePhotoUrl) ? (
                <img
                  src={user?.profilePhotoUrl ?? userDetails?.profilePhotoUrl}
                  alt="Your avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-base font-semibold uppercase tracking-widest text-white">
                  {[user?.firstName, user?.lastName]
                    .filter(Boolean)
                    .map((part) => (part ? part.charAt(0) : ""))
                    .join("")
                    .slice(0, 2)
                    .toUpperCase() ||
                    (user?.email ?? "YOU").slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-emerald-700">
                Student Dashboard
              </h1>
              <p className="text-gray-600">
                Hello{user?.firstName ? `, ${user.firstName}` : ""}! Here's
                what's happening in your classes.
              </p>
            </div>
          </div>
        </div>
        {nextClass && (
          <div className="max-w-xl rounded-lg border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-900">
            <span className="font-semibold">Next class:</span> {nextClass.title}{" "}
            with {nextClass.teacher} - {formatDate(nextClass.start)}
          </div>
        )}
      </motion.div>

      {!hasAcademyAccess && !loadingAcademies ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-medium">
            You're not currently enrolled in an academy.
          </p>
          <p className="mt-1">
            Browse the academy directory to request access and unlock your
            classes and resources.
          </p>
        </div>
      ) : null}

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: "courses", label: "My Classes" },
            { key: "teachers", label: "Teachers" },
            { key: "resources", label: "Resources" },
            { key: "academies", label: "Academies" },
            { key: "profile", label: "My Profile" },
          ].map((tab) => (
            <motion.button
              key={tab.key}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? "border-emerald-500 text-emerald-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
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

      {!isBusy && !error && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {activeTab === "courses" && renderCourses()}
          {activeTab === "teachers" && renderTeachers()}
          {activeTab === "resources" && (
            <StudentResourcesTab
              resources={resources}
              loading={resourcesLoading}
              error={resourcesError}
              onRefresh={refreshResources}
              classes={classes}
              hasAcademyAccess={hasAcademyAccess}
              loadingAcademies={loadingAcademies}
            />
          )}
          {activeTab === "academies" && <AcademyDirectory />}
          {activeTab === "profile" ? (
            <ProfileTab
              title="My Profile"
              subtitle="Express your learning style, keep details updated, and sparkle across the platform."
            />
          ) : null}
        </motion.div>
      )}
    </div>
  );
};

export default StudentDashboard;
