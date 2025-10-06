import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Prediction from "./pages/Prediction.jsx";
import Profile from "./pages/Profile.jsx";
import Layout from "./components/Layout.jsx";   // ✅ Layout import
import PredictionHistory from "./pages/PredictionHistory.jsx";

// Protected Route Wrapper
function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/login" />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Auth Routes (No Layout) */}
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected Routes (With Layout) */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/predict"
        element={
          <ProtectedRoute>
            <Layout>
              <Prediction />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/predictionhistory"   // ✅ spelling corrected
        element={
          <ProtectedRoute>
            <Layout>
              <PredictionHistory />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Layout>
              <Profile />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}
