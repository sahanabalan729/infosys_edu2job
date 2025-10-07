from flask import Flask, request, jsonify
import sqlite3
import os
import joblib
import numpy as np
import pickle
from flask_cors import CORS
import json
import traceback

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
    label_encoders, skills_encoder, certs_encoder = {}, None, None
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
        print("Received form:", form)

        # If model is missing, return dummy predictions
        if model is None or target_encoder is None:
            print("⚠️ Model or encoder not loaded, returning dummy predictions.")
            dummy_predictions = [
                {"job": "Software Developer", "confidence": 0.9, "explanation": "Sample role."},
                {"job": "Data Analyst", "confidence": 0.85, "explanation": "Sample role."},
                {"job": "Project Manager", "confidence": 0.8, "explanation": "Sample role."},
            ]
            return jsonify({"top_jobs": dummy_predictions})

        # ----------------------------
        # Encode categorical features safely
        # ----------------------------
        def safe_transform(encoder, value):
            try:
                return encoder.transform([value])[0]
            except:
                return 0

        degree_val = safe_transform(label_encoders.get("Degree"), form.get("degree",""))
        major_val  = safe_transform(label_encoders.get("Major"), form.get("major",""))
        industry_val = safe_transform(label_encoders.get("IndustryPreference"), form.get("industry",""))

        # ----------------------------
        # Encode skills and certifications
        # ----------------------------
        skills_list = form.get("skills", [])
        if skills_encoder:
            try:
                skills_encoded = skills_encoder.transform([skills_list])
            except:
                print("⚠️ Skills encoding failed, using zeros.")
                skills_encoded = np.zeros((1, skills_encoder.transform([[]]).shape[1]))
        else:
            skills_encoded = np.zeros((1,5))

        certs_list = form.get("certifications", [])
        if certs_encoder:
            try:
                certs_encoded = certs_encoder.transform([certs_list])
            except:
                print("⚠️ Certs encoding failed, using zeros.")
                certs_encoded = np.zeros((1, certs_encoder.transform([[]]).shape[1]))
        else:
            certs_encoded = np.zeros((1,5))

        # ----------------------------
        # Combine all features
        # ----------------------------
        X_numeric = np.array([[degree_val, major_val, float(form.get("cgpa",0)), float(form.get("experience",0)), industry_val]])
        X = np.hstack([X_numeric, skills_encoded, certs_encoded])
        print("Input X shape:", X.shape)

        # ----------------------------
        # Predict
        # ----------------------------
        y_probs = model.predict_proba(X)[0]
        top_idx = np.argsort(y_probs)[-3:][::-1]

        top_jobs = []
        for idx in top_idx:
            job_name = target_encoder.inverse_transform([model.classes_[idx]])[0]
            confidence = float(y_probs[idx])
            explanation = generate_explanation(job_name, form)
            top_jobs.append({"job": job_name, "confidence": confidence, "explanation": explanation})

        # Save top-1 role for DB
        top1_role = top_jobs[0]["job"] if top_jobs else None

        # Save to DB safely
        user_id = form.get("user_id")
        if user_id:
            try:
                conn = sqlite3.connect(DB_PATH)
                cur = conn.cursor()
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS predictions (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id TEXT,
                        cgpa TEXT,
                        degree TEXT,
                        major TEXT,
                        skills TEXT,
                        role TEXT,
                        top_jobs TEXT,
                        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """)
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
            except Exception as e:
                print("⚠️ Failed to save prediction to DB:", e)

        return jsonify({"top_jobs": top_jobs})

    except Exception as e:
        print("Prediction error:", e)
        traceback.print_exc()
        # Return a fallback prediction
        return jsonify({
            "top_jobs": [
                {"job": "Software Developer", "confidence": 0.9, "explanation": "Sample fallback role."},
                {"job": "Data Analyst", "confidence": 0.85, "explanation": "Sample fallback role."}
            ]
        })

# ----------------------------
# 6️⃣ Run server
# ----------------------------
if __name__ == "__main__":
    app.run(port=5000, debug=True)
