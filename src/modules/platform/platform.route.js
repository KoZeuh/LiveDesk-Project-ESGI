const express = require("express");
const platformController = require("./platform.controller");

function createPlatformRouter() {
    const router = express.Router();

    router.get("/bootstrap", platformController.getBootstrap);
    router.get("/leaderboard", platformController.getLeaderboard);

    return router;
}

module.exports = {
    createPlatformRouter
};