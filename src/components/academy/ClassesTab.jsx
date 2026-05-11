import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FaSearch,
  FaVideo,
  FaExternalLinkAlt,
  FaChalkboardTeacher,
  FaClock,
  FaCalendarAlt,
  FaUserFriends,
} from 'react-icons/fa';

const STATUS_FILTER_MAP = {
  upcoming: 'UPCOMING',
  ongoing: 'ONGOING',
  past: 'ENDED',
  attendance: 'ENDED',
};

const EMPTY_CLASSES_SUMMARY = {
  upcoming: 0,
  ongoing: 0,
  ended: 0,
  cancelled: 0,
};

const ClassesTab = ({
  classes = [],
  summary = EMPTY_CLASSES_SUMMARY,
  meta = null,
  filters = {},
  loading = false,
  onChangeFilters,
  activeSubTab,
  setActiveSubTab,
}) => {
  const [searchTerm, setSearchTerm] = useState(filters.search ?? '');
  const [teacherFilter, setTeacherFilter] = useState(filters.teacherId ?? 'all');
  const [selectedClass, setSelectedClass] = useState(null);
  const [showClassModal, setShowClassModal] = useState(false);

  const classesSummary = { ...EMPTY_CLASSES_SUMMARY, ...(summary ?? {}) };

  useEffect(() => {
    setSearchTerm(filters.search ?? '');
  }, [filters.search]);

  useEffect(() => {
    setTeacherFilter(filters.teacherId ?? 'all');
  }, [filters.teacherId]);

  useEffect(() => {
    if (typeof onChangeFilters !== 'function') {
      return;
    }
    const expected = STATUS_FILTER_MAP[activeSubTab] ?? 'ALL';
    const current = filters.status ?? 'ALL';
    if (expected !== current) {
      onChangeFilters({ status: expected, page: 1 });
    }
  }, [activeSubTab, filters.status, onChangeFilters]);

  useEffect(() => {
    if (typeof onChangeFilters !== 'function') {
      return;
    }
    const normalized = filters.search ?? '';
    if (searchTerm === normalized) {
      return;
    }
    const debounce = setTimeout(() => {
      onChangeFilters({ search: searchTerm, page: 1 });
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm, filters.search, onChangeFilters]);

  const teacherOptions = useMemo(() => {
    const map = new Map();
    classes.forEach((cls) => {
      if (cls.teacherId) {
        map.set(cls.teacherId, cls.teacher);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [classes]);

  const statusCards = useMemo(
    () => [
      {
        key: 'upcoming',
        label: 'Upcoming',
        value: classesSummary.upcoming,
        Icon: FaCalendarAlt,
        accent: 'bg-blue-50 text-blue-600',
      },
      {
        key: 'ongoing',
        label: 'In Progress',
        value: classesSummary.ongoing,
        Icon: FaClock,
        accent: 'bg-red-50 text-red-600',
      },
      {
        key: 'ended',
        label: 'Completed (30d)',
        value: classesSummary.ended,
        Icon: FaVideo,
        accent: 'bg-emerald-50 text-emerald-600',
      },
      {
        key: 'cancelled',
        label: 'Cancelled',
        value: classesSummary.cancelled,
        Icon: FaUserFriends,
        accent: 'bg-amber-50 text-amber-600',
      },
    ],
    [classesSummary],
  );

  const attendanceMetrics = useMemo(() => {
    const endedClasses = classes.filter((cls) => cls.status === 'ended');
    if (!endedClasses.length) {
      return { averageRate: 0, best: null, worst: null, rates: [] };
    }

    const rates = endedClasses.map((cls) => {
      const base = cls.students_count || 0;
      const value = base > 0 ? Math.round(((cls.attendance ?? 0) / base) * 100) : 0;
      return { ...cls, rate: value };
    });

    const total = rates.reduce((acc, item) => acc + item.rate, 0);
    const averageRate = Math.round(total / rates.length);
    const sorted = [...rates].sort((a, b) => b.rate - a.rate);

    return {
      averageRate,
      best: sorted[0],
      worst: sorted[sorted.length - 1],
      rates,
    };
  }, [classes]);

  const handleTeacherFilterChange = (event) => {
    const value = event.target.value;
    setTeacherFilter(value);
    if (typeof onChangeFilters === 'function') {
      onChangeFilters({ teacherId: value === 'all' ? undefined : value, page: 1 });
    }
  };

  const handleTabChange = (tab) => {
    setActiveSubTab(tab);
  };

  const handleViewDetails = (classItem) => {
    setSelectedClass(classItem);
    setShowClassModal(true);
  };

  const closeModal = () => {
    setSelectedClass(null);
    setShowClassModal(false);
  };

  const openZoomLink = (link) => {
    if (!link) {
      return;
    }
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  const renderStatusBadge = (status) => {
    const accent =
      status === 'ongoing'
        ? 'bg-red-100 text-red-700'
        : status === 'upcoming'
        ? 'bg-blue-100 text-blue-700'
        : status === 'cancelled'
        ? 'bg-amber-100 text-amber-700'
        : 'bg-gray-100 text-gray-600';

    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${accent}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const renderEmptyState = (message = 'No classes found for the selected filters.') => (
    <div className="flex items-center justify-center rounded-lg border border-dashed border-gray-200 bg-white p-10 text-sm text-gray-500">
      {message}
    </div>
  );

  const renderClassesTable = (rows) => {
    if (!rows.length) {
      return renderEmptyState();
    }

    return (
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Class
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Teacher
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Schedule
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Participants
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {rows.map((classItem) => (
                <tr key={classItem.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-gray-900">{classItem.title}</div>
                    {classItem.description && (
                      <p className="mt-1 text-sm text-gray-500 line-clamp-2">{classItem.description}</p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{classItem.teacher || 'â€”'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div>{classItem.schedule || new Date(classItem.date).toLocaleString()}</div>
                    {classItem.timezone && <div className="text-xs text-gray-400">{classItem.timezone}</div>}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{classItem.duration} mins</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{classItem.students_count ?? 0}</td>
                  <td className="px-6 py-4 text-sm">{renderStatusBadge(classItem.status)}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center space-x-2">
                      {classItem.status !== 'ended' && classItem.zoomLink && (
                        <button
                          onClick={() => openZoomLink(classItem.zoomLink)}
                          className="inline-flex items-center rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-blue-500 hover:text-blue-600"
                        >
                          <FaExternalLinkAlt className="mr-1" /> Join
                        </button>
                      )}
                      <button
                        onClick={() => handleViewDetails(classItem)}
                        className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                      >
                        View Details
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderAttendanceInsights = () => (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Average Attendance</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{attendanceMetrics.averageRate}%</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Best Performing Class</p>
          <p className="mt-2 text-base font-semibold text-gray-900">
            {attendanceMetrics.best ? attendanceMetrics.best.title : 'â€”'}
          </p>
          {attendanceMetrics.best && (
            <p className="text-sm text-gray-500">{attendanceMetrics.best.rate}% attendance</p>
          )}
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Needs Attention</p>
          <p className="mt-2 text-base font-semibold text-gray-900">
            {attendanceMetrics.worst ? attendanceMetrics.worst.title : 'â€”'}
          </p>
          {attendanceMetrics.worst && (
            <p className="text-sm text-gray-500">{attendanceMetrics.worst.rate}% attendance</p>
          )}
        </div>
      </div>
      {attendanceMetrics.rates.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Class
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Teacher
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Participants
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Attendance Rate
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {attendanceMetrics.rates.map((item) => {
                  const participants = item.students_count ?? 0;
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">{item.title}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{item.teacher || '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{participants}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{item.rate}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        renderEmptyState('No attendance data available yet.')
      )}
    </div>
  );

  const handlePageChange = (page) => {
    if (!onChangeFilters || !page || page === filters.page) {
      return;
    }
    onChangeFilters({ page });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statusCards.map((card) => (
          <div
            key={card.key}
            className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
          >
            <div>
              <p className="text-sm text-gray-500">{card.label}</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">{card.value}</p>
            </div>
            <div className={`rounded-full p-3 ${card.accent}`}>
              <card.Icon className="h-5 w-5" />
            </div>
          </div>
        ))}
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-6">
          {['upcoming', 'ongoing', 'past', 'attendance'].map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`whitespace-nowrap border-b-2 py-3 text-sm font-medium ${
                activeSubTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              {tab === 'past' ? 'Completed' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:w-72">
          <FaSearch className="pointer-events-none absolute inset-y-0 left-3 my-auto h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search classes or teachers..."
            className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-3">
          <select
            value={teacherFilter}
            onChange={handleTeacherFilterChange}
            className="rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Teachers</option>
            {teacherOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => onChangeFilters && onChangeFilters({})}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:border-blue-500 hover:text-blue-600"
          >
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center rounded-lg border border-dashed border-gray-200 bg-white p-10 text-sm text-gray-500">
          Loading classes...
        </div>
      ) : activeSubTab === 'attendance' ? (
        renderAttendanceInsights()
      ) : (
        renderClassesTable(classes)
      )}

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600">
          <div>
            Showing page {meta.currentPage} of {meta.totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!meta.previousPage || loading}
              onClick={() => handlePageChange(meta.previousPage)}
              className={`inline-flex items-center rounded-md border px-3 py-1.5 ${
                meta.previousPage && !loading
                  ? 'border-gray-300 bg-white text-gray-600 hover:border-blue-500 hover:text-blue-600'
                  : 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400'
              }`}
            >
              Previous
            </button>
            <button
              type="button"
              disabled={!meta.nextPage || loading}
              onClick={() => handlePageChange(meta.nextPage)}
              className={`inline-flex items-center rounded-md border px-3 py-1.5 ${
                meta.nextPage && !loading
                  ? 'border-gray-300 bg-white text-gray-600 hover:border-blue-500 hover:text-blue-600'
                  : 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {showClassModal && selectedClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 px-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-lg bg-white shadow-xl">
            <div className="border-b border-gray-200 px-6 py-4">
              <h3 className="text-xl font-semibold text-gray-900">{selectedClass.title}</h3>
              <p className="mt-1 text-sm text-gray-500">{selectedClass.description || 'No description provided.'}</p>
            </div>
            <div className="space-y-4 px-6 py-4 text-sm text-gray-700">
              <div className="flex items-center gap-2 text-gray-600">
                <FaChalkboardTeacher className="text-blue-500" />
                <span>Teacher:</span>
                <span className="font-medium text-gray-900">{selectedClass.teacher || 'Unassigned'}</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase text-gray-500">Start</p>
                  <p className="mt-1 font-medium text-gray-900">
                    {new Date(selectedClass.date).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-500">End</p>
                  <p className="mt-1 font-medium text-gray-900">
                    {selectedClass.endDate ? new Date(selectedClass.endDate).toLocaleString() : 'â€”'}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-500">Duration</p>
                  <p className="mt-1 font-medium text-gray-900">{selectedClass.duration} minutes</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-500">Participants</p>
                  <p className="mt-1 font-medium text-gray-900">{selectedClass.students_count ?? 0}</p>
                </div>
                {selectedClass.status === 'ended' && (
                  <div>
                    <p className="text-xs uppercase text-gray-500">Attendance</p>
                    <p className="mt-1 font-medium text-gray-900">
                      {selectedClass.attendance ?? 0}/{selectedClass.students_count ?? 0}
                    </p>
                  </div>
                )}
              </div>
              {selectedClass.zoomLink && (
                <button
                  type="button"
                  onClick={() => openZoomLink(selectedClass.zoomLink)}
                  className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  <FaExternalLinkAlt className="mr-2" />
                  Open Zoom Meeting
                </button>
              )}
            </div>
            <div className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-3">
              <button
                type="button"
                onClick={closeModal}
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:border-blue-500 hover:text-blue-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ClassesTab;

