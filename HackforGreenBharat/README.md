# EcoSense — Sustainable AI-Powered Green Navigation & Health Intelligence

EcoSense is an environmental routing and health intelligence platform for India that calculates real-time clean-air routes, eco scores, and district-level environmental analytics.

---

## 🌿 AQI Data Pipeline & Provenance

### 1. Transparency & Data Quality Classifications

EcoSense's national and district-level heatmaps classify AQI observations transparently into 3 distinct provenance levels:

| Source Type (`sourceType`) | Description | Visual Tag |
|---|---|---|
| `cpcb_station_average` | Arithmetic mean of verified active monitoring stations (CPCB / data.gov.in) within district boundaries | 📡 **CPCB Station Avg** |
| `derived_nearby_station_estimate` | Documented spatial estimate (inverse-distance weighted) from neighboring active stations | 📐 **Spatial Estimate** |
| `fallback_state_aqi` | State-level baseline reference value used when local station data is unmonitored | 📋 **State Fallback Baseline** |

### 2. CPCB Regulatory AQI Bands

All categories conform strictly to the Central Pollution Control Board (CPCB) standards:

- **Good**: 0–50
- **Satisfactory**: 51–100
- **Moderate**: 101–200
- **Poor**: 201–300
- **Very Poor**: 301–400
- **Severe**: 401–500

### 3. Server Ingestion Pipeline

To run the automated ingestion job:

```bash
cd backend
npm run ingest:aqi
```

To validate dataset syntax, count constraints (720 districts, 36 State/UTs), and CPCB band compliance:

```bash
cd backend
npm run validate:aqi
```

### 4. Environment Variables (Server-Only)

API keys must never be committed to git or exposed to the client-side bundle.

- `DATA_GOV_IN_API_KEY`: API key for Open Government Data Platform India (data.gov.in).
- `CPCB_API_KEY`: Optional CPCB direct portal credential.
- `AQI_INGEST_INTERVAL_HOURS`: Scheduled update frequency (default: 6 hours).

---

## 🚀 Running Locally

### Development

```bash
# In the HackforGreenBharat directory
cd backend
npm run dev:all
```

Runs both frontend (Vite) and backend (Express) concurrently.
