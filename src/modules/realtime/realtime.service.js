const platformService = require("../platform/platform.service");
const notificationsService = require("../notifications/notifications.service");
const { getOnlineUsers } = require("./realtime.state");

function createRealtimeService(io) {
  return {
    io,
    broadcastPresence() {
      io.emit("presence:update", { onlineUsers: getOnlineUsers() });
    },
    broadcastLeaderboard() {
      io.emit("leaderboard:update", platformService.getLeaderboard());
    },
    broadcastNotifications() {
      io.emit("notifications:list", notificationsService.getRecentNotifications());
    },
    pushDashboard(payload) {
      const { sseClients } = require("./realtime.state");
      const data = `event: dashboard\ndata: ${JSON.stringify(payload)}\n\n`;
      for (const res of sseClients) {
        res.write(data);
      }
    },
  };
}

module.exports = {
  createRealtimeService,
};
