const { sanitizePseudo, sanitizeText } = require("../../utils/sanitize");
const notificationsService = require("./notifications.service");

function postNotificationFactory(realtime) {
  return function postNotification(req, res) {
    const type = sanitizeText(req.body.type, 20).toLowerCase();
    const title = sanitizeText(req.body.title, 80);
    const message = sanitizeText(req.body.message, 200);
    const createdBy = sanitizePseudo(req.body.createdBy) || "admin";

    if (!["info", "warning", "critical"].includes(type) || !title || !message) {
      return res.status(400).json({ error: "Notification invalide." });
    }

    const notification = notificationsService.createNotification({
      type,
      title,
      message,
      createdBy,
      realtime,
    });

    return res.status(201).json(notification);
  };
}

module.exports = {
  postNotificationFactory,
};
