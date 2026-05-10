import { useEffect, useState } from "react";
import { apiRequest } from "../../utils/apiClient";

const fetchTrend = (days) =>
  apiRequest(`/zoom-credits/me/usage-trend?days=${days}`);

const formatDay = (iso) => {
  try {
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  } catch {
    return iso;
  }
};

const TeacherCreditUsageChart = ({ days = 14 }) => {
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchTrend(days)
      .then((res) => {
        if (cancelled) return;
        setSeries(res?.data?.series ?? []);
      })
      .catch((err) => !cancelled && setError(err?.message ?? "Failed to load"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [days]);

  const max = Math.max(
    1,
    ...series.map((s) => Math.max(s.credited ?? 0, s.debited ?? 0)),
  );
  const totalDebited = series.reduce((a, s) => a + (s.debited ?? 0), 0);
  const totalCredited = series.reduce((a, s) => a + (s.credited ?? 0), 0);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-baseline justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            Credit usage — last {days} days
          </h3>
          <p className="text-xs text-gray-500">
            Used {totalDebited.toLocaleString()} · Added{" "}
            {totalCredited.toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-gray-500">
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm bg-emerald-500" /> Added
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm bg-rose-500" /> Used
          </span>
        </div>
      </div>
      {loading ? (
        <div className="flex h-32 items-center justify-center text-xs text-gray-400">
          Loading…
        </div>
      ) : error ? (
        <div className="flex h-32 items-center justify-center text-xs text-rose-500">
          {error}
        </div>
      ) : series.length === 0 ? (
        <div className="flex h-32 items-center justify-center text-xs text-gray-400">
          No activity yet.
        </div>
      ) : (
        <div className="flex h-32 items-end gap-1">
          {series.map((s) => {
            const cH = ((s.credited ?? 0) / max) * 100;
            const dH = ((s.debited ?? 0) / max) * 100;
            return (
              <div
                key={s.date}
                className="group flex h-full flex-1 flex-col items-center justify-end gap-0.5"
                title={`${formatDay(s.date)} · added ${s.credited} · used ${s.debited}`}
              >
                <div className="flex h-full w-full items-end gap-0.5">
                  <div
                    className="w-1/2 rounded-t bg-emerald-500/80 transition-opacity group-hover:opacity-100"
                    style={{ height: `${cH}%`, minHeight: cH > 0 ? 2 : 0 }}
                  />
                  <div
                    className="w-1/2 rounded-t bg-rose-500/80 transition-opacity group-hover:opacity-100"
                    style={{ height: `${dH}%`, minHeight: dH > 0 ? 2 : 0 }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TeacherCreditUsageChart;
