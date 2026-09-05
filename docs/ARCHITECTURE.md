# Architecture Overview

## Current & Intended Architecture

### Core Stack Flow
```
React (Frontend UI)
       ↓
FastAPI (REST API Backend)
       ↓
SQLAlchemy (ORM)
       ↓
PostgreSQL (Database)
```

### Production / Hosted Setup
In the production environment, the local PostgreSQL database is replaced by Supabase PostgreSQL:
```
React
       ↓
FastAPI
       ↓
SQLAlchemy
       ↓
Supabase PostgreSQL
```

*Note: Supabase is used strictly for its managed PostgreSQL database. All business logic, routing, and access control live within the FastAPI backend layer.*
