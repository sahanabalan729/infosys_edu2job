import { useState, useEffect } from "react";
import {
  Wand2,
  BarChart3,
  ArrowRight,
  BriefcaseBusiness,
  PlayCircle,
  History,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const [username, setUsername] = useState("");
  const [show, setShow] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedName = localStorage.getItem("username");
    if (storedName) setUsername(storedName);
    setTimeout(() => setShow(true), 300);
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-6 py-10 text-center bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-600 animate-gradient">
      {/* Floating Background Blobs */}
      <div className="absolute -top-20 -left-20 w-72 h-72 bg-purple-400/40 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-64 h-64 bg-indigo-400/40 rounded-full blur-3xl animate-pulse delay-1000"></div>

      {/* Welcome Section */}
<div
  className={`flex flex-col items-center justify-center gap-3 transform transition-all duration-700 ${
    show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
  }`}
>
  <div className="flex items-center gap-3 backdrop-blur-sm px-2 py-1 rounded-md">
    <BriefcaseBusiness className="w-9 h-9 text-white drop-shadow-md" />
    <h2 className="text-4xl font-extrabold text-transparent bg-clip-text 
                   bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 drop-shadow-sm">
      Welcome to Edu2Job
    </h2>
  </div>
</div>

<p
  className={`mt-4 text-lg font-medium text-white transition-all duration-1000 ${
    show ? "opacity-100 scale-100" : "opacity-0 scale-95"
  }`}
>
  👋 Hello, <span className="font-semibold text-yellow-200">{username}</span>
  <br />
  Ready to explore your career path?
</p>





      {/* Two Cards */}
      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-10 w-full max-w-5xl">
        {/* Job Prediction Card */}
        <div
          className="group relative p-8 bg-white/90 rounded-2xl shadow-xl border border-gray-200/40 
                     transition-transform duration-300 hover:scale-[1.03] hover:-rotate-1 hover:shadow-2xl"
        >
          <Wand2 className="mx-auto w-16 h-16 text-indigo-600 drop-shadow-md transition-transform group-hover:scale-110 group-hover:rotate-12 duration-300" />
          <h3 className="mt-5 text-2xl font-semibold text-gray-800">
            Job Prediction
          </h3>
          <p className="mt-2 text-sm text-gray-600">
            Discover your ideal role with AI.
          </p>
          <button
            onClick={() => navigate("/predict")}
            className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-xl font-medium
                       bg-gradient-to-r from-indigo-600 to-purple-600 text-white
                       shadow-md hover:shadow-xl hover:gap-3 transition-all duration-300"
          >
            <PlayCircle size={18} /> Get Started <ArrowRight size={18} />
          </button>
        </div>

        {/* Prediction History Card */}
        <div
          className="group relative p-8 bg-white/90 rounded-2xl shadow-xl border border-gray-200/40 
                     transition-transform duration-300 hover:scale-[1.03] hover:rotate-1 hover:shadow-2xl"
        >
          <BarChart3 className="mx-auto w-16 h-16 text-purple-600 drop-shadow-md transition-transform group-hover:scale-110 group-hover:-rotate-12 duration-300" />
          <h3 className="mt-5 text-2xl font-semibold text-gray-800">
            Prediction History
          </h3>
          <p className="mt-2 text-sm text-gray-600">
            View your past predictions and insights.
          </p>
          <button
            onClick={() => navigate("/predictionhistory")}
            className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-xl font-medium
                       bg-gradient-to-r from-purple-600 to-pink-500 text-white
                       shadow-md hover:shadow-xl hover:gap-3 transition-all duration-300"
          >
            <History size={18} /> View History <ArrowRight size={18} />
          </button>
        </div>
      </div>

      {/* Background Animation */}
      <style>
        {`
          @keyframes gradient {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          .animate-gradient {
            background-size: 200% 200%;
            animation: gradient 15s ease infinite;
          }
        `}
      </style>
    </div>
  );
}
