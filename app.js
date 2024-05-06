const express = require("express");
const app = express();
const cors = require("cors");
const winston = require("winston");
const expressWinston = require("express-winston");
const fileUpload = require("express-fileupload");
var path = require("path");

app.use(cors({ origin: "*" }));

app.use(express.json({ limit: "5000mb" }));
app.use(express.urlencoded({ limit: "5000mb" }));
app.use(express.static(path.join(__dirname)));
app.use(
  fileUpload({
    createParentPath: true,
  })
);

app.use(
  expressWinston.logger({
    transports: [
      new winston.transports.Console(),
      new winston.transports.File({
        filename: "logs/server_log.log",
      }),
    ],
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.json()
    ),
    meta: true, // optional: control whether you want to log the meta data about the request (default to true)
    expressFormat: true, // Use the default Express/morgan request formatting. Enabling this will override any msg if true. Will only output colors with colorize set to true
    colorize: true, // Color the text and status code, using the Express/morgan color palette (text: gray, status: default green, 3XX cyan, 4XX yellow, 5XX red).
  })
);

module.exports = app;
