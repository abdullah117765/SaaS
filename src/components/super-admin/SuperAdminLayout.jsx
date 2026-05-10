import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { FaBars } from "react-icons/fa";
import { contentVariants } from "../academy/animationVariants";
import useWindowSize from "../academy/useWindowSize";
import SuperAdminSidebar from "./SuperAdminSidebar";

const SuperAdminLayout = ({ children }) => {
  const { isMobile } = useWindowSize();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    setSidebarCollapsed(isMobile);
  }, [isMobile]);

  const resolveContentVariant = () => {
    if (isMobile) {
      return "full";
    }
    return sidebarCollapsed ? "mini" : "open";
  };

  return (
    <div className="relative min-h-screen bg-gray-50">
      <SuperAdminSidebar
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        isMobile={isMobile}
      />

      {isMobile && !sidebarCollapsed ? (
        <button
          type="button"
          onClick={() => setSidebarCollapsed(true)}
          className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm focus:outline-none lg:hidden"
          aria-label="Close sidebar"
          tabIndex={-1}
        />
      ) : null}

      <motion.main
        className="relative min-h-screen px-4 pb-12 pt-6 transition-all duration-300 sm:px-6 lg:px-12"
        variants={contentVariants}
        animate={resolveContentVariant()}
        initial={isMobile ? "full" : "open"}
      >
        {isMobile && sidebarCollapsed ? (
          <button
            type="button"
            onClick={() => setSidebarCollapsed(false)}
            className="mb-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-900/30 focus:outline-none focus:ring-2 focus:ring-emerald-300"
            aria-label="Open sidebar"
          >
            <FaBars className="h-4 w-4" />
            Menu
          </button>
        ) : null}
        <div className="w-full">{children}</div>
      </motion.main>
    </div>
  );
};

export default SuperAdminLayout;
