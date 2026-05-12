import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import apiRequest, { resolveAssetUrl } from "../../utils/apiClient";

const DEFAULT_FILTERS = {
  status: "all",
  search: "",
  from: "",
  to: "",
  page: 1,
};

const DEFAULT_STUDENT_FILTERS = {
  status: "APPROVED",
  search: "",
  academyId: "active",
};

const toLocaleDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
};

const normaliseClass = (record) => ({
  id: record.id,
  title: record.title,
  description: record.description ?? "",
  status: record.status?.toLowerCase() ?? "upcoming",
  scheduledStart: record.scheduledStart,
  scheduledEnd: record.scheduledEnd,
  start: toLocaleDateTime(record.scheduledStart),
  end: toLocaleDateTime(record.scheduledEnd),
  participants: record.participantsCount ?? 0,
  timezone: record.timezone ?? "UTC",
  creditsConsumed: record.creditsConsumed ?? 0,
  zoomJoinUrl: record.zoomJoinUrl ?? null,
  zoomStartUrl: record.zoomStartUrl ?? null,
  cancellationReason:
    typeof record.metadata?.cancellation?.reason === "string"
      ? record.metadata.cancellation.reason
      : "",
});

const useTeacherDashboardData = () => {
  const { user, academyMemberships, loadingAcademies } = useAuth();
  const { showToast } = useToast();
  const userId = user?.id ?? null;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [classes, setClasses] = useState([]);
  const [classesMeta, setClassesMeta] = useState(null);
  const [students, setStudents] = useState([]);
  const [studentsMeta, setStudentsMeta] = useState(null);
  const [studentsSummary, setStudentsSummary] = useState(null);
  const [creditSummary, setCreditSummary] = useState(null);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [studentFilters, setStudentFilters] = useState(DEFAULT_STUDENT_FILTERS);
  const [selectedAcademyId, setSelectedAcademyId] = useState(null);

  useEffect(() => {
    if (!Array.isArray(academyMemberships) || academyMemberships.length === 0) {
      setSelectedAcademyId(null);
      return;
    }

    setSelectedAcademyId((prev) => {
      if (
        prev &&
        academyMemberships.some((membership) => membership.academyId === prev)
      ) {
        return prev;
      }
      return academyMemberships[0]?.academyId ?? null;
    });
  }, [academyMemberships]);

  const activeAcademyId = useMemo(
    () => selectedAcademyId ?? academyMemberships?.[0]?.academyId ?? null,
    [academyMemberships, selectedAcademyId],
  );

  const academyOptions = useMemo(
    () =>
      (academyMemberships ?? []).map((membership) => ({
        value: membership.academyId,
        label: membership.academy?.name ?? "Unnamed Academy",
        status: membership.status,
      })),
    [academyMemberships],
  );

  const hasAcademyAccess = Boolean(activeAcademyId);

  const metrics = useMemo(() => {
    const upcoming = classes.filter((cls) => cls.status === "upcoming");
    const completed = classes.filter((cls) => cls.status === "ended");

    return {
      totalClasses: classes.length,
      upcomingCount: upcoming.length,
      completedCount: completed.length,
      studentCount: students.length,
    };
  }, [classes, students]);

  const load = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    if (!Array.isArray(academyMemberships) || academyMemberships.length === 0) {
      setClasses([]);
      setClassesMeta(null);
      setStudents([]);
      setStudentsMeta(null);
      setStudentsSummary(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: String(filters.page ?? 1),
        limit: "15",
        teacherId: userId,
      });

      if (activeAcademyId) {
        params.append("academyId", activeAcademyId);
      }

      if (filters.status && filters.status !== "all") {
        params.append("status", filters.status.toUpperCase());
      }
      if (filters.search.trim()) {
        params.append("search", filters.search.trim());
      }
      if (filters.from) {
        params.append("from", filters.from);
      }
      if (filters.to) {
        params.append("to", filters.to);
      }

      const studentParams = new URLSearchParams({
        limit: "100",
        page: "1",
      });
      if (studentFilters.status) {
        studentParams.append("status", studentFilters.status.toUpperCase());
      }
      if (studentFilters.search.trim()) {
        studentParams.append("search", studentFilters.search.trim());
      }
      const resolvedStudentAcademyId =
        studentFilters.academyId === "active"
          ? activeAcademyId
          : studentFilters.academyId && studentFilters.academyId !== "all"
            ? studentFilters.academyId
            : null;
      if (resolvedStudentAcademyId) {
        studentParams.append("academyId", resolvedStudentAcademyId);
      }

      const [classesResponse, studentsResponse, creditResponse] =
        await Promise.all([
          apiRequest(`/classes?${params.toString()}`),
          apiRequest(`/users/students?${studentParams.toString()}`),
          apiRequest("/zoom-credits/me/summary").catch(() => null),
        ]);

      const mappedClasses = (classesResponse?.data ?? []).map(normaliseClass);
      setClasses(mappedClasses);
      setClassesMeta(classesResponse?.meta ?? null);

      const mappedStudents = (studentsResponse?.data ?? []).map((student) => {
        const academies = Array.isArray(student.academies)
          ? student.academies
          : [];
        const approvedAcademyNames = academies
          .filter((academy) => academy.status === "APPROVED")
          .map((academy) => academy.academyName ?? "Unnamed Academy");
        const enrolledClasses =
          Number(
            student._count?.classParticipants ?? student.enrolledClasses ?? 0,
          ) || 0;
        const profilePhotoUrl = resolveAssetUrl(student.profilePhotoUrl);

        return {
          id: student.id,
          name:
            `${student.firstName ?? ""} ${student.lastName ?? ""}`.trim() ||
            student.email,
          email: student.email,
          status: student.status,
          joined: toLocaleDateTime(student.createdAt),
          academies: approvedAcademyNames,
          enrolledClasses,
          avatarUrl: profilePhotoUrl,
        };
      });
      setStudents(mappedStudents);
      setStudentsMeta(studentsResponse?.meta ?? null);
      setStudentsSummary(studentsResponse?.summary ?? null);
      setCreditSummary(creditResponse ?? null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to load dashboard data.";
      setStudents([]);
      setStudentsMeta(null);
      setStudentsSummary(null);
      setCreditSummary(null);
      setError(message);
      showToast({
        status: "error",
        title: "Failed to load classes",
        description: message,
      });
    } finally {
      setLoading(false);
    }
  }, [
    academyMemberships,
    activeAcademyId,
    filters,
    showToast,
    studentFilters,
    userId,
  ]);

  useEffect(() => {
    load();
  }, [load]);

  const updateFilters = useCallback((updates) => {
    setFilters((prev) => ({
      ...prev,
      ...updates,
      // reset to page 1 whenever any filter OTHER than page changes
      ...(Object.keys(updates).some((k) => k !== "page") ? { page: 1 } : {}),
    }));
  }, []);

  const updateStudentFilters = useCallback((updates) => {
    setStudentFilters((prev) => ({
      ...prev,
      ...updates,
    }));
  }, []);

  const resetStudentFilters = useCallback(() => {
    setStudentFilters(DEFAULT_STUDENT_FILTERS);
  }, []);

  const createClass = useCallback(
    async (payload) => {
      if (!userId) {
        return {
          success: false,
          error: "Unable to determine teacher identity.",
        };
      }

      if (!activeAcademyId) {
        const message = "Join an academy before scheduling classes.";
        showToast({
          status: "error",
          title: "No academy selected",
          description: message,
        });
        return { success: false, error: message };
      }
      try {
        await apiRequest("/classes", {
          method: "POST",
          body: {
            ...payload,
            teacherId: userId,
            academyId: activeAcademyId,
          },
        });
        showToast({
          status: "success",
          title: "Class scheduled",
          description: "The Zoom class has been created successfully.",
        });
        await load();
        return { success: true };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unable to schedule class.";
        showToast({
          status: "error",
          title: "Creation failed",
          description: message,
        });
        return { success: false, error: message };
      }
    },
    [activeAcademyId, load, showToast, userId],
  );

  const updateClass = useCallback(
    async (classId, payload) => {
      try {
        await apiRequest(`/classes/${classId}`, {
          method: "PATCH",
          body: payload,
        });
        showToast({
          status: "success",
          title: "Class updated",
          description: "Changes have been saved successfully.",
        });
        await load();
        return { success: true };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unable to update class.";
        showToast({
          status: "error",
          title: "Update failed",
          description: message,
        });
        return { success: false, error: message };
      }
    },
    [load, showToast],
  );

  const deleteClass = useCallback(
    async (classId) => {
      try {
        await apiRequest(`/classes/${classId}`, {
          method: "DELETE",
        });
        showToast({
          status: "success",
          title: "Class cleared",
          description: "The class has been removed from your list.",
        });
        await load();
        return { success: true };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unable to delete class.";
        showToast({
          status: "error",
          title: "Deletion failed",
          description: message,
        });
        return { success: false, error: message };
      }
    },
    [load, showToast],
  );

  const cancelClass = useCallback(
    async (classId, reason) => {
      try {
        await apiRequest(`/classes/${classId}/cancel`, {
          method: "POST",
          body: { reason },
        });
        showToast({
          status: "success",
          title: "Class cancelled",
          description: "The Zoom meeting has been cancelled.",
        });
        await load();
        return { success: true };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unable to cancel class.";
        showToast({
          status: "error",
          title: "Cancellation failed",
          description: message,
        });
        return { success: false, error: message };
      }
    },
    [load, showToast],
  );

  const endClass = useCallback(
    async (classId) => {
      try {
        await apiRequest(`/classes/${classId}/end`, { method: "POST" });
        showToast({
          status: "success",
          title: "Class ended",
          description: "The class has been marked as ended.",
        });
        await load();
        return { success: true };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unable to end class.";
        showToast({
          status: "error",
          title: "Failed to end class",
          description: message,
        });
        return { success: false, error: message };
      }
    },
    [load, showToast],
  );

  const recreateClass = useCallback(
    async (classId, payload = {}) => {
      try {
        await apiRequest(`/classes/${classId}/recreate`, {
          method: "POST",
          body: payload,
        });
        showToast({
          status: "success",
          title: "Class recreated",
          description: "A new class has been scheduled with the same students.",
        });
        await load();
        return { success: true };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unable to recreate class.";
        showToast({
          status: "error",
          title: "Recreation failed",
          description: message,
        });
        return { success: false, error: message };
      }
    },
    [load, showToast],
  );

  return {
    loading,
    loadingAcademies,
    error,
    classes,
    classesMeta,
    students,
    studentsMeta,
    studentsSummary,
    creditSummary,
    studentFilters,
    filters,
    setFilters: updateFilters,
    setStudentFilters: updateStudentFilters,
    resetStudentFilters,
    metrics,
    refresh: load,
    createClass,
    updateClass,
    cancelClass,
    endClass,
    recreateClass,
    deleteClass,
    academyOptions,
    activeAcademyId,
    setActiveAcademyId: setSelectedAcademyId,
    academyMemberships,
    hasAcademyAccess,
  };
};

export default useTeacherDashboardData;
