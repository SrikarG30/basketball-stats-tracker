import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
});

export const searchPlayers = async (query) => {
  const res = await api.get("/api/players/search", { params: { q: query } });
  return res.data;
};

export const getPlayerGamelog = async (playerId, season = "2024-25") => {
  const res = await api.get(`/api/players/${playerId}/gamelog`, {
    params: { season },
  });
  return res.data;
};

export const getPlayerAdvanced = async (playerId, season = "2024-25") => {
  const res = await api.get(`/api/players/${playerId}/advanced`, {
    params: { season },
  });
  return res.data;
};

export const getPlayerInfo = async (playerId) => {
  const res = await api.get(`/api/players/${playerId}/info`);
  return res.data;
};

export const getSeasons = async () => {
  const res = await api.get("/api/seasons");
  return res.data.seasons;
};
