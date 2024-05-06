const env =  "production";
console.log(process.env.NODE_ENV);
const dev = {
  port: 5001,
  serverURL: "http://localhost:5001",
  videoFolder: __dirname,
  jsonFolder: __dirname,
  appURL: "http://localhost:3000/mediaPlayer/",
  userCacheDir: "/var/www/node/cache",
  executablePath:
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  URL: 0,
};

const production = {
  port: 5001,
  serverURL: "https://api-animation.easycoach.club/",
  videoFolder: __dirname,
  jsonFolder: __dirname,
  appURL: "https://animation.easycoach.club/videoPlayer/",
  userCacheDir: "/var/www/node/cache",
  executablePath: "/usr/bin/google-chrome",
  URL: 0,
};

const config = {
  dev,
  production,
};

module.exports = config[env];
