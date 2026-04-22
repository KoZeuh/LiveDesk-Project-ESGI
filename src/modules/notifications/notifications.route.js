const express = require("express");
const notificationsController = require("./notifications.controller");

function createNotificationsRouter(realtime) {
  const router = express.Router();

  router.post("/notifications", notificationsController.postNotificationFactory(realtime));

  return router;
}

module.exports = {
  createNotificationsRouter,
};
