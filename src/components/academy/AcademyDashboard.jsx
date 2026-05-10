import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";

// Import custom hooks
import useAcademyData from "./useAcademyData";
import useAcademySettings from "./useAcademySettings";
import useWindowSize from "./useWindowSize";

// Import components
import DashboardHeader from "./DashboardHeader";
import Sidebar from "./Sidebar";
import TabContent from "./TabContent";

// Import animation variants
import { contentVariants } from "./animationVariants";
import OwnerOnboardingGate from "./OwnerOnboardingGate";

const AcademyDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [activeSubTab, setActiveSubTab] = useState("upcoming");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [requestedUsersTab, setRequestedUsersTab] = useState("teachers");
  const { isMobile } = useWindowSize();

  useEffect(() => {
    setSidebarCollapsed(isMobile);
  }, [isMobile]);

  const navigateToTab = (tab, options = {}) => {
    if (typeof tab === "string") {
      setActiveTab(tab);
    }

    if (options?.subTab) {
      if (tab === "classes") {
        setActiveSubTab(options.subTab);
      }
      if (tab === "users") {
        setRequestedUsersTab(options.subTab);
      }
    }
  };

  const { userRole, ownerAcademyStatus } = useAuth();
  const shouldShowOnboardingGate =
    userRole === "academy_owner" && ownerAcademyStatus !== "approved";

  const {
    loading: dashboardLoading,
    error: dashboardError,
    refresh,
    academyData,
    zoomCredits,
    classes,
    classesMeta,
    classesSummary,
    classesFilters,
    classesLoading,
    loadClasses,
    resources,
    resourcesLoading,
    notifications,
    unreadNotifications,
    pendingUsers,
    teachers,
    students,
    teachersSummary,
    studentsSummary,
    payments,
    paymentsLoading,
    subscriptionUsage,
    approvePendingUser,
    rejectPendingUser,
    revokeMembership,
    purchaseCredits,
    uploadResource,
    updateResource,
    deleteResource,
    refreshResources,
    setNotifications,
    setUnreadNotifications,
  } = useAcademyData();

  const {
    settings: academySettings,
    loading: academySettingsLoading,
    saving: academySettingsSaving,
    error: academySettingsError,
    refresh: refreshAcademySettings,
    update: updateAcademySettings,
  } = useAcademySettings();

  if (shouldShowOnboardingGate) {
    return <OwnerOnboardingGate />;
  }

  const getContentVariant = () => {
    if (isMobile) {
      return "full";
    }
    return sidebarCollapsed ? "mini" : "open";
  };

  if (dashboardLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">
            Loading academy dashboard...
          </p>
        </div>
      </div>
    );
  }

  const teacherCount = teachersSummary?.approved ?? teachers.length;
  const studentCount = studentsSummary?.approved ?? students.length;

  return (
    <div className="relative min-h-screen bg-gray-50">
      <Sidebar
        academyData={academyData}
        activeTab={activeTab}
        setActiveTab={(tab) => navigateToTab(tab)}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        isMobile={isMobile}
        unreadNotifications={unreadNotifications}
      />

      <motion.main
        className="min-h-screen px-4 pb-10 pt-6 transition-all duration-300 overflow-x-hidden sm:px-6 lg:px-8"
        variants={contentVariants}
        animate={getContentVariant()}
        initial={isMobile ? "full" : "open"}
      >
        <DashboardHeader academyData={academyData} />

        {dashboardError && (
          <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span>{dashboardError}</span>
              <button
                type="button"
                className="inline-flex items-center gap-1 text-red-700 underline underline-offset-2 hover:text-red-800"
                onClick={refresh}
              >
                Retry
              </button>
            </div>
          </div>
        )}

        <TabContent
          activeTab={activeTab}
          academyId={academyData?.id}
          teacherCount={teacherCount}
          studentCount={studentCount}
          classes={classes}
          classesMeta={classesMeta}
          classesSummary={classesSummary}
          classesFilters={classesFilters}
          classesLoading={classesLoading}
          onLoadClasses={loadClasses}
          zoomCredits={zoomCredits}
          subscriptionUsage={subscriptionUsage}
          teachers={teachers}
          students={students}
          teachersSummary={teachersSummary}
          studentsSummary={studentsSummary}
          pendingUsers={pendingUsers}
          onApproveUser={approvePendingUser}
          onRejectUser={rejectPendingUser}
          onRevokeUser={revokeMembership}
          onPurchaseCredits={purchaseCredits}
          requestedUsersTab={requestedUsersTab}
          onNavigateTab={navigateToTab}
          notifications={notifications}
          setNotifications={setNotifications}
          setUnreadNotifications={setUnreadNotifications}
          payments={payments}
          paymentsLoading={paymentsLoading}
          resources={resources}
          resourcesLoading={resourcesLoading}
          onUploadResource={uploadResource}
          onUpdateResource={updateResource}
          onDeleteResource={deleteResource}
          onRefreshResources={refreshResources}
          academySettings={academySettings}
          academySettingsLoading={academySettingsLoading}
          academySettingsSaving={academySettingsSaving}
          academySettingsError={academySettingsError}
          onRefreshAcademySettings={refreshAcademySettings}
          onUpdateAcademySettings={updateAcademySettings}
          activeSubTab={activeSubTab}
          setActiveSubTab={setActiveSubTab}
        />
      </motion.main>
    </div>
  );
};

export default AcademyDashboard;
