const path = require("path");

module.exports = {
    PORT: process.env.PORT || 3000,
    DASHBOARD_INTERVAL_MS: 2000,
    DATABASE_PATH: path.join(__dirname, "..", "..", "data.sqlite"),
    PUBLIC_DIR: path.join(__dirname, "..", "..", "public"),
};