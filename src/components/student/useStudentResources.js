import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import apiRequest from "../../utils/apiClient";
import { mapResourceRecord } from "../../utils/resourceTransforms";

const useStudentResources = (classes = [], teachers = [], academyId = null) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const userId = user?.id ?? null;

  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const classIds = useMemo(
    () => new Set(classes.map((cls) => cls.id)),
    [classes],
  );

  const teacherIds = useMemo(
    () => new Set(teachers.map((teacher) => teacher.id)),
    [teachers],
  );

  const loadResources = useCallback(async () => {
    if (!userId) {
      setResources([]);
      return;
    }

    if (!academyId) {
      setResources([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ limit: "100", page: "1", academyId });
      const response = await apiRequest(`/resources?${params.toString()}`);
      const rawResources = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
          ? response
          : [];
      const mapped = rawResources.map(mapResourceRecord);

      const filtered = mapped.filter((resource) => {
        if (resource.visibility === "PUBLIC") {
          return true;
        }
        if (resource.visibility === "ACADEMY") {
          return true;
        }
        if (resource.classId && classIds.has(resource.classId)) {
          return true;
        }
        if (resource.uploaderId && teacherIds.has(resource.uploaderId)) {
          return true;
        }
        if (resource.uploaderId === userId) {
          return true;
        }
        return false;
      });

      setResources(filtered);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to load resources.";
      setError(message);
      showToast({
        status: "error",
        title: "Failed to load resources",
        description: message,
      });
    } finally {
      setLoading(false);
    }
  }, [academyId, classIds, teacherIds, showToast, userId]);

  useEffect(() => {
    loadResources();
  }, [loadResources]);

  return {
    resources,
    loading,
    error,
    refresh: loadResources,
  };
};

export default useStudentResources;

