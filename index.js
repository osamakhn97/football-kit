const app = require("./app");
const dotenv = require("dotenv");
var path = require("path");
dotenv.config({ path: path.join(__dirname, ".env") });

const { fabric } = require("fabric");
const { overrideFabricObjs } = require("./fabric-overrides/index");
const { addAnnotation } = require("./annotateLine");
const PORT = process.env.PORT || 5001;

overrideFabricObjs(fabric);
addAnnotation(fabric);

const {
  createVideo,
  createVideoAsync,
  createVideoAsyncTemp,
  createVideoChrome,
  createMediaChrome,
} = require("./controllers/videoController");
const {
  saveJson,
  getVideoUrl,
} = require("./controllers/videoControlletModified");

app.post("/generateVideo:id", createVideo);
app.post("/generateVideo/async:id", createVideoAsync);
app.post("/generateVideo/asynctemp:id", createVideoAsyncTemp);
app.post("/generateVideo/chrome/async:id", createVideoChrome);
app.post("/generateVideo1/chrome/async:id", createMediaChrome);
app.get("/test",(req,res)=>res.send({msg:'connection successfull'}))
app.get("/", getVideoUrl);
app.post("/save", saveJson);

app.listen(PORT, () => {
  console.log("listening at port " + PORT);
});
