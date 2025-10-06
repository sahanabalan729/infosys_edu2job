import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CreatableSelect from "react-select/creatable";
import { api, ml } from "../api/client";
import {
  GraduationCap,
  BookOpen,
  Star,
  Briefcase,
  Clock,
  UserCheck,
  Code,
  Award,
  Play,
  RefreshCcw,
  Save
} from "lucide-react";

export default function Prediction() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    degree: "",
    major: "",
    cgpa: "",
    skills: [],
    certifications: [],
    industry: "",
    experience: "",
    employed: "",
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/login");
  }, [navigate]);

  const degrees = ["B.Tech","B.E","M.Tech","M.E","B.Sc","M.Sc","MBA","PhD"];
  const majors = ["Computer Science","Information Technology","Mechanical","Electrical","Civil","Electronics","AI & DS","Design","Management"];
  const industries = ["Software / IT","Mechanical","Electrical","Civil","Electronics","Design / UI-UX","Management"];
  const experiences = [
    { value: 0, label: "0-1 years" },
    { value: 1.5, label: "1-3 years" },
    { value: 4, label: "3-5 years" },
    { value: 6, label: "5+ years" },
  ];
  const employedOptions = ["Yes","No"];
  const skillOptions = [
    { value: "Python", label: "Python" }, { value: "Java", label: "Java" }, { value: "C++", label: "C++" },
    { value: "SQL", label: "SQL" }, { value: "React", label: "React" }, { value: "Node.js", label: "Node.js" },
    { value: "Machine Learning", label: "Machine Learning" }, { value: "Deep Learning", label: "Deep Learning" },
    { value: "Data Science", label: "Data Science" }, { value: "AI", label: "AI" },{ value: "C", label: "C" } ,{ value: "AutoCAD", label: "AutoCAD" },
    { value: "CATIA", label: "CATIA" }, { value: "SolidWorks", label: "SolidWorks" }, { value: "Thermodynamics", label: "Thermodynamics" },
    { value: "Embedded Systems", label: "Embedded Systems" }, { value: "PLC", label: "PLC" }, { value: "Excel", label: "Excel" },
    { value: "UI/UX", label: "UI/UX" }, { value: "Figma", label: "Figma" }, { value: "Adobe XD", label: "Adobe XD" }, { value: "Photoshop", label: "Photoshop" },
    { value: "Finance", label: "Finance" },{ value: "MATLAB", label: "MATLAB" } ,{ value: "HR", label: "HR" }
  ];
  const certOptions = [
    { value: "AWS", label: "AWS" }, { value: "Udemy", label: "Udemy" },{ value: "Coursera", label: "Coursera" },{ value: "Microsoft", label: "Microsoft" }, { value: "Google", label: "Google" },
    { value: "IBM", label: "IBM" }, { value: "Oracle", label: "Oracle" }, { value: "Cisco", label: "Cisco" },
    { value: "Autodesk", label: "Autodesk" }, { value: "SolidWorks", label: "SolidWorks" },
    { value: "Infosys", label: "Infosys" }, { value: "TCS", label: "TCS" }, { value: "Capgemini", label: "Capgemini" }
  ];

  const handleChange = (field, value) => setForm({ ...form, [field]: value });

  const handlePredict = async () => {
    if (!form.degree || !form.major || !form.cgpa) {
      alert("Please fill all required fields!");
      return;
    }
    if (form.cgpa < 0) {
      alert("CGPA cannot be negative!");
      return;
    }

    setLoading(true);
    setResult(null);

    const payload = {
      degree: form.degree,
      major: form.major,
      cgpa: Number(form.cgpa),
      skills: form.skills,
      certifications: form.certifications,
      industry: form.industry,
      experience: form.experience ? Number(form.experience) : 0,
      employed: form.employed,
    };

    try {
      const res = await ml.post("/predict", payload);
      const predictions = res.data.top_jobs || [];
      setResult(predictions);

      if (Array.isArray(predictions) && predictions.length > 0) {
        for (let job of predictions.slice(0, 3)) {
          const savePayload = {
            ...payload,
            skills: payload.skills.join(", "),
            certifications: payload.certifications.join(", "),
            top_jobs: [job],
          };
          await api.post("/predict", savePayload);
        }
      }
    } catch (err) {
      console.error("❌ Prediction error:", err.response || err);
      setResult([{ job: "Error predicting job role", explanation: err.message, confidence: 0 }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await api.post("/profile", form);
      alert("Profile saved successfully!");
    } catch (err) {
      console.error(err.response || err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        alert("Session expired. Please login again.");
        localStorage.removeItem("token");
        navigate("/login");
      } else {
        alert("Failed to save profile.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setForm({
      degree: "",
      major: "",
      cgpa: "",
      skills: [],
      certifications: [],
      industry: "",
      experience: "",
      employed: "",
    });
    setResult(null);
  };

  // Component for animated progress bar
  const ConfidenceBar = ({ confidence }) => {
    const [width, setWidth] = useState(0);

    useEffect(() => {
      const timer = setTimeout(() => {
        setWidth(Math.round(confidence * 100));
      }, 100); // small delay for animation
      return () => clearTimeout(timer);
    }, [confidence]);

    return (
      <div className="mt-2">
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className="h-3 bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-1000 ease-in-out"
            style={{ width: `${width}%` }}
          />
        </div>
        <p className="text-sm mt-1 text-gray-700">{width}% match</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 px-6 py-10 overflow-y-auto">
      <div className="bg-white/70 backdrop-blur-xl p-10 rounded-2xl shadow-2xl w-full max-w-4xl mx-auto">
        <h1 className="text-3xl font-extrabold text-center bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6">
          Job Role Prediction
        </h1>

        {!result ? (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Degree */}
            <div>
              <label className="flex items-center gap-2 mb-1 font-medium text-gray-700">
                <GraduationCap className="w-5 h-5 text-indigo-600"/> Degree
              </label>
              <select
                className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-400"
                value={form.degree}
                onChange={(e) => handleChange("degree", e.target.value)}
              >
                <option value="">Select Degree</option>
                {degrees.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            {/* Major */}
            <div>
              <label className="flex items-center gap-2 mb-1 font-medium text-gray-700">
                <BookOpen className="w-5 h-5 text-indigo-600"/> Major
              </label>
              <select
                className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-400"
                value={form.major}
                onChange={(e) => handleChange("major", e.target.value)}
              >
                <option value="">Select Major</option>
                {majors.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            {/* CGPA */}
            <div>
              <label className="flex items-center gap-2 mb-1 font-medium text-gray-700">
                <Star className="w-5 h-5 text-yellow-500"/> CGPA
              </label>
              <input
                type="number"
                step="0.01"
                className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-400"
                value={form.cgpa}
                onChange={(e) => handleChange("cgpa", e.target.value)}
              />
            </div>

            {/* Industry */}
            <div>
              <label className="flex items-center gap-2 mb-1 font-medium text-gray-700">
                <Briefcase className="w-5 h-5 text-purple-600"/> Industry Preference
              </label>
              <select
                className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-400"
                value={form.industry}
                onChange={(e) => handleChange("industry", e.target.value)}
              >
                <option value="">Select Industry</option>
                {industries.map(ind => <option key={ind} value={ind}>{ind}</option>)}
              </select>
            </div>

            {/* Experience */}
            <div>
              <label className="flex items-center gap-2 mb-1 font-medium text-gray-700">
                <Clock className="w-5 h-5 text-indigo-600"/> Experience
              </label>
              <select
                className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-400"
                value={form.experience}
                onChange={(e) => handleChange("experience", Number(e.target.value))}
              >
                <option value="">Select Experience</option>
                {experiences.map(exp => <option key={exp.value} value={exp.value}>{exp.label}</option>)}
              </select>
            </div>

            {/* Employed */}
            <div>
              <label className="flex items-center gap-2 mb-1 font-medium text-gray-700">
                <UserCheck className="w-5 h-5 text-green-600"/> Currently Employed
              </label>
              <select
                className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-400"
                value={form.employed}
                onChange={(e) => handleChange("employed", e.target.value)}
              >
                <option value="">Select</option>
                {employedOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>

            {/* Skills */}
            <div className="md:col-span-2">
              <label className="flex items-center gap-2 mb-1 font-medium text-gray-700">
                <Code className="w-5 h-5 text-indigo-600"/> Skills
              </label>
              <CreatableSelect
                isMulti
                options={skillOptions}
                value={form.skills.map(s => ({ value: s, label: s }))}
                onChange={(val) => handleChange("skills", val ? val.map(v => v.value) : [])}
              />
            </div>

            {/* Certifications */}
            <div className="md:col-span-2">
              <label className="flex items-center gap-2 mb-1 font-medium text-gray-700">
                <Award className="w-5 h-5 text-green-600"/> Certifications
              </label>
              <CreatableSelect
                isMulti
                options={certOptions}
                value={form.certifications.map(c => ({ value: c, label: c }))}
                onChange={(val) => handleChange("certifications", val ? val.map(v => v.value) : [])}
              />
            </div>

            {/* Predict Button */}
            <div className="md:col-span-2 text-center mt-4">
              <button
                onClick={handlePredict}
                disabled={loading || !form.degree || !form.major || !form.cgpa}
                className="px-8 py-3 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mx-auto"
              >
                <Play className="w-5 h-5"/>
                {loading ? "Predicting..." : "Predict Job Role"}
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-8 flex flex-col items-center w-full max-w-md mx-auto">
            <h2 className="text-2xl font-bold mb-4">Top Job Suggestions</h2>
            {Array.isArray(result) && result.map((job, index) => (
              <div key={index} className="w-full p-4 mb-2 bg-white/20 rounded-lg shadow">
                <h3 className="font-semibold text-lg">{job.job}</h3>
                <ConfidenceBar confidence={job.confidence} />
                <p className="text-sm mt-2">{job.explanation}</p>
              </div>
            ))}

            <div className="flex gap-4 mt-6">
              <button
                onClick={handleReset}
                className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-all duration-300 flex items-center gap-2"
              >
                <RefreshCcw className="w-4 h-4"/> Try Again
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-300 disabled:opacity-50 flex items-center gap-2"
              >
                <Save className="w-4 h-4"/> Save Profile
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
