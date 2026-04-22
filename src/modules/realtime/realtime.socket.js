const notificationsService = require("../notifications/notifications.service");
const platformService = require("../platform/platform.service");
const { onlineUsers } = require("./realtime.state");
const { sanitizePseudo, sanitizeText } = require("../../utils/sanitize");

function emitSystemMessage(io, content) {
  io.emit("system:message", {
    pseudo: "Systeme",
    content,
    created_at: new Date().toISOString(),
  });
}

function registerRealtimeSocket(io, realtime) {
  io.on("connection", (socket) => {
    socket.on("user:join", ({ pseudo }, ack) => {
      const cleanPseudo = sanitizePseudo(pseudo);
      if (!cleanPseudo) {
        ack?.({ ok: false, error: "Pseudo invalide." });
        return;
      }
      if (onlineUsers.has(cleanPseudo)) {
        ack?.({ ok: false, error: "Ce pseudo est deja utilise." });
        return;
      }

      socket.data.pseudo = cleanPseudo;
      onlineUsers.set(cleanPseudo, socket.id);
      platformService.markUserOnline(cleanPseudo);
      socket.join(cleanPseudo);

      ack?.({ ok: true, payload: platformService.buildBootstrapPayload(cleanPseudo) });
      emitSystemMessage(io, `${cleanPseudo} a rejoint la plateforme.`);
      realtime.broadcastPresence();
      realtime.broadcastLeaderboard();
    });

    socket.on("chat:send", ({ content }, ack) => {
      const pseudo = socket.data.pseudo;
      const cleanContent = sanitizeText(content, 300);
      if (!pseudo || !cleanContent) {
        ack?.({ ok: false, error: "Message invalide." });
        return;
      }

      const message = platformService.createChatMessage(pseudo, cleanContent);
      io.emit("chat:new", message);
      realtime.broadcastLeaderboard();
      ack?.({ ok: true });
    });

    socket.on("notification:ack", (_, ack) => {
      const pseudo = socket.data.pseudo;
      if (pseudo) {
        notificationsService.acknowledgeNotification(pseudo);
        realtime.broadcastLeaderboard();
      }
      ack?.({ ok: true });
    });

    socket.on("admin:notify", ({ type, title, message }, ack) => {
      const pseudo = socket.data.pseudo || "admin";
      const cleanType = sanitizeText(type, 20).toLowerCase();
      const cleanTitle = sanitizeText(title, 80);
      const cleanMessage = sanitizeText(message, 200);

      if (!["info", "warning", "critical"].includes(cleanType) || !cleanTitle || !cleanMessage) {
        ack?.({ ok: false, error: "Notification invalide." });
        return;
      }

      const notification = notificationsService.createNotification({
        type: cleanType,
        title: cleanTitle,
        message: cleanMessage,
        createdBy: pseudo,
        realtime,
      });
      ack?.({ ok: true, notification });
    });

    socket.on("webrtc:request", ({ target }, ack) => {
      const caller = socket.data.pseudo;
      const callee = sanitizePseudo(target);
      const targetSocketId = onlineUsers.get(callee);

      if (!caller || !callee || !targetSocketId) {
        ack?.({ ok: false, error: "Utilisateur cible indisponible." });
        return;
      }

      const session = platformService.createVideoSession(caller, callee);
      io.to(targetSocketId).emit("webrtc:incoming", session);
      realtime.broadcastLeaderboard();
      ack?.({ ok: true, session });
    });

    socket.on("webrtc:accept", ({ target, sessionId }) => {
      const from = socket.data.pseudo;
      const cleanTarget = sanitizePseudo(target);
      const targetSocketId = onlineUsers.get(cleanTarget);
      if (!from || !targetSocketId) {
        return;
      }

      io.to(targetSocketId).emit("webrtc:accepted", { from, sessionId });
    });

    socket.on("webrtc:decline", ({ target, sessionId }) => {
      const from = socket.data.pseudo;
      const cleanTarget = sanitizePseudo(target);
      const targetSocketId = onlineUsers.get(cleanTarget);

      platformService.endVideoSession(sessionId);
      if (!from || !targetSocketId) {
        return;
      }

      io.to(targetSocketId).emit("webrtc:declined", { from, sessionId });
    });

    socket.on("webrtc:signal", ({ target, type, data, sessionId }) => {
      const from = socket.data.pseudo;
      const cleanTarget = sanitizePseudo(target);
      const targetSocketId = onlineUsers.get(cleanTarget);
      if (!from || !targetSocketId) {
        return;
      }

      io.to(targetSocketId).emit("webrtc:signal", { from, type, data, sessionId });
    });

    socket.on("webrtc:session-message", ({ target, content }) => {
      const from = socket.data.pseudo;
      const cleanTarget = sanitizePseudo(target);
      const cleanContent = sanitizeText(content, 240);
      const targetSocketId = onlineUsers.get(cleanTarget);
      if (!from || !targetSocketId || !cleanContent) {
        return;
      }

      io.to(targetSocketId).emit("webrtc:session-message", {
        from,
        content: cleanContent,
        created_at: new Date().toISOString(),
      });
    });

    socket.on("webrtc:end", ({ target, sessionId }) => {
      const from = socket.data.pseudo;
      const cleanTarget = sanitizePseudo(target);
      const targetSocketId = onlineUsers.get(cleanTarget);

      platformService.endVideoSession(sessionId);
      if (targetSocketId) {
        io.to(targetSocketId).emit("webrtc:end", { from, sessionId });
      }
    });

    socket.on("disconnect", () => {
      const pseudo = socket.data.pseudo;
      if (!pseudo) {
        return;
      }

      onlineUsers.delete(pseudo);
      platformService.markUserOffline(pseudo);
      emitSystemMessage(io, `${pseudo} a quitte la plateforme.`);
      realtime.broadcastPresence();
      realtime.broadcastLeaderboard();
    });
  });
}

module.exports = {
  registerRealtimeSocket,
};
