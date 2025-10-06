import { useState, useEffect } from "react";
import axios from "axios";

export default function ProfilePage() {
  const [editMode, setEditMode] = useState(false);
  const [user, setUser] = useState({
    name: "",
    email: "",
    phone: "",
    linkedin: "",
    github: "",
    degree: "",
    major: "",
    cgpa: "",
    experience: "",
    skills: "",
    certifications: "",
  });

  // 🔹 Debug: log state on every render
  useEffect(() => {
    console.log("Current user state:", user);
  }, [user]);

  // Load profile from backend
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:3000/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log("Fetched profile from backend:", res.data);

        if (res.data) {
          setUser({
            name: res.data.name || "",
            email: res.data.email || "",
            phone: res.data.phone || "",
            linkedin: res.data.linkedin || "",
            github: res.data.github || "",
            degree: res.data.degree || "",
            major: res.data.major || "",
            cgpa: res.data.cgpa || "",
            experience: res.data.experience || "",
            skills: res.data.skills || "",
            certifications: res.data.certifications || "",
          });
        }
      } catch (err) {
        console.error("Error fetching profile:", err.message);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post("http://localhost:3000/profile", user, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Profile save response:", res.data);
      setEditMode(false);
      alert("Profile saved successfully!");
    } catch (err) {
      console.error("Error saving profile:", err.response?.data || err.message);
      alert("Error saving profile");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 px-6 py-10 flex justify-center items-center">
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Account Info */}
        <div className="bg-white/70 backdrop-blur-xl shadow-2xl rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-center bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6">
            User Info
          </h2>

          {["name", "email", "phone", "linkedin", "github"].map((field) => (
            <div className="mb-4" key={field}>
              <label className="text-gray-700 text-sm">
                {field.charAt(0).toUpperCase() + field.slice(1)}
              </label>
              <input
                type={field === "email" ? "email" : "text"}
                name={field}
                value={user[field]}
                onChange={handleChange}
                disabled={!editMode}
                placeholder={
                  field === "linkedin"
                    ? "https://linkedin.com/in/username"
                    : field === "github"
                    ? "https://github.com/username"
                    : ""
                }
                className="w-full p-3 rounded-lg border border-gray-300 bg-white/60 text-gray-800 focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          ))}
        </div>

        {/* Educational Details */}
        <div className="bg-white/70 backdrop-blur-xl shadow-2xl rounded-2xl p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Educational Details
            </h2>
            <button
              onClick={() => (editMode ? handleSave() : setEditMode(true))}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition-all duration-300"
            >
              {editMode ? "Save" : "Edit"}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {["degree", "major", "cgpa", "experience", "skills", "certifications"].map(
              (field) => (
                <div
                  className={field === "skills" || field === "certifications" ? "col-span-2" : ""}
                  key={field}
                >
                  <label className="text-gray-700 text-sm">
                    {field.charAt(0).toUpperCase() + field.slice(1)}
                  </label>
                  <input
                    type="text"
                    name={field}
                    value={user[field]}
                    onChange={handleChange}
                    disabled={!editMode}
                    className="w-full p-3 rounded-lg border border-gray-300 bg-white/60 text-gray-800 focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
