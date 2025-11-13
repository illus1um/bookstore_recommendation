# 🚀 Quick Start Guide

This quick guide will help you launch the project in 5 minutes.

---

## ⚡ Quick Installation

### Step 1: Clone Repository

```bash
git clone https://github.com/[your-username]/bookstore-recommendation.git
cd bookstore-recommendation
```

### Step 2: Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (choose your OS)
venv\Scripts\activate          # Windows
source venv/bin/activate       # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Create .env file
echo "MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=bookstore_db
SECRET_KEY=your-secret-key-min-32-characters-please-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
API_V1_STR=/api/v1
PROJECT_NAME=Bookstore Recommendation System
BACKEND_CORS_ORIGINS=[\"http://localhost:3000\",\"http://localhost:5173\"]
ENVIRONMENT=development" > .env

# Initialize database
python init_database.py

# Optional: Load test data
python -m app.db.seed

# Start server
uvicorn app.main:app --reload
```

Backend running on: **http://localhost:8000**

### Step 3: Frontend Setup (New Terminal)

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
echo "VITE_API_URL=http://localhost:8000
VITE_API_TIMEOUT=15000" > .env

# Start development server
npm run dev
```

Frontend running on: **http://localhost:5173**

---

## 🎯 Verification

1. **Frontend:** http://localhost:5173
2. **API Docs:** http://localhost:8000/docs
3. **Health Check:** http://localhost:8000/health

---

## 📝 First Steps

### 1. Registration

1. Open http://localhost:5173/register
2. Fill the form:
   - Email: `test@example.com`
   - Username: `testuser`
   - Password: `password123`
   - Favorite genres: select 2-3
3. Click "Register"

### 2. Browse Catalog

1. Go to "Catalog" section
2. Try filters by genre, author, price
3. Use search

### 3. Get Recommendations

1. Browse several books (open details)
2. Add some to cart
3. Return to homepage
4. Check "For You" section - personal recommendations!

---

## 🧪 Testing

### Generate Large Dataset

```bash
cd backend
python -m tests.generate_test_data
```

### Benchmark Recommendations

```bash
python -m tests.benchmark_recommendations
```

### Load Testing

```bash
pip install locust
locust -f tests/locustfile.py --host=http://localhost:8000
```

Open http://localhost:8089

---

## 📚 Documentation

- **Full Documentation:** [README.md](README.md)
- **Project Proposal:** [docs/PROJECT_PROPOSAL.md](docs/PROJECT_PROPOSAL.md)
- **Performance Analysis:** [docs/PERFORMANCE_ANALYSIS.md](docs/PERFORMANCE_ANALYSIS.md)
- **Final Report:** [docs/FINAL_REPORT.md](docs/FINAL_REPORT.md)
- **Testing Guide:** [docs/TESTING_GUIDE.md](docs/TESTING_GUIDE.md)

---

## 🆘 Common Issues

### MongoDB Connection Failed

**Problem:** `pymongo.errors.ServerSelectionTimeoutError`

**Solution:**
1. Check if MongoDB is running:
   ```bash
   # Windows
   sc query MongoDB
   
   # Linux/Mac
   systemctl status mongod
   ```

2. Check `MONGODB_URL` in `.env`

### Frontend Can't Connect to Backend

**Problem:** `Network Error` in browser console

**Solution:**
1. Verify backend is running on port 8000
2. Check `VITE_API_URL` in `frontend/.env`
3. Verify CORS settings in backend `.env`

### No Recommendations

**Problem:** Empty "For You" section

**Solution:**
1. Make sure you're registered and logged in
2. Interact with books (view, add to cart)
3. For cold start, specify favorite genres in profile

---

## 💡 Useful Commands

```bash
# Backend
cd backend
uvicorn app.main:app --reload              # Start with hot reload
python -m app.db.seed                      # Load test data
python -m tests.generate_test_data         # Generate large dataset
python -m tests.benchmark_recommendations  # Benchmark

# Frontend
cd frontend
npm run dev          # Start dev server
npm run build        # Production build
npm run preview      # Preview production
npm run lint         # Check linter

# MongoDB
mongosh              # MongoDB shell
use bookstore_db     # Switch to database
db.books.find()      # View books
db.users.find()      # View users
```

---

## 🎉 Done!

Now you have a fully functional bookstore with recommendation system!

**What's Next?**
- Explore [documentation](README.md)
- Check [API documentation](http://localhost:8000/docs)
- Run [performance tests](docs/TESTING_GUIDE.md)
- Read [project report](docs/FINAL_REPORT.md)

---

**Questions?** Create an issue in the repository or email [your email]
