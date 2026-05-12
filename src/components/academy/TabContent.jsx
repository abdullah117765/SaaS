import { AnimatePresence } from "framer-motion";
import BillingPage from "../../pages/BillingPage";

// Import tab components
import AcademySettingsTab from "./AcademySettingsTab";
import ClassesTab from "./ClassesTab";
import CreditManagementTab from "./CreditManagementTab";
import CreditsTab from "./CreditsTab";
import FinanceTab from "./FinanceTab";
import NotificationsTab from "./NotificationsTab";
import OverviewTab from "./OverviewTab";
import PaymentsTab from "./PaymentsTab";
import RecordingsTab from "./RecordingsTab";
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
      case "billing":
        return <BillingPage key="billing" mode="all" />;
      case "subscription":
        return <BillingPage key="subscription" mode="subscriptions" />;
      case "finance":
        return (
          <FinanceTab
            key="finance"
            payments={payments}
            paymentsLoading={paymentsLoading}
          />
        );
      case "credits":
        return (
          <CreditsTab
            key="credits"
            zoomCredits={zoomCredits}
            onPurchaseCredits={onPurchaseCredits}
            academyId={academyId}
            subscriptionUsage={subscriptionUsage}
            onNavigateToFinance={() => onNavigateTab("finance")}
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
      case "recordings":
        return <RecordingsTab key="recordings" academyId={academyId} />;
      default:
        return null;
    }
  };

  const isFullBleedBilling =
    activeTab === "billing" ||
    activeTab === "subscription" ||
    activeTab === "finance" ||
    activeTab === "credits";

  return isFullBleedBilling ? (
    <div className="overflow-hidden rounded-lg border border-emerald-100 bg-white shadow">
      <div className="p-0">
        <AnimatePresence mode="wait">{renderActiveTab()}</AnimatePresence>
      </div>
    </div>
  ) : (
    <div className="overflow-hidden rounded-lg bg-white shadow">
      <div className="p-6">
        <AnimatePresence mode="wait">{renderActiveTab()}</AnimatePresence>
      </div>
    </div>
  );
};

export default TabContent;
