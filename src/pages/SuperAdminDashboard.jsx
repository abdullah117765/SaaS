import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import SuperAdminLayout from "../components/super-admin/SuperAdminLayout";
import { useAuth } from "../contexts/AuthContext";
import apiRequest from "../utils/apiClient";

const numberFormatter = new Intl.NumberFormat("en-US");
const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const cardVariants = {
  hidden: { scale: 0.95, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { type: "spring", stiffness: 100, damping: 18 },
  },
  hover: {
    scale: 1.02,
    boxShadow: "0 12px 20px rgba(18, 105, 63, 0.12)",
    transition: { type: "spring", stiffness: 320, damping: 16 },
  },
};

const LoadingState = () => (
  <div className="flex items-center justify-center py-20">
    <div className="flex items-center space-x-3 text-green-600">
      <div className="h-3 w-3 rounded-full bg-green-500 animate-bounce" />
      <div className="h-3 w-3 rounded-full bg-green-500 animate-bounce delay-75" />
      <div className="h-3 w-3 rounded-full bg-green-500 animate-bounce delay-150" />
      <span className="text-sm font-medium text-gray-600">
        Loading live metrics…
      </span>
    </div>
  </div>
);

const ErrorState = ({ message }) => (
  <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
    {message ??
      "Unable to load dashboard information. Please refresh to try again."}
  </div>
);

const formatDateTime = (value) => {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch (error) {
    return value;
  }
};

const formatDate = (value) => {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString();
  } catch (error) {
    return value;
  }
};

const buildDisplayName = (firstName, lastName, email) => {
  const parts = [firstName, lastName]
    .map((part) => (part ?? "").trim())
    .filter(Boolean);
  if (parts.length > 0) {
    return parts.join(" ");
  }
  return email ?? "Unknown";
};

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const { userDetails } = useAuth();
  const [overview, setOverview] = useState(null);
  const [academyPreview, setAcademyPreview] = useState({
    data: [],
    summary: null,
    meta: null,
  });
  const [paymentsPreview, setPaymentsPreview] = useState({
    data: [],
    summary: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams({
          page: "1",
          limit: "5",
        }).toString();

        const [overviewResponse, academiesResponse, paymentsResponse] =
          await Promise.all([
            apiRequest("/dashboard/overview"),
            apiRequest(`/academies/admin?${queryParams}`),
            apiRequest(`/payments?${queryParams}`),
          ]);

        if (!isMounted) {
          return;
        }

        setOverview(overviewResponse);
        setAcademyPreview({
          data: academiesResponse?.data ?? [],
          summary: academiesResponse?.summary ?? null,
          meta: academiesResponse?.meta ?? null,
        });
        setPaymentsPreview({
          data: paymentsResponse?.data ?? [],
          summary: paymentsResponse?.summary ?? null,
        });
        setError(null);
      } catch (err) {
        console.error("Failed to load super admin dashboard", err);
        if (isMounted) {
          setError(err?.message ?? "Failed to load dashboard data.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const stats = useMemo(() => {
    const academiesTotal = academyPreview.meta?.total ?? 0;
    const academiesPending = academyPreview.summary?.pending ?? 0;
    const teachersApproved = overview?.totals?.teachers?.approved ?? 0;
    const teachersPending = overview?.totals?.teachers?.pending ?? 0;
    const studentsApproved = overview?.totals?.students?.approved ?? 0;
    const studentsPending = overview?.totals?.students?.pending ?? 0;
    const upcomingClasses = overview?.totals?.classes?.upcoming ?? 0;
    const ongoingClasses = overview?.totals?.classes?.ongoing ?? 0;

    return [
      {
        key: "academies",
        title: "Academies",
        value: numberFormatter.format(academiesTotal),
        hint: `${numberFormatter.format(academiesPending)} pending approval`,
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-10 w-10 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 6.253l8 4.5-8 4.5-8-4.5 8-4.5z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 12.753l8 4.5 8-4.5"
            />
          </svg>
        ),
      },
      {
        key: "teachers",
        title: "Approved Teachers",
        value: numberFormatter.format(teachersApproved),
        hint: `${numberFormatter.format(teachersPending)} awaiting review`,
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-10 w-10 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 11c1.657 0 3-1.567 3-3.5S13.657 4 12 4s-3 1.567-3 3.5 1.343 3.5 3 3.5z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M6.5 20a5.5 5.5 0 0111 0"
            />
          </svg>
        ),
      },
      {
        key: "students",
        title: "Students",
        value: numberFormatter.format(studentsApproved),
        hint: `${numberFormatter.format(studentsPending)} pending onboarding`,
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-10 w-10 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M6 20v-1a6 6 0 0112 0v1"
            />
          </svg>
        ),
      },
      {
        key: "classes",
        title: "Upcoming Classes",
        value: numberFormatter.format(upcomingClasses),
        hint: `${numberFormatter.format(ongoingClasses)} live right now`,
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-10 w-10 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 8v4l3 1"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 6a9 9 0 110 18 9 9 0 010-18z"
            />
          </svg>
        ),
      },
    ];
  }, [academyPreview, overview]);

  const quickActions = useMemo(
    () => [
      {
        label: "Academy Management",
        description: "Track approvals, health, and usage",
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3 13.5l9-9 9 9M4.5 12H19.5V21H4.5z"
            />
          </svg>
        ),
        action: () => navigate("/super-admin/academies"),
      },
      {
        label: "Manage Users",
        description: "Approve, suspend, or invite platform users",
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M17 20v-2a3 3 0 00-3-3H6a3 3 0 00-3 3v2"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 11a4 4 0 100-8 4 4 0 000 8z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M21 21v-2a3 3 0 00-2-2.828"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M16 3.13a4 4 0 010 7.75"
            />
          </svg>
        ),
        action: () => navigate("/super-admin/users"),
      },
      {
        label: "Platform Settings",
        description: "Configure onboarding and operational controls",
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066 1.724 1.724 0 012.37 2.37 1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573 1.724 1.724 0 01-2.37 2.37 1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066 1.724 1.724 0 01-2.37-2.37 1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573 1.724 1.724 0 012.37-2.37 1.724 1.724 0 002.573-1.066z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        ),
        action: () => navigate("/super-admin/platform-settings"),
      },
      {
        label: "Reports & Billing",
        description: "Monitor revenue, payments, and credit usage",
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 17v-2m3 2v-4m3 4v-6M5 21h14a2 2 0 002-2V7a2 2 0 00-.586-1.414l-4-4A2 2 0 0014 1H5a2 2 0 00-2 2v16a2 2 0 002 2z"
            />
          </svg>
        ),
        action: () => navigate("/super-admin/reports"),
      },
      {
        label: "Contact Inbox",
        description: "Review and resolve website contact submissions",
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        ),
        action: () => navigate("/super-admin/contact-messages"),
      },
    ],
    [navigate],
  );

  const upcomingClasses = overview?.upcomingClasses ?? [];
  const recentActivity = overview?.recentActivity ?? [];
  const zoomCredits = overview?.zoomCredits;
  const subscription = overview?.subscription;

  return (
    <SuperAdminLayout>
      <div className="py-8">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-green-800">
            Super Admin Dashboard
          </h1>
          <p className="mt-2 text-gray-600">
            {userDetails
              ? `Welcome back, ${userDetails.name}.`
              : "Manage the platform with live health metrics."}
          </p>
        </motion.div>

        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} />
        ) : (
          <>
            <motion.div
              className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4 mb-8"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {stats.map((stat) => (
                <motion.div
                  key={stat.key}
                  className="bg-white rounded-lg border border-green-100 p-6 shadow-sm"
                  variants={cardVariants}
                  whileHover="hover"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        {stat.title}
                      </p>
                      <p className="mt-2 text-3xl font-bold text-green-700">
                        {stat.value}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">{stat.hint}</p>
                    </div>
                    <div className="rounded-full bg-green-50 p-3">
                      {stat.icon}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-8">
              <motion.div
                className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-100"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">
                      Academy Management
                    </h2>
                    <p className="text-sm text-gray-500">
                      {academyPreview.meta?.total
                        ? `${numberFormatter.format(academyPreview.meta.total)} academies on the platform`
                        : "Live academy enrolments"}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
                    onClick={() => navigate("/super-admin/academies")}
                  >
                    View All
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
                        >
                          Academy Owner
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
                        >
                          Email
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
                        >
                          Status
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
                        >
                          Joined
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {academyPreview.data.length === 0 ? (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-6 py-6 text-center text-sm text-gray-500"
                          >
                            No academies found yet.
                          </td>
                        </tr>
                      ) : (
                        academyPreview.data.map((academy) => (
                          <tr key={academy.id}>
                            <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                              {buildDisplayName(
                                academy.owner?.firstName,
                                academy.owner?.lastName,
                                academy.owner?.email,
                              )}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                              {academy.owner?.email ?? "—"}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm">
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                  academy.status === "APPROVED"
                                    ? "bg-green-100 text-green-700"
                                    : academy.status === "PENDING"
                                      ? "bg-yellow-100 text-yellow-700"
                                      : "bg-red-100 text-red-700"
                                }`}
                              >
                                {academy.status}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                              {formatDate(academy.createdAt)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>

              <motion.div
                className="bg-white rounded-lg shadow-sm border border-gray-100"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <div className="border-b border-gray-100 px-6 py-4">
                  <h2 className="text-lg font-semibold text-gray-800">
                    Quick Actions
                  </h2>
                  <p className="text-sm text-gray-500">
                    Jump straight into the most common workflows
                  </p>
                </div>
                <div className="space-y-3 px-4 py-4">
                  {quickActions.map((item) => (
                    <motion.button
                      key={item.label}
                      type="button"
                      className="w-full rounded-lg border border-gray-100 bg-green-50 px-4 py-3 text-left shadow-sm transition-colors hover:bg-green-100"
                      onClick={item.action}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-start space-x-3">
                          <span className="mt-1">{item.icon}</span>
                          <div>
                            <p className="font-semibold text-green-700">
                              {item.label}
                            </p>
                            <p className="text-sm text-gray-600">
                              {item.description}
                            </p>
                          </div>
                        </div>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 text-green-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-8">
              <motion.div
                className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-100"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="border-b border-gray-100 px-6 py-4">
                  <h2 className="text-lg font-semibold text-gray-800">
                    Upcoming Classes
                  </h2>
                  <p className="text-sm text-gray-500">
                    Next five sessions scheduled by your academies
                  </p>
                </div>
                <div className="divide-y divide-gray-100">
                  {upcomingClasses.length === 0 ? (
                    <div className="px-6 py-10 text-center text-sm text-gray-500">
                      No upcoming classes scheduled.
                    </div>
                  ) : (
                    upcomingClasses.map((cls) => (
                      <div key={cls.id} className="px-6 py-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-base font-semibold text-gray-800">
                              {cls.title}
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                              <span className="inline-flex items-center">
                                <svg
                                  className="mr-1 h-4 w-4 text-green-500"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M8 7V3m8 4V3m-9 4h10a2 2 0 012 2v9a2 2 0 01-2 2H7a2 2 0 01-2-2v-9a2 2 0 012-2z"
                                  />
                                </svg>
                                {formatDateTime(cls.scheduledStart)}
                              </span>
                              {cls.teacher ? (
                                <span>• {cls.teacher.name}</span>
                              ) : null}
                              <span>
                                • {cls.participantsCount} participants
                              </span>
                            </div>
                          </div>
                          <span className="inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-semibold uppercase text-green-700">
                            {cls.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>

              <motion.div
                className="bg-white rounded-lg shadow-sm border border-gray-100"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 }}
              >
                <div className="border-b border-gray-100 px-6 py-4">
                  <h2 className="text-lg font-semibold text-gray-800">
                    Zoom Credits
                  </h2>
                  <p className="text-sm text-gray-500">
                    Balance and most recent credit activity
                  </p>
                </div>
                {zoomCredits ? (
                  <div className="px-6 py-5 space-y-4">
                    <div>
                      <p className="text-xs uppercase text-gray-400">Balance</p>
                      <p className="mt-1 text-3xl font-semibold text-green-700">
                        {numberFormatter.format(zoomCredits.balance)}
                      </p>
                      <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                        <span>
                          {numberFormatter.format(zoomCredits.totalCredited)}{" "}
                          credited
                        </span>
                        <span>•</span>
                        <span>
                          {numberFormatter.format(zoomCredits.totalDebited)}{" "}
                          debited
                        </span>
                      </div>
                    </div>
                    <div className="rounded-md bg-gray-50 p-3">
                      <p className="text-xs font-semibold uppercase text-gray-500">
                        Recent activity
                      </p>
                      <div className="mt-2 space-y-2">
                        {zoomCredits.recentTransactions.length === 0 ? (
                          <p className="text-xs text-gray-500">
                            No transactions recorded.
                          </p>
                        ) : (
                          zoomCredits.recentTransactions.map((tx) => (
                            <div
                              key={tx.id}
                              className="rounded-md bg-white px-3 py-2 shadow-sm"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-800">
                                  {tx.summary}
                                </span>
                                <span className="text-xs font-semibold text-green-600">
                                  {tx.type}
                                </span>
                              </div>
                              <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
                                <span>{formatDateTime(tx.timestamp)}</span>
                                <span>
                                  {numberFormatter.format(tx.amount)} credits
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="px-6 py-6 text-sm text-gray-500">
                    Zoom credit data unavailable.
                  </div>
                )}
              </motion.div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <motion.div
                className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-100"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.14 }}
              >
                <div className="border-b border-gray-100 px-6 py-4">
                  <h2 className="text-lg font-semibold text-gray-800">
                    Latest Payments
                  </h2>
                  <p className="text-sm text-gray-500">
                    {paymentsPreview.summary
                      ? `${currencyFormatter.format(paymentsPreview.summary.totalAmount)} processed across ${numberFormatter.format(
                          paymentsPreview.summary.totalCount,
                        )} payments`
                      : "Recent billing activity across the platform"}
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Reference
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {paymentsPreview.data.length === 0 ? (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-6 py-6 text-center text-sm text-gray-500"
                          >
                            No payments recorded yet.
                          </td>
                        </tr>
                      ) : (
                        paymentsPreview.data.map((payment) => (
                          <tr key={payment.id}>
                            <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                              {payment.reference ?? "Manual entry"}
                              <p className="text-xs text-gray-500">
                                {payment.userName ?? payment.userId}
                              </p>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm">
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                  payment.status === "COMPLETED"
                                    ? "bg-green-100 text-green-700"
                                    : payment.status === "PENDING"
                                      ? "bg-yellow-100 text-yellow-700"
                                      : payment.status === "FAILED"
                                        ? "bg-red-100 text-red-700"
                                        : "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {payment.status}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                              {currencyFormatter.format(payment.amount)}{" "}
                              {payment.currency}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                              {formatDateTime(payment.createdAt)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>

              <motion.div
                className="bg-white rounded-lg shadow-sm border border-gray-100"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.16 }}
              >
                <div className="border-b border-gray-100 px-6 py-4">
                  <h2 className="text-lg font-semibold text-gray-800">
                    Recent Activity
                  </h2>
                  <p className="text-sm text-gray-500">
                    System-wide approvals, classes, and credit events
                  </p>
                </div>
                <div className="max-h-96 overflow-y-auto px-6 py-5 space-y-4">
                  {recentActivity.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      No activity recorded.
                    </p>
                  ) : (
                    recentActivity.map((entry) => (
                      <div key={entry.id} className="relative pl-6">
                        <span className="absolute left-0 top-2 block h-3 w-3 rounded-full bg-green-500" />
                        <p className="text-sm font-medium text-gray-800">
                          {entry.message}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDateTime(entry.timestamp)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
                {subscription ? (
                  <div className="border-t border-gray-100 px-6 py-5">
                    <p className="text-sm font-semibold text-gray-800">
                      Subscription Plan
                    </p>
                    <p className="text-sm text-gray-600">{subscription.plan}</p>
                    <div className="mt-3 grid grid-cols-3 gap-3">
                      <div className="rounded-md bg-gray-50 p-3 text-center">
                        <p className="text-xs uppercase text-gray-400">
                          Teacher usage
                        </p>
                        <p className="text-sm font-semibold text-gray-800">
                          {numberFormatter.format(subscription.usage.teachers)}/
                          {numberFormatter.format(subscription.limits.teachers)}
                        </p>
                      </div>
                      <div className="rounded-md bg-gray-50 p-3 text-center">
                        <p className="text-xs uppercase text-gray-400">
                          Student usage
                        </p>
                        <p className="text-sm font-semibold text-gray-800">
                          {numberFormatter.format(subscription.usage.students)}/
                          {numberFormatter.format(subscription.limits.students)}
                        </p>
                      </div>
                      <div className="rounded-md bg-gray-50 p-3 text-center">
                        <p className="text-xs uppercase text-gray-400">
                          Storage
                        </p>
                        <p className="text-sm font-semibold text-gray-800">
                          {numberFormatter.format(subscription.usage.storageGb)}{" "}
                          GB
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}
              </motion.div>
            </div>
          </>
        )}
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminDashboard;
