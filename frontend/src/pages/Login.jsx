import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api/client";
import { User, Eye, EyeOff, Sun, Moon } from "lucide-react";

export default function Login() {
  const [form, setForm] = useState({ username: "", password: "", newPassword: "", confirmPassword: "" });
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState(false); // <-- New state for success
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [dark, setDark] = useState(() => localStorage.getItem("theme") === "dark");
  const [forgot, setForgot] = useState(false);

  const navigate = useNavigate();

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
    if (loading) return;
    setErr("");
    setSuccess(false); // Reset success
    setLoading(true);

    try {
      if (forgot) {
        if (form.newPassword !== form.confirmPassword) {
          setErr("Passwords do not match");
          setLoading(false);
          return;
        }
        await api.post("/reset-password", {
          username: form.username,
          newPassword: form.newPassword
        });
        setErr("Password reset successful. Please login.");
        setSuccess(true); // Show in green
        setForgot(false);
        setForm(prev => ({ ...prev, password: "", newPassword: "", confirmPassword: "" }));
      } else {
        const res = await api.post("/login", { username: form.username, password: form.password });
        localStorage.setItem("token", res.data.token || "");
        localStorage.setItem("username", form.username);
        navigate("/dashboard");
      }
    } catch (err) {
      setErr(err?.response?.data?.message || "Operation failed");
      setSuccess(false); // Error stays red
    } finally {
      setLoading(false);
    }
  };

  const bgImage = dark ? "/images/logindark.jpg" : "/images/loginlight.jpg";

  return (
    <div
      className="min-h-screen grid place-items-center bg-cover bg-center transition-all duration-500"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md p-6 rounded-2xl shadow-xl bg-white/90 dark:bg-gray-900/80 backdrop-blur-md space-y-4"
      >
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {forgot ? "Reset Password" : "Edu2Job Login"}
          </h1>
          <button
            type="button"
            onClick={() => setDark(prev => !prev)}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            {dark ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-800" />}
          </button>
        </div>

        {/* Message */}
        {err && (
          <p className={`text-sm ${success ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
            {err}
          </p>
        )}

        {/* Username */}
        <div>
          <label className="label text-gray-700 dark:text-gray-300 text-sm">Username</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              autoComplete="username"
              className="pl-10 w-full border rounded-lg p-2 text-sm bg-gray-50 dark:bg-gray-800 dark:text-white dark:border-gray-700"
              value={form.username}
              onChange={e => setForm(prev => ({ ...prev, username: e.target.value }))}
              placeholder="Enter your username"
              required
            />
          </div>
        </div>

        {/* Password / Reset */}
        {!forgot ? (
          <div>
            <label className="label text-gray-700 dark:text-gray-300 text-sm">Password</label>
            <div className="relative">
              <input
                autoComplete="current-password"
                className="w-full border rounded-lg p-2 pr-10 text-sm bg-gray-50 dark:bg-gray-800 dark:text-white dark:border-gray-700"
                type={showPass ? "text" : "password"}
                value={form.password}
                onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPass(prev => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400"
              >
                {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div>
              <label className="label text-gray-700 dark:text-gray-300 text-sm">New Password</label>
              <input
                type="password"
                autoComplete="new-password"
                className="w-full border rounded-lg p-2 text-sm bg-gray-50 dark:bg-gray-800 dark:text-white dark:border-gray-700"
                value={form.newPassword}
                onChange={e => setForm(prev => ({ ...prev, newPassword: e.target.value }))}
                placeholder="Enter new password"
                required
              />
            </div>
            <div>
              <label className="label text-gray-700 dark:text-gray-300 text-sm">Confirm Password</label>
              <input
                type="password"
                autoComplete="new-password"
                className="w-full border rounded-lg p-2 text-sm bg-gray-50 dark:bg-gray-800 dark:text-white dark:border-gray-700"
                value={form.confirmPassword}
                onChange={e => setForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="Confirm new password"
                required
              />
            </div>
          </>
        )}

        {/* Forgot password toggle */}
        {!forgot && (
          <div className="text-right">
            <button
              type="button"
              className="text-xs text-blue-600 hover:underline dark:text-blue-400"
              onClick={() => setForgot(true)}
            >
              Forgot password?
            </button>
          </div>
        )}

        {/* Submit */}
        <button
          className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition disabled:opacity-60"
          disabled={loading}
        >
          {loading ? "Processing..." : forgot ? "Reset Password" : "Sign in"}
        </button>

        {/* Register link */}
        <p className="text-center text-xs text-gray-600 dark:text-gray-400 mt-2">
          No account?{" "}
          <Link className="text-blue-600 hover:underline dark:text-blue-400" to="/register">
            Register
          </Link>
        </p>
      </form>
    </div>
  );
}
