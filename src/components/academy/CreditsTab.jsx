import { FaCoins, FaVideo } from "react-icons/fa";
import CreditManagementTab from "./CreditManagementTab";
import ZoomCreditsTab from "./ZoomCreditsTab";

const CreditsTab = ({ zoomCredits, onPurchaseCredits, academyId }) => {
  return (
    <div className="flex flex-col divide-y divide-emerald-100">
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
export default CreditsTab;
