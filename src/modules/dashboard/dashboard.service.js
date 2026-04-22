const platformService = require("../platform/platform.service");
const notificationsService = require("../notifications/notifications.service");

let dashboardState = { cpu: 34, ram: 48 };

function boundedRandomWalk(value, min, max, maxStep) {
  const next = value + (Math.random() * maxStep * 2 - maxStep);
  return Math.max(min, Math.min(max, Math.round(next)));
}

function buildDashboardPayload() {
  dashboardState = {
    cpu: boundedRandomWalk(dashboardState.cpu, 10, 95, 11),
    ram: boundedRandomWalk(dashboardState.ram, 20, 92, 8),
  };

  const totals = platformService.getDashboardTotals();

  return {
    timestamp: new Date().toISOString(),
    metrics: {
      cpu: dashboardState.cpu,
      ram: dashboardState.ram,
      activeUsers: platformService.getActiveUserCount(),
      totalMessages: totals.totalMessages,
      totalNotifications: totals.totalNotifications,
      totalVideoSessions: totals.totalVideoSessions,
    },
    alerts: [
      { metric: "cpu", triggered: dashboardState.cpu >= 80, message: "CPU elevee" },
      { metric: "ram", triggered: dashboardState.ram >= 75, message: "RAM elevee" },
    ],
    leaderboard: platformService.getLeaderboard().slice(0, 5),
    recentNotifications: notificationsService.getRecentNotifications().slice(0, 5),
  };
}

module.exports = {
  buildDashboardPayload,
};
