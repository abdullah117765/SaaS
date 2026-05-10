import { AnimatePresence } from "framer-motion";

// Import tab components
import AcademySettingsTab from "./AcademySettingsTab";
import ClassesTab from "./ClassesTab";
import CreditManagementTab from "./CreditManagementTab";
import NotificationsTab from "./NotificationsTab";
import OverviewTab from "./OverviewTab";
import PaymentsTab from "./PaymentsTab";
import ResourcesTab from "./ResourcesTab";
import UsersTab from "./UsersTab";
import ZoomCreditsTab from "./ZoomCreditsTab";

const TabContent = ({
  activeTab,
  teacherCount,
  studentCount,
  classes,
  classesMeta,
  classesSummary,
  classesFilters,
  classesLoading,
  onLoadClasses,
  zoomCredits,
  subscriptionUsage,
  teachers,
  students,
  teachersSummary,
  studentsSummary,
  pendingUsers,
  onApproveUser,
  onRejectUser,
  onRevokeUser,
  onPurchaseCredits,
  notifications,
  setNotifications,
  setUnreadNotifications,
  payments,
  paymentsLoading,
  resources,
  resourcesLoading,
  onUploadResource,
  onUpdateResource,
  onDeleteResource,
  onRefreshResources,
  activeSubTab,
  setActiveSubTab,
  academySettings,
  academySettingsLoading,
  academySettingsSaving,
  academySettingsError,
  onRefreshAcademySettings,
  onUpdateAcademySettings,
  academyId,
  requestedUsersTab = "teachers",
  onNavigateTab = () => {},
}) => {
  const renderActiveTab = () => {
    switch (activeTab) {
      case "overview":
        return (
          <OverviewTab
            key="overview"
            teacherCount={teacherCount}
            studentCount={studentCount}
            classes={classes}
            zoomCredits={zoomCredits}
            subscriptionUsage={subscriptionUsage}
            onNavigate={onNavigateTab}
            onShowPurchaseCredits={() => onNavigateTab("zoom")}
          />
        );
      case "users":
        return (
          <UsersTab
            key="users"
            teachers={teachers}
            students={students}
            pendingUsers={pendingUsers}
            teacherSummary={teachersSummary}
            studentSummary={studentsSummary}
            onApproveUser={onApproveUser}
            onRejectUser={onRejectUser}
            onRevokeUser={onRevokeUser}
            initialSubTab={requestedUsersTab}
          />
        );
      case "notifications":
        return (
          <NotificationsTab
            key="notifications"
            notifications={notifications}
            setNotifications={setNotifications}
            setUnreadNotifications={setUnreadNotifications}
          />
        );
      case "payments":
        return (
          <PaymentsTab
            key="payments"
            payments={payments}
            loading={paymentsLoading}
          />
        );
      case "zoom":
        return (
          <ZoomCreditsTab
            key="zoom"
            zoomCredits={zoomCredits}
            onPurchaseCredits={onPurchaseCredits}
          />
        );
      case "credit-management":
        return (
          <CreditManagementTab key="credit-management" academyId={academyId} />
        );
      case "classes":
        return (
          <ClassesTab
            key="classes"
            classes={classes}
            summary={classesSummary}
            meta={classesMeta}
            filters={classesFilters}
            loading={classesLoading}
            onChangeFilters={onLoadClasses}
            activeSubTab={activeSubTab}
            setActiveSubTab={setActiveSubTab}
          />
        );
      case "settings":
        return (
          <AcademySettingsTab
            key="settings"
            settings={academySettings}
            loading={academySettingsLoading}
            saving={academySettingsSaving}
            error={academySettingsError}
            onRefresh={onRefreshAcademySettings}
            onSubmit={onUpdateAcademySettings}
          />
        );
      case "resources":
        return (
          <ResourcesTab
            key="resources"
            resources={resources}
            classes={classes}
            loading={resourcesLoading}
            onUploadResource={onUploadResource}
            onUpdateResource={onUpdateResource}
            onDeleteResource={onDeleteResource}
            onRefreshResources={onRefreshResources}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="p-6">
        <AnimatePresence mode="wait">{renderActiveTab()}</AnimatePresence>
      </div>
    </div>
  );
};

export default TabContent;
