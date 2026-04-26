from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from nba_api.stats.endpoints import (
    playercareerstats,
    playergamelog,
    commonplayerinfo,
    leaguedashplayerstats,
)
from nba_api.stats.static import players
from pydantic import BaseModel
from typing import Optional
import pandas as pd

app = FastAPI(
    title="Basketball Stats Tracker",
    description="NBA player stats with advanced metrics (TS%, PER, +/-, shooting splits)",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Models ───────────────────────────────────────────────
class PlayerSummary(BaseModel):
    id: int
    full_name: str
    first_name: str
    last_name: str
    is_active: bool


class GameStats(BaseModel):
    game_date: str
    matchup: str
    wl: Optional[str]
    min: float
    pts: int
    reb: int
    ast: int
    plus_minus: float
    fgm: int
    fga: int
    fg_pct: float
    fg3m: int
    fg3a: int
    fg3_pct: float
    ftm: int
    fta: int
    ft_pct: float
    stl: int
    blk: int
    tov: int


class AdvancedStats(BaseModel):
    ts_pct: float
    efg_pct: float
    per: float
    avg_pts: float
    avg_reb: float
    avg_ast: float
    avg_plus_minus: float
    avg_fg_pct: float
    avg_fg3_pct: float
    avg_ft_pct: float
    total_fgm: int
    total_fga: int
    total_fg3m: int
    total_fg3a: int
    total_ftm: int
    total_fta: int
    games_played: int


# ─── Helpers ──────────────────────────────────────────────
def safe_float(val, default=0.0):
    """Safely convert a value to float."""
    try:
        if val is None or (isinstance(val, float) and pd.isna(val)):
            return default
        return float(val)
    except (ValueError, TypeError):
        return default


def safe_int(val, default=0):
    """Safely convert a value to int."""
    try:
        if val is None or (isinstance(val, float) and pd.isna(val)):
            return default
        return int(val)
    except (ValueError, TypeError):
        return default


def compute_ts_pct(pts: int, fga: int, fta: int) -> float:
    """True Shooting Percentage = PTS / (2 * (FGA + 0.44 * FTA))"""
    denom = 2 * (fga + 0.44 * fta)
    if denom == 0:
        return 0.0
    return round(pts / denom, 4)


def compute_efg_pct(fgm: int, fg3m: int, fga: int) -> float:
    """Effective FG% = (FGM + 0.5 * FG3M) / FGA"""
    if fga == 0:
        return 0.0
    return round((fgm + 0.5 * fg3m) / fga, 4)


def compute_per(stats: dict, minutes: float) -> float:
    """
    Simplified PER approximation.
    Full PER requires league averages and pace adjustments.
    This uses the commonly cited simplified formula.
    """
    if minutes == 0:
        return 0.0

    per = (
        stats["pts"]
        + stats["reb"]
        + stats["ast"]
        + stats["stl"]
        + stats["blk"]
        - (stats["fga"] - stats["fgm"])
        - (stats["fta"] - stats["ftm"])
        - stats["tov"]
    ) / minutes * 36  # per-36 normalization

    return round(per, 2)


# ─── Endpoints ────────────────────────────────────────────
@app.get("/")
def root():
    return {"message": "Basketball Stats Tracker API", "version": "1.0.0"}


@app.get("/api/players/search", response_model=list[PlayerSummary])
def search_players(q: str = Query(..., min_length=2, description="Player name search")):
    """Search for NBA players by name."""
    results = players.find_players_by_full_name(q)
    if not results:
        # Try partial match
        all_players = players.get_players()
        results = [
            p for p in all_players
            if q.lower() in p["full_name"].lower()
        ]

    return [
        PlayerSummary(
            id=p["id"],
            full_name=p["full_name"],
            first_name=p["first_name"],
            last_name=p["last_name"],
            is_active=p["is_active"],
        )
        for p in results[:15]
    ]


@app.get("/api/players/{player_id}/gamelog", response_model=list[GameStats])
def get_player_gamelog(
    player_id: int,
    season: str = Query(default="2024-25", description="NBA season (e.g. 2024-25)"),
):
    """Get game-by-game stats for a player in a given season."""
    try:
        log = playergamelog.PlayerGameLog(
            player_id=player_id,
            season=season,
            season_type_all_star="Regular Season",
        )
        df = log.get_data_frames()[0]
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Could not fetch game log: {e}")

    if df.empty:
        return []

    games = []
    for _, row in df.iterrows():
        games.append(
            GameStats(
                game_date=str(row.get("GAME_DATE", "")),
                matchup=str(row.get("MATCHUP", "")),
                wl=row.get("WL"),
                min=safe_float(row.get("MIN", 0)),
                pts=safe_int(row.get("PTS", 0)),
                reb=safe_int(row.get("REB", 0)),
                ast=safe_int(row.get("AST", 0)),
                plus_minus=safe_float(row.get("PLUS_MINUS", 0)),
                fgm=safe_int(row.get("FGM", 0)),
                fga=safe_int(row.get("FGA", 0)),
                fg_pct=safe_float(row.get("FG_PCT", 0)),
                fg3m=safe_int(row.get("FG3M", 0)),
                fg3a=safe_int(row.get("FG3A", 0)),
                fg3_pct=safe_float(row.get("FG3_PCT", 0)),
                ftm=safe_int(row.get("FTM", 0)),
                fta=safe_int(row.get("FTA", 0)),
                ft_pct=safe_float(row.get("FT_PCT", 0)),
                stl=safe_int(row.get("STL", 0)),
                blk=safe_int(row.get("BLK", 0)),
                tov=safe_int(row.get("TOV", 0)),
            )
        )

    return games


@app.get("/api/players/{player_id}/advanced", response_model=AdvancedStats)
def get_player_advanced(
    player_id: int,
    season: str = Query(default="2024-25", description="NBA season (e.g. 2024-25)"),
):
    """Compute advanced stats (TS%, eFG%, PER) for a player's season."""
    try:
        log = playergamelog.PlayerGameLog(
            player_id=player_id,
            season=season,
            season_type_all_star="Regular Season",
        )
        df = log.get_data_frames()[0]
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Could not fetch stats: {e}")

    if df.empty:
        raise HTTPException(status_code=404, detail="No games found for this season")

    # Aggregate totals
    total_pts = safe_int(df["PTS"].sum())
    total_reb = safe_int(df["REB"].sum())
    total_ast = safe_int(df["AST"].sum())
    total_fgm = safe_int(df["FGM"].sum())
    total_fga = safe_int(df["FGA"].sum())
    total_fg3m = safe_int(df["FG3M"].sum())
    total_fg3a = safe_int(df["FG3A"].sum())
    total_ftm = safe_int(df["FTM"].sum())
    total_fta = safe_int(df["FTA"].sum())
    total_stl = safe_int(df["STL"].sum())
    total_blk = safe_int(df["BLK"].sum())
    total_tov = safe_int(df["TOV"].sum())
    total_min = safe_float(df["MIN"].sum())
    total_pm = safe_float(df["PLUS_MINUS"].sum())
    games = len(df)

    ts = compute_ts_pct(total_pts, total_fga, total_fta)
    efg = compute_efg_pct(total_fgm, total_fg3m, total_fga)
    per = compute_per(
        {
            "pts": total_pts,
            "reb": total_reb,
            "ast": total_ast,
            "stl": total_stl,
            "blk": total_blk,
            "fgm": total_fgm,
            "fga": total_fga,
            "ftm": total_ftm,
            "fta": total_fta,
            "tov": total_tov,
        },
        total_min,
    )

    return AdvancedStats(
        ts_pct=ts,
        efg_pct=efg,
        per=per,
        avg_pts=round(total_pts / games, 1) if games else 0,
        avg_reb=round(total_reb / games, 1) if games else 0,
        avg_ast=round(total_ast / games, 1) if games else 0,
        avg_plus_minus=round(total_pm / games, 1) if games else 0,
        avg_fg_pct=round(total_fgm / total_fga, 3) if total_fga else 0,
        avg_fg3_pct=round(total_fg3m / total_fg3a, 3) if total_fg3a else 0,
        avg_ft_pct=round(total_ftm / total_fta, 3) if total_fta else 0,
        total_fgm=total_fgm,
        total_fga=total_fga,
        total_fg3m=total_fg3m,
        total_fg3a=total_fg3a,
        total_ftm=total_ftm,
        total_fta=total_fta,
        games_played=games,
    )


@app.get("/api/players/{player_id}/info")
def get_player_info(player_id: int):
    """Get basic player info (team, position, height, etc.)."""
    try:
        info = commonplayerinfo.CommonPlayerInfo(player_id=player_id)
        df = info.get_data_frames()[0]
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Player not found: {e}")

    if df.empty:
        raise HTTPException(status_code=404, detail="Player not found")

    row = df.iloc[0]
    return {
        "id": player_id,
        "full_name": f"{row.get('FIRST_NAME', '')} {row.get('LAST_NAME', '')}",
        "team": row.get("TEAM_NAME", "N/A"),
        "team_abbreviation": row.get("TEAM_ABBREVIATION", "N/A"),
        "jersey": row.get("JERSEY", "N/A"),
        "position": row.get("POSITION", "N/A"),
        "height": row.get("HEIGHT", "N/A"),
        "weight": row.get("WEIGHT", "N/A"),
        "country": row.get("COUNTRY", "N/A"),
        "draft_year": row.get("DRAFT_YEAR", "N/A"),
        "draft_round": row.get("DRAFT_ROUND", "N/A"),
        "draft_number": row.get("DRAFT_NUMBER", "N/A"),
    }


@app.get("/api/seasons")
def get_available_seasons():
    """Return list of recent NBA seasons."""
    return {
        "seasons": [
            "2024-25",
            "2023-24",
            "2022-23",
            "2021-22",
            "2020-21",
            "2019-20",
            "2018-19",
            "2017-18",
        ]
    }
