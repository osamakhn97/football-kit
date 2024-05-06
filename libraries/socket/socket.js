const ios = require("socket.io")(8080, {
  cors: {
    origin: "*",
  },
});

module.exports = ios;
