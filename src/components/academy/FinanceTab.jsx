import { FaCreditCard } from "react-icons/fa";
import BillingPage from "../../pages/BillingPage";
import PaymentsTab from "./PaymentsTab";

const FinanceTab = ({ payments = [], paymentsLoading = false }) => {
  return (
    <div className="flex flex-col divide-y divide-emerald-100">
      {/* Billing & Credits section */}
      <BillingPage
        mode="billing"
        outerClassName="w-full space-y-6 bg-white p-6"
      />

      {/* Subscription plans section */}
      <BillingPage
        mode="subscriptions"
        outerClassName="w-full space-y-6 bg-white p-6"
      />

      {/* Payment history section */}
      <div className="p-6">
        <div className="mb-5 flex items-center gap-3">
          <FaCreditCard className="h-5 w-5 text-emerald-600" />
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Payment History
            </h2>
            <p className="text-sm text-slate-500">
              All payment transactions for your academy.
            </p>
          </div>
        </div>
        <PaymentsTab payments={payments} loading={paymentsLoading} />
      </div>
    </div>
  );
};

export default FinanceTab;
