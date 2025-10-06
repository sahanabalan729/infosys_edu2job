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
# Load ML Model & Encoders
# ----------------------------
MODEL_PATH = "jobrole_model.pkl"
LABEL_ENCODER_PATH = "label_encoder.pkl"
FEATURE_ENCODERS_PATH = "feature_encoders.pkl"

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
    model, target_encoder, feature_encoders = None, None, None
    print("⚠️ Model or encoders not found. Prediction API will not work.")

# ----------------------------
# 3️⃣ Explanation logic
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
# 4️⃣ Prediction API
# ----------------------------
@app.route("/predict", methods=["POST"])
def predict():
    try:
        form = request.json
        if model is None:
            return jsonify({"top_jobs": []})

        # Encode categorical fields
        degree_enc = label_encoders.get("Degree")
        major_enc = label_encoders.get("Major")
        industry_enc = label_encoders.get("IndustryPreference")

        try:
            degree_val = degree_enc.transform([form.get("degree","")])[0] if degree_enc else 0
        except:
            degree_val = 0
        try:
            major_val = major_enc.transform([form.get("major","")])[0] if major_enc else 0
        except:
            major_val = 0
        try:
            industry_val = industry_enc.transform([form.get("industry","")])[0] if industry_enc else 0
        except:
            industry_val = 0

        skills_list = form.get("skills", [])
        skills_encoded = skills_encoder.transform([skills_list]) if skills_encoder else np.zeros((1,5))
        certs_list = form.get("certifications", [])
        certs_encoded = certs_encoder.transform([certs_list]) if certs_encoder else np.zeros((1,5))

        X_numeric = np.array([[degree_val, major_val, float(form.get("cgpa",0)), float(form.get("experience",0)), industry_val]])
        X = np.hstack([X_numeric, skills_encoded, certs_encoded])

        # Predict
        y_probs = model.predict_proba(X)[0]
        top_idx = np.argsort(y_probs)[-3:][::-1]

        top_jobs = []
        for idx in top_idx:
            # ✅ FIXED: Use model.classes_ before decoding
            job_name = target_encoder.inverse_transform([model.classes_[idx]])[0]
            confidence = float(y_probs[idx])
            explanation = generate_explanation(job_name, form)
            top_jobs.append({
                "job": job_name,
                "confidence": confidence,
                "explanation": explanation
            })

        # Save top-1 role explicitly
        top1_role = top_jobs[0]["job"] if top_jobs else None

        # Save to DB
        user_id = form.get("user_id")
        if user_id:
            conn = sqlite3.connect(DB_PATH)
            cur = conn.cursor()
            cur.execute("""
                INSERT INTO predictions (user_id, cgpa, degree, major, skills, role, top_jobs, date)
                VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            """, (
                user_id,
                form.get("cgpa",""),
                form.get("degree",""),
                form.get("major",""),
                ",".join(skills_list),
                top1_role,               # Save top-1 role
                json.dumps(top_jobs)
            ))
            conn.commit()
            conn.close()

        return jsonify({"top_jobs": top_jobs})

    except Exception as e:
        print("Prediction error:", e)
        return jsonify({"top_jobs": []})

# ----------------------------
# 5️⃣ Run server
# ----------------------------
if __name__ == "__main__":
    app.run(port=5000, debug=True)
