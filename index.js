const express = require("express");
const app = express();
const mongoose = require("mongoose");
const connection = require("./mySqlDatabase");
app.use(express.json());

const apis = require("./apis/api");
const mySqlapi = require("./apis/apiMysql");
app.use("/mysqlapi", mySqlapi);
app.use("/api", apis);

mongoose
  .connect("mongodb://localhost:27017/Catogory")
  .then(() => console.log("Connected To MongoDB"))
  .catch((error) => console.log(error));

app.listen(3000, () => {
  console.log("Server is running on 3000");
  connection.getConnection((err, conn) => {
    if (err) {
      console.error("Error connecting: " + err.stack);
      return;
    }
    console.log("Connected as id " + conn.threadId);
    conn.release();
  });
});
