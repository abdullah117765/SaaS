import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import apiRequest, { resolveAssetUrl } from "../../utils/apiClient";
import { listNotifications } from "../../utils/notificationsApi";
import { mapResourceRecord } from "../../utils/resourceTransforms";

const EMPTY_SUBSCRIPTION_USAGE = {
  studentLimit: 0,
  teacherLimit: 0,
  storageLimit: 0,
  studentCount: 0,
  teacherCount: 0,
  storageUsed: 0,
  zoomCreditsLimit: 0,
  zoomCreditsUsed: 0,
  recentActivity: [],
};

const EMPTY_USER_SUMMARY = {
  approved: 0,
  pending: 0,
  rejected: 0,
  inactive: 0,
};

const EMPTY_CLASSES_SUMMARY = {
  upcoming: 0,
  ongoing: 0,
  ended: 0,
  cancelled: 0,
};

const DEFAULT_CLASSES_FILTERS = {
  page: 1,
  limit: 10,
  status: "ALL",
  search: "",
  teacherId: "all",
};

const safeLocaleDate = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "N/A" : date.toLocaleDateString();
};

const normaliseRole = (role) => (role ? role.toLowerCase() : null);

const buildDisplayName = (user) => {
  if (!user) return "Unknown";
  const parts = [user.firstName, user.lastName].filter(Boolean);
  if (parts.length > 0) {
    return parts.join(" ");
  }
  return user.email ?? "Unknown";
};

const mapClassRecord = (record) => {
  const status = (record.status ?? "UPCOMING").toLowerCase();
  const teacherName = record.teacher
    ? `${record.teacher.firstName} ${record.teacher.lastName ?? ""}`.trim() ||
      record.teacher.email
    : "Unassigned";

  return {
    id: record.id,
    title: record.title,
    description: record.description ?? "",
    teacher: teacherName,
    teacherId: record.teacher?.id ?? null,
    schedule: formatTimeRange(
      record.scheduledStart,
      record.scheduledEnd,
      record.timezone,
    ),
    date: record.scheduledStart,
    endDate: record.scheduledEnd,
    duration: record.durationMinutes,
    students_count: record.participantsCount ?? 0,
    attendance: status === "ended" ? (record.participantsCount ?? 0) : null,
    status,
    timezone: record.timezone,
    zoomLink: record.zoomJoinUrl,
  };
};

const formatTimeRange = (startIso, endIso, timezone) => {
  if (!startIso || !endIso) return "";
  try {
    const start = new Date(startIso);
    const end = new Date(endIso);
    const dateFormatter = new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeZone: timezone,
    });
    const timeFormatter = new Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: timezone,
    });

    const date = dateFormatter.format(start);
    return `${date}, ${timeFormatter.format(start)} - ${timeFormatter.format(end)}`;
  } catch (error) {
    return "";
  }
};

const mapTransactionType = (type) =>
  type === "CREDIT" || type === "TRANSFER_IN" ? "purchase" : "usage";

const mapTransactionRecord = (record) => {
  const metadata = record?.metadata ?? {};
  const paymentStatus =
    typeof metadata.paymentStatus === "string"
      ? metadata.paymentStatus
      : "Completed";
  const source = typeof metadata.source === "string" ? metadata.source : null;
  const description =
    source === "purchase"
      ? (record.reason ?? "Credit purchase")
      : (metadata.classTitle ?? record.reason ?? "N/A");

  return {
    id: record.id,
    date: record.createdAt ?? record.date ?? new Date().toISOString(),
    amount: record.amount,
    type: mapTransactionType(record.type),
    status: paymentStatus,
    transactionId: record.id,
    className: description,
  };
};

const mapPaymentRecord = (payment) => ({
  id: payment.id,
  amount: payment.amount,
  status: payment.status,
  currency: payment.currency ?? "USD",
  provider: payment.provider ?? "Unknown",
  reference: payment.reference ?? "",
  createdAt: payment.createdAt ?? new Date().toISOString(),
});

const mapNotificationRecord = (notification) => ({
  id: notification.id,
  title: notification.title ?? "Notification",
  message: notification.body ?? "",
  time: notification.createdAt ? new Date(notification.createdAt).toLocaleString() : "",
  read: Boolean(notification.readAt),
  type: notification.type ?? "GENERIC",
  actionLink: notification.data?.actionLink,
  actionText: notification.data?.actionText,
});

const useAcademyData = () => {
  const { user, refreshAcademyContext } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [academyData, setAcademyData] = useState({
    id: "",
    name: "Your Academy",
    createdAt: new Date().toISOString(),
    subscription: {
      plan: "Professional",
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      status: "active",
    },
  });
  const [classes, setClasses] = useState([]);
  const [classesMeta, setClassesMeta] = useState(null);
  const [classesSummary, setClassesSummary] = useState(EMPTY_CLASSES_SUMMARY);
  const [classesFilters, setClassesFilters] = useState(DEFAULT_CLASSES_FILTERS);
  const classesFiltersRef = useRef(DEFAULT_CLASSES_FILTERS);
  const [classesLoading, setClassesLoading] = useState(false);
  const [zoomCredits, setZoomCredits] = useState({
    available: 0,
    used: 0,
    totalCredited: 0,
    history: [],
  });
  const [subscriptionUsage, setSubscriptionUsage] = useState(
    EMPTY_SUBSCRIPTION_USAGE,
  );
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const teacherIdsRef = useRef(new Set());
  const [teachersSummary, setTeachersSummary] = useState(EMPTY_USER_SUMMARY);
  const [studentsSummary, setStudentsSummary] = useState(EMPTY_USER_SUMMARY);
  const [resources, setResources] = useState([]);
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [payments, setPayments] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);

  useEffect(() => {
    classesFiltersRef.current = classesFilters;
  }, [classesFilters]);

  const userId = user?.id ?? null;
  const academyName = useMemo(() => {
    if (!user) return "Your Academy";
    const name = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
    return name ? `${name}'s Academy` : "Your Academy";
  }, [user]);

  const mapPendingMembershipRecord = useCallback(
    (membership) => {
      const user = membership.user ?? {};
      const profilePhotoUrl = resolveAssetUrl(user.profilePhotoUrl) ?? null;
      return {
        id: membership.id,
        membershipId: membership.id,
        userId: membership.userId,
        name: buildDisplayName(user),
        firstName: user.firstName ?? "",
        lastName: user.lastName ?? "",
        email: user.email ?? "",
        role: normaliseRole(membership.role),
        status: membership.status,
        requestDate: safeLocaleDate(membership.requestedAt),
        reason: membership.reason ?? "",
        phoneNumber: user.phoneNumber ?? "",
        gender: user.gender ?? "",
        bio: user.bio ?? "",
        dateOfBirth: user.dateOfBirth ? safeLocaleDate(user.dateOfBirth) : "",
        addressStreet: user.addressStreet ?? "",
        addressHouse: user.addressHouse ?? "",
        addressCity: user.addressCity ?? "",
        addressState: user.addressState ?? "",
        addressCountry: user.addressCountry ?? "",
        avatarUrl: profilePhotoUrl,
      };
    },
    [],
  );

  const fetchClasses = useCallback(
    async (overrides = {}) => {
      const currentFilters =
        classesFiltersRef.current ?? DEFAULT_CLASSES_FILTERS;
      const nextFilters = { ...currentFilters, ...overrides };
      const params = new URLSearchParams();
      params.set("page", String(nextFilters.page ?? 1));
      params.set("limit", String(nextFilters.limit ?? 10));
      if (nextFilters.status && nextFilters.status !== "ALL") {
        params.set("status", nextFilters.status);
      }
      if (nextFilters.teacherId && nextFilters.teacherId !== "all") {
        params.set("teacherId", nextFilters.teacherId);
      }
      if (nextFilters.search) {
        params.set("search", nextFilters.search);
      }

      setClassesLoading(true);
      try {
        const response = await apiRequest(`/classes?${params.toString()}`);
        if (response) {
          const mapped = Array.isArray(response.data)
            ? response.data.map(mapClassRecord)
            : [];
          setClasses(mapped);
          setClassesMeta(response.meta ?? null);
          setClassesSummary(response.summary ?? EMPTY_CLASSES_SUMMARY);
          classesFiltersRef.current = nextFilters;
          setClassesFilters(nextFilters);
        }
      } catch (err) {
        console.error("Failed to fetch classes", err);
      } finally {
        setClassesLoading(false);
      }
    },
    [mapClassRecord],
  );

  const loadPayments = useCallback(async () => {
    setPaymentsLoading(true);
    try {
      const response = await apiRequest("/payments?limit=100&page=1");
      const mapped = Array.isArray(response?.data)
        ? response.data.map(mapPaymentRecord)
        : [];
      setPayments(mapped);
    } catch (error) {
      console.error("Failed to load payments", error);
    } finally {
      setPaymentsLoading(false);
    }
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      const response = await listNotifications({ take: 50 });
      const payload = response?.data ?? response ?? {};
      const mapped = Array.isArray(payload.items)
        ? payload.items.map(mapNotificationRecord)
        : [];
      setNotifications(mapped);
      setUnreadNotifications(payload.unread ?? mapped.filter((item) => !item.read).length);
    } catch (error) {
      console.error("Failed to load notifications", error);
      setNotifications([]);
      setUnreadNotifications(0);
    }
  }, []);

  const loadResources = useCallback(async () => {
    setResourcesLoading(true);
    try {
      if (!academyData?.id) {
        setResources([]);
        return;
      }

      const resourceParams = new URLSearchParams({ limit: '100', page: '1', academyId: academyData.id });
      const response = await apiRequest(`/resources?${resourceParams.toString()}`);
      const rawResources = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
          ? response
          : [];
      const mapped = rawResources.map(mapResourceRecord);
      const allowedUploaderIds = new Set(teacherIdsRef.current);
      if (userId) {
        allowedUploaderIds.add(userId);
      }
      const filtered = mapped.filter((resource) =>
        allowedUploaderIds.has(resource.uploaderId ?? '') || resource.visibility === 'PUBLIC',
      );
      setResources(filtered);
    } catch (error) {
      console.error('Failed to load resources', error);
      showToast({
        status: 'error',
        title: 'Unable to load resources',
        description:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred while fetching resources.',
      });
    } finally {
      setResourcesLoading(false);
    }
  }, [showToast, userId]);

  const loadUserCollections = useCallback(async () => {
    try {
      const [pendingMembershipsResponse, approvedMembershipsResponse] =
        await Promise.all([
          apiRequest(
            "/academies/owner/memberships?limit=100&page=1&status=PENDING",
          ),
          apiRequest(
            "/academies/owner/memberships?limit=100&page=1&status=APPROVED",
          ),
        ]);

      const approvedMemberships = Array.isArray(approvedMembershipsResponse?.data)
        ? approvedMembershipsResponse.data
        : [];

      const buildMemberRecord = (membership, role) => {
        const user = membership.user ?? {};
        const profilePhotoUrl = resolveAssetUrl(user.profilePhotoUrl) ?? null;
        return {
          id: user.id ?? membership.id,
          membershipId: membership.id,
          name: buildDisplayName(user),
          firstName: user.firstName ?? "",
          lastName: user.lastName ?? "",
          email: user.email ?? "",
          role: role.toLowerCase(),
          status: user.status ?? membership.status,
          joinDate: safeLocaleDate(
            membership.respondedAt ?? membership.requestedAt,
          ),
          classes:
            role === "TEACHER"
              ? user._count?.teachingClasses ?? 0
              : user._count?.classParticipants ?? 0,
          resources:
            role === "TEACHER" ? user._count?.resources ?? 0 : undefined,
          enrolledClasses:
            role === "STUDENT" ? user._count?.classParticipants ?? 0 : undefined,
          phoneNumber: user.phoneNumber ?? "",
          gender: user.gender ?? "",
          bio: user.bio ?? "",
          dateOfBirth: user.dateOfBirth ? safeLocaleDate(user.dateOfBirth) : "",
          addressStreet: user.addressStreet ?? "",
          addressHouse: user.addressHouse ?? "",
          addressCity: user.addressCity ?? "",
          addressState: user.addressState ?? "",
          addressCountry: user.addressCountry ?? "",
          avatarUrl: profilePhotoUrl,
        };
      };

      const teachersMemberships = approvedMemberships.filter(
        (membership) => membership.role === "TEACHER",
      );
      const studentsMemberships = approvedMemberships.filter(
        (membership) => membership.role === "STUDENT",
      );

      const mappedTeachers = teachersMemberships.map((membership) =>
        buildMemberRecord(membership, "TEACHER"),
      );
      const mappedStudents = studentsMemberships.map((membership) =>
        buildMemberRecord(membership, "STUDENT"),
      );

      teacherIdsRef.current = new Set(
        mappedTeachers
          .map((teacher) => teacher.id)
          .filter((identifier) => Boolean(identifier)),
      );

      setTeachers(mappedTeachers);
      setStudents(mappedStudents);
      const pendingMemberships = Array.isArray(pendingMembershipsResponse?.data)
        ? pendingMembershipsResponse.data
        : [];
      const pendingTeachersCount = pendingMemberships.filter(
        (membership) => membership.role === "TEACHER",
      ).length;
      const pendingStudentsCount = pendingMemberships.filter(
        (membership) => membership.role === "STUDENT",
      ).length;

      const mappedPending = pendingMemberships.map(mapPendingMembershipRecord);
      setPendingUsers(mappedPending);

      setTeachersSummary({
        approved: mappedTeachers.length,
        pending: pendingTeachersCount,
        rejected: 0,
        inactive: 0,
      });
      setStudentsSummary({
        approved: mappedStudents.length,
        pending: pendingStudentsCount,
        rejected: 0,
        inactive: 0,
      });

      setSubscriptionUsage((prev) => ({
        ...prev,
        studentCount: mappedStudents.length,
        teacherCount: mappedTeachers.length,
      }));
    } catch (error) {
      console.error("Failed to load user collections", error);
    }
  }, [mapPendingMembershipRecord]);

  const loadData = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const nowIso = new Date().toISOString();
      const [overview, ownerAcademy] = await Promise.all([
        apiRequest("/dashboard/overview"),
        apiRequest("/academies/owner").catch(() => null),
      ]);

      if (overview) {
        const resolvedAcademyId =
          overview.academy?.id ?? ownerAcademy?.id ?? "";
        const resolvedAcademyName =
          overview.academy?.name ?? ownerAcademy?.name ?? academyName;
        const resolvedCreatedAt =
          overview.academy?.createdAt ?? ownerAcademy?.createdAt ?? nowIso;
        const resolvedUpdatedAt =
          overview.academy?.updatedAt ?? ownerAcademy?.updatedAt ?? nowIso;

        const overviewTransactions = Array.isArray(
          overview.zoomCredits?.recentTransactions,
        )
          ? overview.zoomCredits.recentTransactions.map((tx) => ({
              id: tx.id,
              date: tx.timestamp,
              amount: tx.amount,
              type: mapTransactionType(tx.type),
              status: "Completed",
              transactionId: tx.id,
              className: tx.summary,
            }))
          : [];

        setAcademyData({
          id: resolvedAcademyId,
          name: resolvedAcademyName,
          createdAt: resolvedCreatedAt,
          subscription: {
            plan: overview.subscription?.plan ?? "Professional",
            startDate: resolvedCreatedAt,
            endDate: resolvedUpdatedAt,
            status: "active",
          },
        });

        setZoomCredits({
          available: overview.zoomCredits?.balance ?? 0,
          used: overview.zoomCredits?.totalDebited ?? 0,
          totalCredited: overview.zoomCredits?.totalCredited ?? 0,
          history: overviewTransactions,
        });

        setSubscriptionUsage({
          studentLimit: overview.subscription?.limits?.students ?? 0,
          teacherLimit: overview.subscription?.limits?.teachers ?? 0,
          storageLimit: overview.subscription?.limits?.storageGb ?? 0,
          studentCount: overview.subscription?.usage?.students ?? 0,
          teacherCount: overview.subscription?.usage?.teachers ?? 0,
          storageUsed: overview.subscription?.usage?.storageGb ?? 0,
          zoomCreditsLimit: overview.zoomCredits?.totalCredited ?? 0,
          zoomCreditsUsed: overview.zoomCredits?.totalDebited ?? 0,
          recentActivity: Array.isArray(overview.recentActivity)
            ? overview.recentActivity.map((item) => ({
                id: item.id,
                type: item.type,
                message: item.message,
                timestamp: item.timestamp,
              }))
            : [],
        });

        setClassesSummary({
          upcoming: overview.totals?.classes?.upcoming ?? 0,
          ongoing: overview.totals?.classes?.ongoing ?? 0,
          ended: overview.totals?.classes?.completedLast30Days ?? 0,
          cancelled: 0,
        });
      }

      await fetchClasses({ page: 1 });
      await loadUserCollections();
      await Promise.all([loadResources(), loadPayments(), loadNotifications()]);

      const [zoomSummary, transactionsResponse] = await Promise.all([
        apiRequest(`/zoom-credits/${userId}/summary`).catch(() => null),
        apiRequest(
          `/zoom-credits/${userId}/transactions?limit=50&page=1`,
        ).catch(() => null),
      ]);

      if (zoomSummary) {
        setZoomCredits((prev) => ({
          ...prev,
          available: zoomSummary.balance ?? prev.available,
          used: zoomSummary.totalDebited ?? prev.used,
          totalCredited: zoomSummary.totalCredited ?? prev.totalCredited,
        }));
      }

      if (transactionsResponse?.data) {
        const mappedHistory = Array.isArray(transactionsResponse.data)
          ? transactionsResponse.data.map(mapTransactionRecord)
          : [];
        setZoomCredits((prev) => ({
          ...prev,
          history: mappedHistory,
        }));
      }

      setAcademyData((prev) => ({
        ...prev,
        name: overview?.academy?.name ?? prev.name ?? academyName,
        updatedAt: nowIso,
      }));
    } catch (fetchError) {
      const message =
        fetchError instanceof Error
          ? fetchError.message
          : "Failed to load academy data";
      setError(message);
      showToast({
        status: "error",
        title: "Dashboard refresh failed",
        description: message,
      });
    } finally {
      setLoading(false);
    }
  }, [
    academyName,
    fetchClasses,
    loadPayments,
    loadNotifications,
    loadResources,
    loadUserCollections,
    mapTransactionRecord,
    showToast,
    userId,
  ]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const approvePendingUser = useCallback(
    async (membershipId) => {
      const pendingUser = pendingUsers.find(
        (candidate) => candidate.id === membershipId,
      );
      if (!pendingUser) {
        return { success: false, error: "Pending membership not found." };
      }

      try {
        await apiRequest(`/academies/memberships/${membershipId}`, {
          method: "PATCH",
          body: { action: "APPROVE" },
        });

        setPendingUsers((prev) =>
          prev.filter((userRecord) => userRecord.id !== membershipId),
        );
        await Promise.all([loadUserCollections(), refreshAcademyContext?.()]);
        showToast({
          status: "success",
          title: "Membership approved",
          description: `${buildDisplayName(pendingUser)} now has access.`,
        });
        return { success: true };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unable to approve membership.";
        showToast({
          status: "error",
          title: "Approval failed",
          description: message,
        });
        return { success: false, error: message };
      }
    },
    [loadUserCollections, pendingUsers, refreshAcademyContext, showToast],
  );
  const rejectPendingUser = useCallback(
    async (membershipId, reason) => {
      const pendingUser = pendingUsers.find(
        (candidate) => candidate.id === membershipId,
      );
      if (!pendingUser) {
        return { success: false, error: "Pending membership not found." };
      }

      const trimmedReason = reason?.trim();
      if (!trimmedReason) {
        return { success: false, error: "Rejection reason is required." };
      }

      try {
        await apiRequest(`/academies/memberships/${membershipId}`, {
          method: "PATCH",
          body: { action: "REJECT", reason: trimmedReason },
        });

        setPendingUsers((prev) =>
          prev.filter((userRecord) => userRecord.id !== membershipId),
        );
        await Promise.all([loadUserCollections(), refreshAcademyContext?.()]);
        showToast({
          status: "success",
          title: "Membership rejected",
          description: `${buildDisplayName(pendingUser)} has been notified.`,
        });
        return { success: true };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unable to reject membership.";
        showToast({
          status: "error",
          title: "Rejection failed",
          description: message,
        });
        return { success: false, error: message };
      }
    },
    [loadUserCollections, pendingUsers, refreshAcademyContext, showToast],
  );

  const revokeMembership = useCallback(
    async (membershipId, reason) => {
      const trimmedReason = reason?.trim();
      if (!trimmedReason) {
        return { success: false, error: "Revocation reason is required." };
      }

      try {
        await apiRequest(`/academies/memberships/${membershipId}`, {
          method: "PATCH",
          body: { action: "REVOKE", reason: trimmedReason },
        });
        await Promise.all([loadUserCollections(), refreshAcademyContext?.()]);
        showToast({
          status: "success",
          title: "Access revoked",
          description: "The user can no longer access this academy.",
        });
        return { success: true };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unable to revoke membership.";
        showToast({
          status: "error",
          title: "Revocation failed",
          description: message,
        });
        return { success: false, error: message };
      }
    },
    [loadUserCollections, refreshAcademyContext, showToast],
  );

  const purchaseCredits = useCallback(
    async ({ amount, planId, currency = "USD" }) => {
      if (!userId) {
        return { success: false, error: "Unable to determine current user." };
      }

      if (!Number.isFinite(amount) || amount <= 0) {
        return { success: false, error: "Amount must be a positive number." };
      }

      try {
        const payload = await apiRequest("/zoom-credits/purchase", {
          method: "POST",
          body: {
            amount: Math.round(amount),
            planId,
            currency,
          },
        });

        if (!payload?.summary || !payload?.transaction) {
          return { success: false, error: "Unexpected response from server." };
        }

        const transactionRecord = mapTransactionRecord(payload.transaction);

        setZoomCredits((prev) => ({
          available: payload.summary.balance ?? prev.available,
          used: payload.summary.totalDebited ?? prev.used,
          totalCredited: payload.summary.totalCredited ?? prev.totalCredited,
          history: [transactionRecord, ...(prev.history ?? [])],
        }));

        await loadPayments();
        showToast({
          status: "success",
          title: "Credits purchased",
          description: `${transactionRecord.amount} credits added to your balance.`,
        });
        return { success: true, transaction: transactionRecord };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unable to purchase credits.";
        showToast({
          status: "error",
          title: "Purchase failed",
          description: message,
        });
        return { success: false, error: message };
      }
    },
    [loadPayments, mapTransactionRecord, showToast, userId],
  );

  const uploadResource = useCallback(
    async (payload) => {
      try {
        const isFileUpload = payload instanceof FormData;
        const requestBody = isFileUpload
          ? payload
          : { ...payload, academyId: payload.academyId ?? academyData?.id ?? null };
        if (isFileUpload && !requestBody.has("academyId")) {
          requestBody.append("academyId", academyData?.id ?? "");
        }
        await apiRequest(isFileUpload ? "/resources/upload" : "/resources", {
          method: "POST",
          body: requestBody,
        });
        await loadResources();
        showToast({
          status: "success",
          title: "Resource uploaded",
          description: "The resource is now available to your academy.",
        });
        return { success: true };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unable to upload resource.";
        showToast({
          status: "error",
          title: "Upload failed",
          description: message,
        });
        return { success: false, error: message };
      }
    },
    [academyData?.id, loadResources, showToast],
  );

  const updateResource = useCallback(
    async (resourceId, updates) => {
      try {
        const isFileUpload = updates instanceof FormData;
        const requestBody = isFileUpload
          ? updates
          : { ...updates, academyId: updates.academyId ?? academyData?.id ?? null };
        if (isFileUpload && !requestBody.has("academyId")) {
          requestBody.append("academyId", academyData?.id ?? "");
        }
        await apiRequest(`/resources/${resourceId}${isFileUpload ? "/upload" : ""}`, {
          method: "PATCH",
          body: requestBody,
        });
        await loadResources();
        showToast({
          status: "success",
          title: "Resource updated",
          description: "Changes have been saved successfully.",
        });
        return { success: true };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unable to update resource.";
        showToast({
          status: "error",
          title: "Update failed",
          description: message,
        });
        return { success: false, error: message };
      }
    },
    [academyData?.id, loadResources, showToast],
  );

  const deleteResource = useCallback(
    async (resourceId) => {
      try {
        await apiRequest(`/resources/${resourceId}`, {
          method: "DELETE",
        });
        await loadResources();
        showToast({
          status: "success",
          title: "Resource removed",
          description: "The resource is no longer available to users.",
        });
        return { success: true };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unable to delete resource.";
        showToast({
          status: "error",
          title: "Deletion failed",
          description: message,
        });
        return { success: false, error: message };
      }
    },
    [loadResources, showToast],
  );

  return {
    loading,
    error,
    refresh: loadData,
    academyData,
    classes,
    classesMeta,
    classesSummary,
    classesFilters,
    classesLoading,
    loadClasses: fetchClasses,
    zoomCredits,
    subscriptionUsage,
    notifications,
    unreadNotifications,
    pendingUsers,
    teachers,
    students,
    teachersSummary,
    studentsSummary,
    resources,
    resourcesLoading,
    payments,
    paymentsLoading,
    approvePendingUser,
    rejectPendingUser,
    revokeMembership,
    purchaseCredits,
    uploadResource,
    updateResource,
    deleteResource,
    refreshResources: loadResources,
    refreshPayments: loadPayments,
    setNotifications,
    setUnreadNotifications,
  };
};

export default useAcademyData;



