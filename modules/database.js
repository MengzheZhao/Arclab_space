const sqlite = require("sqlite");
const dbPromise = sqlite.open("./sql/database.db");
module.exports = dbPromise;