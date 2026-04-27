const { statements } = require("../../db/database");
const { getOnlineUsers, onlineUsers } = require("../realtime/realtime.state");
const { WEBRTC_ICE_SERVERS } = require("../../config/constants");

function buildBootstrapPayload(pseudo) {
  return {
    currentUser: pseudo,
    onlineUsers: getOnlineUsers(),
    messages: statements.recentMessages.all().reverse(),
    notifications: statements.recentNotifications.all(),
    leaderboard: statements.leaderboard.all(),
    webrtc: {
      iceServers: WEBRTC_ICE_SERVERS,
    },
  };
}

function getLeaderboard() {
  return statements.leaderboard.all();
}

function getDashboardTotals() {
  return statements.totals.get();
}

function getActiveUserCount() {
  return onlineUsers.size;
}

function markUserOnline(pseudo) {
  statements.upsertUser.run({ pseudo });
}

function markUserOffline(pseudo) {
  statements.setOffline.run(pseudo);
}

function createChatMessage(pseudo, content) {
  const user = statements.getUser.get(pseudo);
  statements.insertMessage.run(user.id, pseudo, content);
  statements.incrementMessages.run(pseudo);
  return statements.selectLastMessage.get();
}

function createVideoSession(caller, callee) {
  statements.incrementVideoSessions.run(caller);
  const info = statements.insertVideoSession.run(caller, callee);

  return {
    id: info.lastInsertRowid,
    caller,
    callee,
    created_at: new Date().toISOString()
  };
}

function endVideoSession(sessionId) {
  if (sessionId) {
    statements.endVideoSession.run(sessionId);
  }
}

module.exports = {
  buildBootstrapPayload,
  createChatMessage,
  createVideoSession,
  endVideoSession,
  getActiveUserCount,
  getDashboardTotals,
  getLeaderboard,
  markUserOffline,
  markUserOnline
};