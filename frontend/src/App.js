import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";
import {
  searchPlayers,
  getPlayerGamelog,
  getPlayerAdvanced,
  getPlayerInfo,
} from "./api";
import "./App.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

/* ─── Stat Card ─────────────────────────────────────────── */
function StatCard({ label, value, sub, accent }) {
  return (
    <div className={`stat-card ${accent ? "stat-card--accent" : ""}`}>
      <div className="stat-card__value">{value}</div>
      <div className="stat-card__label">{label}</div>
      {sub && <div className="stat-card__sub">{sub}</div>}
    </div>
  );
}

/* ─── Game Log Table ────────────────────────────────────── */
function GameLogTable({ games }) {
  if (!games.length) return null;

  return (
    <div className="table-wrap">
      <table className="game-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Matchup</th>
            <th>W/L</th>
            <th>MIN</th>
            <th>PTS</th>
            <th>REB</th>
            <th>AST</th>
            <th>+/-</th>
            <th>FG</th>
            <th>FG%</th>
            <th>3PT</th>
            <th>3P%</th>
            <th>FT</th>
            <th>FT%</th>
          </tr>
        </thead>
        <tbody>
          {games.map((g, i) => (
            <tr key={i} className={g.wl === "W" ? "row-win" : "row-loss"}>
              <td>{g.game_date}</td>
              <td className="matchup">{g.matchup}</td>
              <td>
                <span className={`wl-badge ${g.wl === "W" ? "wl-w" : "wl-l"}`}>
                  {g.wl}
                </span>
              </td>
              <td>{g.min}</td>
              <td className="bold">{g.pts}</td>
              <td>{g.reb}</td>
              <td>{g.ast}</td>
              <td className={g.plus_minus >= 0 ? "plus" : "minus"}>
                {g.plus_minus > 0 ? "+" : ""}
                {g.plus_minus}
              </td>
              <td>
                {g.fgm}/{g.fga}
              </td>
              <td>{(g.fg_pct * 100).toFixed(1)}%</td>
              <td>
                {g.fg3m}/{g.fg3a}
              </td>
              <td>{(g.fg3_pct * 100).toFixed(1)}%</td>
              <td>
                {g.ftm}/{g.fta}
              </td>
              <td>{(g.ft_pct * 100).toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─── Charts ────────────────────────────────────────────── */
function PerformanceCharts({ games }) {
  if (!games.length) return null;

  // Reverse so chronological (oldest → newest)
  const chronological = [...games].reverse();
  const labels = chronological.map((g) => {
    const parts = g.game_date.split(" ");
    return parts.length >= 2 ? `${parts[0]} ${parts[1]}` : g.game_date;
  });

  const chartOptions = (title) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, labels: { color: "#999", font: { size: 11 } } },
      title: {
        display: true,
        text: title,
        color: "#e4e4ef",
        font: { size: 14, weight: 600 },
      },
      tooltip: {
        backgroundColor: "#1a1a2e",
        borderColor: "#333",
        borderWidth: 1,
        titleColor: "#fff",
        bodyColor: "#ccc",
      },
    },
    scales: {
      x: {
        ticks: { color: "#666", maxRotation: 45, font: { size: 9 } },
        grid: { color: "rgba(255,255,255,0.04)" },
      },
      y: {
        ticks: { color: "#666" },
        grid: { color: "rgba(255,255,255,0.04)" },
      },
    },
  });

  const ptsRebAstData = {
    labels,
    datasets: [
      {
        label: "PTS",
        data: chronological.map((g) => g.pts),
        borderColor: "#4af",
        backgroundColor: "rgba(68, 170, 255, 0.1)",
        fill: true,
        tension: 0.3,
        pointRadius: 3,
      },
      {
        label: "REB",
        data: chronological.map((g) => g.reb),
        borderColor: "#34d399",
        backgroundColor: "rgba(52, 211, 153, 0.1)",
        fill: true,
        tension: 0.3,
        pointRadius: 3,
      },
      {
        label: "AST",
        data: chronological.map((g) => g.ast),
        borderColor: "#fb923c",
        backgroundColor: "rgba(251, 146, 60, 0.1)",
        fill: true,
        tension: 0.3,
        pointRadius: 3,
      },
    ],
  };

  const plusMinusData = {
    labels,
    datasets: [
      {
        label: "+/-",
        data: chronological.map((g) => g.plus_minus),
        backgroundColor: chronological.map((g) =>
          g.plus_minus >= 0 ? "rgba(52, 211, 153, 0.6)" : "rgba(239, 68, 68, 0.6)"
        ),
        borderRadius: 3,
      },
    ],
  };

  const shootingData = {
    labels,
    datasets: [
      {
        label: "FG%",
        data: chronological.map((g) => (g.fg_pct * 100).toFixed(1)),
        borderColor: "#4af",
        tension: 0.3,
        pointRadius: 2,
      },
      {
        label: "3P%",
        data: chronological.map((g) => (g.fg3_pct * 100).toFixed(1)),
        borderColor: "#a78bfa",
        tension: 0.3,
        pointRadius: 2,
      },
      {
        label: "FT%",
        data: chronological.map((g) => (g.ft_pct * 100).toFixed(1)),
        borderColor: "#34d399",
        tension: 0.3,
        pointRadius: 2,
      },
    ],
  };

  return (
    <div className="charts-grid">
      <div className="chart-container">
        <Line data={ptsRebAstData} options={chartOptions("Points / Rebounds / Assists")} />
      </div>
      <div className="chart-container">
        <Bar data={plusMinusData} options={chartOptions("+/- Per Game")} />
      </div>
      <div className="chart-container chart-wide">
        <Line data={shootingData} options={chartOptions("Shooting Splits (%)")} />
      </div>
    </div>
  );
}

/* ─── Main App ──────────────────────────────────────────── */
export default function App() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [playerInfo, setPlayerInfo] = useState(null);
  const [gamelog, setGamelog] = useState([]);
  const [advanced, setAdvanced] = useState(null);
  const [season, setSeason] = useState("2024-25");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef(null);
  const refreshRef = useRef(null);

  // Auto-refresh every 60 seconds if a player is selected
  useEffect(() => {
    if (selectedPlayer) {
      refreshRef.current = setInterval(() => {
        loadPlayerData(selectedPlayer.id, season, true);
      }, 60000);
    }
    return () => clearInterval(refreshRef.current);
  }, [selectedPlayer, season]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSearch = useCallback(async (value) => {
    setQuery(value);
    if (value.length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    try {
      const data = await searchPlayers(value);
      setResults(data);
      setShowDropdown(true);
    } catch {
      setResults([]);
    }
  }, []);

  const loadPlayerData = async (playerId, szn, silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const [info, log, adv] = await Promise.all([
        getPlayerInfo(playerId),
        getPlayerGamelog(playerId, szn),
        getPlayerAdvanced(playerId, szn),
      ]);
      setPlayerInfo(info);
      setGamelog(log);
      setAdvanced(adv);
    } catch (err) {
      setError("Failed to load player data. Try a different season.");
    } finally {
      setLoading(false);
    }
  };

  const selectPlayer = (player) => {
    setSelectedPlayer(player);
    setQuery(player.full_name);
    setShowDropdown(false);
    loadPlayerData(player.id, season);
  };

  const changeSeason = (newSeason) => {
    setSeason(newSeason);
    if (selectedPlayer) {
      loadPlayerData(selectedPlayer.id, newSeason);
    }
  };

  const seasons = [
    "2024-25", "2023-24", "2022-23", "2021-22",
    "2020-21", "2019-20", "2018-19", "2017-18",
  ];

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header__inner">
          <h1 className="header__title">
            <span className="header__icon">🏀</span> Basketball Stats Tracker
          </h1>
          <div className="header__badge">NBA</div>
        </div>
      </header>

      {/* Search Bar */}
      <div className="search-section">
        <div className="search-bar" ref={searchRef}>
          <input
            type="text"
            placeholder="Search for an NBA player..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => results.length > 0 && setShowDropdown(true)}
          />
          {showDropdown && results.length > 0 && (
            <div className="search-dropdown">
              {results.map((p) => (
                <button
                  key={p.id}
                  className="search-result"
                  onClick={() => selectPlayer(p)}
                >
                  <span className="search-result__name">{p.full_name}</span>
                  <span className="search-result__status">
                    {p.is_active ? "Active" : "Retired"}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="season-select">
          <label>Season</label>
          <select value={season} onChange={(e) => changeSeason(e.target.value)}>
            {seasons.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading / Error */}
      {loading && (
        <div className="loading">
          <div className="spinner"></div>
          Loading stats...
        </div>
      )}
      {error && <div className="error-msg">{error}</div>}

      {/* Player Dashboard */}
      {!loading && playerInfo && advanced && (
        <div className="dashboard">
          {/* Player Header */}
          <div className="player-header">
            <div>
              <h2 className="player-name">{playerInfo.full_name}</h2>
              <p className="player-meta">
                {playerInfo.team} · #{playerInfo.jersey} · {playerInfo.position} ·{" "}
                {playerInfo.height}, {playerInfo.weight} lbs
              </p>
            </div>
            <div className="player-season">{season}</div>
          </div>

          {/* Stat Cards - Core */}
          <div className="stats-row">
            <StatCard label="PPG" value={advanced.avg_pts} />
            <StatCard label="RPG" value={advanced.avg_reb} />
            <StatCard label="APG" value={advanced.avg_ast} />
            <StatCard
              label="+/-"
              value={
                advanced.avg_plus_minus > 0
                  ? `+${advanced.avg_plus_minus}`
                  : advanced.avg_plus_minus
              }
            />
            <StatCard label="GP" value={advanced.games_played} />
          </div>

          {/* Stat Cards - Shooting */}
          <div className="stats-row">
            <StatCard
              label="FG%"
              value={`${(advanced.avg_fg_pct * 100).toFixed(1)}%`}
              sub={`${advanced.total_fgm}/${advanced.total_fga}`}
              accent
            />
            <StatCard
              label="3P%"
              value={`${(advanced.avg_fg3_pct * 100).toFixed(1)}%`}
              sub={`${advanced.total_fg3m}/${advanced.total_fg3a}`}
              accent
            />
            <StatCard
              label="FT%"
              value={`${(advanced.avg_ft_pct * 100).toFixed(1)}%`}
              sub={`${advanced.total_ftm}/${advanced.total_fta}`}
              accent
            />
            <StatCard label="TS%" value={`${(advanced.ts_pct * 100).toFixed(1)}%`} accent />
            <StatCard label="PER" value={advanced.per} accent />
          </div>

          {/* Charts */}
          <PerformanceCharts games={gamelog} />

          {/* Game Log */}
          <div className="section-header">
            <h3>Game Log</h3>
            <span className="auto-refresh">Auto-refreshes every 60s</span>
          </div>
          <GameLogTable games={gamelog} />
        </div>
      )}

      {/* Empty State */}
      {!loading && !selectedPlayer && (
        <div className="empty-state">
          <div className="empty-icon">🏀</div>
          <h2>Search for a player to get started</h2>
          <p>View game logs, shooting splits, and advanced metrics like TS% and PER.</p>
        </div>
      )}
    </div>
  );
}
