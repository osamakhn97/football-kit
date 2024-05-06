const {
  animateShapes,
  animateNonMoveables,
  showOpacity,
  hideOpacity,
  fadeOutShapes,
  setPlayerNameDim,
  setTextDimensions,
  setConnectLineDim,
} = require("../../utils");
const { fabric } = require("fabric");
var point = require("point-at-length");
const fs = require("fs");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");
var path = require("path");
const ffprobe = require("ffprobe-static");
const fsPromises = require("fs/promises");
const os = require("os");
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobe.path);
const ios = require("../socket/socket");
const {
  VIDEO_GENERATION_RATIO,
  FRAMES_LOADING_RATIO,
} = require("./utils/loading");

var counter = 0;
let isRecording = true;
const recursiveMovement = (
  move,
  obj,
  pathLen,
  svgD,
  duration,
  player,
  pathLength,
  canvas,
  hasAnimationStopped,
  textObj,
  shirtObj,
  resolve
) => {
  if (hasAnimationStopped) return;

  var getScaleX = obj.scaleX;
  var getScaleY = obj.scaleY;
  var limit = 42;
  var z = move + 1;
    let distanceFactor = 3
  if (parseInt(duration) < 1000) {
        distanceFactor = 9
    }
    else if (parseInt(duration) > 1000 && parseInt(duration) <= 1250) {
        distanceFactor = 7
    }
    else if (parseInt(duration) > 1250 && parseInt(duration) <= 2000) {
        distanceFactor = 5
  }

    else if (parseInt(duration) > 2000 && parseInt(duration) <= 3000) {
        distanceFactor = 3
    }
    else if (parseInt(duration) > 3000 && parseInt(duration) <= 3500) {
        distanceFactor = 2.5
  }
    else if (parseInt(duration) > 3500 && parseInt(duration) < 4000) {
        distanceFactor = 2
    }
    else if (parseInt(duration) > 4000 && parseInt(duration) < 5000) {
        distanceFactor = 1
    }

     limit = pathLength/distanceFactor;
    var durations = (((duration) / (limit)));
 
  if (z < limit + 1) {
    //
    // for x
    var prcnt = (move * pathLength) / 100;
    var pt = pathLen.at(prcnt);
    pt.x = pt[0];
    pt.y = pt[1];
    pt.x = pt.x * getScaleX;
    pt.y = pt.y * getScaleY;
    var prcnt1 = (z * pathLength) / 100;
    var t = 1;
    var pt1 = pathLen.at(prcnt1);
    pt1.x = pt1[0];
    pt1.y = pt1[1];

    if (duration < 5000) {
      switch (duration) {
        case 500:
        case 625:
          var difference = parseFloat(-3);
          durations = difference / (limit + difference);
          if (z === 1) {
            animateShapes(canvas, duration, player);
          }
          if (z === Math.floor(limit / 3) * 2) {
            fadeOutShapes(canvas, duration, player);
          }
          // durations = 625/pathLength;
          prcnt = (move * pathLength) / limit;
          pt = pathLen.at(prcnt);
          pt.x = pt[0];
          pt.y = pt[1];

          pt.x = pt.x * getScaleX;
          pt.y = pt.y * getScaleY;
          //for y
          prcnt1 = (z * pathLength) / limit;
          t = 1;
          pt1 = pathLen.at(prcnt1);
          pt1.x = pt1[0];
          pt1.y = pt1[1];
          break;
        case 1250:
        case 1000:
          var difference = parseFloat(-2);
          durations = difference / (limit + difference);
          if (z === 1) {
            animateShapes(canvas, duration, player);
          }
          if (z === Math.floor(limit / 3) * 2) {
            fadeOutShapes(canvas, duration, player);
          }
          // durations = 625/pathLength;
          prcnt = (move * pathLength) / limit;
          pt = pathLen.at(prcnt);
          pt.x = pt[0];
          pt.y = pt[1];
          pt.x = pt.x * getScaleX;
          pt.y = pt.y * getScaleY;
          //for y
          prcnt1 = (z * pathLength) / limit;
          t = 1;
          pt1 = pathLen.at(prcnt1);
          pt1.x = pt1[0];
          pt1.y = pt1[1];
          break;
        case 1875:
          var difference = parseFloat(-1);
          durations = difference / (limit + difference);
          if (z === 1) {
            animateShapes(canvas, duration, player);
          }
          if (z === Math.floor(limit / 3) * 2) {
            fadeOutShapes(canvas, duration, player);
          }
          // durations = 625/pathLength;
          prcnt = (move * pathLength) / limit;
          pt = pathLen.at(prcnt);
          pt.x = pt[0];
          pt.y = pt[1];
          pt.x = pt.x * getScaleX;
          pt.y = pt.y * getScaleY;
          //for y
          prcnt1 = (z * pathLength) / limit;
          t = 1;
          pt1 = pathLen.at(prcnt1);
          pt1.x = pt1[0];
          pt1.y = pt1[1];
          break;
        case 2500:
        case 2700:
        case 2000:
          var difference = parseFloat(-1);
          durations = difference / (limit + difference);
          if (z === 1) {
            animateShapes(canvas, duration, player);
          }
          if (z === Math.floor(limit / 3) * 2) {
            fadeOutShapes(canvas, duration, player);
          }
          // durations = 2500 / pathLength;
          prcnt = (move * pathLength) / limit;
          pt = pathLen.at(prcnt);
          pt.x = pt[0];
          pt.y = pt[1];
          pt.x = pt.x * getScaleX;
          pt.y = pt.y * getScaleY;
          //for y
          prcnt1 = (z * pathLength) / limit;
          t = 1;
          pt1 = pathLen.at(prcnt1);
          pt1.x = pt1[0];
          pt1.y = pt1[1];
          break;
        case 3000:
        case 3125:
        case 3750:
          var difference = parseFloat(3);
          durations = difference / (limit + difference);
          if (z === 1) {
            animateShapes(canvas, duration, player);
          }
          if (z === Math.floor(limit / 3) * 2) {
            fadeOutShapes(canvas, duration, player);
          }
          prcnt = (move * pathLength) / limit;
          pt = pathLen.at(prcnt);
          pt.x = pt[0];
          pt.y = pt[1];
          pt.x = pt.x * getScaleX;
          pt.y = pt.y * getScaleY;
          //for y
          prcnt1 = (z * pathLength) / limit;
          t = 1;
          pt1 = pathLen.at(prcnt1);
          pt1.x = pt1[0];
          pt1.y = pt1[1];
        case 4000:
        case 4375:
          var difference = parseFloat(4);
          durations = difference / (limit + difference);
          if (z === 1) {
            animateShapes(canvas, duration, player);
          }
          if (z === Math.floor(limit / 3) * 2) {
            fadeOutShapes(canvas, duration, player);
          }
          prcnt = (move * pathLength) / limit;
          pt = pathLen.at(prcnt);
          pt.x = pt[0];
          pt.y = pt[1];
          pt.x = pt.x * getScaleX;
          pt.y = pt.y * getScaleY;
          //for y
          prcnt1 = (z * pathLength) / limit;
          t = 1;
          pt1 = pathLen.at(prcnt1);
          pt1.x = pt1[0];
          pt1.y = pt1[1];
          break;
      }
    }

    pt1.x = pt1.x * getScaleX;
    pt1.y = pt1.y * getScaleY;
    var diffrenceX = pt1.x - pt.x;
    var diffrenceY = pt.y - pt1.y;
    var left_player = player.left;
    var top_player = player.top;
    if (player.name)
      player.animate(
        {
          left: parseFloat(left_player + diffrenceX),
          top: top_player - diffrenceY,
        },
        {
          onChange: function () {
            player.setCoords();
            canvas.requestRenderAll.bind(canvas);
          },
          duration: durations,
          onComplete: function () {
            if (player.name === "player_custom_image") {
              setTextDimensions(
                canvas._objects[textObj],
                canvas._objects[shirtObj],
                player,
                canvas
              );
            } else if (
              player.objecttype === "sprite-image" ||
              player.name === "player"
            ) {
              setPlayerNameDim(canvas._objects[textObj], player, canvas);
            }
            for (let i = 0; i < canvas._objects.length; i++) {
              if (
                canvas._objects[i].name === "connectionLine" &&
                canvas._objects[i].ref_id.includes(player.ref_id)
              ) {
                setConnectLineDim(canvas, canvas._objects[i]);
              }
            }
            recursiveMovement(
              move + 1,
              obj,
              pathLen,
              svgD,
              duration,
              player,
              pathLength,
              canvas,
              hasAnimationStopped,
              textObj,
              shirtObj,
              resolve
            );
          },
        }
      );
  } else resolve(player.name);
};

const getObjProps = (frObjs, ob, canvas) => {
  if (
    ob.name === "player_custom_image" ||
    ob.name === "player" ||
    ob.name === "shape" ||
    ob.name === "free-shape" ||
    (ob.name === "image" && ob.is_animation === false)
  ) {
    let ind = frObjs.findIndex(
      (f) =>
        (f.name === "player_custom_image" ||
          f.name === "player" ||
          f.name === "shape" ||
          f.name === "free-shape" ||
          (f.name === "image" && f.is_animation === false)) &&
        f.ref_id === ob.ref_id
    );
    if (ind > -1) {
      if (ob.name === "player" || ob.name === "player_custom_image") {
        ob._objects[0].showHighlight = frObjs[ind].objects[0].showHighlight;
        ob._objects[0].highlightColor = frObjs[ind].objects[0].highlightColor;
        ob._objects[0].bgrOpacity = frObjs[ind].objects[0].bgrOpacity;
      }
      ob.fadeFlag = frObjs[ind].fadeFlag;

      canvas.renderAll();
    }
  }
};
const processVideo = (id, resolveAnimation, canvas) => {
  const out = path.join(__dirname, `videos`, `${id}.mp4`);
  let bg = path.join(__dirname, `bg`, `${id}.png`);
  let inp = path.join(__dirname, `frames`, `${id}`, `image%d.png`);
  let width = 2 * Math.round(canvas.width / 2);
  let height = 2 * Math.round(canvas.height / 2);
  let overLay = `overlay=(W-w)/2:(H-h)/2:shortest=1,scale=${width}:${height}`;
  console.log(width, height);
  let command = ffmpeg()
    .addInput(inp)
    .inputOption(
      "-framerate",
      "90",
      "-loop",
      "1",
      "-i",
      `${bg}`,
      "-filter_complex",
      `overlay=(W-w)/2:(H-h)/2:shortest=1,scale=${width}:${height}`
    )
    .on("progress", function (progress) {
      console.log("Processing: " + progress.percent + "% done");
      ios.emit(
        `receive-message${id}`,
        "Processing: " +
          Math.round(
            progress.percent * FRAMES_LOADING_RATIO + FRAMES_LOADING_RATIO * 100
          ) +
          "% done"
      );
    })
    .on("end", async function (stdout, stderr) {
      console.log("Transcoding succeeded !");
      ios.emit(`receive-message${id}`, "Processing: " + "100" + "% done");
      ios.emit(`receive-message${id}`, "video generated successfully");
      ios.emit(`receive-message${id}`, "Downloading...");
      await fsPromises.unlink(path.join(__dirname, "bg", `${id}.png`));
      fs.rm(
        path.join(__dirname, "frames", `${id}`),
        { recursive: true },
        (err) => console.log("deleted successfully")
      );
      resolveAnimation(id);
    })
    .on("error", function (stdout, stderr) {
      console.log("failed to process video", stdout, stderr);
      resolveAnimation(id);
    })
    .output(out);
  command.run();
};
const getStaticTime = (frObjs, ob, canvas) => {
  let timeArr = [];
  let maxTime = 2500;
  frObjs.forEach((e) => {
    if (
      e.name === "player" ||
      e.name === "player_custom_image" ||
      (e.name === "image" && e.is_animation === true)
    ) {
      timeArr.push(e.time);
    }
  });
  if (timeArr.length) {
    maxTime = Math.max(...timeArr);
  }
  return maxTime;
};
const startAnimation = (
  frameNo = 1,
  animationState,
  canvas,
  frames,
  shadowFrames,
  hasAnimationStopped,
  svgPaths,
  frameC,
  res,
  id,
  resolveAnimation,
  bufferArr
) => {
  if (
    animationState &&
    frameNo === 0 &&
    frames.length === 1 &&
    !canvas._objects.length
  ) {
    console.log("No frames added");
    resolveAnimation("No frames added");
    return;
  }
  if (frameNo > frames.length - 1) {
    isRecording = false;
    let promisesObjs = [];
    bufferArr.forEach((e, i) => {
      promisesObjs[i] = new Promise((resolve, reject) => {
        fs.writeFileSync(
          path.join(__dirname, `frames`, `${id}`, `image${i}.png`),
          e
        );
        resolve("resolved");
      });
    });
    Promise.all(promisesObjs)
      .then((values) => {
        processVideo(id, resolveAnimation, canvas);
      })
      .catch((error) => {
        console.log("error", error);
        resolveAnimation("resolved" + error);
      });
    return;
  }
  if (frameNo === 0) {
    counter = 0;
    isRecording = true;
    fabric.util.requestAnimFrame(function render() {
      if (!isRecording) {
        console.log("recording stopped");
        return;
      }
      var buffer = frameC.toBuffer();
      bufferArr.push(buffer);
      fabric.util.requestAnimFrame(render);
    });
  }
  console.log("frame ", frameNo);
  console.log("next frame ", frameNo);
  const totalFrames = frames.length;
  const nextFrameNo = frameNo + 1;

  const initialFramePercentage = Math.round(
    (frameNo / totalFrames) * VIDEO_GENERATION_RATIO * 100
  );

  let finalFramePercentage =
    frameNo !== frames.length
      ? Math.round((nextFrameNo / totalFrames) * VIDEO_GENERATION_RATIO * 100)
      : VIDEO_GENERATION_RATIO * 100;

  ios.emit(
    `receive-message${id}`,
    `Processing: ${initialFramePercentage} % done`
  );
  let promises = [];
  let frTime = 0;

  let count = 0;
  const intervalId = setInterval(() => {
    let currentPercentage = initialFramePercentage + count;
    if (!(currentPercentage < finalFramePercentage))
      return clearInterval(intervalId);

    count += Math.log(count + 2);

    ios.emit(
      `receive-message${id}`,
      `Processing: ${Math.round(currentPercentage)} % done`
    );
  }, 1500);

  for (let i = 0; i < canvas._objects.length; i++) {
    promises[i] = new Promise((resolve, reject) => {
      let ob = canvas._objects[i];
      // if(ob.name === 'custom_image_name'){
      //     console.log('hebrew',ob.text.split()[0],ob.direction);
      //
      // }
      let textObj;
      let staticTime;
      frTime =
        !shadowFrames[frameNo].objects.length ||
        frameNo === 0 ||
        frameNo === frames.length - 1
          ? 2000
          : 0;
      let shirtObj;
      let time = 2700;
      let frObjs = JSON.parse(frames[frameNo].json).objects;
      let currObjInd = frObjs.findIndex(
        (f) =>
          f.ref_id === ob.ref_id && f.name !== "line-end-point_shadow-object"
      );
      if(ob.name === 'shape' || ob.name === 'free-shape') canvas.sendToBack(ob);
      if (currObjInd === -1) {
        ob.visible = false;
      } else {
        ob.visible = true;
      }
      canvas.renderAll();
      if (frameNo !== 0 && ob.visible == true) {
        getObjProps(frObjs, ob, canvas);
        hideOpacity(canvas, i);
        showOpacity(canvas, i);
      }
      staticTime = getStaticTime(frObjs, ob, canvas);
      if (!ob.is_animation && shadowFrames[frameNo].objects.length)
        animateNonMoveables(canvas, staticTime, ob);
      else if (!ob.is_animation && !shadowFrames[frameNo].objects.length)
        animateNonMoveables(canvas, 1800, ob);
      if (ob.is_animation && frameNo >= 1) {
        let shadowInd = shadowFrames[frameNo].shadowLines.findIndex(
          (f) => f.ref_id === `${ob.ref_id}__shadow-object`
        );
        let currObjInd = frObjs.findIndex(
          (f) => f.ref_id === ob.ref_id && f.name === ob.name
        );
        if (currObjInd > -1) {
          time = frObjs[currObjInd].time;
        }

        if (shadowInd > -1) {
          let pathLen = null;
          const svg = svgPaths.find(
            (f) => f.id === `line-svg:${frameNo}:${ob.ref_id}__shadow-object`
          );
          if (svg) pathLen = point(svg.d);
          if (pathLen) {
            let pathLength = Math.floor(pathLen.length());
            //console.log('pathLength',pathLength)
            let obj = shadowFrames[frameNo].shadowLines[shadowInd];
            if (ob.name === "player_custom_image") {
              textObj = canvas._objects.findIndex(
                (f) => f.name === "custom_image_name" && f.ref_id === ob.ref_id
              );
              shirtObj = canvas._objects.findIndex(
                (f) =>
                  f.name === "custom_image_shirtno" && f.ref_id === ob.ref_id
              );
            } else if (
              ob.objecttype === "sprite-image" ||
              ob.name === "player"
            ) {
              textObj = canvas._objects.findIndex(
                (f) => f.name === "custom_image_name" && f.ref_id === ob.ref_id
              );
            }
            recursiveMovement(
              0,
              obj,
              pathLen,
              svg.d,
              time,
              ob,
              pathLength,
              canvas,
              hasAnimationStopped,
              textObj,
              shirtObj,
              resolve
            );
          } else resolve(ob.name + "error");
        } else resolve(ob.name + "error");
      } else resolve(ob.name + "error");
    });
  }
  Promise.all(promises)
    .then((values) => {
      clearInterval(intervalId);
      if (!JSON.parse(frames[frameNo].json).objects.length) frTime = 2500;
      setTimeout(() => {
        startAnimation(
          frameNo + 1,
          true,
          canvas,
          frames,
          shadowFrames,
          false,
          svgPaths,
          frameC,
          res,
          id,
          resolveAnimation,
          bufferArr
        );
      }, frTime);
    })
    .catch((error) => {
      console.log("error", error);
    });
};

const startAnimationTemp = (
  frameNo = 1,
  animationState,
  canvas,
  frames,
  shadowFrames,
  hasAnimationStopped,
  svgPaths,
  frameC,
  res,
  id,
  resolveAnimation,
  bufferArr
) => {
  if (
    animationState &&
    frameNo === 0 &&
    frames.length === 1 &&
    !canvas._objects.length
  ) {
    console.log("No frames added");
    resolveAnimation("No frames added");
    return;
  }
  if (frameNo > frames.length - 1) {
    isRecording = false;
    let promisesObjs = [];
    const t0 = performance.now();
    console.log("finally t0:",t0);
    bufferArr.forEach((e, i) => {
      promisesObjs[i] = new Promise((resolve, reject) => {
        var base64Data = e.replace(/^data:image\/png;base64,/, "");
        //var base64Data = e;


        fs.writeFileSync(
          path.join(__dirname, `frames`, `${id}`, `image${i}.png`),
            base64Data, 'base64'
        );
        resolve("resolved");
      });
    });
    Promise.all(promisesObjs)
      .then((values) => {
        processVideo(id, resolveAnimation, canvas);
      })
      .catch((error) => {
        console.log("error", error);
        resolveAnimation("resolved" + error);
      });
    return;
  }
  if (frameNo === 0) {
    counter = 0;
    isRecording = true;
    var frameCounter  = 0;
    fabric.util.requestAnimFrame(function render() {
      if (!isRecording) {
        console.log("recording stopped");
        return;
      }
      frameCounter++;
      const t0 = performance.now();

      //var buffer = frameC.toBuffer();
      //var buffer = "frameC.toBuffer()";
      var buffer = canvas.toDataURL();
      const t1 = performance.now();
      //console.log(`Calla to frameNo: ${frameNo}  took ${t1 - t0} milliseconds. total counter = ${frameCounter}`);
      bufferArr.push(buffer);
      fabric.util.requestAnimFrame(render);
    });
  }
  console.log("frame ", frameNo);
  console.log("next frame ", frameNo);
  const totalFrames = frames.length;
  const nextFrameNo = frameNo + 1;

  const initialFramePercentage = Math.round(
    (frameNo / totalFrames) * VIDEO_GENERATION_RATIO * 100
  );

  let finalFramePercentage =
    frameNo !== frames.length
      ? Math.round((nextFrameNo / totalFrames) * VIDEO_GENERATION_RATIO * 100)
      : VIDEO_GENERATION_RATIO * 100;

  ios.emit(
    `receive-message${id}`,
    `Processing: ${initialFramePercentage} % done`
  );
  let promises = [];
  let frTime = 0;

  let count = 0;
  const intervalId = setInterval(() => {
    let currentPercentage = initialFramePercentage + count;
    if (!(currentPercentage < finalFramePercentage))
      return clearInterval(intervalId);

    count += Math.log(count + 2);

    ios.emit(
      `receive-message${id}`,
      `Processing: ${Math.round(currentPercentage)} % done`
    );
  }, 0);

  for (let i = 0; i < canvas._objects.length; i++) {
    promises[i] = new Promise((resolve, reject) => {
      let ob = canvas._objects[i];
      // if(ob.name === 'custom_image_name'){
      //     console.log('hebrew',ob.text.split()[0],ob.direction);
      //
      // }
      let textObj;
      let staticTime;
      frTime =
        !shadowFrames[frameNo].objects.length ||
        frameNo === 0 ||
        frameNo === frames.length - 1
          ? 1200
          : 0;
      let shirtObj;
      let time = 2700;
      let frObjs = JSON.parse(frames[frameNo].json).objects;
      let currObjInd = frObjs.findIndex(
        (f) =>
          f.ref_id === ob.ref_id && f.name !== "line-end-point_shadow-object"
      );
      if(ob.name === 'shape' || ob.name === 'free-shape') canvas.sendToBack(ob);
      if (currObjInd === -1) {
        ob.visible = false;
      } else {
        ob.visible = true;
      }
      canvas.renderAll();
      if (frameNo !== 0 && ob.visible == true) {
        getObjProps(frObjs, ob, canvas);
        hideOpacity(canvas, i);
        showOpacity(canvas, i);
      }
      staticTime = getStaticTime(frObjs, ob, canvas);
      if (!ob.is_animation && shadowFrames[frameNo].objects.length)
        animateNonMoveables(canvas, staticTime, ob);
      else if (!ob.is_animation && !shadowFrames[frameNo].objects.length)
        animateNonMoveables(canvas, 1800, ob);
      if (ob.is_animation && frameNo >= 1) {
        let shadowInd = shadowFrames[frameNo].shadowLines.findIndex(
          (f) => f.ref_id === `${ob.ref_id}__shadow-object`
        );
        let currObjInd = frObjs.findIndex(
          (f) => f.ref_id === ob.ref_id && f.name === ob.name
        );
        if (currObjInd > -1) {
          time = frObjs[currObjInd].time;
        }

        if (shadowInd > -1) {
          let pathLen = null;
          const svg = svgPaths.find(
            (f) => f.id === `line-svg:${frameNo}:${ob.ref_id}__shadow-object`
          );
          if (svg) pathLen = point(svg.d);
          if (pathLen) {
            let pathLength = Math.floor(pathLen.length());
            //console.log('pathLength',pathLength)
            let obj = shadowFrames[frameNo].shadowLines[shadowInd];
            if (ob.name === "player_custom_image") {
              textObj = canvas._objects.findIndex(
                (f) => f.name === "custom_image_name" && f.ref_id === ob.ref_id
              );
              shirtObj = canvas._objects.findIndex(
                (f) =>
                  f.name === "custom_image_shirtno" && f.ref_id === ob.ref_id
              );
            } else if (
              ob.objecttype === "sprite-image" ||
              ob.name === "player"
            ) {
              textObj = canvas._objects.findIndex(
                (f) => f.name === "custom_image_name" && f.ref_id === ob.ref_id
              );
            }
            recursiveMovement(
              0,
              obj,
              pathLen,
              svg.d,
              time,
              ob,
              pathLength,
              canvas,
              hasAnimationStopped,
              textObj,
              shirtObj,
              resolve
            );
          } else resolve(ob.name + "error");
        } else resolve(ob.name + "error");
      } else resolve(ob.name + "error");
    });
  }
  Promise.all(promises)
    .then((values) => {
      console.log("all promises resolved "+(frameNo+1));
      clearInterval(intervalId);
      if (!JSON.parse(frames[frameNo].json).objects.length) frTime = 2500;
      setTimeout(() => {
        console.log("Frame "+frameNo+1+" time is ",frTime);
        startAnimationTemp(
          frameNo + 1,
          true,
          canvas,
          frames,
          shadowFrames,
          false,
          svgPaths,
          frameC,
          res,
          id,
          resolveAnimation,
          bufferArr
        );
      }, frTime);
    })
    .catch((error) => {
      console.log("error", error);
    });
};
const addAllObjs = (allFrames, canvas) => {
  return new Promise((resolve) => {
    let tempArr = [];
    let finalArr = [];
    let tempNames;
    for (let i = 0; i < allFrames.length; i++) {
      let canvasObjs = JSON.parse(allFrames[i].json).objects;
      tempArr.push(...canvasObjs);
    }
    tempNames = tempArr.filter(
      (f) =>
        f.name === "custom_image_name" || f.name === "pa" || f.name === "arrow"
    );
    tempArr = tempArr.filter(
      (f) =>
        f.name !== "custom_image_name" &&
        f.name !== "custom_image_shirtno" &&
        f.name !== "pa" &&
        f.name !== "arrow"
    );
    let filteredNames = [];
    let filteredObjs = [];
    tempNames.forEach((e, ind) => {
      let filteredIndex = filteredNames.findIndex((f) => f.ref_id === e.ref_id);
      if (filteredIndex === -1) filteredNames.push(e);
    });
    tempArr.forEach((e, ind) => {
      let filteredObjIndex = filteredObjs.findIndex(
        (f) => f.ref_id === e.ref_id
      );
      if (filteredObjIndex === -1) filteredObjs.push(e);
    });
    finalArr = [...filteredNames, ...filteredObjs];
    if (finalArr.length) {
      fabric.util.enlivenObjects(finalArr, function (objects) {
        objects.forEach((obj) => {
          let objInd = JSON.parse(allFrames[0].json).objects.findIndex(
            (f) => f.ref_id !== obj.ref_id
          );
          if (objInd > -1) obj.visible = false;
        });
        canvas.add(...objects);
        resolve("resolved");
        canvas.renderAll();
      });
    } else resolve("resolved");
  });
};

module.exports = { startAnimation,startAnimationTemp, addAllObjs };
