import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import {
  FaSearch,
  FaUserCheck,
  FaUserTimes,
  FaChalkboardTeacher,
  FaUserGraduate,
} from 'react-icons/fa';

const emptyListMessage = {
  teachers: 'No teachers found',
  students: 'No students found',
  pending: 'No pending approvals',
};

const toSearchableString = (value) => (value ?? '').toLowerCase();

const SUMMARY_TEMPLATE = { approved: 0, pending: 0, rejected: 0, inactive: 0 };

const MODAL_SIZES = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

const statusBadgeClasses = {
  approved: "bg-emerald-50 text-emerald-700",
  pending: "bg-amber-50 text-amber-700",
  rejected: "bg-rose-50 text-rose-700",
  inactive: "bg-gray-100 text-gray-600",
};

const normaliseText = (value) => (value ?? '').toString().trim();

const getInitials = (name, email) => {
  const source = normaliseText(name) || normaliseText(email);
  if (!source) {
    return 'NA';
  }
  const parts = source
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0]);
  return parts.join('').slice(0, 2).toUpperCase();
};

const formatInlineValue = (value, empty = '--') => {
  const normalised = normaliseText(value);
  if (!normalised) {
    return empty;
  }
  if (normalised.toUpperCase() === 'N/A') {
    return empty;
  }
  return normalised;
};

const Modal = ({ open, onClose, title, children, footer, size = "md" }) => {
  if (!open || typeof document === 'undefined') {
    return null;
  }

  const sizeClass = MODAL_SIZES[size] ?? MODAL_SIZES.md;

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose?.();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onMouseDown={handleBackdropClick}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`w-full ${sizeClass} rounded-xl bg-white p-6 shadow-xl`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-500 hover:bg-gray-200 hover:text-gray-700"
          >
            Close
          </button>
        </div>
        <div className="mt-4 space-y-4">{children}</div>
        {footer ? <div className="mt-6 flex justify-end gap-3">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  );
};

const UsersTab = ({
  teachers = [],
  students = [],
  pendingUsers = [],
  teacherSummary = SUMMARY_TEMPLATE,
  studentSummary = SUMMARY_TEMPLATE,
  onApproveUser,
  onRejectUser,
  onRevokeUser,
  initialSubTab = 'teachers',
}) => {
  const [activeSubTab, setActiveSubTab] = useState('teachers');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [userPendingAction, setUserPendingAction] = useState(null);
  const [pendingActionType, setPendingActionType] = useState('reject');

  useEffect(() => {
    const normalised = (initialSubTab ?? '').toLowerCase();
    if (!normalised) {
      return;
    }
    if (['teachers', 'students', 'pending'].includes(normalised)) {
      setActiveSubTab(normalised);
    }
  }, [initialSubTab]);

  const teacherStats = teacherSummary ?? SUMMARY_TEMPLATE;
  const studentStats = studentSummary ?? SUMMARY_TEMPLATE;
  const totalPending = pendingUsers.length;

  const summaryCards = useMemo(() => {
    const teacherPending = teacherStats.pending ?? 0;
    const studentPending = studentStats.pending ?? 0;
    return [
      {
        key: 'teachers',
        label: 'Approved Teachers',
        value: teacherStats.approved ?? teachers.length,
        hint: `${teacherPending} pending / ${teacherStats.inactive ?? 0} inactive`,
        Icon: FaChalkboardTeacher,
      },
      {
        key: 'students',
        label: 'Approved Students',
        value: studentStats.approved ?? students.length,
        hint: `${studentPending} pending`,
        Icon: FaUserGraduate,
      },
      {
        key: 'pending',
        label: 'Pending Approvals',
        value: totalPending,
        hint: `${teacherPending + studentPending} awaiting review`,
        Icon: FaUserTimes,
      },
    ];
  }, [studentStats, teacherStats, students.length, teachers.length, totalPending]);

  const normalisedSearch = searchTerm.trim().toLowerCase();

  const filterUsers = (list = []) => {
    if (!normalisedSearch) return list;
    return list.filter((user = {}) => {
      const fields = [
        user.name,
        user.email,
        user.phoneNumber,
        user.addressCity,
        user.addressState,
        user.addressCountry,
        user.role,
        user.status,
      ];
      const searchSpace = fields.map(toSearchableString).join(' ');
      return searchSpace.includes(normalisedSearch);
    });
  };

  const filteredTeachers = useMemo(() => filterUsers(teachers), [teachers, normalisedSearch]);
  const filteredStudents = useMemo(() => filterUsers(students), [students, normalisedSearch]);
  const filteredPending = useMemo(() => filterUsers(pendingUsers), [pendingUsers, normalisedSearch]);

  const renderAvatar = (user) => {
    if (user?.avatarUrl) {
      return (
        <img
          src={user.avatarUrl}
          alt={`${user?.name ?? 'User'} avatar`}
          className="h-14 w-14 rounded-full object-cover shadow-sm ring-2 ring-emerald-100"
        />
      );
    }
    return (
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 ring-2 ring-emerald-100 shadow-inner">
        <span className="text-sm font-semibold">{getInitials(user?.name, user?.email)}</span>
      </div>
    );
  };

  const renderStatusBadge = (status) => {
    if (!status) return null;
    const key = status.toString().toLowerCase();
    const classes = statusBadgeClasses[key] ?? "bg-gray-100 text-gray-600";
    const label = key.replace(/_/g, ' ');
    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${classes}`}>
        {label}
      </span>
    );
  };

  const renderFactRow = (items, options = {}) => {
    const { className = '' } = options;
    return (
      <div className={`mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600 ${className}`}>
        {items.map(({ label, value }) => (
          <span key={label} className="flex items-center gap-1">
            <span className="font-medium text-gray-700">{label}:</span>
            <span>{formatInlineValue(value)}</span>
          </span>
        ))}
      </div>
    );
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleApprove = (user) => {
    if (!onApproveUser || !user?.id) {
      return;
    }

    setActionError(null);
    setActionSuccess(null);
    setPendingActionType('approve');
    setUserPendingAction(user);
    setConfirmModalOpen(true);
  };

  const closeApproveModal = () => {
    setConfirmModalOpen(false);
    setUserPendingAction(null);
    setActionLoadingId(null);
    setActionError(null);
    setPendingActionType((prev) => (prev === 'approve' ? 'reject' : prev));
  };

  const submitApprove = async () => {
    if (!onApproveUser || !userPendingAction?.id) {
      return;
    }

    try {
      setActionError(null);
      setActionSuccess(null);
      setActionLoadingId(userPendingAction.id);
      const result = await onApproveUser(userPendingAction.id);
      if (result?.success === false) {
        setActionError(result.error ?? 'Unable to approve user.');
      } else {
        setActionSuccess('User approved successfully.');
        closeApproveModal();
      }
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to approve user.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = (user) => {

    if (!user?.id) {
      return;
    }

    setActionError(null);
    setActionSuccess(null);
    setRejectReason('');
    setPendingActionType('reject');
    setUserPendingAction(user);
    setRejectModalOpen(true);
  };

  const handleRevoke = (user) => {
    if (!onRevokeUser || !user?.membershipId) {
      return;
    }

    setActionError(null);
    setActionSuccess(null);
    setRejectReason('');
    setPendingActionType('revoke');
    setUserPendingAction(user);
    setRejectModalOpen(true);
  };

  const closeRejectModal = () => {
    setRejectModalOpen(false);
    setRejectReason('');
    setUserPendingAction(null);
    setActionLoadingId(null);
    setActionError(null);
    setPendingActionType('reject');
  };

  const submitReject = async () => {
    const trimmedReason = rejectReason.trim();
    if (!trimmedReason) {
      setActionError('A reason is required.');
      return;
    }

    if (pendingActionType === 'revoke') {
      if (!onRevokeUser || !userPendingAction?.membershipId) {
        setActionError('Membership details unavailable.');
        return;
      }
    } else if (!onRejectUser || !userPendingAction?.id) {
      return;
    }

    try {
      setActionError(null);
      setActionSuccess(null);
      const targetId =
        pendingActionType === 'revoke'
          ? userPendingAction.membershipId
          : userPendingAction.id;
      setActionLoadingId(targetId);
      const result =
        pendingActionType === 'revoke'
          ? await onRevokeUser(targetId, trimmedReason)
          : await onRejectUser(targetId, trimmedReason);
      if (result?.success === false) {
        setActionError(result.error ?? 'Action could not be completed.');
      } else {
        setActionSuccess(
          pendingActionType === 'revoke'
            ? 'Membership revoked successfully.'
            : 'User rejected successfully.',
        );
        closeRejectModal();
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Action could not be completed.';
      setActionError(message);
    } finally {
      setActionLoadingId(null);
    }
  };

  useEffect(() => {
    if (!actionSuccess) return;
    const timer = setTimeout(() => setActionSuccess(null), 3000);
    return () => clearTimeout(timer);
  }, [actionSuccess]);

  const renderEmptyState = (type) => (
    <div className="text-center py-8">
      <p className="text-gray-500">{emptyListMessage[type]}</p>
    </div>
  );

  const renderTeachers = () => (
    <div className="bg-white shadow overflow-hidden sm:rounded-xl">
      {filteredTeachers.length === 0
        ? renderEmptyState('teachers')
        : (
          <ul className="divide-y divide-gray-200">
            {filteredTeachers.map((teacher) => (
              <li key={teacher.id}>
                <div className="px-4 py-5 sm:px-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex flex-1 gap-4">
                      <div className="flex-shrink-0">{renderAvatar(teacher)}</div>
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-base font-semibold text-gray-900">{teacher.name}</p>
                          {renderStatusBadge(teacher.status)}
                          <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
                            {teacher.role ?? 'teacher'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">{teacher.email}</p>
                        {renderFactRow([
                          { label: 'Phone', value: teacher.phoneNumber },
                          { label: 'Joined', value: teacher.joinDate },
                          { label: 'Classes', value: teacher.classes ?? 0 },
                          { label: 'Resources', value: teacher.resources ?? 0 },
                        ])}
                        {renderFactRow(
                          [
                            { label: 'City', value: teacher.addressCity },
                            { label: 'State', value: teacher.addressState },
                            { label: 'Country', value: teacher.addressCountry },
                          ],
                          { className: 'text-sm' },
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 sm:items-end">
                      <button
                        onClick={() => handleViewUser({ ...teacher, recordType: 'teacher' })}
                        className="inline-flex items-center justify-center rounded-md border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2"
                      >
                        View profile
                      </button>
                      <button
                        onClick={() => handleRevoke(teacher)}
                        disabled={!teacher.membershipId}
                        className="inline-flex items-center justify-center rounded-md border border-transparent px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Revoke access
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
    </div>
  );

  const renderStudents = () => (
    <div className="bg-white shadow overflow-hidden sm:rounded-xl">
      {filteredStudents.length === 0
        ? renderEmptyState('students')
        : (
          <ul className="divide-y divide-gray-200">
            {filteredStudents.map((student) => (
              <li key={student.id}>
                <div className="px-4 py-5 sm:px-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex flex-1 gap-4">
                      <div className="flex-shrink-0">{renderAvatar(student)}</div>
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-base font-semibold text-gray-900">{student.name}</p>
                          {renderStatusBadge(student.status)}
                          <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
                            {student.role ?? 'student'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">{student.email}</p>
                        {renderFactRow([
                          { label: 'Phone', value: student.phoneNumber },
                          { label: 'Joined', value: student.joinDate },
                          { label: 'Enrolled classes', value: student.enrolledClasses ?? 0 },
                        ])}
                        {renderFactRow([
                          { label: 'Date of birth', value: student.dateOfBirth },
                          { label: 'City', value: student.addressCity },
                          { label: 'Country', value: student.addressCountry },
                        ])}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 sm:items-end">
                      <button
                        onClick={() => handleViewUser({ ...student, recordType: 'student' })}
                        className="inline-flex items-center justify-center rounded-md border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2"
                      >
                        View profile
                      </button>
                      <button
                        onClick={() => handleRevoke(student)}
                        disabled={!student.membershipId}
                        className="inline-flex items-center justify-center rounded-md border border-transparent px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Revoke access
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
    </div>
  );

  const renderPending = () => (
    <div className="bg-white shadow overflow-hidden sm:rounded-xl">
      {filteredPending.length === 0
        ? renderEmptyState('pending')
        : (
          <ul className="divide-y divide-gray-200">
            {filteredPending.map((user) => {
              const isProcessing = actionLoadingId === user.id;
              const roleLabel = (user.role ?? '').replace(/_/g, ' ');
              const reasonText = formatInlineValue(user.reason, '');
              return (
                <li key={user.id}>
                  <div className="px-4 py-5 sm:px-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex flex-1 gap-4">
                        <div className="flex-shrink-0">{renderAvatar(user)}</div>
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-base font-semibold text-gray-900">{user.name}</p>
                            {renderStatusBadge(user.status)}
                            <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
                              {roleLabel || 'pending user'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">{user.email}</p>
                          {renderFactRow([
                            { label: 'Requested', value: user.requestDate },
                            { label: 'Phone', value: user.phoneNumber },
                            { label: 'Gender', value: user.gender },
                          ])}
                          {renderFactRow([
                            { label: 'Date of birth', value: user.dateOfBirth },
                            { label: 'City', value: user.addressCity },
                            { label: 'Country', value: user.addressCountry },
                          ])}
                          {reasonText ? (
                            <div className="mt-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
                              <span className="font-medium text-gray-700">Message:</span> {reasonText}
                            </div>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 sm:items-end">
                        <button
                          onClick={() => handleViewUser({ ...user, recordType: 'pending' })}
                          className="inline-flex items-center justify-center rounded-md border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2"
                        >
                          View profile
                        </button>
                        <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                          <button
                            onClick={() => handleApprove(user)}
                            disabled={isProcessing}
                            className="inline-flex items-center justify-center rounded-md border border-transparent px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <FaUserCheck className="mr-1" />
                            {isProcessing ? 'Processing...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => handleReject(user)}
                            disabled={isProcessing}
                            className="inline-flex items-center justify-center rounded-md border border-transparent px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <FaUserTimes className="mr-1" />
                            {isProcessing ? 'Processing...' : 'Reject'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
    </div>
  );


  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {summaryCards.map((card) => (
          <div
            key={card.key}
            className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
          >
            <div>
              <p className="text-sm text-gray-500">{card.label}</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">{card.value}</p>
              {card.hint && <p className="mt-1 text-xs text-gray-400">{card.hint}</p>}
            </div>
            <div className="rounded-full bg-gray-100 p-3 text-gray-600">
              <card.Icon className="h-5 w-5" />
            </div>
          </div>
        ))}
      </div>
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveSubTab('teachers')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeSubTab === 'teachers'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <FaChalkboardTeacher className="mr-2" />
              Teachers
            </div>
          </button>
          <button
            onClick={() => setActiveSubTab('students')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeSubTab === 'students'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <FaUserGraduate className="mr-2" />
              Students
            </div>
          </button>
          <button
            onClick={() => setActiveSubTab('pending')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeSubTab === 'pending'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <FaUserCheck className="mr-2" />
              Pending Approvals
              {pendingUsers.length > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-red-500 text-white">
                  {pendingUsers.length}
                </span>
              )}
            </div>
          </button>
        </nav>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
      </div>

      {actionError && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{actionError}</div>
      )}

      {actionSuccess && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{actionSuccess}</div>
      )}

      {activeSubTab === 'teachers' && renderTeachers()}
      {activeSubTab === 'students' && renderStudents()}
      {activeSubTab === 'pending' && renderPending()}

      <Modal
        open={confirmModalOpen}
        onClose={closeApproveModal}
        title="Approve user?"
        size="sm"
        footer={
          <>
            <button
              type="button"
              onClick={closeApproveModal}
              className="inline-flex items-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              disabled={actionLoadingId === userPendingAction?.id}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submitApprove}
              disabled={actionLoadingId === userPendingAction?.id}
              className={`inline-flex items-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white ${
                actionLoadingId === userPendingAction?.id
                  ? 'bg-emerald-300 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {actionLoadingId === userPendingAction?.id ? 'Approving...' : 'Approve'}
            </button>
          </>
        }
      >
        <p className="text-sm text-gray-700">
          Approve {userPendingAction?.name ?? 'this user'} to join your academy?
        </p>
        <p className="text-xs text-gray-500">
          Approved users will gain immediate access to relevant resources and notifications.
        </p>
      </Modal>

      <Modal
        open={rejectModalOpen}
        onClose={closeRejectModal}
        title={pendingActionType === 'revoke' ? 'Revoke Access' : 'Reject Application'}
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={closeRejectModal}
              className="inline-flex items-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              disabled={actionLoadingId === userPendingAction?.id}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submitReject}
              disabled={actionLoadingId === userPendingAction?.id}
              className={`inline-flex items-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white ${
                actionLoadingId === userPendingAction?.id
                  ? 'bg-red-300 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {actionLoadingId === userPendingAction?.id
                ? pendingActionType === 'revoke'
                  ? 'Revoking...'
                  : 'Rejecting...'
                : pendingActionType === 'revoke'
                  ? 'Revoke'
                  : 'Reject'}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Provide a reason for {pendingActionType === 'revoke' ? 'revoking access' : 'rejecting'} {userPendingAction?.name ?? 'this user'}.
          </p>
          <textarea
            className="w-full rounded-md border border-gray-300 p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            rows={4}
            value={rejectReason}
            onChange={(event) => setRejectReason(event.target.value)}
            placeholder={pendingActionType === 'revoke' ? 'Reason for revocation' : 'Reason for rejection'}
          />
        </div>
      </Modal>

      {showUserModal && selectedUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
          <div className="flex min-h-screen items-center justify-center px-4 py-8 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500/70 transition-opacity" aria-hidden="true" />
            <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">
              &#8203;
            </span>
            <div className="inline-block w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-bottom shadow-2xl transition-all sm:my-8 sm:align-middle sm:p-8">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                <div className="mx-auto flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 ring-2 ring-emerald-200 shadow-inner sm:mx-0">
                  {selectedUser.avatarUrl ? (
                    <img
                      src={selectedUser.avatarUrl}
                      alt={`${selectedUser.name} avatar`}
                      className="h-20 w-20 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-xl font-semibold">{getInitials(selectedUser.name, selectedUser.email)}</span>
                  )}
                </div>
                <div className="flex-1 space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-semibold text-gray-900">{selectedUser.name}</h3>
                    {renderStatusBadge(selectedUser.status)}
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      {(selectedUser.role ?? '').replace(/_/g, ' ') || 'User'}
                    </span>
                  </div>
                  <div className="grid gap-4 text-sm text-gray-700 sm:grid-cols-2">
                    <div>
                      <p className="font-medium text-gray-500">Email</p>
                      <p>{selectedUser.email}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-500">Phone</p>
                      <p>{formatInlineValue(selectedUser.phoneNumber, 'Not provided')}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-500">Joined</p>
                      <p>{formatInlineValue(selectedUser.joinDate, 'Not available')}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-500">Classes</p>
                      <p>
                        {selectedUser.recordType === 'teacher'
                          ? `${selectedUser.classes ?? 0} taught`
                          : selectedUser.recordType === 'student'
                          ? `${selectedUser.enrolledClasses ?? 0} enrolled`
                          : 'Not applicable'}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-500">Gender</p>
                      <p>{formatInlineValue(selectedUser.gender, 'Not provided')}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-500">Date of birth</p>
                      <p>{formatInlineValue(selectedUser.dateOfBirth, 'Not provided')}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="font-medium text-gray-500">Address</p>
                      <p>
                        {formatInlineValue(
                          [selectedUser.addressHouse, selectedUser.addressStreet, selectedUser.addressCity, selectedUser.addressState, selectedUser.addressCountry]
                            .filter(Boolean)
                            .join(', '),
                          'Not provided',
                        )}
                      </p>
                    </div>
                    {selectedUser.bio ? (
                      <div className="sm:col-span-2">
                        <p className="font-medium text-gray-500">Bio</p>
                        <p className="text-gray-600">{selectedUser.bio}</p>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="inline-flex items-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default UsersTab;







