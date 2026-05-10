import { motion } from "framer-motion";
import { useMemo } from "react";
import {
    FaBars,
    FaBuilding,
    FaChartPie,
    FaChevronLeft,
    FaCog,
    FaCreditCard,
    FaEnvelope,
    FaSignOutAlt,
    FaTachometerAlt,
    FaUsers,
} from "react-icons/fa";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
    mobileSidebarVariants,
    navItemVariants,
    sidebarVariants,
} from "../academy/animationVariants";

const navItems = [
  {
    key: "dashboard",
    label: "Overview",
    to: "/super-admin/dashboard",
    icon: FaTachometerAlt,
  },
  {
    key: "academies",
    label: "Academies",
    to: "/super-admin/academies",
    icon: FaBuilding,
  },
  {
    key: "users",
    label: "Users",
    to: "/super-admin/users",
    icon: FaUsers,
  },
  {
    key: "reports",
    label: "Reports",
    to: "/super-admin/reports",
    icon: FaChartPie,
  },
  {
    key: "billing",
    label: "Billing",
    to: "/super-admin/billing",
    icon: FaCreditCard,
  },
  {
    key: "platform-settings",
    label: "Platform Settings",
    to: "/super-admin/platform-settings",
    icon: FaCog,
  },
  {
    key: "contact-messages",
    label: "Contact Inbox",
    to: "/super-admin/contact-messages",
    icon: FaEnvelope,
  },
];

const SuperAdminSidebar = ({
  sidebarCollapsed,
  setSidebarCollapsed,
  isMobile,
}) => {
  const { signOut, userDetails } = useAuth();
  const location = useLocation();

  const variants = useMemo(
    () => (isMobile ? mobileSidebarVariants : sidebarVariants),
    [isMobile],
  );
  const isMini = !isMobile && sidebarCollapsed;
  const labelVariant = isMini ? "mini" : "open";

  const resolveVariant = () => {
    if (isMobile) {
      return sidebarCollapsed ? "closed" : "open";
    }
    return sidebarCollapsed ? "mini" : "open";
  };

  const handleSignOut = () => {
    signOut();
  };

  const renderNavLinkClass = (isActive) => {
    const activeStyles = "text-white";
    const inactiveStyles =
      "text-emerald-100 hover:text-white transition-colors duration-150";
    const alignment = sidebarCollapsed
      ? "justify-center px-0"
      : "gap-3 pl-6 pr-4";
    return `group relative flex w-full items-center rounded-xl py-3 text-sm font-semibold tracking-wide transition-colors ${alignment} ${
      isActive ? activeStyles : inactiveStyles
    }`;
  };

  return (
    <motion.aside
      className="fixed left-0 top-0 bottom-0 z-40 flex flex-col overflow-hidden bg-gradient-to-b from-emerald-700 via-emerald-800 to-emerald-900 text-emerald-50 shadow-[0_22px_48px_rgba(6,95,70,0.32)] transition-all duration-300"
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
                {userDetails?.name ?? "Super Admin"}
              </span>
              <span className="truncate text-xs text-emerald-100/80">
                {userDetails?.email ?? "admin@platform"}
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
            const isActive = location.pathname.startsWith(item.to);
            const linkClassName = renderNavLinkClass(isActive);
            return (
              <li key={item.key}>
                <NavLink
                  to={item.to}
                  className={linkClassName}
                  onClick={() => {
                    if (isMobile) {
                      setSidebarCollapsed(true);
                    }
                  }}
                >
                  <span
                    className={`absolute left-0 top-1/2 h-8 w-[3px] -translate-y-1/2 rounded-full transition ${
                      isActive
                        ? "bg-white"
                        : "bg-transparent group-hover:bg-white/40"
                    }`}
                    style={{ opacity: !isMini ? 1 : 0 }}
                  />
                  <ItemIcon
                    className={`h-5 w-5 transition ${isActive ? "text-white" : "text-emerald-100 group-hover:text-white"}`}
                  />
                  {!isMini && (
                    <motion.span
                      className="truncate"
                      variants={navItemVariants}
                      animate={labelVariant}
                      transition={{ duration: 0.18 }}
                    >
                      {item.label}
                    </motion.span>
                  )}
                  {item.key === "academies" && item.badge != null && !isMini ? (
                    <motion.span
                      variants={navItemVariants}
                      animate={labelVariant}
                      className="ml-auto inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-white/90 px-1.5 text-xs font-semibold text-emerald-700"
                    >
                      {item.badge}
                    </motion.span>
                  ) : null}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-white/10 px-4 pb-6 pt-5">
        <button
          type="button"
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-emerald-50 transition hover:bg-white/15 hover:text-white"
        >
          <FaSignOutAlt className="h-5 w-5 text-emerald-100" />
          {!isMini && (
            <motion.span variants={navItemVariants} animate={labelVariant}>
              Sign out
            </motion.span>
          )}
        </button>
      </div>
    </motion.aside>
  );
};

export default SuperAdminSidebar;

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
