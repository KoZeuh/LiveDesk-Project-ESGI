const dashboardService = require("./dashboard.service");
const { sseClients } = require("../realtime/realtime.state");

function streamDashboard(req, res) {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  sseClients.add(res);
  res.write(`event: dashboard\ndata: ${JSON.stringify(dashboardService.buildDashboardPayload())}\n\n`);

  req.on("close", () => {
    sseClients.delete(res);
  });
}

module.exports = {
  streamDashboard,
};
