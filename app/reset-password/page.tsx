"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Eye, EyeOff, Lock, CheckCircle, XCircle } from "lucide-react";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [hasValidToken, setHasValidToken] = useState(false);
  const supabase = createClient();

  const router = useRouter();

  useEffect(() => {
    // Check for access token in URL fragments (Supabase auth sends tokens in fragments)
    const checkToken = () => {
      // Make sure we're on the client side
      if (typeof window === "undefined") return;

      console.log("Full URL:", window.location.href);

      const hash = window.location.hash;
      console.log("Hash:", hash);

      if (hash) {
        const fragment = hash.substring(1); // Remove the '#'
        console.log("Fragment:", fragment);

        const params = new URLSearchParams(fragment);
        const accessToken = params.get("token_hash");
        const type = params.get("type");

        console.log("Access Token:", accessToken);
        console.log("Type:", type);

        if (accessToken && type === "recovery") {
          setHasValidToken(true);
          console.log("Valid token found!");
        } else {
          console.log("Invalid token or type");
          setMessage(
            "Invalid or expired password reset link. Please request a new one."
          );
        }
      } else {
        console.log("No hash found in URL");
        setMessage(
          "Invalid or expired password reset link. Please request a new one."
        );
      }
    };

    // Add a small delay to ensure the component is mounted
    setTimeout(checkToken, 100);
  }, []);

  const validatePassword = (pwd) => {
    if (pwd.length < 8) return "Password must be at least 8 characters";
    if (!/[A-Z]/.test(pwd))
      return "Password must contain at least one uppercase letter";
    if (!/[a-z]/.test(pwd))
      return "Password must contain at least one lowercase letter";
    if (!/[0-9]/.test(pwd)) return "Password must contain at least one number";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    // Validation
    const passwordError = validatePassword(password);
    if (passwordError) {
      setMessage(passwordError);
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      // Update password using Supabase
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        setMessage(error.message);
      } else {
        setIsSuccess(true);
        setMessage("Password updated successfully! Redirecting to login...");

        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push("/auth");
        }, 3000);
      }
    } catch (error) {
      setMessage("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!hasValidToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-black flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-gray-700/50 p-8 shadow-2xl text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Invalid Reset Link
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
            <button
              onClick={() => router.push("/auth")}
              className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl transition-all duration-300 hover:scale-105 font-medium shadow-lg"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-gray-700/50 p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-green-500/25">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Set New Password
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Choose a strong password for your account
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* New Password Field */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white transition-all duration-300"
                  placeholder="Enter new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white transition-all duration-300"
                  placeholder="Confirm new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
              <p className="font-medium">Password requirements:</p>
              <ul className="space-y-1 ml-4">
                <li
                  className={`flex items-center gap-2 ${
                    password.length >= 8 ? "text-green-600" : ""
                  }`}
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${
                      password.length >= 8 ? "bg-green-600" : "bg-gray-300"
                    }`}
                  ></div>
                  At least 8 characters
                </li>
                <li
                  className={`flex items-center gap-2 ${
                    /[A-Z]/.test(password) ? "text-green-600" : ""
                  }`}
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${
                      /[A-Z]/.test(password) ? "bg-green-600" : "bg-gray-300"
                    }`}
                  ></div>
                  One uppercase letter
                </li>
                <li
                  className={`flex items-center gap-2 ${
                    /[a-z]/.test(password) ? "text-green-600" : ""
                  }`}
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${
                      /[a-z]/.test(password) ? "bg-green-600" : "bg-gray-300"
                    }`}
                  ></div>
                  One lowercase letter
                </li>
                <li
                  className={`flex items-center gap-2 ${
                    /[0-9]/.test(password) ? "text-green-600" : ""
                  }`}
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${
                      /[0-9]/.test(password) ? "bg-green-600" : "bg-gray-300"
                    }`}
                  ></div>
                  One number
                </li>
              </ul>
            </div>

            {/* Message */}
            {message && (
              <div
                className={`p-4 rounded-xl flex items-center gap-3 ${
                  isSuccess
                    ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200"
                    : "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200"
                }`}
              >
                {isSuccess ? (
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 flex-shrink-0" />
                )}
                <p className="text-sm font-medium">{message}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !password || !confirmPassword}
              className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl transition-all duration-300 hover:scale-105 disabled:scale-100 font-medium shadow-lg disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Updating Password...
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  Update Password
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
