import {
  motion,
  useAnimation,
  useInView
} from "framer-motion";
import { useEffect, useRef } from "react";
import {
  FaArrowRight,
  FaChalkboardTeacher,
  FaCheckCircle,
  FaGraduationCap,
  FaSchool,
  FaUserPlus,
} from "react-icons/fa";
import { Link } from "react-router-dom";

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const slideIn = {
  hidden: { opacity: 0, x: -30 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
};

const buttonHover = {
  hover: { scale: 1.05, boxShadow: "0px 5px 15px rgba(0, 0, 0, 0.1)" },
  tap: { scale: 0.95 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const featureVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const pulseAnimation = {
  scale: [1, 1.05, 1],
  transition: { duration: 2, repeat: Infinity },
};

// Animated Section Component
const AnimatedSection = ({ children, className }) => {
  const controls = useAnimation();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, threshold: 0.2 });

  useEffect(() => {
    if (inView) {
      controls.start("visible");
    }
  }, [controls, inView]);

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={fadeIn}
      className={className}
    >
      {children}
    </motion.div>
  );
};

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary-800 via-primary-700 to-primary-900 text-white pt-24 pb-16 relative overflow-hidden">
        {/* Animated background elements */}
        <motion.div
          className="absolute top-20 left-10 w-64 h-64 bg-primary-400 rounded-full opacity-10 blur-xl"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 20, 0],
            y: [0, -20, 0],
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-10 right-10 w-96 h-96 bg-primary-300 rounded-full opacity-10 blur-xl"
          animate={{
            scale: [1, 1.3, 1],
            x: [0, -30, 0],
            y: [0, 30, 0],
          }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        <motion.div
          className="absolute top-40 right-20 w-32 h-32 bg-white rounded-full opacity-5 blur-lg"
          animate={{
            scale: [1, 1.1, 1],
            x: [0, -10, 0],
            y: [0, 10, 0],
          }}
          transition={{ duration: 6, repeat: Infinity }}
        />

        <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-4xl tracking-tight font-extrabold sm:text-5xl md:text-6xl">
                <span className="block">Run Your Academy on</span>
                <span className="block bg-gradient-to-r from-white to-primary-200 bg-clip-text text-transparent drop-shadow-sm">
                  Live Classes, Not Seat Fees
                </span>
              </h1>
              <div className="relative">
                <div className="absolute inset-0 flex justify-center">
                  <div className="w-1/2 h-1/2 bg-primary-400 opacity-20 blur-3xl rounded-full"></div>
                </div>
                <p className="mt-3 max-w-md mx-auto text-base text-white sm:text-lg md:mt-5 md:text-xl md:max-w-3xl relative">
                  Launch a branded academy in minutes. Teach live on Zoom with
                  built-in attendance, charge by the credit, and let Stripe
                  handle every payout — all in one operating system for tutors,
                  coaches and schools.
                </p>
              </div>
            </motion.div>

            <motion.div
              className="mt-8 max-w-md mx-auto sm:flex sm:justify-center md:mt-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <motion.div
                className="rounded-md shadow-xl"
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="relative group overflow-hidden rounded-md">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary-400 to-primary-600 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary-400 to-primary-600 rounded-lg blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
                  <Link
                    to="/register"
                    state={{ initialTab: "academy" }}
                    className="relative w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 md:py-3 md:text-base md:px-8 transition-all duration-200 shadow-lg"
                  >
                    <span>Create Your Academy</span>
                    <FaArrowRight className="ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                  </Link>
                </div>
              </motion.div>
              <motion.div
                className="mt-3 rounded-md shadow-md sm:mt-0 sm:ml-3"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="relative group overflow-hidden rounded-md">
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-100 to-white opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
                  <Link
                    to="/features"
                    className="relative w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-primary-700 bg-white hover:bg-gray-50 md:py-3 md:text-base md:px-8 transition-all duration-200"
                  >
                    <span>Explore Features</span>
                  </Link>
                </div>
              </motion.div>
              <motion.div
                className="mt-3 rounded-md shadow-md sm:mt-0 sm:ml-3"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="relative group overflow-hidden rounded-md">
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-100 to-white opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
                  <Link
                    to="/login"
                    className="relative w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-primary-700 bg-white hover:bg-gray-50 md:py-3 md:text-base md:px-8 transition-all duration-200"
                  >
                    <span>Sign in</span>
                  </Link>
                </div>
              </motion.div>
            </motion.div>

            <motion.div
              className="mt-10 max-w-md mx-auto bg-white/90 backdrop-blur-sm rounded-xl shadow-xl p-6 border border-white/20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  Why teams switch to us
                </h3>
                <span className="px-3 py-1 bg-primary-100 text-primary-800 text-xs font-medium rounded-full">
                  14-day trial
                </span>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <div className="flex-shrink-0 bg-primary-100 text-primary-600 rounded-full p-2 mt-1">
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                  </div>
                  <div className="ml-3 text-left">
                    <p className="text-base font-medium text-gray-900">
                      Zoom classes on credits, not seats
                    </p>
                    <p className="text-sm text-gray-600">
                      Each minute of teaching debits the academy wallet — pay
                      only for live time.
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 bg-primary-100 text-primary-600 rounded-full p-2 mt-1">
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div className="ml-3 text-left">
                    <p className="text-base font-medium text-gray-900">
                      Stripe payouts &amp; promo coupons built in
                    </p>
                    <p className="text-sm text-gray-600">
                      Sell credit packs, run launch discounts, and split a
                      transparent 10% platform fee — automatically.
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 bg-primary-100 text-primary-600 rounded-full p-2 mt-1">
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  </div>
                  <div className="ml-3 text-left">
                    <p className="text-base font-medium text-gray-900">
                      One workspace for owners, teachers &amp; students
                    </p>
                    <p className="text-sm text-gray-600">
                      Approvals, class scheduling, resources and live attendance
                      — without juggling four tools.
                    </p>
                  </div>
                </li>
              </ul>
            </motion.div>
            <motion.div
              className="mt-4 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.5 }}
            >
              <Link
                to="/pricing"
                className="text-primary-200 hover:text-white text-sm font-medium underline flex items-center justify-center"
              >
                <span>View pricing plans</span>
                <FaArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </motion.div>

            {/* Role selection buttons */}
            <motion.div
              className="mt-12 max-w-lg mx-auto grid grid-cols-3 gap-4"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              <motion.div
                variants={scaleIn}
                whileHover={{ scale: 1.05, y: -5 }}
                className="bg-white/15 rounded-xl p-5 backdrop-blur-sm border border-white/20 hover:bg-white/25 hover:border-white/30 transition-all duration-300 shadow-lg group"
              >
                <Link
                  to="/register"
                  state={{ initialTab: "academy" }}
                  className="flex flex-col items-center text-white"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary-400 rounded-full opacity-20 blur-sm group-hover:opacity-40 transition-opacity duration-300"></div>
                    <FaSchool className="h-8 w-8 mb-3 text-white relative z-10" />
                  </div>
                  <span className="text-sm font-medium group-hover:text-primary-200 transition-colors duration-300">
                    Academy Owner
                  </span>
                </Link>
              </motion.div>
              <motion.div
                variants={scaleIn}
                whileHover={{ scale: 1.05, y: -5 }}
                className="bg-white/15 rounded-xl p-5 backdrop-blur-sm border border-white/20 hover:bg-white/25 hover:border-white/30 transition-all duration-300 shadow-lg group"
              >
                <Link
                  to="/register"
                  state={{ initialTab: "teacher" }}
                  className="flex flex-col items-center text-white"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary-400 rounded-full opacity-20 blur-sm group-hover:opacity-40 transition-opacity duration-300"></div>
                    <FaChalkboardTeacher className="h-8 w-8 mb-3 text-white relative z-10" />
                  </div>
                  <span className="text-sm font-medium group-hover:text-primary-200 transition-colors duration-300">
                    Teacher
                  </span>
                </Link>
              </motion.div>
              <motion.div
                variants={scaleIn}
                whileHover={{ scale: 1.05, y: -5 }}
                className="bg-white/15 rounded-xl p-5 backdrop-blur-sm border border-white/20 hover:bg-white/25 hover:border-white/30 transition-all duration-300 shadow-lg group"
              >
                <Link
                  to="/register"
                  state={{ initialTab: "student" }}
                  className="flex flex-col items-center text-white"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary-400 rounded-full opacity-20 blur-sm group-hover:opacity-40 transition-opacity duration-300"></div>
                    <FaGraduationCap className="h-8 w-8 mb-3 text-white relative z-10" />
                  </div>
                  <span className="text-sm font-medium group-hover:text-primary-200 transition-colors duration-300">
                    Student
                  </span>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Role-based Features Section */}
      <AnimatedSection className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <div className="inline-block">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800">
                <span className="flex h-2 w-2 rounded-full bg-primary-600 mr-2"></span>
                Role-Based Platform
              </span>
            </div>
            <p className="mt-5 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Tailored for Every Educational Role
            </p>
            <div className="mt-4 max-w-3xl mx-auto">
              <p className="text-xl text-gray-600 lg:mx-auto">
                Our platform provides specialized tools for academy owners,
                teachers, and students, creating a seamless educational
                ecosystem.
              </p>
            </div>
          </div>

          <motion.div
            className="mt-16"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            <div className="space-y-12 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-8">
              {/* Academy Owners */}
              <motion.div
                variants={featureVariant}
                className="relative p-8 bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 group hover:border-primary-100"
              >
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 group-hover:scale-110 transition-transform duration-300">
                  <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-lg">
                    <FaSchool className="h-8 w-8" />
                  </div>
                </div>
                <div className="mt-8 text-center">
                  <h3 className="text-xl leading-6 font-bold text-gray-900 mt-4 group-hover:text-primary-600 transition-colors duration-300">
                    Academy Owners
                  </h3>
                  <p className="mt-4 text-base text-gray-500">
                    Manage your entire academy, approve teachers and students,
                    track performance, and grow your educational business.
                  </p>
                  <ul className="mt-6 text-sm text-gray-500 space-y-2">
                    <li className="flex items-center justify-center">
                      <svg
                        className="h-5 w-5 text-primary-500 mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>User approval system</span>
                    </li>
                    <li className="flex items-center justify-center">
                      <svg
                        className="h-5 w-5 text-primary-500 mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>Academy analytics</span>
                    </li>
                    <li className="flex items-center justify-center">
                      <svg
                        className="h-5 w-5 text-primary-500 mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>User management</span>
                    </li>
                  </ul>
                </div>
              </motion.div>

              {/* Teachers */}
              <motion.div
                variants={featureVariant}
                className="relative p-8 bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 group hover:border-primary-100"
              >
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 group-hover:scale-110 transition-transform duration-300">
                  <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-lg">
                    <FaChalkboardTeacher className="h-8 w-8" />
                  </div>
                </div>
                <div className="mt-8 text-center">
                  <h3 className="text-xl leading-6 font-bold text-gray-900 mt-4 group-hover:text-primary-600 transition-colors duration-300">
                    Teachers
                  </h3>
                  <p className="mt-4 text-base text-gray-500">
                    Create and manage classes, track student progress, and
                    deliver engaging educational content.
                  </p>
                  <ul className="mt-6 text-sm text-gray-500 space-y-2">
                    <li className="flex items-center justify-center">
                      <svg
                        className="h-5 w-5 text-primary-500 mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>Class management</span>
                    </li>
                    <li className="flex items-center justify-center">
                      <svg
                        className="h-5 w-5 text-primary-500 mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>Student progress tracking</span>
                    </li>
                    <li className="flex items-center justify-center">
                      <svg
                        className="h-5 w-5 text-primary-500 mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>Content creation tools</span>
                    </li>
                  </ul>
                </div>
              </motion.div>

              {/* Students */}
              <motion.div
                variants={featureVariant}
                className="relative p-8 bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 group hover:border-primary-100"
              >
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 group-hover:scale-110 transition-transform duration-300">
                  <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-lg">
                    <FaGraduationCap className="h-8 w-8" />
                  </div>
                </div>
                <div className="mt-8 text-center">
                  <h3 className="text-xl leading-6 font-bold text-gray-900 mt-4 group-hover:text-primary-600 transition-colors duration-300">
                    Students
                  </h3>
                  <p className="mt-4 text-base text-gray-500">
                    Access classes, track your progress, and engage with
                    educational content in an intuitive interface.
                  </p>
                  <ul className="mt-6 text-sm text-gray-500 space-y-2">
                    <li className="flex items-center justify-center">
                      <svg
                        className="h-5 w-5 text-primary-500 mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>Class enrollment</span>
                    </li>
                    <li className="flex items-center justify-center">
                      <svg
                        className="h-5 w-5 text-primary-500 mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>Progress dashboard</span>
                    </li>
                    <li className="flex items-center justify-center">
                      <svg
                        className="h-5 w-5 text-primary-500 mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>Learning resources</span>
                    </li>
                  </ul>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </AnimatedSection>

      <AnimatedSection className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <div className="inline-block">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800">
                <span className="flex h-2 w-2 rounded-full bg-primary-600 mr-2"></span>
                Built for live teaching
              </span>
            </div>
            <p className="mt-5 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Start free. Pay only when a class goes live.
            </p>
            <div className="mt-4 max-w-3xl mx-auto">
              <p className="text-xl text-gray-600 lg:mx-auto">
                No card to start the 14-day trial. After that, top up credits
                and pay only for the minutes you actually teach — no per-student
                fee, no annual lock-in.
              </p>
            </div>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="relative p-6 bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl hover:border-primary-100 transition-all duration-300 group">
              <div className="absolute -top-5 left-6">
                <div className="flex items-center justify-center h-14 w-14 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 text-white shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                  <FaCheckCircle className="h-6 w-6" />
                </div>
              </div>
              <div className="pt-10">
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors duration-300">
                  Pay-per-minute pricing
                </h3>
                <p className="mt-3 text-base text-gray-500">
                  Credits debit from your wallet only while a Zoom class is
                  live. Cancellations and no-shows cost you nothing.
                </p>
              </div>
            </div>

            <div className="relative p-6 bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl hover:border-primary-100 transition-all duration-300 group">
              <div className="absolute -top-5 left-6">
                <div className="flex items-center justify-center h-14 w-14 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 text-white shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                  <FaUserPlus className="h-6 w-6" />
                </div>
              </div>
              <div className="pt-10">
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors duration-300">
                  Unlimited seats &amp; courses
                </h3>
                <p className="mt-3 text-base text-gray-500">
                  Onboard every teacher and every student with no seat fee. Run
                  unlimited classes, batches and resource libraries.
                </p>
              </div>
            </div>

            <div className="relative p-6 bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl hover:border-primary-100 transition-all duration-300 group">
              <div className="absolute -top-5 left-6">
                <div className="flex items-center justify-center h-14 w-14 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 text-white shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                  <FaCheckCircle className="h-6 w-6" />
                </div>
              </div>
              <div className="pt-10">
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors duration-300">
                  Coupons &amp; growth toolkit
                </h3>
                <p className="mt-3 text-base text-gray-500">
                  Launch promo codes and seasonal campaigns from the admin panel
                  — synced to Stripe in one click.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-16 flex justify-center">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              animate={pulseAnimation}
              className="inline-block"
            >
              <Link
                to="/register"
                className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white bg-gradient-to-r from-primary-500 to-primary-600 rounded-full overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <span className="absolute inset-0 w-full h-full bg-gradient-to-br from-primary-400 to-primary-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                <span className="relative flex items-center">
                  Start Your Free Trial
                  <FaArrowRight className="ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                </span>
              </Link>
            </motion.div>
          </div>
        </div>
      </AnimatedSection>

      {/* CTA Section */}
      <section className="relative py-24 overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 text-white">
        {/* Animated background elements */}
        <motion.div
          className="absolute top-10 right-10 w-80 h-80 bg-primary-500 rounded-full opacity-10 blur-xl"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, -20, 0],
            y: [0, 20, 0],
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-10 left-10 w-96 h-96 bg-primary-400 rounded-full opacity-10 blur-xl"
          animate={{
            scale: [1, 1.3, 1],
            x: [0, 30, 0],
            y: [0, -30, 0],
          }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        <motion.div
          className="absolute left-1/2 top-1/2 w-[30rem] h-[30rem] bg-primary-300 rounded-full opacity-5 blur-xl"
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 10, 0],
          }}
          transition={{ duration: 12, repeat: Infinity }}
        />

        <div className="max-w-7xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-extrabold sm:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-white to-primary-200">
              <span className="block">Stop paying for empty seats.</span>
              <span className="block mt-2">
                Charge for live teaching instead.
              </span>
            </h2>
            <p className="mt-6 text-xl leading-7 text-primary-100 max-w-3xl mx-auto">
              Spin up a branded academy in under five minutes, top up a credit
              wallet, and start your first Zoom class today. Cancel anytime
              &mdash; credits never expire.
            </p>

            {/* Role-based signup buttons */}
            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3 max-w-5xl mx-auto">
              <motion.div
                className="rounded-xl overflow-hidden shadow-xl"
                whileHover={{ scale: 1.03, y: -5 }}
                whileTap={{ scale: 0.97 }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                <Link
                  to="/register"
                  state={{ initialTab: "academy" }}
                  className="w-full flex flex-col items-center justify-center px-6 py-8 bg-white/10 backdrop-blur-sm hover:bg-white/15 border border-white/20 hover:border-primary-300/30 transition-all duration-300 h-full rounded-xl"
                >
                  <div className="relative mb-4">
                    <div className="absolute inset-0 bg-primary-400 rounded-full opacity-30 blur-md group-hover:opacity-50 transition-opacity duration-300"></div>
                    <FaSchool className="h-10 w-10 text-primary-200 relative z-10" />
                  </div>
                  <span className="text-white font-bold text-lg">
                    Academy Owner
                  </span>
                  <span className="text-sm text-primary-200 mt-2">
                    Create your academy
                  </span>
                </Link>
              </motion.div>

              <motion.div
                className="rounded-xl overflow-hidden shadow-xl"
                whileHover={{ scale: 1.03, y: -5 }}
                whileTap={{ scale: 0.97 }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                viewport={{ once: true }}
              >
                <Link
                  to="/register"
                  state={{ initialTab: "teacher" }}
                  className="w-full flex flex-col items-center justify-center px-6 py-8 bg-white/10 backdrop-blur-sm hover:bg-white/15 border border-white/20 hover:border-primary-300/30 transition-all duration-300 h-full rounded-xl"
                >
                  <div className="relative mb-4">
                    <div className="absolute inset-0 bg-primary-400 rounded-full opacity-30 blur-md group-hover:opacity-50 transition-opacity duration-300"></div>
                    <FaChalkboardTeacher className="h-10 w-10 text-primary-200 relative z-10" />
                  </div>
                  <span className="text-white font-bold text-lg">Teacher</span>
                  <span className="text-sm text-primary-200 mt-2">
                    Join an academy
                  </span>
                </Link>
              </motion.div>

              <motion.div
                className="rounded-xl overflow-hidden shadow-xl"
                whileHover={{ scale: 1.03, y: -5 }}
                whileTap={{ scale: 0.97 }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <Link
                  to="/register"
                  state={{ initialTab: "student" }}
                  className="w-full flex flex-col items-center justify-center px-6 py-8 bg-white/10 backdrop-blur-sm hover:bg-white/15 border border-white/20 hover:border-primary-300/30 transition-all duration-300 h-full rounded-xl"
                >
                  <div className="relative mb-4">
                    <div className="absolute inset-0 bg-primary-400 rounded-full opacity-30 blur-md group-hover:opacity-50 transition-opacity duration-300"></div>
                    <FaGraduationCap className="h-10 w-10 text-primary-200 relative z-10" />
                  </div>
                  <span className="text-white font-bold text-lg">Student</span>
                  <span className="text-sm text-primary-200 mt-2">
                    Enroll in classes
                  </span>
                </Link>
              </motion.div>
            </div>

            <motion.div
              className="mt-14 inline-block"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary-400 to-primary-300 rounded-full opacity-50 blur-md group-hover:opacity-75 transition-all duration-300"></div>
                <Link
                  to="/register"
                  className="relative flex items-center justify-center px-8 py-4 text-lg font-medium rounded-full text-primary-900 bg-white hover:bg-primary-50 transition-all duration-300 shadow-lg"
                >
                  <FaUserPlus className="mr-2" />
                  <span>Sign up for free</span>
                  <FaArrowRight className="ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
