# Deployment Validation Report: Sentinel

## 1. Overview
Sentinel supports one-click automated deployment for both local/VM instances and standard public cloud platforms (Railway).

---

## 2. Local VM Deployment (Simulated Fresh Environment)
To verify deployment in a clean environment, follow these steps:

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/catnipconnoisseur/Sentinel.git
   cd Sentinel
   ```
2. **Launch Deployment Script:**
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```
   *If `.env` is missing, the script will prompt for your `FIREWORKS_API_KEY` and write it automatically.*
3. **Automated Container Bootstrap:**
   When the `backend` container starts, `entrypoint.sh` executes:
   - Detects missing database.
   - Generates 48h of multi-sensor telemetry.
   - Initialises SQLite schemas.
   - Indexes technical manuals and SOPs into ChromaDB.
4. **API Readiness:**
   Within **~12 seconds**, the server is operational at `http://localhost:8000/api/health` and Vite serves the frontend at `http://localhost`.

---

## 3. Public Cloud Deployment (Railway)
Sentinel is pre-configured for public deployment as two decoupled microservices:

### Backend Service
- **Source:** `/backend`
- **Environment Variables:**
  - `FIREWORKS_API_KEY` (Required)
- **Persistent Volume:** Mount `/app/data` to persist `sentinel.db` and ChromaDB collections.
- **Port:** 8000

### Frontend Service
- **Source:** `/frontend`
- **Environment Variables:**
  - `BACKEND_URL=https://sentinel-production-9b3f.up.railway.app`
- **Server:** Nginx proxies client requests at `/api/*` to the backend.
- **Port:** 80 (serves compiled static chunks)
