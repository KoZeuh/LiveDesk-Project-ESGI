const onlineUsers = new Map();
const sseClients = new Set();

function getOnlineUsers() {
  return Array.from(onlineUsers.keys()).sort((a, b) => a.localeCompare(b, "fr"));
}

module.exports = {
  onlineUsers,
  sseClients,
  getOnlineUsers,
};
