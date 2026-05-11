import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
    FaArrowRight,
    FaBars,
    FaBell,
    FaChalkboardTeacher,
    FaChartBar,
    FaChevronDown,
    FaCog,
    FaEnvelope,
    FaGraduationCap,
    FaHome,
    FaInfoCircle,
    FaLock,
    FaSignOutAlt,
    FaTag,
    FaTimes,
    FaUser,
    FaUsers,
} from "react-icons/fa";
import { HiOutlineAcademicCap } from "react-icons/hi";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { listNotifications } from "../utils/notificationsApi";
import ChangePasswordModal from "./common/ChangePasswordModal";

const Navbar = () => {
  const { user, userRole, userDetails, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [profileDropdown, setProfileDropdown] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();

  // Poll notifications every 30s
  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return undefined;
    }
    let cancelled = false;
    const load = async () => {
      try {
        const res = await listNotifications({ take: 1 });
        const unread = res?.unread ?? res?.data?.unread ?? 0;
        if (!cancelled) setUnreadCount(unread);
      } catch {
        /* ignore */
      }
    };
    load();
    const id = setInterval(load, 30000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [user, location.pathname]);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [scrolled]);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Get dashboard link based on user role
  const getDashboardLink = () => {
    if (!userRole) return "/dashboard";

    switch (userRole) {
      case "super_admin":
        return "/super-admin/dashboard";
      case "academy_owner":
        return "/academy/dashboard";
      case "teacher":
        return "/teacher/dashboard";
      case "student":
        return "/student/dashboard";
      default:
        return "/dashboard";
    }
  };

  // Get user display name
  const getUserDisplayName = () => {
    if (!user) return "";

    if (userDetails?.name) return userDetails.name;
    if (userDetails?.full_name) return userDetails.full_name;

    return user.email.split("@")[0];
  };

  const avatarUrl =
    userDetails?.profilePhotoUrl ?? user?.profilePhotoUrl ?? null;

  const getAvatarInitials = () => {
    if (!user) return "YOU";
    const source = getUserDisplayName();
    const parts = source.split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
      return (user.email ?? "").slice(0, 2).toUpperCase();
    }
    const initials =
      (parts[0]?.[0] ?? "") +
      (parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "");
    return initials.toUpperCase();
  };

  const dashboardPrefixes = [
    "/dashboard",
    "/academy",
    "/teacher",
    "/student",
    "/super-admin",
  ];
  const isDashboardRoute = dashboardPrefixes.some((prefix) =>
    location.pathname.startsWith(prefix),
  );
  const hasSidebarOffset =
    location.pathname.startsWith("/academy/dashboard") ||
    location.pathname.startsWith("/super-admin");
  const navOffsetClasses = hasSidebarOffset
    ? "lg:left-64 lg:w-[calc(100%-16rem)]"
    : "";

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed z-50 w-full transition-all duration-300 ${navOffsetClasses} ${
        scrolled
          ? "bg-white/95 backdrop-blur-xl shadow-md border-b border-emerald-100"
          : "bg-white/80 backdrop-blur-md"
      }`}
    >
      <div
        className={`px-4 mx-auto sm:px-6 lg:px-8 ${
          isDashboardRoute ? "max-w-none" : "max-w-7xl"
        }`}
      >
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center">
            <motion.div
              className="flex-shrink-0"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <Link to="/" className="flex items-center space-x-1 group">
                <div className="relative">
                  <div className="absolute inset-0 opacity-75 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl blur-sm"></div>
                  <div className="relative bg-gradient-to-br from-primary-500 to-primary-700 p-2.5 rounded-xl">
                    <HiOutlineAcademicCap className="text-white h-7 w-7" />
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-bold tracking-tight text-gray-900 transition-colors group-hover:text-primary-700">
                    EduPlatform
                  </span>
                  <span className="-mt-1 text-xs font-medium text-primary-600">
                    Learning Excellence
                  </span>
                </div>
              </Link>
            </motion.div>
            <div className="hidden lg:block">
              <div className="flex items-center ml-10 space-x-2">
                {!user ? (
                  <>
                    <Link
                      to="/"
                      className="px-3 py-2 text-sm font-medium text-gray-700 transition-all duration-200 border-b-2 border-transparent hover:text-primary-600 hover:border-primary-500"
                    >
                      Home
                    </Link>
                    <Link
                      to="/features"
                      className="px-3 py-2 text-sm font-medium text-gray-700 transition-all duration-200 border-b-2 border-transparent hover:text-primary-600 hover:border-primary-500"
                    >
                      Features
                    </Link>
                    <Link
                      to="/pricing"
                      className="px-3 py-2 text-sm font-medium text-gray-700 transition-all duration-200 border-b-2 border-transparent hover:text-primary-600 hover:border-primary-500"
                    >
                      Pricing
                    </Link>
                    <Link
                      to="/contact"
                      className="px-3 py-2 text-sm font-medium text-gray-700 transition-all duration-200 border-b-2 border-transparent hover:text-primary-600 hover:border-primary-500"
                    >
                      Contact
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      to={getDashboardLink()}
                      className="px-3 py-2 text-sm font-medium text-gray-700 transition-all duration-200 border-b-2 border-transparent hover:text-primary-600 hover:border-primary-500"
                    >
                      Dashboard
                    </Link>
                    {userRole === "super_admin" && (
                      <>
                        <Link
                          to="/super-admin/academies"
                          className="px-3 py-2 text-sm font-medium text-gray-700 transition-all duration-200 border-b-2 border-transparent hover:text-primary-600 hover:border-primary-500"
                        >
                          Academies
                        </Link>
                        <Link
                          to="/super-admin/users"
                          className="px-3 py-2 text-sm font-medium text-gray-700 transition-all duration-200 border-b-2 border-transparent hover:text-primary-600 hover:border-primary-500"
                        >
                          Users
                        </Link>
                        <Link
                          to="/super-admin/platform-settings"
                          className="px-3 py-2 text-sm font-medium text-gray-700 transition-all duration-200 border-b-2 border-transparent hover:text-primary-600 hover:border-primary-500"
                        >
                          Settings
                        </Link>
                        <Link
                          to="/super-admin/reports"
                          className="px-3 py-2 text-sm font-medium text-gray-700 transition-all duration-200 border-b-2 border-transparent hover:text-primary-600 hover:border-primary-500"
                        >
                          Reports
                        </Link>
                        <Link
                          to="/super-admin/billing"
                          className="px-3 py-2 text-sm font-medium text-gray-700 transition-all duration-200 border-b-2 border-transparent hover:text-primary-600 hover:border-primary-500"
                        >
                          Billing
                        </Link>
                      </>
                    )}
                    {userRole === "academy_owner" && (
                      <Link
                        to="/academy/subscription"
                        className="px-3 py-2 text-sm font-medium text-gray-700 transition-all duration-200 border-b-2 border-transparent hover:text-primary-600 hover:border-primary-500"
                      >
                        Subscription
                      </Link>
                    )}
                    {userRole === "academy_owner" && (
                      <Link
                        to="/academy/billing"
                        className="px-3 py-2 text-sm font-medium text-gray-700 transition-all duration-200 border-b-2 border-transparent hover:text-primary-600 hover:border-primary-500"
                      >
                        Billing
                      </Link>
                    )}
                    {userRole === "teacher" && (
                      <>
                        <Link
                          to="/teacher/subscription"
                          className="px-3 py-2 text-sm font-medium text-gray-700 transition-all duration-200 border-b-2 border-transparent hover:text-primary-600 hover:border-primary-500"
                        >
                          Subscription
                        </Link>
                        <Link
                          to="/teacher/billing"
                          className="px-3 py-2 text-sm font-medium text-gray-700 transition-all duration-200 border-b-2 border-transparent hover:text-primary-600 hover:border-primary-500"
                        >
                          Billing
                        </Link>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="flex items-center ml-8 space-x-5">
              {user ? (
                <div className="flex items-center space-x-5">
                  {/* Notifications */}
                  <Link to="/notifications" aria-label="Notifications">
                    <motion.span
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="relative inline-flex items-center justify-center p-2 text-gray-600 transition-colors duration-200 hover:text-primary-600"
                    >
                      <FaBell className="w-5 h-5" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white border-2 border-white">
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                      )}
                    </motion.span>
                  </Link>

                  {/* Profile Dropdown */}
                  <div className="relative">
                    <motion.button
                      onClick={() => setProfileDropdown(!profileDropdown)}
                      className="flex items-center px-3 py-2 space-x-2 transition-all duration-200 bg-white border border-gray-200 rounded-full shadow-sm hover:bg-gray-50 hover:border-primary-300"
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div
                        className={`flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-primary-200 shadow-inner ${
                          avatarUrl
                            ? "bg-white"
                            : "bg-gradient-to-br from-primary-500 to-primary-600"
                        }`}
                      >
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt="Profile avatar"
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <span className="text-xs font-semibold tracking-wider text-white uppercase">
                            {getAvatarInitials()}
                          </span>
                        )}
                      </div>
                      <div className="hidden text-left xl:block">
                        <div className="text-sm font-medium text-gray-800">
                          {getUserDisplayName()}
                        </div>
                        {userRole && (
                          <div className="text-xs font-medium text-primary-600">
                            {userRole
                              .replace("_", " ")
                              .replace(/\b\w/g, (l) => l.toUpperCase())}
                          </div>
                        )}
                      </div>
                      <FaChevronDown className="w-3 h-3 text-gray-400" />
                    </motion.button>

                    {/* Profile Dropdown */}
                    <AnimatePresence>
                      {profileDropdown && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                          className="absolute right-0 z-50 w-56 py-2 mt-2 bg-white border border-gray-100 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5"
                        >
                          <div className="px-4 py-3 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                              <div
                                className={`flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-primary-200 shadow-inner ${
                                  avatarUrl
                                    ? "bg-white"
                                    : "bg-gradient-to-br from-primary-500 to-primary-600"
                                }`}
                              >
                                {avatarUrl ? (
                                  <img
                                    src={avatarUrl}
                                    alt="Profile avatar"
                                    className="object-cover w-full h-full"
                                  />
                                ) : (
                                  <span className="text-sm font-semibold tracking-wider text-white uppercase">
                                    {getAvatarInitials()}
                                  </span>
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-800">
                                  {getUserDisplayName()}
                                </p>
                                <p className="mt-0.5 text-xs text-gray-500 truncate">
                                  {user?.email}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="py-1">
                            <Link
                              to={getDashboardLink()}
                              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary-600"
                            >
                              <FaChalkboardTeacher className="w-4 h-4 mr-3 text-gray-400" />
                              Dashboard
                            </Link>

                            {userRole === "academy_owner" && (
                              <Link
                                to="/academy/subscription"
                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary-600"
                              >
                                <FaGraduationCap className="w-4 h-4 mr-3 text-gray-400" />
                                Subscription
                              </Link>
                            )}

                            {userRole === "teacher" && (
                              <>
                                <Link
                                  to="/teacher/subscription"
                                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary-600"
                                >
                                  <FaGraduationCap className="w-4 h-4 mr-3 text-gray-400" />
                                  Subscription
                                </Link>
                                <Link
                                  to="/teacher/billing"
                                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary-600"
                                >
                                  <FaChartBar className="w-4 h-4 mr-3 text-gray-400" />
                                  Billing
                                </Link>
                              </>
                            )}

                            {userRole === "super_admin" && (
                              <>
                                <Link
                                  to="/super-admin/academies"
                                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary-600"
                                >
                                  <FaGraduationCap className="w-4 h-4 mr-3 text-gray-400" />
                                  Academy management
                                </Link>
                                <Link
                                  to="/super-admin/users"
                                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary-600"
                                >
                                  <FaUsers className="w-4 h-4 mr-3 text-gray-400" />
                                  User management
                                </Link>
                                <Link
                                  to="/super-admin/platform-settings"
                                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary-600"
                                >
                                  <FaCog className="w-4 h-4 mr-3 text-gray-400" />
                                  Platform settings
                                </Link>
                                <Link
                                  to="/super-admin/reports"
                                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary-600"
                                >
                                  <FaChartBar className="w-4 h-4 mr-3 text-gray-400" />
                                  Reports &amp; billing
                                </Link>
                                <Link
                                  to="/super-admin/billing"
                                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary-600"
                                >
                                  <FaChartBar className="w-4 h-4 mr-3 text-gray-400" />
                                  Platform billing
                                </Link>
                              </>
                            )}
                          </div>

                          <div className="py-1 border-t border-gray-100">
                            <button
                              onClick={() => {
                                setProfileDropdown(false);
                                setShowChangePassword(true);
                              }}
                              className="flex items-center w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 hover:text-primary-600"
                            >
                              <FaLock className="w-4 h-4 mr-3 text-gray-400" />
                              Change password
                            </button>
                            <button
                              onClick={signOut}
                              className="flex items-center w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-red-50"
                            >
                              <FaSignOutAlt className="w-4 h-4 mr-3 text-red-500" />
                              Sign out
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <motion.div whileTap={{ scale: 0.97 }}>
                    <Link
                      to="/login"
                      className="px-4 py-2 text-sm font-medium transition-all duration-200 border border-transparent rounded-md text-primary-600 hover:text-primary-700 hover:border-primary-200"
                    >
                      Sign In
                    </Link>
                  </motion.div>
                  <motion.div whileTap={{ scale: 0.97 }}>
                    <Link
                      to="/register"
                      className="flex items-center px-4 py-2 space-x-2 text-sm font-medium text-white transition-all duration-200 rounded-md shadow-sm bg-primary-600 hover:bg-primary-700 hover:shadow"
                    >
                      <span>Get Started</span>
                      <FaArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </motion.div>
                </div>
              )}
            </div>
          </div>
          <div className="flex lg:hidden">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleMenu}
              className="p-2 text-gray-600 transition-all duration-200 rounded-md hover:text-primary-600 hover:bg-gray-100"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <FaTimes className="w-5 h-5" />
              ) : (
                <FaBars className="w-5 h-5" />
              )}
            </motion.button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="absolute left-0 right-0 overflow-hidden border-t border-gray-100 shadow-md lg:hidden top-full bg-white/95 backdrop-blur-md"
          >
            <div className="px-4 py-4 space-y-1 max-h-[80vh] overflow-y-auto">
              {!user ? (
                // Public navigation links for mobile
                <>
                  <Link
                    to="/"
                    className="flex items-center space-x-3 px-3 py-2.5 rounded-md text-gray-700 hover:text-primary-600 hover:bg-gray-50 transition-all duration-200"
                  >
                    <FaHome className="w-5 h-5 text-gray-400" />
                    <span className="font-medium">Home</span>
                  </Link>
                  <Link
                    to="/features"
                    className="flex items-center space-x-3 px-3 py-2.5 rounded-md text-gray-700 hover:text-primary-600 hover:bg-gray-50 transition-all duration-200"
                  >
                    <FaInfoCircle className="w-5 h-5 text-gray-400" />
                    <span className="font-medium">Features</span>
                  </Link>
                  <Link
                    to="/pricing"
                    className="flex items-center space-x-3 px-3 py-2.5 rounded-md text-gray-700 hover:text-primary-600 hover:bg-gray-50 transition-all duration-200"
                  >
                    <FaTag className="w-5 h-5 text-gray-400" />
                    <span className="font-medium">Pricing</span>
                  </Link>
                  <Link
                    to="/contact"
                    className="flex items-center space-x-3 px-3 py-2.5 rounded-md text-gray-700 hover:text-primary-600 hover:bg-gray-50 transition-all duration-200"
                  >
                    <FaEnvelope className="w-5 h-5 text-gray-400" />
                    <span className="font-medium">Contact</span>
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to={getDashboardLink()}
                    className="flex items-center space-x-3 px-3 py-2.5 rounded-md text-gray-700 hover:text-primary-600 hover:bg-gray-50 transition-all duration-200"
                  >
                    <FaChalkboardTeacher className="w-5 h-5 text-gray-400" />
                    <span className="font-medium">Dashboard</span>
                  </Link>
                  <Link
                    to="/notifications"
                    className="flex items-center space-x-3 px-3 py-2.5 rounded-md text-gray-700 hover:text-primary-600 hover:bg-gray-50 transition-all duration-200"
                  >
                    <FaBell className="w-5 h-5 text-gray-400" />
                    <span className="font-medium">Notifications</span>
                    {unreadCount > 0 ? (
                      <span className="ml-auto inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-semibold text-white">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    ) : null}
                  </Link>
                  {userRole === "super_admin" && (
                    <>
                      <Link
                        to="/super-admin/academies"
                        className="flex items-center space-x-3 px-3 py-2.5 rounded-md text-gray-700 hover:text-primary-600 hover:bg-gray-50 transition-all duration-200"
                      >
                        <FaGraduationCap className="w-5 h-5 text-gray-400" />
                        <span className="font-medium">Academies</span>
                      </Link>
                      <Link
                        to="/super-admin/users"
                        className="flex items-center space-x-3 px-3 py-2.5 rounded-md text-gray-700 hover:text-primary-600 hover:bg-gray-50 transition-all duration-200"
                      >
                        <FaUsers className="w-5 h-5 text-gray-400" />
                        <span className="font-medium">Users</span>
                      </Link>
                      <Link
                        to="/super-admin/platform-settings"
                        className="flex items-center space-x-3 px-3 py-2.5 rounded-md text-gray-700 hover:text-primary-600 hover:bg-gray-50 transition-all duration-200"
                      >
                        <FaCog className="w-5 h-5 text-gray-400" />
                        <span className="font-medium">Platform settings</span>
                      </Link>
                      <Link
                        to="/super-admin/reports"
                        className="flex items-center space-x-3 px-3 py-2.5 rounded-md text-gray-700 hover:text-primary-600 hover:bg-gray-50 transition-all duration-200"
                      >
                        <FaChartBar className="w-5 h-5 text-gray-400" />
                        <span className="font-medium">
                          Reports &amp; billing
                        </span>
                      </Link>
                      <Link
                        to="/super-admin/billing"
                        className="flex items-center space-x-3 px-3 py-2.5 rounded-md text-gray-700 hover:text-primary-600 hover:bg-gray-50 transition-all duration-200"
                      >
                        <FaChartBar className="w-5 h-5 text-gray-400" />
                        <span className="font-medium">Platform billing</span>
                      </Link>
                    </>
                  )}
                  {userRole === "academy_owner" && (
                    <Link
                      to="/academy/subscription"
                      className="flex items-center space-x-3 px-3 py-2.5 rounded-md text-gray-700 hover:text-primary-600 hover:bg-gray-50 transition-all duration-200"
                    >
                      <FaGraduationCap className="w-5 h-5 text-gray-400" />
                      <span className="font-medium">Subscription</span>
                    </Link>
                  )}
                  {userRole === "academy_owner" && (
                    <Link
                      to="/academy/billing"
                      className="flex items-center space-x-3 px-3 py-2.5 rounded-md text-gray-700 hover:text-primary-600 hover:bg-gray-50 transition-all duration-200"
                    >
                      <FaChartBar className="w-5 h-5 text-gray-400" />
                      <span className="font-medium">Billing</span>
                    </Link>
                  )}
                  {userRole === "teacher" && (
                    <>
                      <Link
                        to="/teacher/subscription"
                        className="flex items-center space-x-3 px-3 py-2.5 rounded-md text-gray-700 hover:text-primary-600 hover:bg-gray-50 transition-all duration-200"
                      >
                        <FaGraduationCap className="w-5 h-5 text-gray-400" />
                        <span className="font-medium">Subscription</span>
                      </Link>
                      <Link
                        to="/teacher/billing"
                        className="flex items-center space-x-3 px-3 py-2.5 rounded-md text-gray-700 hover:text-primary-600 hover:bg-gray-50 transition-all duration-200"
                      >
                        <FaChartBar className="w-5 h-5 text-gray-400" />
                        <span className="font-medium">Billing</span>
                      </Link>
                    </>
                  )}
                </>
              )}
            </div>
            <div className="pt-3 mt-3 border-t border-gray-100">
              {user ? (
                <div className="px-4 space-y-3">
                  <div className="px-3 py-3 rounded-md bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600">
                        <FaUser className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-800">
                          {getUserDisplayName()}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {user.email}
                        </div>
                        {userRole && (
                          <div className="mt-1.5">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700">
                              {userRole
                                .replace("_", " ")
                                .replace(/\b\w/g, (l) => l.toUpperCase())}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {userRole === "academy_owner" && (
                      <>
                        <Link
                          to="/academy/subscription"
                          className="flex items-center space-x-3 px-3 py-2.5 rounded-md text-gray-700 hover:text-primary-600 hover:bg-gray-50 transition-all duration-200"
                        >
                          <FaGraduationCap className="w-5 h-5 text-gray-400" />
                          <span className="font-medium">
                            Manage Subscription
                          </span>
                        </Link>
                        <Link
                          to="/academy/billing"
                          className="flex items-center space-x-3 px-3 py-2.5 rounded-md text-gray-700 hover:text-primary-600 hover:bg-gray-50 transition-all duration-200"
                        >
                          <FaChartBar className="w-5 h-5 text-gray-400" />
                          <span className="font-medium">Billing</span>
                        </Link>
                      </>
                    )}
                    {userRole === "teacher" && (
                      <>
                        <Link
                          to="/teacher/subscription"
                          className="flex items-center space-x-3 px-3 py-2.5 rounded-md text-gray-700 hover:text-primary-600 hover:bg-gray-50 transition-all duration-200"
                        >
                          <FaGraduationCap className="w-5 h-5 text-gray-400" />
                          <span className="font-medium">Subscription</span>
                        </Link>
                        <Link
                          to="/teacher/billing"
                          className="flex items-center space-x-3 px-3 py-2.5 rounded-md text-gray-700 hover:text-primary-600 hover:bg-gray-50 transition-all duration-200"
                        >
                          <FaChartBar className="w-5 h-5 text-gray-400" />
                          <span className="font-medium">Billing</span>
                        </Link>
                      </>
                    )}
                    {userRole === "super_admin" && (
                      <>
                        <Link
                          to="/super-admin/academies"
                          className="flex items-center space-x-3 px-3 py-2.5 rounded-md text-gray-700 hover:text-primary-600 hover:bg-gray-50 transition-all duration-200"
                        >
                          <FaGraduationCap className="w-5 h-5 text-gray-400" />
                          <span className="font-medium">
                            Academy management
                          </span>
                        </Link>
                        <Link
                          to="/super-admin/users"
                          className="flex items-center space-x-3 px-3 py-2.5 rounded-md text-gray-700 hover:text-primary-600 hover:bg-gray-50 transition-all duration-200"
                        >
                          <FaUsers className="w-5 h-5 text-gray-400" />
                          <span className="font-medium">User management</span>
                        </Link>
                        <Link
                          to="/super-admin/platform-settings"
                          className="flex items-center space-x-3 px-3 py-2.5 rounded-md text-gray-700 hover:text-primary-600 hover:bg-gray-50 transition-all duration-200"
                        >
                          <FaCog className="w-5 h-5 text-gray-400" />
                          <span className="font-medium">Platform settings</span>
                        </Link>
                        <Link
                          to="/super-admin/reports"
                          className="flex items-center space-x-3 px-3 py-2.5 rounded-md text-gray-700 hover:text-primary-600 hover:bg-gray-50 transition-all duration-200"
                        >
                          <FaChartBar className="w-5 h-5 text-gray-400" />
                          <span className="font-medium">
                            Reports &amp; billing
                          </span>
                        </Link>
                      </>
                    )}
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        setProfileDropdown(false);
                        setShowChangePassword(true);
                      }}
                      className="flex items-center space-x-3 px-3 py-2.5 rounded-md text-gray-700 hover:text-primary-600 hover:bg-gray-50 transition-all duration-200 w-full text-left"
                    >
                      <FaLock className="w-5 h-5 text-gray-400" />
                      <span className="font-medium">Change password</span>
                    </button>
                    <button
                      onClick={signOut}
                      className="flex items-center space-x-3 px-3 py-2.5 rounded-md text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200 w-full text-left"
                    >
                      <FaSignOutAlt className="w-5 h-5 text-red-500" />
                      <span className="font-medium">Sign Out</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="px-4 py-3 mt-3 space-y-3 border-t border-gray-100">
                  <Link
                    to="/login"
                    className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-md text-primary-600 hover:text-primary-700 bg-white border border-primary-200 hover:border-primary-300 transition-all duration-200 font-medium"
                  >
                    <span>Sign In</span>
                  </Link>
                  <Link
                    to="/register"
                    className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-md text-white bg-primary-600 hover:bg-primary-700 transition-all duration-200 font-medium shadow-sm hover:shadow"
                  >
                    <span>Get Started</span>
                    <FaArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <ChangePasswordModal
        open={showChangePassword}
        onClose={() => setShowChangePassword(false)}
      />
    </motion.nav>
  );
};

export default Navbar;
