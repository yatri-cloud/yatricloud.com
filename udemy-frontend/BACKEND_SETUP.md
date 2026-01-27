# Backend & Frontend Connection Setup

## Quick Start Guide

### Step 1: Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
```

Or if using virtual environment:

```bash
cd backend
./myenv/bin/pip install -r requirements.txt
```

### Step 2: Start the Backend Server

```bash
python3 backend/server.py
```

Or with venv:

```bash
./backend/myenv/bin/python3 backend/server.py
```

The backend API will be available at:
- **API Base URL**: `http://localhost:8000`
- **API Documentation**: `http://localhost:8000/docs` (Interactive Swagger UI)

### Step 3: Start the Frontend (in a new terminal)

```bash
npm install
npm run dev
```

Frontend will be available at:
- **Frontend URL**: `http://localhost:3001`

### Step 4: Verify Connection

1. Open your frontend at `http://localhost:3001`
2. The frontend will automatically make requests to `http://localhost:8000`
3. You should see courses loading if the backend is working

---

## Available Backend Endpoints

### Health & Info
- `GET /health` - Health check
- `GET /api/providers` - List available providers (AWS, Azure, GCP)

### Providers
- `GET /api/providers/{provider}/certifications` - Get certifications for a provider
- `GET /api/providers/models` - Get available Ollama models

### Courses
- `POST /api/courses` - Generate a new course with questions
  ```json
  {
    "provider": "aws",
    "certification": "Solutions Architect Associate",
    "num_questions": 10,
    "exam_duration_minutes": 180,
    "model": "mistral"
  }
  ```
- `GET /api/courses` - Get all generated courses
- `GET /api/courses/{course_id}` - Get specific course
- `DELETE /api/courses/{course_id}` - Delete a course

### Authentication (Placeholder)
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register
- `GET /api/auth/verify` - Verify token

### User
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

---

## Environment Variables

Create a `.env` file in the frontend root to configure:

```env
VITE_API_BASE_URL=http://localhost:8000
```

---

## Troubleshooting

### Backend won't start
- Ensure Ollama is running (if generating questions)
- Check Python version: `python3 --version` (requires 3.13+)
- Install dependencies: `pip install -r requirements.txt`

### Frontend can't connect to backend
- Verify backend is running on port 8000
- Check CORS is enabled (it is by default)
- Check browser console for error messages
- Verify API_BASE_URL in `src/lib/api.ts`

### CORS Errors
- The backend has CORS enabled for `localhost:3001`
- If accessing from different URL, update the `allow_origins` in `server.py`

---

## Next Steps

1. Implement database (SQLAlchemy + PostgreSQL recommended)
2. Add proper authentication (JWT tokens)
3. Add payment integration
4. Deploy to production (Vercel + Railway/Heroku)
