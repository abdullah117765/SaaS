import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import apiRequest from "../utils/apiClient";

/**
 * Landing page Stripe redirects to after a successful checkout.
 * Polls /zoom-credits/me/summary a few times so the user sees their updated
 * balance without having to refresh manually, then sends them back to billing.
 */
const BillingSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get("session_id");
  const [dots, setDots] = useState(".");
  const [credits, setCredits] = useState(null);

  // Animated dots while polling
  useEffect(() => {
    const id = setInterval(
      () => setDots((d) => (d.length >= 3 ? "." : d + ".")),
      500,
    );
    return () => clearInterval(id);
  }, []);

  // Poll the summary endpoint up to 6 times (max 12 s) waiting for the
  // webhook to process and the balance to update, then redirect.
  useEffect(() => {
    let cancelled = false;
    let attempts = 0;

    const poll = async () => {
      while (attempts < 6 && !cancelled) {
        await new Promise((r) => setTimeout(r, 2000));
        try {
          const summary = await apiRequest("/zoom-credits/me/summary");
          if (summary?.balance !== undefined) {
            if (!cancelled) setCredits(summary.balance);
          }
        } catch {
          // ignore — will retry
        }
        attempts++;
      }
      if (!cancelled) {
        navigate("/academy/billing?checkout=success", { replace: true });
      }
    };

    poll();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-emerald-100 bg-white p-10 text-center shadow-lg">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <svg
            className="h-8 w-8 text-emerald-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          Payment Successful!
        </h1>
        <p className="mt-2 text-gray-500">
          Your payment was received. We&apos;re confirming your credits{dots}
        </p>
        {credits !== null && (
          <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 px-6 py-4">
            <p className="text-sm text-emerald-700">Updated credit balance</p>
            <p className="mt-1 text-3xl font-bold text-emerald-800">
              {credits.toLocaleString()}
            </p>
          </div>
        )}
        {sessionId && (
          <p className="mt-4 truncate text-xs text-gray-400">
            Session: {sessionId}
          </p>
        )}
        <p className="mt-6 text-sm text-gray-400">
          Redirecting you back to billing{dots}
        </p>
      </div>
    </div>
  );
};

export default BillingSuccess;
