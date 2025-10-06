import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { BarChart3 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";

export default function PredictionHistory() {
  const [history, setHistory] = useState([]);
  const [allHistory, setAllHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCharts, setShowCharts] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const navigate = useNavigate();

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("You are not logged in");
        navigate("/login");
        return;
      }

      const res = await axios.get("http://localhost:3000/predictions", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const validData = (res.data || []).filter(
        (h) => h.role && h.role.trim() !== "" && h.role !== "N/A"
      );

      setAllHistory(validData);

      const latestMap = new Map();
      validData.forEach((item) => {
        const key = `${item.cgpa}|${item.degree}|${item.major}|${item.skills}`;
        if (
          !latestMap.has(key) ||
          new Date(item.date) > new Date(latestMap.get(key).date)
        ) {
          latestMap.set(key, item);
        }
      });

      setHistory(Array.from(latestMap.values()));
    } catch (err) {
      console.error("❌ Error fetching history:", err);
      setError(err.response?.data?.message || err.message);
      if (err.response?.status === 401 || err.response?.status === 403) {
        alert("Session expired. Please login again.");
        localStorage.removeItem("token");
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:3000/predictions/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchHistory();
      setDeleteModal({ open: false, id: null });
    } catch (err) {
      console.error("❌ Error deleting prediction:", err);
      alert(err.response?.data?.message || "Failed to delete prediction");
    }
  };

  // Pagination
  const totalPages = Math.ceil(history.length / itemsPerPage);
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentItems = history.slice(indexOfFirst, indexOfLast);

  const changePage = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  // Skills Radar Chart
  const skillCounts = history.reduce((acc, h) => {
    if (!h.skills) return acc;
    const skillsArr = h.skills.split(",").map((s) => s.trim());
    skillsArr.forEach((s) => {
      acc[s] = (acc[s] || 0) + 1;
    });
    return acc;
  }, {});

  const skillData = Object.keys(skillCounts).map((s) => ({
    name: s,
    value: skillCounts[s],
  }));

  // Stacked Bar Chart
  const majors = [...new Set(history.map((h) => h.major))];
  const allRoles = [...new Set(allHistory.map((h) => h.role))];

  const stackedData = majors.map((major) => {
    const row = { major };
    allRoles.forEach((role) => {
      row[role] = allHistory.filter(
        (h) => h.major === major && h.role === role
      ).length;
    });
    return row;
  });

  const COLORS = [
    "#6366f1",
    "#f97316",
    "#10b981",
    "#ef4444",
    "#0ea5e9",
    "#a855f7",
    "#14b8a6",
    "#f59e0b",
    "#ec4899",
    "#84cc16",
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const filtered = payload.filter((p) => p.value > 0);
      return (
        <div className="bg-white shadow-md rounded-lg p-3 border border-gray-200">
          <p className="font-bold text-gray-800 mb-1">{label}</p>
          {filtered.map((entry, index) => (
            <p
              key={`tooltip-${index}`}
              style={{ color: entry.color }}
              className="text-sm font-medium"
            >
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 p-10">
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-indigo-700 mb-6">
          Prediction History
        </h1>

        {loading ? (
          <p className="text-center text-gray-700">Loading predictions...</p>
        ) : error ? (
          <p className="text-center text-red-600 font-semibold">{error}</p>
        ) : history.length === 0 ? (
          <p className="text-center text-gray-700 font-semibold">
            No predictions found. Make some predictions first!
          </p>
        ) : (
          <>
            {/* Table */}
            <div className="overflow-x-auto mb-6">
              <table className="w-full border border-gray-300 rounded-lg">
                <thead className="bg-indigo-600 text-white">
                  <tr>
                    <th className="p-2">CGPA</th>
                    <th className="p-2">Degree</th>
                    <th className="p-2">Major</th>
                    <th className="p-2">Skills</th>
                    <th className="p-2">Predicted Role</th>
                    <th className="p-2">Date</th>
                    <th className="p-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((h) => (
                    <tr key={h.id} className="text-center border-b">
                      <td className="p-2">{h.cgpa}</td>
                      <td className="p-2">{h.degree}</td>
                      <td className="p-2">{h.major}</td>
                      <td className="p-2">{h.skills}</td>
                      <td className="p-2 font-semibold text-indigo-600">{h.role}</td>
                      <td className="p-2">
                        {new Date(h.date).toLocaleDateString()}{" "}
                        {new Date(h.date).toLocaleTimeString()}
                      </td>
                      <td className="p-2">
                        <button
                          onClick={() => setDeleteModal({ open: true, id: h.id })}
                          className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-center items-center space-x-2 mb-8">
              <button
                onClick={() => changePage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
              >
                Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => changePage(i + 1)}
                  className={`px-3 py-1 rounded ${
                    currentPage === i + 1
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-200"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => changePage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>

            {/* Button to reveal insights */}
            <div className="text-center mb-6">
              <button
                onClick={() => setShowCharts(!showCharts)}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md transition flex items-center gap-2 mx-auto"
              >
                <BarChart3 size={18} />
                {showCharts ? "Hide Insights" : "View Insights"}
              </button>
            </div>

            {/* Charts */}
            <AnimatePresence>
              {showCharts && (
                <motion.div
                  className="grid md:grid-cols-2 gap-10"
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 50 }}
                  transition={{ duration: 0.5 }}
                >
                  {/* Stacked Bar Chart */}
                  <motion.div
                    className="bg-white rounded-xl shadow-md p-6"
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                  >
                    <h2 className="text-lg font-bold mb-4 text-gray-700">
                      Major-wise Predicted Roles
                    </h2>
                    <ResponsiveContainer width="100%" height={340}>
                      <BarChart
                        data={stackedData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                      >
                        <XAxis
                          dataKey="major"
                          interval={0}
                          angle={-35}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis />
                        <Tooltip content={<CustomTooltip />} />
                        {allRoles.map((role, i) => (
                          <Bar
                            key={role}
                            dataKey={role}
                            stackId="roles"
                            name={role}
                            fill={COLORS[i % COLORS.length]}
                          />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </motion.div>

                  {/* Skills Radar Chart */}
                  <motion.div
                    className="bg-white rounded-xl shadow-md p-6"
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <h2 className="text-lg font-bold mb-4 text-gray-700">
                      Skills Distribution
                    </h2>
                    <RadarChart
                      outerRadius={110}
                      width={450}
                      height={300}
                      data={skillData}
                    >
                      <PolarGrid />
                      <PolarAngleAxis
                        dataKey="name"
                        tick={{ fontSize: 10 }}
                        tickFormatter={(value) =>
                          value.length > 12 ? value.substring(0, 12) + "…" : value
                        }
                      />
                      <PolarRadiusAxis />
                      <Tooltip />
                      <Radar
                        name="Skills"
                        dataKey="value"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.6}
                      />
                    </RadarChart>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {deleteModal.open && (
            <motion.div
              className="fixed inset-0 bg-black/50 flex justify-center items-center z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-white rounded-xl shadow-xl p-6 w-80"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
              >
                <h2 className="text-lg font-bold mb-4 text-gray-700 text-center">
                  Confirm Delete
                </h2>
                <p className="text-center mb-6 text-gray-600">
                  Are you sure you want to delete this prediction?
                </p>
                <div className="flex justify-center gap-4">
                  <button
                    onClick={() => handleDelete(deleteModal.id)}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setDeleteModal({ open: false, id: null })}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
