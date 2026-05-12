import { motion } from "framer-motion";
import React, { useState } from "react";
import {
    FaEnvelope,
    FaEye,
    FaEyeSlash,
    FaLock,
    FaQuestionCircle,
    FaSignInAlt,
} from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      if (signInError) throw signInError;

      if (rememberMe) {
        localStorage.setItem("rememberEmail", email);
      } else {
        localStorage.removeItem("rememberEmail");
      }

      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err?.message ?? "Unable to sign in. Please try again.");
    } finally {
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

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#03120e]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-20 h-96 w-96 rounded-full bg-emerald-300/10 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-600/5 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 h-full w-full lg:grid lg:grid-cols-[1fr_1.1fr]"
      >
        <div className="hidden flex-col justify-between border-r border-emerald-800/30 bg-gradient-to-b from-emerald-950/95 to-emerald-900/90 px-12 py-16 lg:flex">
          <div>
            <div className="mb-5 inline-flex items-center gap-3 rounded-2xl border border-emerald-400/35 bg-emerald-500/12 px-4 py-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-sm font-bold text-black">
                Q
              </span>
              <div>
                <p className="text-sm font-bold tracking-wide text-emerald-50">
                  Q Edu Platform
                </p>
                <p className="text-[11px] uppercase tracking-[0.2em] text-emerald-200/70">
                  Learning Excellence
                </p>
              </div>
            </div>
            <h2 className="max-w-xs text-3xl font-extrabold leading-tight text-white">
              Manage your academy with calm, focused control.
            </h2>
            <p className="mt-3 max-w-sm text-sm text-emerald-100/75">
              Classes, credits, subscriptions, and teacher operations in one
              workspace.
            </p>
          </div>

          <div className="space-y-3 text-sm text-emerald-100/80">
            <div className="rounded-xl border border-emerald-600/25 bg-emerald-500/10 p-3">
              <p className="font-semibold text-emerald-50">
                Owner-first billing
              </p>
              <p className="text-xs">
                Subscriptions and payments are controlled from academy owner
                dashboards.
              </p>
            </div>
            <div className="rounded-xl border border-emerald-600/25 bg-emerald-500/10 p-3">
              <p className="font-semibold text-emerald-50">Credit visibility</p>
              <p className="text-xs">
                Teachers see available credits and usage trends directly from
                dashboard.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-center overflow-y-auto bg-white p-8 text-slate-900 sm:p-12 lg:p-16 h-full">
          <div className="text-center">
            <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-lg shadow-emerald-900/25">
              <FaSignInAlt className="text-2xl text-white" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-emerald-950">
              Welcome back
            </h1>
            <p className="mt-3 text-base text-slate-600">
              Sign in to continue to your academy workspace.
            </p>
          </div>

          {error ? (
            <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              <FaQuestionCircle className="mt-0.5 flex-shrink-0 text-lg" />
              <div>
                <p className="font-semibold">Sign in failed</p>
                <p className="mt-1 text-xs">{error}</p>
              </div>
            </div>
          ) : null}

          <form className="space-y-6" onSubmit={handleLogin}>
            <div className="space-y-5">
              <div className="group relative">
                <label
                  htmlFor="email-address"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Email Address
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <FaEnvelope className="h-4 w-4 text-emerald-500 transition-colors group-focus-within:text-emerald-700" />
                  </div>
                  <input
                    id="email-address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="relative block w-full appearance-none rounded-xl border border-slate-300 py-3 pl-10 pr-3 text-slate-900 placeholder-slate-400 transition-all duration-200 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="group relative">
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Password
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <FaLock className="h-4 w-4 text-emerald-500 transition-colors group-focus-within:text-emerald-700" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    className="relative block w-full appearance-none rounded-xl border border-slate-300 py-3 pl-10 pr-12 text-slate-900 placeholder-slate-400 transition-all duration-200 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 transition-colors hover:text-emerald-600 disabled:opacity-50"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <FaEyeSlash className="h-4 w-4" />
                    ) : (
                      <FaEye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="group flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={loading}
                    className="h-4 w-4 cursor-pointer rounded border-slate-300 bg-slate-100 text-emerald-600 focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="ml-2 text-sm text-slate-600 transition-colors group-hover:text-slate-700">
                    Remember me
                  </span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl border border-transparent bg-gradient-to-r from-emerald-600 to-emerald-800 px-6 py-4 text-base font-semibold text-white shadow-lg transition-all duration-200 hover:from-emerald-700 hover:to-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-75"
            >
              <span className="flex items-center justify-center gap-3">
                {loading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <span>Sign in</span>
                    <FaSignInAlt className="text-lg" />
                  </>
                )}
              </span>
            </button>

            <div className="text-center">
              <p className="text-base text-slate-600">
                Don't have an account?{" "}
                <Link
                  to="/register"
                  className="font-semibold text-emerald-700 transition-colors hover:text-emerald-800 hover:underline"
                >
                  Create one now
                </Link>
              </p>
            </div>
          </form>

          <div className="border-t border-slate-200 pt-6">
            <p className="text-center text-xs text-slate-500">
              By signing in, you agree to our{" "}
              <a
                href="#"
                className="text-emerald-700 transition-colors hover:underline"
              >
                Terms of Service
              </a>{" "}
              and{" "}
              <a
                href="#"
                className="text-emerald-700 transition-colors hover:underline"
              >
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
