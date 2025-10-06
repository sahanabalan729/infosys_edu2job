import pandas as pd
import pickle
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, MultiLabelBinarizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
import numpy as np

# 1. Load dataset
df = pd.read_csv("Dataset.csv")

# Debug: check dataset columns
print("✅ Dataset columns:", df.columns.tolist())
print(df.head())

# 2. Process multi-value fields (Skills, Certifications)
if "Skills" in df.columns:
    df["Skills"] = df["Skills"].apply(lambda x: [s.strip() for s in x.split(",")] if pd.notna(x) else [])
else:
    df["Skills"] = [[] for _ in range(len(df))]

if "Certifications" in df.columns:
    df["Certifications"] = df["Certifications"].apply(lambda x: [c.strip() for c in x.split(",")] if pd.notna(x) else [])
else:
    df["Certifications"] = [[] for _ in range(len(df))]

# 3. Encode categorical columns safely
label_encoders = {}
categorical_cols = ["Degree", "Major", "IndustryPreference"]

for col in categorical_cols:
    if col in df.columns:
        le = LabelEncoder()
        df[col] = le.fit_transform(df[col].astype(str))
        label_encoders[col] = le
    else:
        print(f"⚠️ Skipping missing column: {col}")
        df[col] = 0  # default fill if missing

# 4. Encode Skills & Certifications
skills_encoder = MultiLabelBinarizer()
skills_encoded = skills_encoder.fit_transform(df["Skills"])

certs_encoder = MultiLabelBinarizer()
certs_encoded = certs_encoder.fit_transform(df["Certifications"])

# 5. Combine features
X_numeric_cols = [c for c in ["Degree", "Major", "CGPA", "Experience", "IndustryPreference"] if c in df.columns]
X_numeric = df[X_numeric_cols].values
X = np.hstack([X_numeric, skills_encoded, certs_encoded])

# 6. Encode target
target_encoder = LabelEncoder()
y = target_encoder.fit_transform(df["Job Role"])

# 7. Train-test split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.35, random_state=42)

# 8. Train model
model = RandomForestClassifier(n_estimators=1000, random_state=42)
model.fit(X_train, y_train)

# 9. Evaluate
y_pred = model.predict(X_test)
print("✅ Test Accuracy:", accuracy_score(y_test, y_pred))

# 10. Save model & encoders
with open("jobrole_model.pkl", "wb") as f:
    pickle.dump(model, f)

with open("label_encoder.pkl", "wb") as f:
    pickle.dump(target_encoder, f)

with open("feature_encoders.pkl", "wb") as f:
    pickle.dump({
        "label_encoders": label_encoders,
        "skills_encoder": skills_encoder,
        "certs_encoder": certs_encoder
    }, f)

print("🎉 Model trained & saved successfully!")  