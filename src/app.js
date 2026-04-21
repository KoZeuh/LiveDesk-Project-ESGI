const express = require("express");
const http = require("http");

const { Server } = require("socket.io");

const { DASHBOARD_INTERVAL_MS, PUBLIC_DIR } = require("./config/constants");

const dashboardService = require("./modules/dashboard/dashboard.service");

const { createDashboardRouter } = require("./modules/dashboard/dashboard.route");
const { createNotificationsRouter } = require("./modules/notifications/notifications.route");
const { createPlatformRouter } = require("./modules/platform/platform.route");
const { registerRealtimeSocket } = require("./modules/realtime/realtime.socket");
const { createRealtimeService } = require("./modules/realtime/realtime.service");

function createApp() {
    const app = express();
    const server = http.createServer(app);
    const io = new Server(server);
    const realtime = createRealtimeService(io);

    app.use(express.json());
    app.use(express.static(PUBLIC_DIR));
    app.use("/api", createPlatformRouter());
    app.use("/api", createDashboardRouter());
    app.use("/api", createNotificationsRouter(realtime));

    registerRealtimeSocket(io, realtime);

    setInterval(() => {
        realtime.pushDashboard(dashboardService.buildDashboardPayload());
    }, DASHBOARD_INTERVAL_MS);

    return { app, server };
}

module.exports = {
    createApp,
};