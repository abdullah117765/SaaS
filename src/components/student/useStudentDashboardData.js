import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import apiRequest, { resolveAssetUrl } from "../../utils/apiClient";

const mapClass = (cls) => ({
  id: cls.id,
  title: cls.title,
  description: cls.description ?? "",
  status: cls.status?.toLowerCase() ?? "upcoming",
  start: cls.scheduledStart,
  end: cls.scheduledEnd,
  teacherId: cls.teacher?.id ?? null,
  teacher: cls.teacher
    ? `${cls.teacher.firstName ?? ""} ${cls.teacher.lastName ?? ""}`.trim() ||
      cls.teacher.email
    : "Unassigned",
  timezone: cls.timezone,
  joinUrl: cls.zoomJoinUrl,
});

const formatDate = (value) => {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "—" : parsed.toLocaleString();
};

const useStudentDashboardData = () => {
  const { user, academyMemberships, loadingAcademies } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [classes, setClasses] = useState([]);
  const [classesMeta, setClassesMeta] = useState(null);
  const [classPage, setClassPage] = useState(1);
  const [teachers, setTeachers] = useState([]);

  const activeAcademyId = useMemo(
    () => academyMemberships?.[0]?.academyId ?? null,
    [academyMemberships],
  );

  const hasAcademyAccess = Boolean(activeAcademyId);

  const upcomingClasses = useMemo(
    () =>
      classes
        .filter((cls) => cls.status === "upcoming")
        .sort((a, b) => new Date(a.start) - new Date(b.start)),
    [classes],
  );

  const metrics = useMemo(
    () => ({
      totalClasses: classesMeta?.total ?? classes.length,
      upcomingCount: upcomingClasses.length,
      teacherCount: teachers.length,
    }),
    [classesMeta, classes.length, upcomingClasses.length, teachers.length],
  );

  const load = useCallback(async () => {
    if (!activeAcademyId) {
      setClasses([]);
      setClassesMeta(null);
      setTeachers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const classParams = new URLSearchParams({
        limit: "15",
        page: String(classPage),
        academyId: activeAcademyId,
      });
      const teacherParams = new URLSearchParams({
        limit: "100",
        page: "1",
        status: "APPROVED",
      });
      const [classResponse, teachersResponse] = await Promise.all([
        apiRequest(`/classes?${classParams.toString()}`),
        apiRequest(`/users/teachers?${teacherParams.toString()}`),
      ]);

      const fetchedClasses = (classResponse?.data ?? []).map(mapClass);
      const rawTeachers = Array.isArray(teachersResponse?.data)
        ? teachersResponse.data
        : [];
      const filteredTeachers = rawTeachers.filter((teacher) => {
        if (!Array.isArray(teacher.academyMemberships) || !activeAcademyId) {
          return true;
        }
        return teacher.academyMemberships.some(
          (membership) =>
            membership.academyId === activeAcademyId &&
            membership.status === "APPROVED",
        );
      });

      const fetchedTeachers = filteredTeachers.map((teacher) => ({
        id: teacher.id,
        name:
          `${teacher.firstName ?? ""} ${teacher.lastName ?? ""}`.trim() ||
          teacher.email,
        email: teacher.email,
        bio: teacher.bio ?? "",
        avatarUrl: resolveAssetUrl(teacher.profilePhotoUrl),
        academies: Array.isArray(teacher.academies)
          ? teacher.academies
              .filter((academy) => academy.status === "APPROVED")
              .map((academy) => academy.academyName ?? "Unnamed Academy")
          : [],
        classCount: Number(teacher._count?.teachingClasses ?? 0) || 0,
        resourceCount: Number(teacher._count?.resources ?? 0) || 0,
        joined: formatDate(teacher.createdAt),
        status: teacher.status,
      }));

      setClasses(fetchedClasses);
      setClassesMeta(classResponse?.meta ?? null);
      setTeachers(fetchedTeachers);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to load dashboard data";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [activeAcademyId, classPage]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    user,
    loading,
    error,
    classes,
    classesMeta,
    classPage,
    setClassPage,
    teachers,
    metrics,
    upcomingClasses,
    refresh: load,
    hasAcademyAccess,
    loadingAcademies,
    activeAcademyId,
  };
};

export default useStudentDashboardData;
