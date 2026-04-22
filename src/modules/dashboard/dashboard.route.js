const express = require("express");
const dashboardController = require("./dashboard.controller");

function createDashboardRouter() {
  const router = express.Router();

  router.get("/dashboard/stream", dashboardController.streamDashboard);

  return router;
}

module.exports = {
  createDashboardRouter,
};
