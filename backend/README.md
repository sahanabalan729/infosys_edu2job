# Job Role Prediction – Advanced (Express + JWT + Flask ML, Dataset.csv)

## Overview
- **Frontend**: Glassmorphic login/registration + dashboard with advanced inputs (degree, major, CGPA, employed, experience, industry, skills, certifications).
- **Auth**: JWT via Express; in-container messages for *Login successful*, *User not found*, *Invalid password*, *Not logged in*.
- **ML**: Flask service that trains on your provided `Dataset.csv` (500 rows, 9 columns). Text fields **Skills** and **Certifications** are converted to multi-hot vectors.

## Run
### Node/Express
```bash
npm install
npm start
```

### Flask ML Service
```bash
cd ml_service
python -m venv venv
# Windows: venv\Scripts\activate
# macOS/Linux: source venv/bin/activate
python -m pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
python app.py
```

## Use
1. Visit http://localhost:3000 → Register → Login.
2. Go to Dashboard and fill the form. Use comma-separated lists for **skills** and **certifications**.
3. Prediction result will display in the container.

## Notes
- If you use Python 3.13 and hit binary wheel issues, prefer Python **3.11/3.12** for the Flask venv.
- The Express fallback route is Express 5 compatible.