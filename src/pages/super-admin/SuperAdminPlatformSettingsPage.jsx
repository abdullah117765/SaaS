import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import SuperAdminLayout from "../../components/super-admin/SuperAdminLayout";
import apiRequest from "../../utils/apiClient";

const DEFAULT_SETTINGS = {
  sessionTimeoutMinutes: 60,
  zoomCreditLowThreshold: 100,
  maxConcurrentClasses: 12,
  dailyDigestEmail: true,
  supportEmail: "support@qedu.io",
  maxAcademiesPerTeacher: 3,
  maxAcademiesPerStudent: 1,
};
const SETTINGS_METADATA = [
  {
    key: "sessionTimeoutMinutes",
    label: "Session timeout (minutes)",
    description:
      "Controls how long a user can stay signed in without activity.",
    type: "number",
    min: 5,
    max: 480,
    step: 5,
  },
  {
    key: "zoomCreditLowThreshold",
    label: "Zoom credit alert threshold",
    description:
      "Trigger low balance alerts when credits fall below this amount.",
    type: "number",
    min: 0,
    max: 10000,
    step: 10,
  },
  {
    key: "maxConcurrentClasses",
    label: "Max concurrent live classes",
    description: "Limit the number of simultaneous live sessions per academy.",
    type: "number",
    min: 1,
    max: 1000,
  },
  {
    key: "dailyDigestEmail",
    label: "Send daily digest emails",
    description: "Deliver daily activity summaries to academy owners.",
    type: "boolean",
  },
  {
    key: "supportEmail",
    label: "Support email address",
    description: "Primary email address displayed to end-users for help.",
    type: "email",
  },
  {
    key: "maxAcademiesPerTeacher",
    label: "Max academies per teacher",
    description:
      "Limit the number of academies a teacher can join (0 for unlimited).",
    type: "number",
    min: 0,
    max: 50,
  },
  {
    key: "maxAcademiesPerStudent",
    label: "Max academies per student",
    description:
      "Limit the number of academies a student can join (0 for unlimited).",
    type: "number",
    min: 0,
    max: 50,
  },
];

const SuperAdminPlatformSettingsPage = () => {
  const [initialValues, setInitialValues] = useState(null);
  const [formValues, setFormValues] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    let active = true;

    const loadSettings = async () => {
      setLoading(true);
      try {
        const result = await apiRequest("/platform-settings");
        if (!active) return;
        const normalised = { ...DEFAULT_SETTINGS, ...(result ?? {}) };
        setInitialValues(normalised);
        setFormValues(normalised);
        setError(null);
      } catch (err) {
        console.error("Failed to load platform settings", err);
        if (active) {
          setError(err?.message ?? "Failed to load platform settings.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadSettings();

    return () => {
      active = false;
    };
  }, []);

  const dirtyDiff = useMemo(() => {
    if (!initialValues || !formValues) {
      return {};
    }
    return Object.entries(formValues).reduce((acc, [key, value]) => {
      if (
        key === "updatedAt" ||
        key === "updatedById" ||
        key === "updatedByName"
      ) {
        return acc;
      }
      if (value !== initialValues[key]) {
        acc[key] = value;
      }
      return acc;
    }, {});
  }, [initialValues, formValues]);

  const handleFieldChange = (key, nextValue) => {
    setFormValues((prev) => ({
      ...prev,
      [key]: nextValue,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSuccessMessage(null);

    if (!formValues) {
      return;
    }

    const updates = dirtyDiff;
    if (Object.keys(updates).length === 0) {
      setSuccessMessage("No changes to save.");
      return;
    }

    try {
      setSaving(true);
      const updated = await apiRequest("/platform-settings", {
        method: "PATCH",
        body: updates,
      });
      const normalised = { ...DEFAULT_SETTINGS, ...(updated ?? {}) };
      setInitialValues(normalised);
      setFormValues(normalised);
      setSuccessMessage("Settings saved successfully.");
      setError(null);
    } catch (err) {
      console.error("Failed to update platform settings", err);
      setError(err?.message ?? "Unable to save settings right now.");
    } finally {
      setSaving(false);
    }
  };

  const renderField = (config) => {
    const value = formValues?.[config.key];
    const id = `platform-setting-${config.key}`;

    if (config.type === "boolean") {
      return (
        <label
          key={config.key}
          htmlFor={id}
          className="flex items-start justify-between gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm"
        >
          <div>
            <p className="text-sm font-medium text-gray-800">{config.label}</p>
            <p className="mt-1 text-xs text-gray-500">{config.description}</p>
          </div>
          <input
            id={id}
            type="checkbox"
            className="mt-1 h-5 w-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
            checked={Boolean(value)}
            onChange={(event) =>
              handleFieldChange(config.key, event.target.checked)
            }
          />
        </label>
      );
    }

    return (
      <div key={config.key}>
        <label htmlFor={id} className="block text-sm font-medium text-gray-800">
          {config.label}
        </label>
        <p className="mt-1 text-xs text-gray-500">{config.description}</p>
        <input
          id={id}
          type={config.type === "number" ? "number" : "email"}
          className="mt-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          value={value ?? ""}
          min={config.min}
          max={config.max}
          step={config.step}
          onChange={(event) =>
            handleFieldChange(
              config.key,
              config.type === "number"
                ? Number(event.target.value)
                : event.target.value,
            )
          }
        />
      </div>
    );
  };

  return (
    <SuperAdminLayout>
      <div className="w-full py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-green-800">
            Platform Settings
          </h1>
          <p className="mt-2 text-gray-600">
            Fine-tune onboarding, security, and operational preferences across
            the entire platform.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-2xl border border-gray-200 bg-white shadow-sm"
        >
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  Global controls
                </h2>
                <p className="text-sm text-gray-500">
                  Changes apply worldwide immediately after saving.
                </p>
              </div>
              {initialValues?.updatedAt ? (
                <div className="text-xs text-gray-500">
                  <p>
                    Last updated:{" "}
                    {new Date(initialValues.updatedAt).toLocaleString()}
                  </p>
                  <p>
                    By:{" "}
                    <span className="font-medium text-gray-700">
                      {initialValues.updatedByName ??
                        initialValues.updatedById ??
                        "Unknown"}
                    </span>
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          {loading ? (
            <div className="px-6 py-10 text-center text-sm text-gray-500">
              Loading platform settings...
            </div>
          ) : error ? (
            <div className="px-6 py-10">
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6">
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
                {SETTINGS_METADATA.map((setting) => renderField(setting))}
              </div>

              <div className="flex flex-col gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-gray-600">
                  {Object.keys(dirtyDiff).length > 0 ? (
                    <span className="text-green-600">
                      {Object.keys(dirtyDiff).length} pending change(s)
                    </span>
                  ) : (
                    <span>No unsaved changes</span>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  {successMessage ? (
                    <span className="text-sm text-green-600">
                      {successMessage}
                    </span>
                  ) : null}
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-md bg-green-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {saving ? "Saving..." : "Save changes"}
                  </button>
                </div>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminPlatformSettingsPage;
