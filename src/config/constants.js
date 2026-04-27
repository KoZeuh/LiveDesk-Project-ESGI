const path = require("path");

const DEFAULT_PORT = 3000;
const DEFAULT_DASHBOARD_INTERVAL_MS = 2000;
const DEFAULT_WEBRTC_ICE_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];

const parsedPort = Number.parseInt(process.env.PORT || `${DEFAULT_PORT}`, 10);
const parsedDashboardIntervalMs = Number.parseInt(
  process.env.DASHBOARD_INTERVAL_MS || `${DEFAULT_DASHBOARD_INTERVAL_MS}`,
  10
);

function normalizeIceServer(server) {
  if (!server || typeof server !== "object") {
    return null;
  }

  const hasUrlList = Array.isArray(server.urls);
  const urls = hasUrlList
    ? server.urls.filter((value) => typeof value === "string" && value.trim())
    : typeof server.urls === "string" && server.urls.trim()
      ? server.urls.trim()
      : null;

  if (!urls || (Array.isArray(urls) && !urls.length)) {
    return null;
  }

  const normalizedServer = { urls };
  if (typeof server.username === "string" && server.username.trim()) {
    normalizedServer.username = server.username.trim();
  }
  if (typeof server.credential === "string" && server.credential.trim()) {
    normalizedServer.credential = server.credential.trim();
  }

  return normalizedServer;
}

function parseIceServers(rawValue) {
  if (!rawValue) {
    return [...DEFAULT_WEBRTC_ICE_SERVERS];
  }

  try {
    const parsed = JSON.parse(rawValue);
    if (!Array.isArray(parsed)) {
      return [...DEFAULT_WEBRTC_ICE_SERVERS];
    }

    const sanitizedServers = parsed.map(normalizeIceServer).filter(Boolean);
    return sanitizedServers.length ? sanitizedServers : [...DEFAULT_WEBRTC_ICE_SERVERS];
  } catch {
    return [...DEFAULT_WEBRTC_ICE_SERVERS];
  }
}

const WEBRTC_ICE_SERVERS = parseIceServers(process.env.WEBRTC_ICE_SERVERS);

module.exports = {
  PORT: Number.isFinite(parsedPort) && parsedPort > 0 ? parsedPort : DEFAULT_PORT,
  DASHBOARD_INTERVAL_MS:
    Number.isFinite(parsedDashboardIntervalMs) && parsedDashboardIntervalMs > 0
      ? parsedDashboardIntervalMs
      : DEFAULT_DASHBOARD_INTERVAL_MS,
  DATABASE_PATH: process.env.DATABASE_PATH || path.join(__dirname, "..", "..", "data.sqlite"),
  PUBLIC_DIR: path.join(__dirname, "..", "..", "public"),
  WEBRTC_ICE_SERVERS,
};