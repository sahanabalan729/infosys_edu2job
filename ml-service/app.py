from flask import Flask, request, jsonify
import sqlite3
import os
import joblib
import numpy as np
import pickle
from flask_cors import CORS
import json

# ----------------------------
# 1️⃣ Create Flask app
# ----------------------------
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# ----------------------------
# 2️⃣ Configure DB path
# ----------------------------
BASE_DIR = os.path.dirname(__file__)
DB_DIR = os.path.join(BASE_DIR, "backend")
os.makedirs(DB_DIR, exist_ok=True)
DB_PATH = os.path.join(DB_DIR, "users.db")

# ----------------------------
# 3️⃣ Load ML Model & Encoders
# ----------------------------
MODEL_PATH = os.path.join(BASE_DIR, "jobrole_model.pkl")
LABEL_ENCODER_PATH = os.path.join(BASE_DIR, "label_encoder.pkl")
FEATURE_ENCODERS_PATH = os.path.join(BASE_DIR, "feature_encoders.pkl")

if os.path.exists(MODEL_PATH) and os.path.exists(LABEL_ENCODER_PATH) and os.path.exists(FEATURE_ENCODERS_PATH):
    model = joblib.load(MODEL_PATH)
    target_encoder = joblib.load(LABEL_ENCODER_PATH)
    with open(FEATURE_ENCODERS_PATH, "rb") as f:
        feature_encoders = pickle.load(f)
    label_encoders = feature_encoders.get("label_encoders", {})
    skills_encoder = feature_encoders.get("skills_encoder")
    certs_encoder = feature_encoders.get("certs_encoder")
    print("🎯 Model & encoders loaded successfully!")
else:
    model, target_encoder, label_encoders, skills_encoder, certs_encoder = None, None, {}, None, None
    print("⚠️ Model or encoders not found. Prediction API will not work.")

# ----------------------------
# 4️⃣ Explanation logic
# ----------------------------
def generate_explanation(job_name, form):
    tech_roles = ["data analyst","software engineer","project manager"]
    reasons = []

    if job_name.lower() in tech_roles:
        if job_name.lower() == "data analyst":
            if "Python" in form.get("skills", []) or "SQL" in form.get("skills", []):
                reasons.append("Your programming skills in Python/SQL match this role.")
        if job_name.lower() == "software engineer":
            if any(skill in form.get("skills", []) for skill in ["Python","Java","C++","Node.js","React"]):
                reasons.append("Your coding skills are suitable for Software Engineering.")
        if job_name.lower() == "project manager":
            if form.get("experience", 0) >= 3:
                reasons.append("Your experience supports project management responsibilities.")
    else:
        if job_name.lower() == "hr":
            if "HR" in form.get("skills", []) or "HR" in form.get("certifications", []):
                reasons.append("Your HR skills and certifications make you suitable for HR roles.")
        elif job_name.lower() == "finance":
            if "Finance" in form.get("skills", []) or "Finance" in form.get("certifications", []):
                reasons.append("Your finance knowledge is valuable for this role.")
    if not reasons:
        reasons.append("This role aligns with your profile.")
    return " ".join(reasons)

# ----------------------------
# 5️⃣ Prediction API
# ----------------------------
@app.route("/predict", methods=["POST"])
def predict():
    try:
        form = request.json
        print("📥 Form received:", form)

        if model is None:
            return jsonify({"top_jobs": []})

        # ----------------------------
        # Encode categorical fields
        # ----------------------------
        def safe_encode(encoder, val):
            if encoder is None:
                return 0
            try:
                return encoder.transform([val])[0]
            except:
                return 0

        degree_val = safe_encode(label_encoders.get("Degree"), form.get("degree",""))
        major_val = safe_encode(label_encoders.get("Major"), form.get("major",""))
        industry_val = safe_encode(label_encoders.get("IndustryPreference"), form.get("industry",""))

        # ----------------------------
        # Encode skills & certifications
        # ----------------------------
        skills_list = form.get("skills", [])
        if skills_encoder:
            try:
                skills_encoded = skills_encoder.transform([skills_list])
            except:
                skills_encoded = np.zeros((1, skills_encoder.transform([[]]).shape[1]))
        else:
            skills_encoded = np.zeros((1,5))

        certs_list = form.get("certifications", [])
        if certs_encoder:
            try:
                certs_encoded = certs_encoder.transform([certs_list])
            except:
                certs_encoded = np.zeros((1, certs_encoder.transform([[]]).shape[1]))
        else:
            certs_encoded = np.zeros((1,5))

        X_numeric = np.array([[degree_val, major_val, float(form.get("cgpa",0)), float(form.get("experience",0)), industry_val]])
        X = np.hstack([X_numeric, skills_encoded, certs_encoded])

        print("🧮 Encoded features X:", X)

        # ----------------------------
        # Predict probabilities
        # ----------------------------
        y_probs = model.predict_proba(X)[0]
        print("📊 Predicted probabilities:", y_probs)

        top_idx = np.argsort(y_probs)[-3:][::-1]

        top_jobs = []
        for idx in top_idx:
            job_name = target_encoder.inverse_transform([model.classes_[idx]])[0]
            confidence = float(y_probs[idx])
            explanation = generate_explanation(job_name, form)
            top_jobs.append({
                "job": job_name,
                "confidence": confidence,
                "explanation": explanation
            })

        print("✅ Top jobs:", top_jobs)

        # ----------------------------
        # Save top-1 role to DB
        # ----------------------------
        user_id = form.get("user_id")
        if user_id:
            conn = sqlite3.connect(DB_PATH)
            cur = conn.cursor()
            cur.execute("""CREATE TABLE IF NOT EXISTS predictions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                cgpa TEXT,
                degree TEXT,
                major TEXT,
                skills TEXT,
                role TEXT,
                top_jobs TEXT,
                date TEXT DEFAULT CURRENT_TIMESTAMP
            )""")
            conn.commit()

            top1_role = top_jobs[0]["job"] if top_jobs else None
            cur.execute("""
                INSERT INTO predictions (user_id, cgpa, degree, major, skills, role, top_jobs)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                user_id,
                form.get("cgpa",""),
                form.get("degree",""),
                form.get("major",""),
                ",".join(skills_list),
                top1_role,
                json.dumps(top_jobs)
            ))
            conn.commit()
            conn.close()

        return jsonify({"top_jobs": top_jobs})

    except Exception as e:
        print("❌ Prediction error:", e)
        return jsonify({"top_jobs": []})

# ----------------------------
# 6️⃣ Run server
# ----------------------------
if __name__ == "__main__":
    app.run(port=5000, debug=True)
