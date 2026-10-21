# SehatSetu

Healthcare discovery and appointment-booking platform (Indore, Madhya Pradesh).

## Setup & Run

### Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

The backend server runs on `http://localhost:5000`.
Health check endpoint: `GET http://localhost:5000/api/health`

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

The frontend development server runs on `http://localhost:5173`.

### Production Build (Frontend)

```bash
cd frontend
npm run build
```
