const { PORT } = require("./src/config/constants");
const { createApp } = require("./src/app");

const { server } = createApp();

server.listen(PORT, () => {
    console.log(`Serveur demarre sur http://localhost:${PORT}`);
});