# AutoParts
Group project for CSCE 4350 Fundamentals of Database Systems

## Run locally

Frontend (Vite + React):

```sh
cd AutoParts
npm install
npm run dev
```

Backend API (Express + PostgreSQL on Neon), in a second terminal:

```sh
neon env pull        # once, from the repo root: creates .env.local with DATABASE_URL
cd backend
npm install
npm run dev
```

Check it at http://localhost:3001/api/health and http://localhost:3001/api/parts.

Database schema, seed data and test accounts: see [backend/db/README.md](backend/db/README.md).
