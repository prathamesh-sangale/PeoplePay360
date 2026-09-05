# PeoplePay360 Development Guide

## Technology Stack
- **Frontend**: React, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Python, FastAPI, SQLAlchemy, Alembic
- **Database**: PostgreSQL (Local for dev, Supabase for production)
- **Node Version**: v24+
- **Python Version**: 3.12+

## Installation

### Frontend
```bash
cd frontend
npm install
```

### Backend
```bash
cd backend
python -m venv .venv
source .venv/Scripts/activate  # On Windows
pip install -r requirements.txt
```

## Running the Application

### Start Frontend
```bash
cd frontend
npm run dev
```

### Start Backend
```bash
cd backend
uvicorn app.main:app --reload
```

## Local PostgreSQL Configuration
1. Ensure PostgreSQL is installed locally.
2. Create a database named `peoplepay360`.
3. Copy `.env.example` to `.env` and update the `DATABASE_URL`.
4. Run Alembic migrations: `cd backend && alembic upgrade head` (Once initialized)

## Environment Variables
See `.env.example` for required variables. **NEVER** commit the actual `.env` file containing secrets.

## Git Strategy
- `main`: Stable production branch
- `frontend/hr`: Employee & HR frontend features (Member 1)
- `frontend/payroll-admin`: Payroll & Admin frontend features (Member 2)
- `backend/integration`: API, Auth, Business logic (Member 3)
- `database`: PostgreSQL, Models, Migrations (Member 4)
