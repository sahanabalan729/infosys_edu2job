import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api/client";
import { User, Eye, EyeOff, Sun, Moon } from "lucide-react";

export default function Register() {
  const [form, setForm] = useState({ username: "", password: "", confirm: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [dark, setDark] = useState(() => localStorage.getItem("theme") === "dark");

  const nav = useNavigate();

  const passwordsMatch = form.password === form.confirm || form.confirm === "";

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");

    if (!passwordsMatch) {
      setErr("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      await api.post("/register", { username: form.username, password: form.password });
      nav("/login");
    } catch (e) {
      setErr(e?.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen grid place-items-center 
      bg-[url('/images/stationeries-keyboard-eyeglasses-white-marble-textured-background.jpg')] 
      dark:bg-[url('/images/office-supplies.jpg')]
      bg-cover bg-center transition-all duration-500"
    >
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md p-6 rounded-2xl shadow-lg 
        bg-white/80 dark:bg-gray-900/80 backdrop-blur-md space-y-4"
      >
        {/* Header with dark mode toggle */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Create Account
          </h1>
          <button
            type="button"
            onClick={() => setDark(!dark)}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            {dark ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-800" />}
          </button>
        </div>

        {err && <p className="text-sm text-red-600 dark:text-red-400">{err}</p>}

        {/* Username field */}
        <div>
          <label className="label text-gray-700 dark:text-gray-300">Username</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="pl-10 w-full border rounded-lg p-2 bg-gray-50 dark:bg-gray-800 dark:text-white dark:border-gray-700"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="Choose a username"
              required
            />
          </div>
        </div>

        {/* Password field */}
        <div>
          <label className="label text-gray-700 dark:text-gray-300">Password</label>
          <div className="relative">
            <input
              className="w-full border rounded-lg p-2 pr-10 bg-gray-50 dark:bg-gray-800 dark:text-white dark:border-gray-700"
              type={showPass ? "text" : "password"}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Create a password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400"
            >
              {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Confirm password field with live validation */}
        <div>
          <label className="label text-gray-700 dark:text-gray-300">Re-enter Password</label>
          <div className="relative">
            <input
              className={`w-full border rounded-lg p-2 pr-10 bg-gray-50 dark:bg-gray-800 dark:text-white 
                ${passwordsMatch ? "border-gray-300 dark:border-gray-700" : "border-red-500"} 
                dark:border-gray-700`}
              type={showConfirm ? "text" : "password"}
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              placeholder="Re-enter your password"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400"
            >
              {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {!passwordsMatch && (
            <p className="text-xs text-red-600 mt-1">Passwords do not match</p>
          )}
        </div>

        {/* Submit button */}
        <button
          className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 
          text-white font-medium transition disabled:opacity-60"
          disabled={loading || !passwordsMatch}
        >
          {loading ? "Creating..." : "Create Account"}
        </button>

        {/* Login link */}
        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{" "}
          <Link className="text-blue-600 hover:underline dark:text-blue-400" to="/login">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}
