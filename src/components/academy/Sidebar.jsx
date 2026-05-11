import { motion } from "framer-motion";
import {
    FaBars,
    FaBell,
    FaBook,
    FaCalendarAlt,
    FaChevronLeft,
    FaCog,
    FaCoins,
    FaCreditCard,
    FaSignOutAlt,
    FaTachometerAlt,
    FaUserCheck,
} from "react-icons/fa";
import {
    mobileSidebarVariants,
    navItemVariants,
    sidebarVariants,
} from "./animationVariants";

const navItems = [
  { key: "overview", label: "Overview", icon: FaTachometerAlt },
  { key: "users", label: "Users", icon: FaUserCheck },
  { key: "notifications", label: "Notifications", icon: FaBell },
  { key: "finance", label: "Finance", icon: FaCreditCard },
  { key: "credits", label: "Credits & Zoom", icon: FaCoins },
  { key: "classes", label: "Classes", icon: FaCalendarAlt },
  { key: "resources", label: "Resources", icon: FaBook },
  { key: "settings", label: "Settings", icon: FaCog },
];

const Sidebar = ({
  academyData,
  activeTab,
  setActiveTab,
  sidebarCollapsed,
  setSidebarCollapsed,
  isMobile,
  unreadNotifications,
}) => {
  const isLabelCollapsed = !isMobile && sidebarCollapsed;
  const labelVariant = isLabelCollapsed ? "closed" : "open";
  const variants = isMobile ? mobileSidebarVariants : sidebarVariants;
  const activeStyles = "text-white";
  const inactiveStyles =
    "text-emerald-100 hover:text-white transition-colors duration-150";

  const resolveVariant = () => {
    if (isMobile) {
      return sidebarCollapsed ? "closed" : "open";
    }
    return sidebarCollapsed ? "mini" : "open";
  };

  const containerClass = `fixed left-0 top-0 bottom-0 z-40 flex flex-col overflow-hidden bg-gradient-to-b from-emerald-700 via-emerald-800 to-emerald-900 text-emerald-50 shadow-[0_22px_48px_rgba(6,95,70,0.32)] transition-all duration-300`;

  return (
    <motion.aside
      className={containerClass}
      variants={variants}
      animate={resolveVariant()}
      initial={isMobile ? "closed" : "open"}
    >
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center justify-between px-0 py-2">
          <div
            className={`flex min-w-0 items-center gap-3 overflow-hidden transition-all duration-200 ${
              sidebarCollapsed
                ? "w-0 opacity-0 pointer-events-none"
                : "w-auto opacity-100"
            }`}
          >
            <BoxedLogo />
            <div className="flex min-w-0 flex-col leading-snug">
              <span className="truncate text-sm font-semibold text-white">
                EduPlatform
              </span>
              <span className="text-[11px] uppercase tracking-[0.24em] text-emerald-100/70">
                Learning Excellence
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600 text-white text-lg font-semibold shadow-lg shadow-emerald-900/40 focus:outline-none focus:ring-2 focus:ring-white/40"
            aria-label={
              sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
            }
          >
            {sidebarCollapsed ? (
              <FaBars className="h-4 w-4" />
            ) : (
              <FaChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 pb-6">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const ItemIcon = item.icon;
            const isActive = activeTab === item.key;
            const labelVisible = !sidebarCollapsed;
            return (
              <li key={item.key}>
                <button
                  type="button"
                  onClick={() => setActiveTab(item.key)}
                  className={`group relative flex w-full items-center rounded-xl py-3.5 text-sm font-semibold tracking-wide transition-colors ${
                    sidebarCollapsed ? "justify-center px-0" : "gap-3 pl-6 pr-4"
                  } ${isActive ? activeStyles : inactiveStyles}`}
                >
                  <span
                    className={`absolute left-0 top-1/2 h-8 w-[3px] -translate-y-1/2 rounded-full transition ${
                      isActive
                        ? "bg-white"
                        : "bg-transparent group-hover:bg-white/40"
                    }`}
                    style={{ opacity: labelVisible ? 1 : 0 }}
                  />
                  <ItemIcon
                    className={`h-5 w-5 transition ${
                      isActive
                        ? "text-white"
                        : "text-emerald-100 group-hover:text-white"
                    }`}
                  />
                  {labelVisible && (
                    <motion.span
                      className="truncate"
                      variants={navItemVariants}
                      animate={labelVariant}
                      transition={{ duration: 0.18 }}
                    >
                      {item.label}
                    </motion.span>
                  )}
                  {labelVisible &&
                  item.key === "notifications" &&
                  unreadNotifications > 0 ? (
                    <motion.span
                      variants={navItemVariants}
                      animate={labelVariant}
                      className="ml-auto inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-white/90 px-1.5 text-xs font-semibold text-emerald-700"
                    >
                      {unreadNotifications}
                    </motion.span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-white/10 px-4 pb-6 pt-5">
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-emerald-50 transition hover:bg-white/15 hover:text-white"
        >
          <FaSignOutAlt className="h-5 w-5 text-emerald-100" />
          <motion.span variants={navItemVariants} animate={labelVariant}>
            Logout
          </motion.span>
        </button>
      </div>
    </motion.aside>
  );
};

export default Sidebar;

const BoxedLogo = () => (
  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600 text-white text-lg font-semibold shadow-lg shadow-emerald-900/40">
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path
        d="M12 3L4 7.5V16.5L12 21L20 16.5V7.5L12 3Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 12L12 14.5L16 12"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12 7V14.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </span>
);
