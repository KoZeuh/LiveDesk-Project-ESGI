const { statements } = require("../../db/database");

function getRecentNotifications() {
  return statements.recentNotifications.all();
}

function acknowledgeNotification(pseudo) {
  statements.incrementAlertReceived.run(pseudo);
}

function createNotification({ type, title, message, createdBy, realtime }) {
  const info = statements.insertNotification.run(type, title, message, createdBy);
  const notification = statements.selectNotificationById.get(info.lastInsertRowid);

  realtime.io.emit("notification:new", notification);
  realtime.broadcastLeaderboard();
  realtime.broadcastNotifications();
  return notification;
}

module.exports = {
  acknowledgeNotification,
  createNotification,
  getRecentNotifications,
};
