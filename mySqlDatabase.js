const mysql = require("mysql2");

const connection = mysql.createPool({
  host: "localhost",
  user: "vineet",
  password: "Vineet9095",
  database: "vineetpracdatabase",
});

module.exports = connection;
