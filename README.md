# 🏀 Basketball Stats Tracker

A full-stack NBA analytics application that pulls real-time player data, computes advanced metrics (TS%, PER, eFG%), and visualizes performance trends with interactive charts.

## Features

- **Player Search** — Search any NBA player (active or retired)
- **Game Log** — Full game-by-game breakdown with PTS, REB, AST, +/-, shooting splits
- **Advanced Metrics** — True Shooting %, Player Efficiency Rating, Effective FG%
- **Shooting Splits** — FG%, 3P%, FT% with made/attempted counts
- **Interactive Charts** — Points/Rebounds/Assists trends, +/- per game, shooting percentages over time
- **Auto-Refresh** — Dashboard refreshes every 60 seconds for live game tracking
- **Multi-Season** — Switch between seasons (2017-18 through 2024-25)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI (Python) |
| Frontend | React 18 |
| Charts | Chart.js + react-chartjs-2 |
| Data Source | nba_api (stats.nba.com) |
| HTTP Client | Axios |

## Quick Start

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API docs available at `http://localhost:8000/docs`

### Frontend

```bash
cd frontend
npm install
npm start
```

Runs at `http://localhost:3000`

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `REACT_APP_API_URL` | `http://localhost:8000` | Backend API URL |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/players/search?q={name}` | Search players by name |
| `GET` | `/api/players/{id}/gamelog?season={season}` | Game-by-game stats |
| `GET` | `/api/players/{id}/advanced?season={season}` | Advanced metrics (TS%, PER) |
| `GET` | `/api/players/{id}/info` | Player bio info |
| `GET` | `/api/seasons` | Available seasons list |

## Advanced Metrics

- **TS% (True Shooting)** — `PTS / (2 * (FGA + 0.44 * FTA))` — measures scoring efficiency accounting for 3s and FTs
- **eFG% (Effective FG)** — `(FGM + 0.5 * FG3M) / FGA` — adjusts FG% for the added value of 3-pointers
- **PER (Player Efficiency)** — Simplified per-36 efficiency rating combining all box score stats

## Screenshots

_Coming soon_

## License

MIT