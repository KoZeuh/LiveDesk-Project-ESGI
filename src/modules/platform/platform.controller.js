const { sanitizePseudo } = require("../../utils/sanitize");
const platformService = require("./platform.service");

function getBootstrap(req, res) {
    const pseudo = sanitizePseudo(req.query.pseudo);
    res.json(platformService.buildBootstrapPayload(pseudo));
}

function getLeaderboard(_req, res) {
    res.json(platformService.getLeaderboard());
}

module.exports = {
    getBootstrap,
    getLeaderboard
};