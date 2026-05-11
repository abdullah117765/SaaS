import { FaArrowUp, FaCoins, FaVideo } from "react-icons/fa";
import CreditManagementTab from "./CreditManagementTab";
import ZoomCreditsTab from "./ZoomCreditsTab";

const CreditsTab = ({ zoomCredits, onPurchaseCredits, academyId, subscriptionUsage, onNavigateToFinance }) => {
  const plan = subscriptionUsage?.planName ?? subscriptionUsage?.plan ?? null;
  const planTier = subscriptionUsage?.tier ?? null;
  const studentLimit = subscriptionUsage?.studentLimit ?? 0;
  const teacherLimit = subscriptionUsage?.teacherLimit ?? 0;
  const storageLimit = subscriptionUsage?.storageLimit ?? 0;

  return (
    <div className="flex flex-col divide-y divide-emerald-100">
      {/* Subscription Plan Overview */}
      <div className="p-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <FaArrowUp className="h-5 w-5 text-indigo-600" />
            <div>
              <h2 className="text-xl font-bold text-slate-900">Subscription Plan</h2>
              <p className="text-sm text-slate-500">Your current plan and limits.</p>
            </div>
          </div>
          {onNavigateToFinance && (
            <button
              type="button"
              onClick={onNavigateToFinance}
              className="inline-flex items-center rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
            >
              Manage / Upgrade
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">Plan</p>
            <p className="mt-1 text-lg font-bold text-indigo-800">
              {plan ?? planTier ?? "Free"}
            </p>
          </div>
          <div className="rounded-xl border border-sky-100 bg-sky-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-500">Teachers</p>
            <p className="mt-1 text-lg font-bold text-sky-800">
              {teacherLimit > 0 ? `Up to ${teacherLimit}` : "Unlimited"}
            </p>
          </div>
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Students</p>
            <p className="mt-1 text-lg font-bold text-emerald-800">
              {studentLimit > 0 ? `Up to ${studentLimit}` : "Unlimited"}
            </p>
          </div>
          <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">Storage</p>
            <p className="mt-1 text-lg font-bold text-amber-800">
              {storageLimit > 0 ? `${storageLimit} GB` : "Unlimited"}
            </p>
          </div>
        </div>
      </div>
      {/* Zoom Credits section */}
      <div className="p-6">
        <div className="mb-4 flex items-center gap-3">
          <FaVideo className="h-5 w-5 text-emerald-600" />
          <div>
            <h2 className="text-xl font-bold text-slate-900">Zoom Credits</h2>
            <p className="text-sm text-slate-500">
              Manage and purchase Zoom class credits.
            </p>
          </div>
        </div>
        <ZoomCreditsTab
          key="zoom-credits-inline"
          zoomCredits={zoomCredits}
          onPurchaseCredits={onPurchaseCredits}
        />
      </div>

      {/* Credit Management section */}
      <div className="p-6">
        <div className="mb-4 flex items-center gap-3">
          <FaCoins className="h-5 w-5 text-emerald-600" />
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Credit Management
            </h2>
            <p className="text-sm text-slate-500">
              Assign and manage teacher credit limits.
            </p>
          </div>
        </div>
        <CreditManagementTab
          key="credit-management-inline"
          academyId={academyId}
        />
      </div>
    </div>
  );
};

export default CreditsTab;
