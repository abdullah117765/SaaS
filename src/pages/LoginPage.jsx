import { motion } from "framer-motion";
import React, { useState } from "react";
import {
    FaEnvelope,
    FaLock,
    FaQuestionCircle,
    FaSignInAlt,
} from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: signInError } = await signIn(email, password);

      if (signInError) {
        throw signInError;
      }

      if (rememberMe) {
        localStorage.setItem("rememberEmail", email);
      } else {
        localStorage.removeItem("rememberEmail");
      }

      navigate("/dashboard", { replace: true });
      setLoading(false);
    } catch (err) {
      console.error("Login error:", err);
      setError(err?.message ?? "Unable to sign in. Please try again.");
      setLoading(false);
    }
  };

  React.useEffect(() => {
    const savedEmail = localStorage.getItem("rememberEmail");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const containerVariants = {
    hidden: { opacity: 0, y: -50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 120,
        damping: 15,
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10,
      },
    },
  };

  const buttonVariants = {
    hover: {
      scale: 1.02,
      boxShadow: "0 20px 25px -5px rgba(59, 130, 246, 0.3)",
      transition: { duration: 0.3 },
    },
    tap: { scale: 0.98 },
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-blue-600 via-blue-500 to-purple-600 px-4 py-12 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -right-40 -top-40 h-80 w-80 rounded-full bg-blue-400 opacity-20 mix-blend-multiply blur-3xl"
          animate={{ y: [0, 50, 0], x: [0, 50, 0] }}
          transition={{ duration: 20, repeat: Infinity }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-purple-400 opacity-20 mix-blend-multiply blur-3xl"
          animate={{ y: [0, -50, 0], x: [0, -50, 0] }}
          transition={{ duration: 20, repeat: Infinity, delay: 5 }}
        />
      </div>

      <div className="flex min-h-[calc(100vh-6rem)] items-center justify-center">
        <motion.div
          className="relative z-10 w-full max-w-md space-y-8 rounded-2xl bg-white/95 p-8 shadow-2xl backdrop-blur-lg"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div variants={itemVariants} className="text-center">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg">
              <FaSignInAlt className="text-2xl text-white" />
            </div>
            <h2 className="mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-3xl font-extrabold text-transparent">
              Q Edu
            </h2>
            <p className="text-sm text-gray-600">
              Welcome back to your learning platform
            </p>
          </motion.div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 rounded-lg border-l-4 border-red-500 bg-red-50 p-4 text-sm text-red-700"
            >
              <FaQuestionCircle className="mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Sign in failed</p>
                <p className="mt-1 text-xs">{error}</p>
              </div>
            </motion.div>
          )}

          <motion.form
            variants={itemVariants}
            className="mt-8 space-y-6"
            onSubmit={handleLogin}
          >
            <div className="space-y-5">
              <div className="group relative">
                <label
                  htmlFor="email-address"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Email Address
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <FaEnvelope className="h-5 w-5 text-blue-400 transition-colors group-focus-within:text-blue-600" />
                  </div>
                  <input
                    id="email-address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="relative block w-full appearance-none rounded-lg border border-gray-300 py-3 pl-10 pr-3 text-gray-900 placeholder-gray-400 transition-all duration-200 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="group relative">
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <FaLock className="h-5 w-5 text-blue-400 transition-colors group-focus-within:text-blue-600" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="relative block w-full appearance-none rounded-lg border border-gray-300 py-3 pl-10 pr-3 text-gray-900 placeholder-gray-400 transition-all duration-200 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="��������"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="group flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={loading}
                    className="h-4 w-4 cursor-pointer rounded border-gray-300 bg-gray-100 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-600 transition-colors group-hover:text-gray-700">
                    Remember me
                  </span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm font-medium text-blue-600 transition-colors hover:text-blue-700 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              className="w-full rounded-lg border border-transparent bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 text-sm font-medium text-white shadow-lg transition-all duration-200 hover:from-blue-700 hover:to-purple-700 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-75"
            >
              <span className="flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <svg
                      className="h-5 w-5 animate-spin"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign in</span>
                    <FaSignInAlt />
                  </>
                )}
              </span>
            </motion.button>

            <motion.div
              variants={itemVariants}
              className="space-y-3 text-center"
            >
              <p className="text-sm text-gray-600">
                Don't have an account?{" "}
                <Link
                  to="/register"
                  className="font-semibold text-blue-600 transition-colors hover:text-blue-700 hover:underline"
                >
                  Create one now
                </Link>
              </p>
            </motion.div>
          </motion.form>

          <motion.div
            variants={itemVariants}
            className="border-t border-gray-200 pt-6"
          >
            <p className="text-center text-xs text-gray-500">
              By signing in, you agree to our{" "}
              <a
                href="#"
                className="text-blue-600 hover:text-blue-700 hover:underline"
              >
                Terms of Service
              </a>{" "}
              and{" "}
              <a
                href="#"
                className="text-blue-600 hover:text-blue-700 hover:underline"
              >
                Privacy Policy
              </a>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
