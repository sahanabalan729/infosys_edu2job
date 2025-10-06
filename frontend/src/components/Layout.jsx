import { NavLink, useNavigate } from "react-router-dom";

export default function Layout({ children }) {
  const navigate = useNavigate();

  const handleLogout = (e) => {
    e.stopPropagation();
    localStorage.clear();
    navigate("/login");
  };

  const linkClasses = ({ isActive }) =>
    `hover:text-blue-600 transition-colors duration-200 ${
      isActive
        ? "text-blue-600 font-semibold border-b-2 border-blue-600 pb-1"
        : "text-gray-700"
    }`;

  return (
    <div className="h-screen flex flex-col">
      {/* Navbar */}
      <header className="flex justify-between items-center bg-white/70 shadow-md px-6 py-4 sticky top-0 z-50 backdrop-blur-md">
        <h1 className="text-2xl font-bold text-blue-600">Edu2Job</h1>
        <nav className="space-x-6 font-medium flex items-center">
          <NavLink to="/dashboard" className={linkClasses}>
            Home
          </NavLink>
          <NavLink to="/predict" className={linkClasses}>
            Prediction
          </NavLink>
          <NavLink to="/predictionhistory" className={linkClasses}>
            Prediction History
          </NavLink>
          <NavLink to="/profile" className={linkClasses}>
            Profile
          </NavLink>
          <button
            onClick={handleLogout}
            className="ml-4 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-all"
          >
            Logout
          </button>
        </nav>
      </header>

      {/* Page Content (scrollable) */}
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
