const fs = require("fs");
const ffmpeg = require("fluent-ffmpeg");
const fsPromises = require("fs/promises");
const uuid = require("uuid");
var Xvfb = require('xvfb');
const generateVideo = require("../libraries/videoGeneration/generateVideo");
var path = require("path");
const { s3 } = require("../libraries/s3/aws3");
const ios = require("../libraries/socket/socket");
const { getSubdomain } = require("../utils/getSubdomain");
const config = require("../utils/config");
const uniqueFilename = require("unique-filename");
const playwright = require("@playwright/test");

const { isJsonString } = require("../libraries/helperFunctions");
const { convertWebmToMp4 } = require("../libraries/ffmpeg/generateVideoAsync");
const {fabric} = require("fabric");
var Frame = require("canvas-to-buffer");

const createVideo = async (req, res, next) => {
  if (!req.body.data) {
    return res.send({ status: "error", message: "No data" }).status(400);
  }
  ios.emit(
    `receive-message${req.params.id}`,
    `Creating your animation. This may take a few minutes...`
  );

  const subdomain = getSubdomain(req);

  const value = await generateVideo(req, res);

  const out = getVideoFilePath(value);
  const outConverted = getVideoFilePath(value, true);

  let command = ffmpeg()
    .addInput(out)
    .outputOption("-filter:v", "setpts=0.5*PTS")
    .on("end", async function (stdout, stderr) {
      ios.emit(`receive-message${req.params.id}`, `Uploading Video...`);

      await fsPromises.unlink(out);
      fs.rm(out, { recursive: true }, (err) => console.log("speed adjusted!!"));
      const { domain, s3_video_key } = await uploadVideoToS3(
        outConverted,
        subdomain
      );
      fs.rm(outConverted, { recursive: true }, (err) =>
        console.log("speed adjusted!!")
      );

      ios.emit(`receive-message${req.params.id}`, `Uploading complete!`);

      const s3_video_full_url =
        "https://easycoach.s3.eu-central-1.amazonaws.com/" +
        domain +
        "/" +
        s3_video_key;

      res.send({
        status: "ok",
        s3_video_key,
        s3_video_full_url,
        url: s3_video_full_url,
      });
    })
    .output(outConverted);
  command.run();
};

const getVideoFilePath = (value, isConverted = false) => {
  value += isConverted ? "-converted" : "";
  return path.join(
    __dirname,
    "../libraries/videoGeneration/videos/",
    `${value}.mp4`
  );
};

const getChromeVideoFilePath = (videoId, isConverted = false) => {
  videoId += isConverted ? "-converted" : "";
  return path.join(
    __dirname,
    "../libraries/chromeVideoGeneration/videosTemp/",
    `${videoId}`
  );
};

const getChromeJsonFilePath = (jsonId) => {
  return path.join(
    __dirname,
    "../libraries/chromeVideoGeneration/jsonTemp/",
    `${jsonId}.json`
  );
};

const createChromeVideoGenerationFolders = () => {
  const mainPath = path.join(__dirname, "../libraries/chromeVideoGeneration");

  const folders = ["", "jsonTemp", "videosTemp","frames","bg","mp4Videos"];

  folders.forEach((folder) => {
    const folderPath = folder ? path.join(mainPath, folder) : mainPath;
    if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath);
  });
};

const uploadVideoToS3 = async (videoPath, domain = "dev") => {
  const id = uuid.v4();
  const s3_video_key = `animation/${id}.mp4`;
  const config = {
    Bucket: process.env.AWS_S3_BUCKET_NAME || "easycoach",
    Key: domain + "/" + s3_video_key,
    Body: fs.readFileSync(videoPath),
    ACL: "public-read",
    ContentType: "video/mp4",
  };
  await s3.putObject(config);
  console.log(s3_video_key);
  return {
    domain,
    s3_video_key,
  };
};

const createVideoAsync = async (req, res, next) => {
  if (!req.body.data) {
    return res.send({ status: "error", message: "No data" }).status(400);
  }

  ios.emit(
    `receive-message${req.params.id}`,
    `Generating your animation. This may take a few minutes...`
  );

  const subdomain = getSubdomain(req);

  console.log(subdomain);

  res.send({
    status: "ok",
    message: "Animation is being processed",
  });

  const value = await generateVideo(req, res);
  const out = getVideoFilePath(value);
  const outConverted = getVideoFilePath(value, true);

  let command = ffmpeg()
    .addInput(out)
    .outputOption("-filter:v", "setpts=0.5*PTS")
    .on("end", async function (stdout, stderr) {
      ios.emit(`receive-message${req.params.id}`, `Uploading Video...`);

      await fsPromises.unlink(out);
      fs.rm(out, { recursive: true }, (err) => console.log("deleted original"));
      const { domain, s3_video_key } = await uploadVideoToS3(
        outConverted,
        subdomain
      );
      fs.rm(outConverted, { recursive: true }, (err) =>
        console.log("speed adjusted!!")
      );

      ios.emit(`receive-message${req.params.id}`, `deleted transcoded`);

      const s3_video_full_url =
        "https://easycoach.s3.eu-central-1.amazonaws.com/" +
        domain +
        "/" +
        s3_video_key;

      ios.emit(`animation-complete-${req.params.id}`, {
        status: "ok",
        s3_video_key,
        s3_video_full_url,
        url: s3_video_full_url,
      });
    })
    .output(outConverted);
  command.run();
};

const createVideoAsyncTemp = async (req, res, next) => {
  if (!req.body.data) {
    return res.send({ status: "error", message: "No data" }).status(400);
  }

  ios.emit(
    `receive-message${req.params.id}`,
    `Generating your animation. This may take a few minutes...`
  );

  const subdomain = getSubdomain(req);

  console.log(subdomain);

  res.send({
    status: "ok",
    message: "Animation is being processed",
  });

  const value = await startAnimationTemp(req, res);
  const out = getVideoFilePath(value);
  const outConverted = getVideoFilePath(value, true);

  let command = ffmpeg()
    .addInput(out)
    .outputOption("-filter:v", "setpts=0.5*PTS")
    .on("end", async function (stdout, stderr) {
      ios.emit(`receive-message${req.params.id}`, `Uploading Video...`);
      console.log("outConverted-",outConverted)
      await fsPromises.unlink(out);
      fs.rm(out, { recursive: true }, (err) => console.log("deleted original"));
      const { domain, s3_video_key } = await uploadVideoToS3(
        outConverted,
        subdomain
      );
      fs.rm(outConverted, { recursive: true }, (err) =>
        console.log("speed adjusted!!")
      );

      ios.emit(`receive-message${req.params.id}`, `deleted transcoded successfully`);

      const s3_video_full_url =
        "https://easycoach.s3.eu-central-1.amazonaws.com/" +
        domain +
        "/" +
        s3_video_key;

      ios.emit(`animation-complete-${req.params.id}`, {
        status: "ok",
        s3_video_key,
        s3_video_full_url,
        url: s3_video_full_url,
      });
    })
    .output(outConverted);
  command.run();
};

const createVideoChrome = async (req, res, next) => {
  createChromeVideoGenerationFolders();

  if (!req.body.data) {
    return res.send({ status: "error", message: "No data" }).status(400);
  }
  const subdomain = getSubdomain(req);
  const json = req.body.data;

  if (!isJsonString(json))
    return res.status(400).send({ message: `Invalid JSON` });

  ios.emit(
      `receive-message${req.params.id}`,
      `Generating your animation. This may take a few minutes...`
  );
  const socketId = req.params.id;
  const jsonId = `${uniqueFilename("")}`;
  const jsonSavePath = getChromeJsonFilePath(jsonId);
  const videoId = jsonId;
  const videoPath = getChromeVideoFilePath(`${videoId}.json`);
  const pageToLoad = `${config.appURL}${jsonId}`;
  const framesDir = path.join(__dirname, "../libraries","chromeVideoGeneration","frames" ,`${videoId}`);
  ios.on("connection",(socket)=>{
    socket.on(`send-message${videoId}`,message=>{
      ios.emit(`receive-message${socketId}`,message)
    })
  })

  if (!fs.existsSync(framesDir)) {
    fs.mkdirSync(framesDir, { recursive: true });
  }

  fs.writeFileSync(jsonSavePath, json);


  if (!fs.existsSync(jsonSavePath)) return console.log("json not found");

  let browser = null;
  try {
    console.log("page to load", pageToLoad);
    console.log('socket id',socketId)

    // OPEN HEADLESS BROWSER

    browser = await playwright["chromium"].launchPersistentContext(
        config.userCacheDir,
        {
          headless: true,
          executablePath: config.executablePath,
          timeout: 0,
          deviceScaleFactor: 1,
          viewport: { width: 1600, height: 760 },
        }
    );
    const page = await browser.newPage();
    page.on("load", (p) => console.timeEnd("pageload"));
    console.log(pageToLoad);

    await page.goto(pageToLoad, { timeout: 300000 });

    console.log("before download:::");
    res.send({
      status: "ok",
      message: "Animation is being processed",
    });
    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 300000 }), // wait for download to start
    ]);

    let downloadError = await download.failure();
    if (downloadError != null) return console.log("download error");
    console.log("after download::::");


    // save into the desired path
    await download.saveAs(videoPath);
    const animationJson = JSON.parse(fs.readFileSync(videoPath));
    const bufferArr= JSON.parse(animationJson.jsonBuffer);
    const jsonBuffer = fs.readFileSync(jsonSavePath,{encoding:'utf8', flag:'r'});
    const bgImage = JSON.parse(jsonBuffer).img;
    // CREATE A CANVAS BACKGROUND IMAGE
    await getCanvasBackground(bgImage,animationJson.height,animationJson.width,videoId);

    // SAVING THE IMAGE FRAMES
    await createFrames(videoId,bufferArr,framesDir);

    // CONVERTING IMAGES TO MP4 VIDEO USING FFMPEG
    await processVideo(videoId,animationJson.width,animationJson.height,socketId);
    await adjustSpeed(videoId,animationJson.width,animationJson.height,socketId);

    // DELETING THE FILES
    fsPromises.unlink(videoPath);
    //fsPromises.unlink(jsonSavePath);

    //CLOSING THE BROWSER
    await download.delete();
    await browser.close();
    // REMOVE THIS FUNCTION AND RETURN COMMAND ON PRODUCTION
    // respondToLocalServer(videoId,socketId);



    // return;
    // --------------------------------------------------------------------
    const videoURLMp4 = path.join(__dirname, "../libraries","chromeVideoGeneration","mp4Videos",`${videoId}-converted.mp4`);
    const { domain, s3_video_key } = await uploadVideoToS3(
        videoURLMp4,
        subdomain
    );
    fsPromises.unlink(videoURLMp4);
    fsPromises.unlink(jsonSavePath);

    const s3_video_full_url =
        "https://easycoach.s3.eu-central-1.amazonaws.com/" +
        domain +
        "/" +
        s3_video_key;

    console.log("s3_key: ", domain + "/" + s3_video_key);
    console.log("uploaded: ", s3_video_full_url);

    ios.emit(`animation-complete-${socketId}`, {
      status: "ok",
      s3_video_key,
      s3_video_full_url,
      url: s3_video_full_url,
    });
  } catch (ex) {
    console.log(`Something went wrong: ${ex.message}`);
  } finally {
    console.log(`closing chrome and deleting files`);
    if (browser) await browser.close();
  }
};
const respondToLocalServer = (videoId,socketId)=>{
  let videoPath = `http://localhost:5001/libraries/chromeVideoGeneration/mp4Videos/${videoId}-converted.mp4`
  console.log(videoPath);
  return;
  // ios.emit(`animation-complete-${socketId}`, {
  //   status: "ok",
  //   s3_video_key:"",
  //   s3_video_full_url:videoPath,
  //   url:videoPath,
  // });
}

const createFrames = (id,bufferArr,framesDir)=>{
  return new Promise(resolveFrames => {
    let promisesObjs = [];
    bufferArr.forEach((e, i) => {
      promisesObjs[i] = new Promise((resolve, reject) => {
        var base64Data = e.replace(/^data:image\/png;base64,/, "");

        fs.writeFileSync(
            path.join(framesDir, `image${i}.png`),
            base64Data, 'base64'
        );
        resolve("resolved");
      });
    });
    Promise.all(promisesObjs)
        .then((values) => {
          console.log("Done creating all images");
          resolveFrames('resolveFrames');
          // processVideo(1,animationJson.width,animationJson.height)

        })
        .catch((error) => {
          console.log("error", error);

        });
  })

}
const getCanvasBackground = (url,height,width,id)=>{
  return new Promise(resolve => {
    let canvasEl = new fabric.StaticCanvas("tacticsboard__canvas", {
      skipTargetFind: true,
      selection: false,
      objectCaching:true,
      preserveObjectStacking: true,
      height:height,
      width:width
    });
    fabric.Image.fromURL(url, async function (img) {
      canvasEl.setBackgroundImage(img, canvasEl.renderAll.bind(canvasEl), {
        scaleX: canvasEl.width / canvasEl.getZoom() / img.width,
        scaleY: canvasEl.height / canvasEl.getZoom() / img.height,
      });
      var frameC = new Frame(canvasEl, {
        quality: 0.4,
        types: ["png"],
      });
      var buffer = frameC.toBuffer();
      fs.writeFileSync(path.join(__dirname, "../libraries","chromeVideoGeneration","bg",`${id}.png`), buffer);
      resolve('resolved')
    });
  })

}

const processVideo = (id,widthEl,heightEl,socketId) => {
  return new Promise((resolve,reject) => {
    // ios.emit(
    //     `receive-message${socketId}`,
    //     '100% done'
    // );
    const out = path.join(__dirname, "../libraries","chromeVideoGeneration","mp4Videos",`${id}.mp4`);
    let bg = path.join(__dirname, "../libraries","chromeVideoGeneration","bg",`${id}.png`);
    let inp = path.join(__dirname, "../libraries", "chromeVideoGeneration","frames",`${id}`, `image%d.png`);
    let width = 2 * Math.round(widthEl / 2);
    let height = 2 * Math.round(heightEl / 2);
    console.log(width, height);
    let command = ffmpeg()
        .addInput(inp)
        .inputOption(
            "-loop",
            "1",
            "-r",
            "60",
            "-i",
            `${bg}`,
            "-filter_complex",
            `overlay=(W-w)/2:(H-h)/2:shortest=1,scale=${width}:${height}`,
        )

        .on("progress", function (progress) {
          console.log("Processing: " + progress.percent + "% Done");
          if(Math.round(25+(progress.percent)/4))
          ios.emit(`receive-message${socketId}`,'Processing Video: ' + Math.round(25+(progress.percent)/4) + "% Done");
          // ios.emit(
          //     `receive-message${socketId}`,
          //     'Processing Video, this may take a few minutes'
          // );
        })
        .on("end", async function (stdout, stderr) {
          console.log("Transcoding succeeded !");
          // ios.emit(`receive-message${id}`, "Processing: " + "100" + "% done");
          // ios.emit(`receive-message${socketId}`, "Video generated successfully");
          // ios.emit(`receive-message${id}`, "Downloading...");
          await fsPromises.unlink(bg);
          fs.rm(
              path.join(__dirname, "../libraries", "chromeVideoGeneration","frames", `${id}`,'/'),
              { recursive: true },
              (err) => console.log("deleted successfully")
          );
          resolve("video generated successfully, all files deleted");
          // resolveAnimation(id);
        })
        .on("error", async function (stdout, stderr) {
          console.log("failed to process video", stdout, stderr);
          await fsPromises.unlink(bg);
          ios.emit(`receive-message${socketId}`, "Download failed");
          ios.emit(`animation-complete-${socketId}`, {
            status: "failed",
            s3_video_key:"",
            s3_video_full_url:null,
            url:'',
          });

          reject("failed to process video");
          // resolveAnimation(id);
        })
        .output(out);
    command.run();
  })

};
const adjustSpeed = (id,widthEl,heightEl,socketId) => {
  return new Promise((resolve,reject) => {
    const inp = path.join(__dirname, "../libraries","chromeVideoGeneration","mp4Videos",`${id}.mp4`);
    const out = path.join(__dirname, "../libraries","chromeVideoGeneration","mp4Videos",`${id}-converted.mp4`);
    let command = ffmpeg()
        .addInput(inp)
        .outputOption("-filter:v", "setpts=0.5*PTS", "-r","60")

        .on("progress", function (progress) {
          // ios.emit(`receive-message${socketId}`, "Setting video speed, please wait...");
          console.log("Setting video speed: " + progress.percent + "% Done");
          if(Math.round(50+(progress.percent)))
          ios.emit(
              `receive-message${socketId}`,'Processing Video: ' + Math.round(50+(progress.percent)) + "% Done");
        })
        .on("end", async function (stdout, stderr) {
          console.log("Transcoding succeeded !");
          fsPromises.unlink(inp);
          ios.emit(`receive-message${socketId}`, "Preparing for download");
          // ios.emit(`receive-message${id}`, "Processing: " + "100" + "% done");
          // ios.emit(`receive-message${socketId}`, "video generated successfully");
          // ios.emit(`receive-message${id}`, "Downloading...");
          resolve("video converted successfully, all files deleted");
          // resolveAnimation(id);
        })
        .on("error", function (stdout, stderr) {
          console.log("failed to process video", stdout, stderr);
          reject("failed to process video");
          // resolveAnimation(id);
        })
        .output(out);
    command.run();
  })

};

const createMediaChrome = async (req, res, next) => {
  let xvfb = new Xvfb({
    silent:    true,
    xvfb_args: ["-screen", "0", '1280x760x24', "-ac"],
  });
  xvfb.start((err)=>{
    if (err)
      xvfb.stop();
      console.log(err)
  })
  createChromeVideoGenerationFolders();

  if (!req.body.data) {
    return res.send({ status: "error", message: "No data" }).status(400);
  }
  const subdomain = getSubdomain(req);
  const json = req.body.data;

  if (!isJsonString(json))
    return res.status(400).send({ message: `Invalid JSON` });

  // ios.emit(
  //     `receive-message${req.params.id}`,
  //     `Generating your animation. This may take a few minutes...`
  // );
  const socketId = req.params.id;
  const jsonId = `${uniqueFilename("")}`;
  const jsonSavePath = getChromeJsonFilePath(jsonId);
  const videoId = jsonId;
  const videoPath = getChromeVideoFilePath(`${videoId}.webm`);
  const pageToLoad = `${config.appURL}${jsonId}`;
  const framesDir = path.join(__dirname, "../libraries","chromeVideoGeneration","frames" ,`${videoId}`);
  // ios.on("connection",(socket)=>{
  //   socket.on(`send-message${videoId}`,message=>{
  //     ios.emit(`receive-message${socketId}`,message)
  //   })
  // })

  if (!fs.existsSync(framesDir)) {
    fs.mkdirSync(framesDir, { recursive: true });
  }

  fs.writeFileSync(jsonSavePath, json);


  if (!fs.existsSync(jsonSavePath)) return console.log("json not found");

  let browser = null;
  try {
    console.log("page to load", pageToLoad);
    console.log('socket id',socketId)

    // OPEN HEADLESS BROWSER

    browser = await playwright["chromium"].launchPersistentContext(
        config.userCacheDir,
        {
          headless: false,
          executablePath: config.executablePath,
          timeout: 0,
          deviceScaleFactor: 1,
          viewport: { width: 1280, height: 760 },
          args: ['--enable-features=UseSkiaRenderer'],
        }
    );
    const page = await browser.newPage();
    page.on("load", (p) => console.timeEnd("pageload"));
    console.log(pageToLoad);

    await page.goto(pageToLoad, { timeout: 300000 });

    console.log("before download:::");
    res.send({
      status: "ok",
      message: "Animation is being processed",
    });
    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 300000 }), // wait for download to start
    ]);

    let downloadError = await download.failure();
    if (downloadError != null) return console.log("download error");
    console.log("after download::::");
    const inp = path.join(__dirname, "../libraries","chromeVideoGeneration","videosTemp",`${videoId}.webm`);
    const out = path.join(__dirname, "../libraries","chromeVideoGeneration","mp4Videos",`${videoId}-converted.mp4`);

    // save into the desired path
    await download.saveAs(videoPath);
    await convertWebmToMp4(inp,out,ios, socketId);
    fsPromises.unlink(videoPath);
    await download.delete();
    await browser.close();
    respondToLocalServer(videoId,socketId);
    // --------------------------------------------------------------------
    const videoURLMp4 = path.join(__dirname, "../libraries","chromeVideoGeneration","mp4Videos",`${videoId}-converted.mp4`);
    const { domain, s3_video_key } = await uploadVideoToS3(
        videoURLMp4,
        subdomain
    );
    xvfb.stop();
    fsPromises.unlink(videoURLMp4);
    fsPromises.unlink(jsonSavePath);

    const s3_video_full_url =
        "https://easycoach.s3.eu-central-1.amazonaws.com/" +
        domain +
        "/" +
        s3_video_key;

    console.log("s3_key: ", domain + "/" + s3_video_key);
    console.log("uploaded: ", s3_video_full_url);

    ios.emit(`animation-complete-${socketId}`, {
      status: "ok",
      s3_video_key,
      s3_video_full_url,
      url: s3_video_full_url,
    });
  } catch (ex) {
    console.log(`Something went wrong: ${ex.message}`);
  } finally {
    console.log(`closing chrome and deleting files`);
    if (browser) await browser.close();
  }
};

module.exports = {
  createVideo,
  createVideoAsync,
  createVideoAsyncTemp,
  createVideoChrome,
  createMediaChrome
};
