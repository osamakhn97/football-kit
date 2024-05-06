const bodyParser = require('body-parser');
const fs         = require("fs");
const webmToMp4 = require("webm-to-mp4");
const uniqueFilename          = require('unique-filename')
function setUpApp(app){
  app.use(bodyParser.json({ limit: '200mb' }));
  app.use(bodyParser.urlencoded({ limit: '200mb', extended: true }));
  app.use(bodyParser.raw());
  app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
  });

}

function sendFailure(res, message){
  res.statusMessage = message;
  return res.status(500).end();
}

function isJsonString(str) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}


module.exports = { setUpApp, sendFailure, isJsonString };
